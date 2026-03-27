# API Documentation

## Backend API Reference

The backend server runs on `http://localhost:5000` and provides the following endpoints.

## Endpoints

### 1. Get All Marks
**Endpoint:** `GET /marks`

**Description:** Retrieves all student marks from the Excel file.

**Request:**
```bash
curl http://localhost:5000/marks
```

**Response:**
```json
{
  "success": true,
  "data": [
    {
      "Name": "Amit Kumar",
      "Class": "10-A",
      "Subject": "Mathematics",
      "Test": "Unit Test 1",
      "Marks": 45,
      "Total": 50,
      "Date": "2024-01-15"
    },
    ...
  ],
  "count": 42
}
```

**Response Fields:**
- `success` (boolean): Whether the request was successful
- `data` (array): Array of student records
- `count` (number): Total number of records

---

### 2. Refresh Data
**Endpoint:** `POST /refresh`

**Description:** Manually refresh data from the Excel file. Useful after updating the Excel data.

**Request:**
```bash
curl -X POST http://localhost:5000/refresh
```

**Response:**
```json
{
  "success": true,
  "message": "Data refreshed successfully",
  "data": [...],
  "count": 42
}
```

---

### 3. Health Check
**Endpoint:** `GET /health`

**Description:** Check if the backend server is running and accessible.

**Request:**
```bash
curl http://localhost:5000/health
```

**Response:**
```json
{
  "status": "Backend server is running"
}
```

---

## Data Structure

Each student record contains:

| Field | Type | Description | Example |
|-------|------|-------------|---------|
| Name | string | Student's full name | "Amit Kumar" |
| Class | string | Class/Grade designation | "10-A" |
| Subject | string | Subject name | "Mathematics" |
| Test | string | Test/Assessment name | "Unit Test 1" |
| Marks | number | Marks obtained | 45 |
| Total | number | Total marks possible | 50 |
| Date | string | Test date (YYYY-MM-DD) | "2024-01-15" |

---

## Error Handling

### Error Response Format
```json
{
  "success": false,
  "message": "Error description",
  "error": "Detailed error message"
}
```

### Common Errors

#### 1. Excel File Not Found
**Status:** 500
```json
{
  "success": false,
  "message": "Error fetching marks",
  "error": "ENOENT: no such file or directory"
}
```

**Solution:**
- Ensure `data/students.xlsx` exists
- Run `node backend/generateData.js` to generate sample data

#### 2. Server Connection Error
**Status:** Cannot connect

**Solution:**
- Verify backend is running: `npm start` in backend folder
- Check if port 5000 is available
- No other application is using port 5000

---

## Usage Examples

### JavaScript (Fetch API)
```javascript
// Get all marks
fetch('http://localhost:5000/marks')
  .then(res => res.json())
  .then(data => console.log(data))
  .catch(err => console.error(err));

// Refresh data
fetch('http://localhost:5000/refresh', {
  method: 'POST'
})
  .then(res => res.json())
  .then(data => console.log(data))
  .catch(err => console.error(err));
```

### JavaScript (Axios)
```javascript
import axios from 'axios';

// Get all marks
axios.get('http://localhost:5000/marks')
  .then(res => console.log(res.data))
  .catch(err => console.error(err));

// Refresh data
axios.post('http://localhost:5000/refresh')
  .then(res => console.log(res.data))
  .catch(err => console.error(err));
```

### Python (Requests)
```python
import requests

# Get all marks
response = requests.get('http://localhost:5000/marks')
print(response.json())

# Refresh data
response = requests.post('http://localhost:5000/refresh')
print(response.json())
```

### cURL
```bash
# Get all marks
curl http://localhost:5000/marks

# Refresh data
curl -X POST http://localhost:5000/refresh

# Health check
curl http://localhost:5000/health
```

---

## CORS Configuration

The backend has CORS enabled to allow requests from:
- Frontend running on `http://localhost:3000`
- Any origin (configurable in `backend/server.js`)

To restrict CORS, modify `backend/server.js`:
```javascript
app.use(cors({
  origin: 'http://localhost:3000',
  credentials: true
}));
```

---

## Rate Limiting (Optional)

To add rate limiting, install and use `express-rate-limit`:

```bash
npm install express-rate-limit
```

Then in `backend/server.js`:
```javascript
const rateLimit = require('express-rate-limit');

const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100 // limit each IP to 100 requests per windowMs
});

app.use(limiter);
```

---

## Excel File Path Configuration

To change the Excel file location, modify `backend/server.js`:

```javascript
const readExcelFile = () => {
  const filePath = path.join(__dirname, '../data/students.xlsx');
  // Change the path here
};
```

Examples:
```javascript
// Absolute path
const filePath = 'C:/Data/students.xlsx';

// Relative to project
const filePath = path.join(__dirname, '../../data/students.xlsx');

// User's documents
const filePath = path.join(process.env.USERPROFILE, 'Documents/students.xlsx');
```

---

## Multiple Excel Sheets

To handle multiple sheets in the Excel file, modify `backend/server.js`:

```javascript
const readExcelFile = () => {
  const filePath = path.join(__dirname, '../data/students.xlsx');
  const workbook = XLSX.readFile(filePath);
  
  // Read all sheets
  const allData = {};
  workbook.SheetNames.forEach(sheetName => {
    const worksheet = workbook.Sheets[sheetName];
    allData[sheetName] = XLSX.utils.sheet_to_json(worksheet);
  });
  
  return allData;
};
```

---

## Logging

To add request logging, modify `backend/server.js`:

```javascript
app.use((req, res, next) => {
  console.log(`${new Date().toISOString()} - ${req.method} ${req.path}`);
  next();
});
```

---

## Performance Optimization

### Caching Data
```javascript
let cachedData = null;
let lastRead = null;

const readExcelFile = () => {
  const filePath = path.join(__dirname, '../data/students.xlsx');
  const stats = fs.statSync(filePath);
  
  // Return cached data if file hasn't changed
  if (cachedData && lastRead === stats.mtimeMs) {
    return cachedData;
  }
  
  const workbook = XLSX.readFile(filePath);
  const sheetName = workbook.SheetNames[0];
  const worksheet = workbook.Sheets[sheetName];
  cachedData = XLSX.utils.sheet_to_json(worksheet);
  lastRead = stats.mtimeMs;
  
  return cachedData;
};
```

---

## Troubleshooting

### API Not Responding
1. Check backend is running
2. Verify port 5000 is correct
3. Check firewall settings
4. Try `curl http://localhost:5000/health`

### Data Not Loading
1. Verify Excel file exists
2. Check Excel column names match exactly
3. Try `/refresh` endpoint
4. Check browser console for errors

### Server Errors
1. Check backend terminal for error messages
2. Verify Excel file is not open in another program
3. Check file permissions
4. Try deleting and regenerating data

---

## Version History

| Version | Changes |
|---------|---------|
| 1.0.0 | Initial release with /marks, /refresh, /health endpoints |

---

For more information, see [README.md](README.md)
