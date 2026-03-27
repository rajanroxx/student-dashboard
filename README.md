# 📚 Student Marks Dashboard

A full-stack web application for tracking and analyzing student marks. Built with React (frontend) and Node.js/Express (backend), using Excel files as the data source.

## 🎯 Features

- ✅ **Dynamic Filtering**: Filter by Class, Student, and Subject
- ✅ **Performance Charts**: Bar chart for test-wise performance
- ✅ **Statistics Dashboard**: Total marks, percentage, and test count
- ✅ **Multiple Views**: Test-wise marks, subject-wise summary, and detailed records
- ✅ **Excel Integration**: Read data directly from Excel file (no database needed)
- ✅ **Responsive Design**: Works on desktop, tablet, and mobile browsers
- ✅ **Real-time Refresh**: Reload latest data from Excel file

## 📁 Project Structure

```
Students dashboard/
├── backend/                    # Node.js/Express server
│   ├── package.json           # Dependencies and scripts
│   ├── server.js              # Main server file
│   └── .env (optional)        # Environment variables
│
├── frontend/                   # React application
│   ├── package.json           # React dependencies
│   ├── public/
│   │   └── index.html         # HTML template
│   └── src/
│       ├── App.js             # Main component
│       ├── index.js           # Entry point
│       └── index.css          # Styles
│
├── data/                       # Data directory
│   ├── students.xlsx          # Excel data file (auto-generated)

│
└── README.md                   # This file
```

## 📋 Excel File Format

The `students.xlsx` file should have the following columns:

| Name | Class | Subject | Test | Marks | Total | Date |
|------|-------|---------|------|-------|-------|------|
| Amit Kumar | 10-A | Mathematics | Unit Test 1 | 45 | 50 | 2024-01-15 |
| Priya Singh | 10-A | English | Unit Test 1 | 38 | 40 | 2024-01-15 |

**Column Details:**
- **Name**: Student's name
- **Class**: Class/Grade (e.g., 10-A, 11-B)
- **Subject**: Subject name (e.g., Mathematics, English, Science)
- **Test**: Test name (e.g., Unit Test 1, Quarterly, Half Yearly)
- **Marks**: Marks obtained
- **Total**: Total marks possible
- **Date**: Test date (YYYY-MM-DD format)

## 🚀 Quick Start (5 minutes)

### Prerequisites

- **Node.js** (version 14 or higher) - [Download](https://nodejs.org/)
- **npm** (comes with Node.js)
- Excel file with student data

### Step 1: Generate Sample Data (Optional)

If you want to test with sample data first:

```bash
cd backend
node generateData.js
```

This creates `students.xlsx` with sample student records.

### Step 2: Setup Backend

1. Open terminal/command prompt
2. Navigate to backend folder:
   ```bash
   cd backend
   ```

3. Install dependencies:
   ```bash
   npm install
   ```

4. Start the backend server:
   ```bash
   npm start
   ```

   You should see:
   ```
   Server is running on http://localhost:5000
   Health check: http://localhost:5000/health
   Marks API: http://localhost:5000/marks
   ```

### Step 3: Setup Frontend (New Terminal)

1. Open a **NEW terminal/command prompt**
2. Navigate to frontend folder:
   ```bash
   cd frontend
   ```

3. Install dependencies:
   ```bash
   npm install
   ```

4. Start the React app:
   ```bash
   npm start
   ```

   - The app will automatically open in your browser at `http://localhost:3000`
   - If it doesn't open, manually visit: `http://localhost:3000`

### Step 4: Start Using!

1. You should see the Student Marks Dashboard
2. Use the filters to explore data:
   - Select a Class
   - Select a Student
   - Optionally select a Subject
3. View:
   - Performance statistics
   - Test-wise bar chart
   - Subject-wise summary
   - Detailed records table

## 📊 API Endpoints

### Backend API (runs on port 5000)

#### 1. Get All Marks
```
GET http://localhost:5000/marks

Response:
{
  "success": true,
  "data": [...],
  "count": 42
}
```

#### 2. Refresh Data
```
POST http://localhost:5000/refresh

Response:
{
  "success": true,
  "message": "Data refreshed successfully",
  "data": [...],
  "count": 42
}
```

#### 3. Health Check
```
GET http://localhost:5000/health

Response:
{
  "status": "Backend server is running"
}
```

## 🔧 Configuration

### Backend Configuration

Edit `backend/server.js` to change:
- **PORT**: Default is 5000
  ```javascript
  const PORT = 5000; // Change this
  ```

- **Excel File Path**: Default is `../data/students.xlsx`
  ```javascript
  const filePath = path.join(__dirname, '../data/students.xlsx'); // Change this
  ```

### Frontend Configuration

The frontend is configured to proxy API requests to `http://localhost:5000` via `package.json`:
```json
"proxy": "http://localhost:5000"
```

To change backend URL, modify in `frontend/src/App.js`:
```javascript
const response = await axios.get('http://localhost:5000/marks');
```

## ⚙️ Advanced Features

### Calculations

The dashboard calculates:
- **Percentage**: `(Total Marks Obtained / Total Marks Possible) × 100`
- **Subject-wise Stats**: Aggregates marks by subject
- **Test-wise Stats**: Aggregates marks by test type
- **Performance Percentage**: Per test breakdown

### Chart Display

- **Bar Chart**: Shows obtained marks vs. total marks for each test
- **Auto-scaling**: Handles different data sizes
- **Responsive**: Adjusts to screen size

### Filtering Logic

1. **Class Filter**: Shows classes available in data
2. **Student Filter**: Shows students of selected class (or all if no class selected)
3. **Subject Filter**: Shows subjects for selected class/student
4. **Reset**: Use filter selection to remove filters

## 🛠️ Troubleshooting

### Issue: "Backend connection failed"

**Solution:**
1. Make sure backend is running: `npm start` in `backend/` folder
2. Check if port 5000 is available (no other app using it)
3. Check backend console for errors

### Issue: "No data showing"

**Solution:**
1. Generate sample data: `node backend/generateData.js`
2. Ensure `students.xlsx` exists in `data/` folder
3. Check Excel file has correct column names
4. Click "Refresh Data" button in dashboard

### Issue: "Module not found error"

**Solution:**
1. Run `npm install` in the folder where error occurs
2. Make sure Node.js and npm are properly installed
3. Delete `node_modules` folder and run `npm install` again

### Issue: "Port already in use"

**Solution:**
1. For backend (port 5000): Change PORT in `backend/server.js`
2. For frontend (port 3000): Set `BROWSER=none PORT=3001 npm start` to use port 3001
3. Or kill the process using that port

## 📱 Multi-User Setup (Optional)

To access dashboard from other computers:

1. **Get Your IP Address:**
   - Windows: Open cmd and type `ipconfig` (look for IPv4 Address)
   - Mac/Linux: Open terminal and type `ifconfig`

2. **Update Backend CORS:**
   Replace line in `backend/server.js`:
   ```javascript
   app.use(cors()); // Allows all origins
   ```

   With specific IP:
   ```javascript
   app.use(cors({
     origin: 'http://YOUR_IP:3000'
   }));
   ```

3. **Update Frontend API URL:**
   Replace in `frontend/src/App.js`:
   ```javascript
   const response = await axios.get('http://YOUR_IP:5000/marks');
   ```

4. **Start servers and access from other computers:**
   - `http://YOUR_IP:3000`

## 📈 Sample Excel Data

Sample data includes:
- **4 Students in Class 10-A**: Amit Kumar, Priya Singh, Raj Patel, Neha Verma
- **2 Students in Class 10-B**: (same students in different class)
- **2 Students in Class 9-A**: Arun Gupta, Seema Das
- **2 Students in Class 11**: Vikram Singh, Anjali Sharma
- **9 Records per student**: Each student has 3 subjects with 3 tests each
- **Total: 42 sample records**

## 📦 Dependencies

### Backend
- **express**: Web server framework
- **cors**: Enable CORS
- **xlsx**: Read/write Excel files

### Frontend
- **react**: UI library
- **axios**: HTTP client
- **chart.js**: Charting library
- **react-chartjs-2**: React wrapper for Chart.js

## 📝 Adding Your Own Data

1. Prepare Excel file with columns: Name, Class, Subject, Test, Marks, Total, Date
2. Place it in `data/` folder as `students.xlsx`
3. Click "Refresh Data" button in dashboard
4. Done! Your data will load automatically

## 🎨 Customization

### Change Colors/Styling

Edit `frontend/src/index.css` to modify:
- Colors: Change gradient colors
- Layout: Modify grid columns
- Fonts: Change font family and sizes

### Add More Charts

In `frontend/src/App.js`, you can add more chart types:
```javascript
import { Line, Pie, Doughnut } from 'react-chartjs-2';
```

### Modify Excel Parser

In `backend/server.js`, edit `readExcelFile()` function to:
- Handle multiple sheets
- Filter specific columns
- Transform data format

## 🐛 Debugging Tips

1. **Check Backend Logs**: Look at backend terminal for errors
2. **Browser Console**: Open DevTools (F12) and check browser console
3. **Excel File**: Verify column names match exactly (case-sensitive)
4. **API Test**: Visit `http://localhost:5000/marks` in browser to see raw JSON

## 📄 License

This project is open source and available for educational purposes.

## ✨ Tips & Tricks

- Use **Refresh Data** button to reload latest Excel changes without restarting
- Filters reset when you change other filters
- Percentage automatically calculates for each test
- Chart updates dynamically based on filter selection
- Works offline once data is loaded (except refresh)

## 🤝 Support

For issues or questions:
1. Check troubleshooting section above
2. Verify all prerequisites are installed
3. Ensure Excel file format is correct
4. Check that both servers are running

---

**Happy Analyzing! 📊📚**
