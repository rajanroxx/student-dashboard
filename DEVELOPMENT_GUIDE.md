# Development Guide

This guide is for developers who want to customize, extend, or understand the Student Marks Dashboard codebase.

## Project Architecture

### Overview
```
┌─────────────────────────────────────────────────────────┐
│                    Web Browser (Port 3000)              │
│ ┌──────────────────────────────────────────────────────┐│
│ │  React Frontend                                      ││
│ │  ├── Filters (Class, Student, Subject)              ││
│ │  ├── Statistics Cards                               ││
│ │  ├── Charts (Chart.js)                              ││
│ │  ├── Tables (Test-wise, Subject-wise, Detailed)     ││
│ │  └── Dynamic Calculations                           ││
│ └──────────────────────────────────────────────────────┘│
└────────────┬────────────────────────────────────────────┘
             │ HTTP Requests (Axios)
             ▼
┌─────────────────────────────────────────────────────────┐
│              Express.js Backend (Port 5000)             │
│ ┌──────────────────────────────────────────────────────┐│
│ │  API Endpoints                                       ││
│ │  ├── GET /marks      (Fetch all records)            ││
│ │  ├── POST /refresh   (Reload Excel data)            ││
│ │  └── GET /health     (Server status)                ││
│ └──────────────────────────────────────────────────────┘│
│                        ↓                                  │
│ ┌──────────────────────────────────────────────────────┐│
│ │  Excel Data Processing (XLSX Package)                ││
│ │  ├── Read Excel file                                 ││
│ │  ├── Parse sheets to JSON                            ││
│ │  └── Return student records                          ││
│ └──────────────────────────────────────────────────────┘│
└────────────┬────────────────────────────────────────────┘
             │ File I/O
             ▼
┌─────────────────────────────────────────────────────────┐
│              File System                                 │
│  /data/students.xlsx (Excel data source)                │
└─────────────────────────────────────────────────────────┘
```

## Tech Stack

### Frontend
- **React 18**: UI framework
- **Axios**: HTTP client for API calls
- **Chart.js**: Charting library
- **React-ChartJS-2**: React wrapper for Chart.js
- **CSS3**: Custom styling

### Backend
- **Node.js**: JavaScript runtime
- **Express.js**: Web framework
- **CORS**: Cross-origin resource sharing middleware
- **XLSX**: Excel file parser
- **npm**: Package manager

## File Structure

```
Students dashboard/
├── backend/
│   ├── package.json              # Dependencies & scripts
│   └── server.js                 # Main API server (176 lines)
│
├── frontend/
│   ├── package.json              # React dependencies
│   ├── public/
│   │   └── index.html            # HTML template
│   └── src/
│       ├── App.js                # Main React component (400+ lines)
│       ├── index.js              # Entry point
│       └── index.css             # Styling (350+ lines)
│
├── data/
│   ├── students.xlsx             # Excel data (auto-generated)

│
├── README.md                     # Complete documentation
├── QUICK_START.txt              # Quick start guide
├── API_DOCUMENTATION.md         # API reference
├── SETUP.bat                    # Windows setup script
├── SETUP.sh                     # Mac/Linux setup script
└── .gitignore                   # Git ignore file
```

## Backend Code Structure

### server.js Overview

```javascript
// 1. Imports
const express = require('express');
const cors = require('cors');
const XLSX = require('xlsx');
const path = require('path');
const fs = require('fs');

// 2. Setup
const app = express();
const PORT = 5000;

// 3. Middleware
app.use(cors());
app.use(express.json());

// 4. Core Function: readExcelFile()
// - Reads Excel file from /data/students.xlsx
// - Converts sheet to JSON array
// - Returns array of student records

// 5. Endpoints
// - GET /marks      (Read Excel data)
// - POST /refresh   (Reload data)
// - GET /health     (Server check)

// 6. Server Start
app.listen(PORT, ...)
```

### Key Backend Functions

#### readExcelFile()
```javascript
const readExcelFile = () => {
  // 1. Construct file path
  const filePath = path.join(__dirname, '../data/students.xlsx');
  
  // 2. Check file exists
  if (!fs.existsSync(filePath)) {
    return [];
  }

  // 3. Read Excel file
  const workbook = XLSX.readFile(filePath);
  
  // 4. Get first sheet
  const sheetName = workbook.SheetNames[0];
  const worksheet = workbook.Sheets[sheetName];
  
  // 5. Convert to JSON
  const data = XLSX.utils.sheet_to_json(worksheet);
  
  return data;
};
```

**To modify:**
- Change file path: Modify `filePath` variable
- Handle multiple sheets: Loop through `workbook.SheetNames`
- Filter data: Add array filter before returning

## Frontend Code Structure

### App.js Overview

```javascript
// 1. Imports
import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { Bar } from 'react-chartjs-2';

// 2. Component: App()
// State management:
// - data: All student records
// - loading: Loading state
// - selectedClass, selectedStudent, selectedSubject: Filters

// 3. useEffect Hook
// - Fetches data on component mount
// - Calls fetchData() function

// 4. Helper Functions
// - getUniqueClasses(): Get list of classes
// - getUniqueStudents(): Get students for selected class
// - getUniqueSubjects(): Get subjects for selection
// - getFilteredData(): Apply all filters
// - calculateStats(): Calculate percentages and totals
// - getSubjectWiseStats(): Group by subject
// - getTestWiseStats(): Group by test
// - prepareChartData(): Format data for Chart.js

// 5. JSX Rendering
// - Header section
// - Filter section
// - Statistics cards
// - Content section (charts & tables)
```

### Key Frontend Functions

#### calculateStats()
```javascript
const calculateStats = () => {
  const filteredData = getFilteredData();

  // Sum all marks
  const totalMarks = filteredData.reduce(
    (sum, item) => sum + (Number(item.Marks) || 0), 0
  );

  // Sum all totals
  const totalPossible = filteredData.reduce(
    (sum, item) => sum + (Number(item.Total) || 0), 0
  );

  // Calculate percentage
  const percentage = totalPossible > 0 
    ? ((totalMarks / totalPossible) * 100).toFixed(2) 
    : 0;

  return { totalMarks, totalPossible, percentage, testCount: filteredData.length };
};
```

#### getFilteredData()
```javascript
const getFilteredData = () => {
  let filtered = data;

  // Apply filters in sequence
  if (selectedClass) {
    filtered = filtered.filter(item => item.Class === selectedClass);
  }

  if (selectedStudent) {
    filtered = filtered.filter(item => item.Name === selectedStudent);
  }

  if (selectedSubject) {
    filtered = filtered.filter(item => item.Subject === selectedSubject);
  }

  return filtered;
};
```

## Customization Guide

### Adding a New Column to Excel

1. **Update Excel file schema:**
   ```
   Add column: "Grade" after "Marks"
   ```

2. **Update backend** (if needed):
   - No changes required; XLSX reads all columns automatically

3. **Update frontend to display:**
   ```javascript
   // In App.js, add to table header:
   <th>Grade</th>
   
   // In table body:
   <td>{item.Grade}</td>
   ```

### Adding a New Filter

1. **Add state to App.js:**
   ```javascript
   const [selectedGrade, setSelectedGrade] = useState('');
   ```

2. **Add unique values function:**
   ```javascript
   const getUniqueGrades = () => {
     return [...new Set(data.map(item => item.Grade))].filter(Boolean).sort();
   };
   ```

3. **Add filter element:**
   ```javascript
   <div className="filter-item">
     <label>Select Grade</label>
     <select value={selectedGrade} onChange={(e) => setSelectedGrade(e.target.value)}>
       <option value="">-- All Grades --</option>
       {getUniqueGrades().map(grade => (
         <option key={grade} value={grade}>{grade}</option>
       ))}
     </select>
   </div>
   ```

4. **Update getFilteredData():**
   ```javascript
   if (selectedGrade) {
     filtered = filtered.filter(item => item.Grade === selectedGrade);
   }
   ```

### Adding a New Chart

1. **Import chart type:**
   ```javascript
   import { Bar, Line, Pie, Doughnut } from 'react-chartjs-2';
   ```

2. **Create data preparation function:**
   ```javascript
   const prepareLineChartData = () => {
     // Format data for line chart
     return { labels, datasets };
   };
   ```

3. **Add chart to JSX:**
   ```javascript
   <div className="chart-container">
     <h3>Performance Over Time</h3>
     <Line data={lineChartData} />
   </div>
   ```

### Adding a New API Endpoint

1. **Add route to backend (server.js):**
   ```javascript
   app.get('/api/students', (req, res) => {
     try {
       const data = readExcelFile();
       const classes = [...new Set(data.map(item => item.Class))];
       res.json({ success: true, classes });
     } catch (error) {
       res.status(500).json({ success: false, error: error.message });
     }
   });
   ```

2. **Call from frontend:**
   ```javascript
   useEffect(() => {
     axios.get('http://localhost:5000/api/students')
       .then(res => setClasses(res.data.classes));
   }, []);
   ```

## Deployment Guide

### Deploy Backend to Heroku

```bash
# 1. Create Heroku account at https://heroku.com

# 2. Install Heroku CLI
npm install -g heroku

# 3. Login
heroku login

# 4. Create app
cd backend
heroku create my-dashboard-api

# 5. Deploy
git push heroku master

# 6. View logs
heroku logs --tail
```

### Deploy Frontend to Vercel

```bash
# 1. Create Vercel account at https://vercel.com
# 2. Install Vercel CLI
npm install -g vercel

# 3. Deploy
cd frontend
vercel

# 4. Update backend URL in App.js to production URL
```

## Performance Optimization

### 1. Cache Excel Data on Backend
```javascript
let cachedData = null;
let cacheExpiry = 0;

const readExcelFile = () => {
  const now = Date.now();
  if (cachedData && now < cacheExpiry) {
    return cachedData;
  }
  
  // Read file...
  cachedData = data;
  cacheExpiry = now + (5 * 60 * 1000); // 5 minute cache
  
  return cachedData;
};
```

### 2. Lazy Load Features on Frontend
```javascript
const [showChart, setShowChart] = useState(false);

// Only render chart when needed
{showChart && <Bar data={chartData} />}
```

### 3. Optimize Table Rendering
```javascript
// Use React.memo for table rows
const TableRow = React.memo(({ item }) => (
  <tr>
    <td>{item.Name}</td>
    {/* ... */}
  </tr>
));
```

## Testing

### Manual Testing Checklist
- [ ] Backend API `/marks` returns data
- [ ] Frontend loads without errors
- [ ] Filter by class works
- [ ] Filter by student works
- [ ] Refresh button updates data
- [ ] Chart displays correctly
- [ ] Percentage calculation is accurate
- [ ] Tables show correct data
- [ ] Responsive design on mobile

### Automated Testing (Optional)

```bash
# Install testing library
npm install --save-dev jest @testing-library/react

# Run tests
npm test
```

## Security Best Practices

1. **Input Validation**
   ```javascript
   // Validate before processing
   if (!item.Marks || Number.isNaN(Number(item.Marks))) {
     console.warn('Invalid marks value');
   }
   ```

2. **File Upload Security** (if adding file upload)
   ```javascript
   // Validate file type
   if (file.type !== 'application/vnd.ms-excel' && 
       file.type !== 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet') {
     throw new Error('Invalid file type');
   }
   ```

3. **CORS Security**
   ```javascript
   // Restrict to specific origin in production
   app.use(cors({
     origin: 'https://yourdomain.com',
     credentials: true
   }));
   ```

## Debugging Tips

### Frontend Debugging
```javascript
// Add console logs
console.log('Filtered data:', getFilteredData());
console.log('Stats:', calculateStats());

// Use React DevTools
// Install Chrome extension: React Developer Tools

// Check network requests
// Open DevTools → Network tab → Check API calls
```

### Backend Debugging
```javascript
// Add request logging
app.use((req, res, next) => {
  console.log(`${req.method} ${req.path}`);
  next();
});

// Log data reading
console.log('Reading file from:', filePath);
console.log('Data records:', data.length);

// Test endpoint in browser
// http://localhost:5000/marks
```

## Version Control

### Commit Messages
```
git add .
git commit -m "feat: add subject filter to dashboard"
git commit -m "fix: correct percentage calculation"
git commit -m "docs: update API documentation"
```

### Ignore Files
Already configured in `.gitignore`:
- node_modules/
- .env
- Excel files (for data privacy)
- Build outputs

## Contributing

1. **Clone repository**
2. **Create feature branch**: `git checkout -b feature/new-feature`
3. **Make changes**
4. **Test thoroughly**
5. **Commit changes**: `git commit -m "feat: add feature"`
6. **Push branch**: `git push origin feature/new-feature`
7. **Create Pull Request**

## Resources

- [React Documentation](https://react.dev)
- [Express.js Guide](https://expressjs.com)
- [XLSX Documentation](https://github.com/SheetJS/js-xlsx)
- [Chart.js Documentation](https://www.chartjs.org)
- [Axios Documentation](https://axios-http.com)

## Common Tasks

### Add Dark Mode
```css
/* Add to index.css */
@media (prefers-color-scheme: dark) {
  body {
    background: #1e1e1e;
    color: #fff;
  }
}
```

### Add Print Functionality
```javascript
const handlePrint = () => {
  window.print();
};

// Add button
<button onClick={handlePrint}>Print</button>
```

### Add Export to CSV
```javascript
const exportToCSV = () => {
  const csv = Papa.unparse(getFilteredData());
  const link = document.createElement('a');
  link.href = 'data:text/csv;charset=utf-8,' + encodeURIComponent(csv);
  link.download = 'marks.csv';
  link.click();
};
```

## FAQ

**Q: How do I add more students?**
A: Add rows to `data/students.xlsx` and click "Refresh Data"

**Q: Can I use different Excel formats?**
A: Yes, modify `backend/server.js` to handle `.csv` or other formats

**Q: How do I connect a real database?**
A: Replace `readExcelFile()` with database query in `backend/server.js`

**Q: Can I add user authentication?**
A: Yes, use middleware like `passport.js` with session management

---

For more information, see [README.md](README.md) and [API_DOCUMENTATION.md](API_DOCUMENTATION.md)
