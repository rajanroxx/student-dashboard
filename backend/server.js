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
app.use(express.json());

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
  Date: String, // Storing date as string for simplicity, can be changed to Date type
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

// Function to convert Excel date to string
const convertExcelDateToString = (excelDate) => {
    if (!excelDate) return '';
    if (typeof excelDate === 'string') return excelDate;
    if (typeof excelDate === 'number') {
        const date = new Date((excelDate - 25569) * 86400 * 1000);
        const day = String(date.getDate()).padStart(2, '0');
        const month = String(date.getMonth() + 1).padStart(2, '0');
        const year = date.getFullYear();
        return `${day}-${month}-${year}`;
    }
    return '';
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

        const workbook = XLSX.read(fileBuffer, { type: 'buffer' });
        const sheetName = workbook.SheetNames[0];
        const worksheet = workbook.Sheets[sheetName];
        const data = XLSX.utils.sheet_to_json(worksheet);

        if (data.length === 0) {
            return res.status(400).json({ success: false, message: 'Excel file is empty.' });
        }

        const formattedData = data.map(row => ({
            Name: row['Student Name'],
            Subject: row['Subject'],
            Test: row['Test'] || 'General', // Default value if 'Test' is not in Excel
            Marks: row['Obtained Marks'],
            Total: row['Total Marks'],
            Date: convertExcelDateToString(row['Date']),
            Class: row['Class'],
        }));

        await StudentData.insertMany(formattedData);

        const newFile = new UploadedFile({
            originalName: req.file.originalname,
            fileHash: fileHash,
            recordCount: formattedData.length,
        });
        await newFile.save();

        res.json({ success: true, message: 'Data uploaded and saved successfully.' });

    } catch (error) {
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
