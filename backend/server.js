const express = require('express');
const cors = require('cors');
const XLSX = require('xlsx');
const path = require('path');
const fs = require('fs');

const app = express();
const PORT = 5000;

// Middleware
app.use(cors());
app.use(express.json());

// Function to convert Excel numeric date to dd-mm-yyyy format
const convertExcelDateToString = (excelDate) => {
  try {
    // If it's already a string, return as is
    if (typeof excelDate === 'string') {
      return excelDate;
    }
    
    // If it's a number, convert from Excel serial date
    if (typeof excelDate === 'number') {
      // Excel dates: days since 1900-01-01, but 1900 is not a leap year in Excel (bug)
      const date = new Date((excelDate - 25569) * 86400 * 1000);
      const day = String(date.getDate()).padStart(2, '0');
      const month = String(date.getMonth() + 1).padStart(2, '0');
      const year = date.getFullYear();
      return `${day}-${month}-${year}`;
    }
    
    return excelDate;
  } catch {
    return excelDate;
  }
};

// Function to process row data and convert dates
const processRowData = (row) => {
  const processed = { ...row };
  
  // Convert Date column if it's numeric
  if (processed.Date !== undefined) {
    processed.Date = convertExcelDateToString(processed.Date);
  }
  
  return processed;
};

// Function to read Excel file for specific class
const readExcelByClass = (className) => {
  try {
    const filePath = path.join(__dirname, '../data/students.xlsx');
    
    // Check if file exists
    if (!fs.existsSync(filePath)) {
      console.error('Excel file not found at:', filePath);
      return [];
    }

    // Read the Excel file
    const workbook = XLSX.readFile(filePath);
    
    // Check if sheet exists
    if (!workbook.SheetNames.includes(className)) {
      console.warn(`Sheet "${className}" not found. Available sheets: ${workbook.SheetNames.join(', ')}`);
      return [];
    }

    const worksheet = workbook.Sheets[className];
    
    // Convert sheet to JSON with header row
    const data = XLSX.utils.sheet_to_json(worksheet, { 
      header: 1,  // Get raw array format first
      defval: ''
    });

    // If empty sheet, return empty array
    if (!data || data.length === 0) {
      console.warn(`Sheet "${className}" is empty`);
      return [];
    }

    // Get headers from first row
    const headers = data[0];
    
    // Expected headers (case-insensitive)
    const expectedHeaders = ['Name', 'Subject', 'Test', 'Marks', 'Total', 'Date'];
    const headersMatch = headers.filter(h => expectedHeaders.includes(h)).length > 0;
    
    if (!headersMatch) {
      console.warn(`Sheet "${className}" columns don't match expected format. Expected: ${expectedHeaders.join(', ')}`);
    }

    // Convert back to JSON properly
    const jsonData = XLSX.utils.sheet_to_json(worksheet);
    
    // Process rows to convert Excel dates to string format
    const processedData = jsonData.map(row => processRowData(row));
    
    return processedData;
  } catch (error) {
    console.error('Error reading Excel file:', error.message);
    return [];
  }
};

// Function to get all available sheets (classes)
const getAllAvailableSheets = () => {
  try {
    const filePath = path.join(__dirname, '../data/students.xlsx');
    
    if (!fs.existsSync(filePath)) {
      return [];
    }

    const workbook = XLSX.readFile(filePath);
    return workbook.SheetNames;
  } catch (error) {
    console.error('Error reading Excel sheets:', error.message);
    return [];
  }
};

// API endpoint to get marks by class name
app.get('/marks/:className', (req, res) => {
  try {
    const className = req.params.className;
    const data = readExcelByClass(className);
    
    res.json({
      success: true,
      className: className,
      data: data,
      count: data.length
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error fetching marks',
      error: error.message
    });
  }
});

// API endpoint to get all marks (backward compatibility - returns all sheets combined)
app.get('/marks', (req, res) => {
  try {
    const allSheets = getAllAvailableSheets();
    let allData = [];
    
    // Combine data from all sheets
    allSheets.forEach(sheetName => {
      const data = readExcelByClass(sheetName);
      // Add class info to each record
      allData = allData.concat(data.map(record => ({
        ...record,
        Class: sheetName
      })));
    });

    res.json({
      success: true,
      data: allData,
      count: allData.length,
      classes: allSheets
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error fetching marks',
      error: error.message
    });
  }
});

// API endpoint to refresh data
app.post('/refresh', (req, res) => {
  try {
    const allSheets = getAllAvailableSheets();
    let allData = [];
    
    allSheets.forEach(sheetName => {
      const data = readExcelByClass(sheetName);
      allData = allData.concat(data.map(record => ({
        ...record,
        Class: sheetName
      })));
    });

    res.json({
      success: true,
      message: 'Data refreshed successfully',
      data: allData,
      count: allData.length,
      classes: allSheets
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error refreshing data',
      error: error.message
    });
  }
});

// API endpoint to verify a sheet format
app.get('/verify/:className', (req, res) => {
  try {
    const className = req.params.className;
    const filePath = path.join(__dirname, '../data/students.xlsx');
    
    if (!fs.existsSync(filePath)) {
      return res.status(404).json({
        success: false,
        message: 'Excel file not found'
      });
    }

    const workbook = XLSX.readFile(filePath);
    
    if (!workbook.SheetNames.includes(className)) {
      return res.status(404).json({
        success: false,
        message: `Sheet "${className}" not found`,
        availableSheets: workbook.SheetNames
      });
    }

    const worksheet = workbook.Sheets[className];
    const data = XLSX.utils.sheet_to_json(worksheet);
    
    // Process dates in data
    const processedData = data.map(row => processRowData(row));
    // Check format
    const expectedColumns = ['Name', 'Subject', 'Test', 'Marks', 'Total', 'Date'];
    const actualColumns = processedData.length > 0 ? Object.keys(processedData[0]) : [];
    
    const status = {
      success: true,
      className: className,
      recordCount: processedData.length,
      hasData: processedData.length > 0,
      columns: {
        expected: expectedColumns,
        actual: actualColumns,
        match: JSON.stringify(expectedColumns) === JSON.stringify(actualColumns)
      },
      sampleRecord: processedData.length > 0 ? processedData[0] : null,
      issues: []
    };

    // Check for issues
    if (processedData.length === 0) {
      status.issues.push('Sheet is empty - no data records found');
    }
    
    if (actualColumns.length === 0) {
      status.issues.push('No columns detected - ensure headers exist in first row');
    }
    
    if (!status.columns.match) {
      status.issues.push(`Column mismatch. Ensure exact headers: ${expectedColumns.join(', ')}`);
    }

    res.json(status);
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error verifying sheet',
      error: error.message
    });
  }
});

// API endpoint to get all available classes
app.get('/classes', (req, res) => {
  try {
    const classes = getAllAvailableSheets();
    res.json({
      success: true,
      classes: classes,
      count: classes.length
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error fetching classes',
      error: error.message
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
  console.log(`Verify Sheet: http://localhost:${PORT}/verify/:className`);
  console.log(`Create New Class: POST http://localhost:${PORT}/classes`);
  console.log(`Refresh Data: POST http://localhost:${PORT}/refresh`);
});
