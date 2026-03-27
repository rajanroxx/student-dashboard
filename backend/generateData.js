const XLSX = require('xlsx');
const path = require('path');
const fs = require('fs');

// Sample data organized by class
const allData = {
  // Class 10-A
  '10A': [
    { Name: 'Amit Kumar', Subject: 'Mathematics', Test: 'DPP1', Marks: 45, Total: 50, Date: '15-01-2024' },
    { Name: 'Amit Kumar', Subject: 'Mathematics', Test: 'DPP2', Marks: 48, Total: 50, Date: '22-01-2024' },
    { Name: 'Amit Kumar', Subject: 'English', Test: 'DPP1', Marks: 38, Total: 40, Date: '16-01-2024' },
    { Name: 'Amit Kumar', Subject: 'English', Test: 'DPP2', Marks: 36, Total: 40, Date: '23-01-2024' },
    { Name: 'Amit Kumar', Subject: 'Science', Test: 'DPP1', Marks: 42, Total: 50, Date: '17-01-2024' },
    { Name: 'Amit Kumar', Subject: 'Science', Test: 'DPP2', Marks: 46, Total: 50, Date: '24-01-2024' },
    { Name: 'Priya Singh', Subject: 'Mathematics', Test: 'DPP1', Marks: 48, Total: 50, Date: '15-01-2024' },
    { Name: 'Priya Singh', Subject: 'Mathematics', Test: 'DPP2', Marks: 49, Total: 50, Date: '22-01-2024' },
    { Name: 'Priya Singh', Subject: 'English', Test: 'DPP1', Marks: 39, Total: 40, Date: '16-01-2024' },
    { Name: 'Priya Singh', Subject: 'English', Test: 'DPP2', Marks: 40, Total: 40, Date: '23-01-2024' },
    { Name: 'Priya Singh', Subject: 'Science', Test: 'DPP1', Marks: 47, Total: 50, Date: '17-01-2024' },
    { Name: 'Priya Singh', Subject: 'Science', Test: 'DPP2', Marks: 48, Total: 50, Date: '24-01-2024' },
  ],
  // Class 10-B
  '10B': [
    { Name: 'Raj Patel', Subject: 'Mathematics', Test: 'DPP1', Marks: 42, Total: 50, Date: '15-01-2024' },
    { Name: 'Raj Patel', Subject: 'Mathematics', Test: 'DPP2', Marks: 44, Total: 50, Date: '22-01-2024' },
    { Name: 'Raj Patel', Subject: 'English', Test: 'DPP1', Marks: 35, Total: 40, Date: '16-01-2024' },
    { Name: 'Raj Patel', Subject: 'English', Test: 'DPP2', Marks: 37, Total: 40, Date: '23-01-2024' },
    { Name: 'Raj Patel', Subject: 'Science', Test: 'DPP1', Marks: 40, Total: 50, Date: '17-01-2024' },
    { Name: 'Raj Patel', Subject: 'Science', Test: 'DPP2', Marks: 43, Total: 50, Date: '24-01-2024' },
    { Name: 'Neha Verma', Subject: 'Mathematics', Test: 'DPP1', Marks: 46, Total: 50, Date: '15-01-2024' },
    { Name: 'Neha Verma', Subject: 'Mathematics', Test: 'DPP2', Marks: 47, Total: 50, Date: '22-01-2024' },
    { Name: 'Neha Verma', Subject: 'English', Test: 'DPP1', Marks: 38, Total: 40, Date: '16-01-2024' },
    { Name: 'Neha Verma', Subject: 'English', Test: 'DPP2', Marks: 39, Total: 40, Date: '23-01-2024' },
    { Name: 'Neha Verma', Subject: 'Science', Test: 'DPP1', Marks: 45, Total: 50, Date: '17-01-2024' },
    { Name: 'Neha Verma', Subject: 'Science', Test: 'DPP2', Marks: 47, Total: 50, Date: '24-01-2024' },
  ],
  // Class 9-A
  '9A': [
    { Name: 'Arun Gupta', Subject: 'Mathematics', Test: 'DPP1', Marks: 40, Total: 50, Date: '10-01-2024' },
    { Name: 'Arun Gupta', Subject: 'English', Test: 'DPP1', Marks: 33, Total: 40, Date: '11-01-2024' },
    { Name: 'Arun Gupta', Subject: 'Science', Test: 'DPP1', Marks: 38, Total: 50, Date: '12-01-2024' },
    { Name: 'Arun Gupta', Subject: 'Mathematics', Test: 'DPP2', Marks: 42, Total: 50, Date: '18-01-2024' },
    { Name: 'Arun Gupta', Subject: 'English', Test: 'DPP2', Marks: 35, Total: 40, Date: '19-01-2024' },
    { Name: 'Arun Gupta', Subject: 'Science', Test: 'DPP2', Marks: 40, Total: 50, Date: '20-01-2024' },
    { Name: 'Seema Das', Subject: 'Mathematics', Test: 'DPP1', Marks: 48, Total: 50, Date: '10-01-2024' },
    { Name: 'Seema Das', Subject: 'English', Test: 'DPP1', Marks: 38, Total: 40, Date: '11-01-2024' },
    { Name: 'Seema Das', Subject: 'Science', Test: 'DPP1', Marks: 46, Total: 50, Date: '12-01-2024' },
    { Name: 'Seema Das', Subject: 'Mathematics', Test: 'DPP2', Marks: 49, Total: 50, Date: '18-01-2024' },
    { Name: 'Seema Das', Subject: 'English', Test: 'DPP2', Marks: 39, Total: 40, Date: '19-01-2024' },
    { Name: 'Seema Das', Subject: 'Science', Test: 'DPP2', Marks: 47, Total: 50, Date: '20-01-2024' },
  ],
  // Class 11-A
  '11A': [
    { Name: 'Vikram Singh', Subject: 'Physics', Test: 'DPP1', Marks: 42, Total: 50, Date: '05-01-2024' },
    { Name: 'Vikram Singh', Subject: 'Chemistry', Test: 'DPP1', Marks: 39, Total: 50, Date: '06-01-2024' },
    { Name: 'Vikram Singh', Subject: 'Mathematics', Test: 'DPP1', Marks: 44, Total: 50, Date: '07-01-2024' },
    { Name: 'Vikram Singh', Subject: 'Physics', Test: 'DPP2', Marks: 45, Total: 50, Date: '13-01-2024' },
    { Name: 'Vikram Singh', Subject: 'Chemistry', Test: 'DPP2', Marks: 41, Total: 50, Date: '14-01-2024' },
    { Name: 'Vikram Singh', Subject: 'Mathematics', Test: 'DPP2', Marks: 46, Total: 50, Date: '15-01-2024' },
  ],
  // Class 11-B
  '11B': [
    { Name: 'Anjali Sharma', Subject: 'Physics', Test: 'DPP1', Marks: 47, Total: 50, Date: '05-01-2024' },
    { Name: 'Anjali Sharma', Subject: 'Chemistry', Test: 'DPP1', Marks: 46, Total: 50, Date: '06-01-2024' },
    { Name: 'Anjali Sharma', Subject: 'Mathematics', Test: 'DPP1', Marks: 48, Total: 50, Date: '07-01-2024' },
    { Name: 'Anjali Sharma', Subject: 'Physics', Test: 'DPP2', Marks: 48, Total: 50, Date: '13-01-2024' },
    { Name: 'Anjali Sharma', Subject: 'Chemistry', Test: 'DPP2', Marks: 47, Total: 50, Date: '14-01-2024' },
    { Name: 'Anjali Sharma', Subject: 'Mathematics', Test: 'DPP2', Marks: 49, Total: 50, Date: '15-01-2024' },
  ],
};

try {
  // Create a new workbook
  const wb = XLSX.utils.book_new();

  // Column widths
  const colWidths = [
    { wch: 15 },  // Name
    { wch: 15 },  // Subject
    { wch: 10 },  // Test
    { wch: 8 },   // Marks
    { wch: 8 },   // Total
    { wch: 12 },  // Date
  ];

  // Create a sheet for each class
  Object.keys(allData).forEach(className => {
    const ws = XLSX.utils.json_to_sheet(allData[className]);
    ws['!cols'] = colWidths;
    
    // Format Date column (column F) as date format
    const range = XLSX.utils.decode_range(ws['!ref']);
    for (let row = range.s.r; row <= range.e.r; row++) {
      const cellAddress = XLSX.utils.encode_cell({ r: row, c: 5 }); // Column F (0-indexed: 5)
      if (ws[cellAddress]) {
        ws[cellAddress].z = 'dd-mm-yyyy'; // Date format
      }
    }
    
    XLSX.utils.book_append_sheet(wb, ws, className);
  });

  // Write to file
  const filePath = path.join(__dirname, '../data/students.xlsx');
  XLSX.writeFile(wb, filePath);

  console.log(`✅ Multi-sheet Excel file created successfully at: ${filePath}`);
  console.log(`📊 Classes: ${Object.keys(allData).join(', ')}`);
  console.log(`📋 Total records: ${Object.values(allData).reduce((sum, arr) => sum + arr.length, 0)}`);
} catch (error) {
  console.error('❌ Error creating Excel file:', error.message);
  process.exit(1);
}
