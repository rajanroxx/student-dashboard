const express = require('express');
const cors = require('cors');
const mongoose = require('mongoose');
const multer = require('multer');
const XLSX = require('xlsx');
const crypto = require('crypto');

const app = express();
const PORT = 5000;

// Middleware
app.use(cors());
app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ limit: '50mb', extended: true }));

// Multer setup for file uploads
const storage = multer.memoryStorage();
const upload = multer({ storage: storage });

// MongoDB Connection
mongoose.connect('mongodb://localhost:27017/students-dashboard')
.then(() => console.log('MongoDB connected'))
.catch(err => console.error('MongoDB connection error:', err));

// Mongoose Schema
const studentDataSchema = new mongoose.Schema({
  Name: String,
  Subject: String,
  Test: String,
  Marks: Number,
  Total: Number,
  Date: { type: Date },
  Class: String,
});

const StudentData = mongoose.model('StudentData', studentDataSchema);

const uploadedFileSchema = new mongoose.Schema({
  originalName: String,
  fileHash: { type: String, unique: true },
  uploadDate: { type: Date, default: Date.now },
  recordCount: Number,
});

const UploadedFile = mongoose.model('UploadedFile', uploadedFileSchema);

// Function to convert Excel date to a Date object
const convertExcelDate = (excelDate) => {
    if (!excelDate) return null;

    // If it's already a Date object, return it
    if (excelDate instanceof Date) {
        return excelDate;
    }

    // If it's a number (Excel's serial date)
    if (typeof excelDate === 'number') {
        // Adjust for timezone offset by creating a UTC date
        const utcDate = new Date(Date.UTC(0, 0, excelDate - 1));
        return utcDate;
    }

    // If it's a string, try to parse it
    if (typeof excelDate === 'string') {
        // Handles 'dd-mm-yyyy', 'mm/dd/yyyy', 'yyyy-mm-dd' etc.
        const date = new Date(excelDate);
        // Check if the parsed date is valid
        if (!isNaN(date.getTime())) {
            return date;
        }
        // Try parsing 'dd-mm-yyyy' manually
        const parts = excelDate.match(/(\d{1,2})[/-](\d{1,2})[/-](\d{4})/);
        if (parts) {
            // Assuming format dd-mm-yyyy
            const day = parseInt(parts[1], 10);
            const month = parseInt(parts[2], 10) - 1; // Month is 0-indexed
            const year = parseInt(parts[3], 10);
            const manualDate = new Date(Date.UTC(year, month, day));
            if (!isNaN(manualDate.getTime())) {
                return manualDate;
            }
        }
    }
    
    return null; // Return null if conversion fails
};


// API endpoint to upload and process Excel file
app.post('/upload', upload.single('file'), async (req, res) => {
    if (!req.file) {
        return res.status(400).json({ success: false, message: 'No file uploaded.' });
    }

    try {
        const fileBuffer = req.file.buffer;
        const fileHash = crypto.createHash('sha256').update(fileBuffer).digest('hex');

        const existingFile = await UploadedFile.findOne({ fileHash });
        if (existingFile) {
            return res.status(409).json({ 
                success: false, 
                message: `This file has already been uploaded on ${existingFile.uploadDate.toLocaleDateString()}.`,
            });
        }

        const workbook = XLSX.read(fileBuffer, { type: 'buffer', cellDates: true });
        const sheetName = workbook.SheetNames[0];
        const worksheet = workbook.Sheets[sheetName];
        const data = XLSX.utils.sheet_to_json(worksheet, { raw: false });

        if (data.length === 0) {
            return res.status(400).json({ success: false, message: 'Excel file is empty.' });
        }

        // --- Dynamic Date Column Finder ---
        let dateColumnName = '';
        if (data.length > 0) {
            const headers = Object.keys(data[0]);
            const possibleDateHeaders = ['date', 'test date', 'exam date']; // Lowercase for case-insensitive comparison
            
            for (const header of headers) {
                if (possibleDateHeaders.includes(header.toLowerCase())) {
                    dateColumnName = header;
                    break;
                }
            }
        }
        console.log(`Found date column: '${dateColumnName}'`);
        // --- End Dynamic Date Column Finder ---


        // Diagnostic logging
        if (data.length > 0) {
            console.log('Column Headers:', Object.keys(data[0]));
            console.log('--- First 5 Rows of Data ---');
            data.slice(0, 5).forEach((row, index) => {
                const rawDate = dateColumnName ? row[dateColumnName] : null;
                const convertedDate = convertExcelDate(rawDate);
                console.log(`Row ${index + 1}: Raw Date Value:`, rawDate, `(Type: ${typeof rawDate})`, `| Converted Date:`, convertedDate);
            });
            console.log('--------------------------');
        }

        const formattedData = data.map(row => {
            const dateValue = dateColumnName ? row[dateColumnName] : null;
            return {
                Name: row['Student Name'],
                Subject: row['Subject'],
                Test: row['Test'] || 'General',
                Marks: row['Obtained Marks'],
                Total: row['Total Marks'],
                Date: convertExcelDate(dateValue),
                Class: row['Class'],
            };
        });
        
        // We will first insert the file record, and if that fails, we don't insert the data
        const newFile = new UploadedFile({
            originalName: req.file.originalname,
            fileHash: fileHash,
            recordCount: formattedData.length,
        });
        await newFile.save();

        try {
            await StudentData.insertMany(formattedData);
        } catch (dataInsertError) {
            // If data insertion fails, we roll back the file record
            await UploadedFile.deleteOne({ fileHash });
            throw dataInsertError;
        }

        res.json({ success: true, message: 'Data uploaded and saved successfully.' });

    } catch (error) {
        console.error('Upload Error:', error);
        // Check for unique constraint violation on fileHash
        if (error.code === 11000) {
            return res.status(409).json({
                success: false,
                message: 'This file has already been uploaded.',
            });
        }
        res.status(500).json({
            success: false,
            message: 'Error processing file',
            error: error.message,
        });
    }
});


// API endpoint to get all marks
app.get('/marks', async (req, res) => {
  try {
    const allData = await StudentData.find();
    const allClasses = [...new Set(allData.map(item => item.Class))];
    
    res.json({
      success: true,
      data: allData,
      count: allData.length,
      classes: allClasses,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error fetching marks',
      error: error.message,
    });
  }
});

// API endpoint to get marks by class name
app.get('/marks/:className', async (req, res) => {
  try {
    const className = req.params.className;
    const data = await StudentData.find({ Class: className });
    
    res.json({
      success: true,
      className: className,
      data: data,
      count: data.length,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error fetching marks for class',
      error: error.message,
    });
  }
});

// API endpoint to create a new data entry
app.post('/marks', async (req, res) => {
  try {
    const newData = new StudentData(req.body);
    await newData.save();
    res.status(201).json({
      success: true,
      message: 'Data entry created successfully',
      data: newData,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error creating data entry',
      error: error.message,
    });
  }
});


// API endpoint to get all available classes
app.get('/classes', async (req, res) => {
  try {
    const allData = await StudentData.find();
    const classes = [...new Set(allData.map(item => item.Class))];
    res.json({
      success: true,
      classes: classes,
      count: classes.length,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error fetching classes',
      error: error.message,
    });
  }
});

// Health check endpoint
app.get('/health', (req, res) => {
  res.json({ status: 'Backend server is running' });
});

// Start server
app.listen(PORT, () => {
  console.log(`Server is running on http://localhost:${PORT}`);
  console.log(`Health check: http://localhost:${PORT}/health`);
  console.log(`All Marks API: http://localhost:${PORT}/marks`);
  console.log(`Marks by Class: http://localhost:${PORT}/marks/:className`);
  console.log(`Available Classes: http://localhost:${PORT}/classes`);
  console.log(`Create New Entry: POST http://localhost:${PORT}/marks`);
  console.log(`Upload Excel: POST http://localhost:${PORT}/upload`);
});
