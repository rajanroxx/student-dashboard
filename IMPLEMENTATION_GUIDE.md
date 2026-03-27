# Student Dashboard - Multi-Class Update Guide

## ✅ What's New

### 1. **Multi-Sheet Excel Structure**
- Single Excel file: `students.xlsx`
- Each sheet represents a class (10A, 10B, 9A, 11A, 11B, etc.)
- Columns: Name, Subject, Test, Marks, Total, Date
- No "Class" column needed in Excel (sheet name = class)

### 2. **Backend API Updates**

#### New Endpoints:
- **GET `/marks/:className`** - Get marks for a specific class
  ```
  http://localhost:5000/marks/10A
  ```
  
- **GET `/classes`** - Get list of all available classes
  ```
  http://localhost:5000/classes
  Returns: { "success": true, "classes": ["10A", "10B", "9A", "11A", "11B"] }
  ```

- **GET `/marks`** - Get all marks (backward compatible)
  - Now returns data from all sheets with Class field added
  
- **POST `/refresh`** - Refresh data from Excel

#### Key Features:
- Reads specific sheet by className parameter
- Returns data as JSON
- Handles missing sheets gracefully
- Combines sheets when needed

### 3. **Frontend Features**

#### Class Selection
- Dropdown shows all available classes from `/classes` endpoint
- Auto-loads first available class on startup
- When class changes → fetches fresh data for that class

#### Date Filtering
- **Date Dropdown**: Shows all unique dates in selected class
- Dynamic sorting (earliest to latest)
- Resets Test and Student filters when date changes
- Date formatting: Converts to readable format (e.g., "15 Jan 2024")

#### Test (DPP) Filtering
- **Test Dropdown**: Shows unique tests for selected date
- Supports: DPP1, DPP2, DPP3, etc. (any test name)
- Filters update when date or test changes

#### Subject Filtering
- **Subject Dropdown**: Shows unique subjects across all filters
- Filters data by subject selection
- Updates class view and student records based on subject
- Resets when class changes

#### Student Selection
- **Student Dropdown**: Shows unique students for filters
- Click on student → view detailed records

#### Two-View System

**Class View (No Student Selected)**:
- Grouped data by student name
- Shows: Student Name | Subjects | Total Marks
- Bar chart: X-axis = student names, Y-axis = total marks
- Click on any student row to see details

**Student View (Student Selected)**:
- Filtered for selected student + date + test
- Table: Subject | Test | Marks | Total | % | Date
- Subject-wise Summary: Subject | Marks | Total | %
- Test-based Graph: X-axis = subjects, Y-axis = marks
- "Back to Class View" button to return

#### Dynamic Filtering
All selections update automatically:
- Class → Date → Test → Student
- Filters cascade (e.g., date filter limits available tests)
- Charts and tables refresh in real-time
- Stats cards show: Total Marks | Percentage | Record Count

### 4. **Data Format**

#### Excel Sheet Structure (Example: 10A)
| Name | Subject | Test | Marks | Total | Date |
|------|---------|------|-------|-------|------|
| Amit Kumar | Mathematics | DPP1 | 45 | 50 | 2024-01-15 |
| Amit Kumar | Mathematics | DPP2 | 48 | 50 | 2024-01-22 |
| ... | ... | ... | ... | ... | ... |

#### Date Handling
- Accepts string dates (YYYY-MM-DD) or Excel numeric dates
- Automatically converts and displays in readable format
- Format: "DD Mon YYYY" (e.g., "15 Jan 2024")

## 🚀 How to Use

### 1. **Start Backend**
```bash
cd backend
npm install  # if needed
node server.js
```
Should log:
```
Server is running on http://localhost:5000
Available Classes API: http://localhost:5000/classes
Get Marks by Class: http://localhost:5000/marks/:className
```

### 2. **Start Frontend**
```bash
cd frontend
npm start
```

### 3. **Generate Sample Data**
```bash
cd backend
node generateData.js
```
Creates `students.xlsx` in `data/` folder

### 4. **Using the Dashboard**

1. Select a class from the dropdown
2. (Optional) Select a date to filter
3. (Optional) Select a test to further filter
4. View class summary or click on a student for details
5. Use "Back to Class View" to return

## 📊 Filtering Logic

```
Class Selection (Required)
    ↓ (Fetches class data)
Date Selection (Optional)
    ↓ (Filter records by date)
Test Selection (Optional)
    ↓ (Filter by test/DPP)
Subject Selection (Optional)
    ↓ (Filter by subject)
Student Selection (Optional)
    ↓ (Click row or select from dropdown)
Shows student detail view
```

## 🔄 Data Flow

```
Frontend
  ├─ Load Classes → GET /classes
  ├─ Select Class → GET /marks/10A
  ├─ Apply Filters (Date, Test, Subject, Student)
  │  ├─ Class -> always required
  │  ├─ Date -> optional
  │  ├─ Test -> optional  
  │  ├─ Subject -> optional
  │  ├─ Student -> optional
  ├─ Update UI
  │  ├─ Stats Cards
  │  ├─ Charts (Bar graphs)
  │  └─ Tables (Grouped/Detailed)
  └─ Navigate between views
```

## 📈 Charts & Visualizations

### Class View Chart
- **Type**: Bar Chart
- **X-axis**: Student Names
- **Y-axis**: Total Marks
- **When**: Show when not viewing specific student

### Student View Chart (Test-Based)
- **Type**: Bar Chart
- **X-axis**: Subject Names
- **Y-axis**: Marks in Selected Test
- **When**: Show when test is selected

## ✨ Key Improvements

✅ Multi-class support (one Excel file, multiple sheets)
✅ Advanced filtering (class → date → test → subject → student)
✅ Subject dropdown filter
✅ Dynamic chart updates based on filters
✅ Date formatting for Excel dates (automatic conversion)
✅ Excel dates stored as Date type (not General)
✅ Grouped class view with clickable rows
✅ Dual view system (class & student)
✅ Test/DPP filtering
✅ No UI rebuild (only logic updated)
✅ Cascading filters (dependent dropdowns)
✅ Real-time stats calculations

## 🦺 Troubleshooting

### "Failed to fetch available classes"
- Ensure backend is running on port 5000
- Check network connection

### "No data available"
- Select a class from the dropdown
- Check if Excel file exists in `data/students.xlsx`
- Verify Excel file has correct sheet names (10A, 10B, etc.)

### Date appears as numbers
- Already handled! formatDate() converts Excel dates automatically

### Filters not updating
- Class must be selected first
- Data is lazy-loaded per class, not pre-loaded

## 📝 Notes

- Single Excel file approach improves data management
- Sheet-based class organization is intuitive
- Lazy loading per class improves performance
- All filters are independent and cascading
- Charts update dynamically with filter changes
