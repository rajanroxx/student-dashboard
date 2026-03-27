# Manual Sheet Creation Guide

## How to Create a New Sheet Manually in Excel

### Step 1: Open the Excel File
- File location: `data/students.xlsx`
- Use Microsoft Excel or compatible software

### Step 2: Create New Sheet
1. Right-click on sheet tab at bottom
2. Select **"Insert Sheet"** or **"New Sheet"**
3. Enter sheet name (follow rules below)
4. Click **OK**

### Step 3: Add Headers
In the first row, add these **exact** column headers:
| Column A | Column B | Column C | Column D | Column E | Column F |
|----------|----------|----------|----------|----------|----------|
| Name | Subject | Test | Marks | Total | Date |

### Step 4: Add Data
Starting from Row 2, enter student records:

| Row | Name | Subject | Test | Marks | Total | Date |
|-----|------|---------|------|-------|-------|------|
| 2 | Amit Kumar | Mathematics | DPP1 | 45 | 50 | 15-01-2024 |
| 3 | Amit Kumar | English | DPP1 | 38 | 40 | 16-01-2024 |
| 4 | Priya Singh | Mathematics | DPP1 | 48 | 50 | 15-01-2024 |

### Step 5: Format Date Column
1. Select column F (Date column)
2. Right-click → **Format Cells**
3. Select **Date** category
4. Choose format: `dd-mm-yyyy`
5. Click **OK**

### Step 6: Save File
- Press **Ctrl+S** to save
- Or File → Save

### Step 7: Refresh Dashboard
1. Go back to dashboard
2. Click **🔄 Refresh Data** button
3. New sheet should appear in class dropdown

---

## Sheet Name Rules (IMPORTANT!)

✅ **MUST start with letter or underscore**
✅ Can contain: letters, numbers, underscores
✅ Max 31 characters
✅ Case-insensitive (ClassA = classa)

❌ **Cannot start with number** (1A, 2B, 3C)
❌ **Cannot contain**: [ ] : * ? / \
❌ **Cannot be empty**

### Valid Examples
- `ClassA` ✅
- `Class1A` ✅
- `Science101` ✅
- `Maths_Advanced` ✅
- `Test2024` ✅

### Invalid Examples
- `1A` ❌
- `10B` ❌
- `Class [10A]` ❌
- `Class-A` ❌ (contains hyphen)

---

## Column Format Reference

| Column | Type | Format | Example |
|--------|------|--------|---------|
| Name | Text | Any student name | Amit Kumar |
| Subject | Text | Subject name | Mathematics |
| Test | Text | Test/DPP name | DPP1, DPP2 |
| Marks | Number | Integer | 45 |
| Total | Number | Integer | 50 |
| Date | Date | dd-mm-yyyy | 15-01-2024 |

---

## If Sheet Not Appearing

### Checklist:
1. ✅ Sheet name starts with letter (NOT number)
2. ✅ Column headers match exactly (Name, Subject, Test, Marks, Total, Date)
3. ✅ Column headers in Row 1
4. ✅ Data starts from Row 2
5. ✅ Date column formatted as date (dd-mm-yyyy)
6. ✅ File saved as `students.xlsx`
7. ✅ Click "🔄 Refresh Data" button in dashboard

### Debug Steps:
1. **Check backend logs** for error messages
2. **Verify API**: Open `http://localhost:5000/classes` in browser
   - Shows all available sheets
   - Check if your sheet is listed
3. **Test data fetch**: Open `http://localhost:5000/marks/YourClassName` in browser
   - Replace `YourClassName` with your sheet name
   - Should show JSON data

---

## Common Issues & Solutions

### Issue: Sheet appears in Excel but not in dashboard

**Solution 1:** Refresh the page (F5)

**Solution 2:** Click "🔄 Refresh Data" button

**Solution 3:** Restart backend server
```bash
cd backend
node server.js
```

---

### Issue: Sheet name shows error "starts with number"

**Problem:** You used a name like `1A`, `2B`, `10A`

**Solution:** Rename to `Class1A`, `Class2B`, `Class10A`

Steps:
1. Right-click sheet tab
2. Select **Rename Sheet**
3. Enter new name (starting with letter)
4. Press Enter

---

### Issue: Data not loading from sheet

**Problem 1:** Column headers don't match exactly
- ❌ Wrong: "Student Name" (should be "Name")
- ✅ Correct: "Name"

**Problem 2:** Headers not in Row 1
- ✅ Headers must be in first row (Row 1)
- Data must start from Row 2

**Problem 3:** Date format wrong
- ❌ Wrong: 2024-01-15, 01/15/2024
- ✅ Correct: 15-01-2024

---

## Testing Your Sheet

### Method 1: Via Browser
1. Start backend: `cd backend && node server.js`
2. Open in browser: `http://localhost:5000/verify/YourClassName`
3. Shows:
   - ✅ Sheet exists
   - ✅ Column format correct
   - ✅ Number of records
   - ❌ Issues (if any)

### Method 2: Via Dashboard
1. Select class from dropdown
2. Check if data loads
3. If error, it shows what columns are expected

---

## Example: Complete Manual Sheet Setup

### File: students.xlsx → Sheet: ClassMaths

**Row 1 (Headers):**
```
Name | Subject | Test | Marks | Total | Date
```

**Row 2-5 (Data):**
```
Raj Kumar | Mathematics | DPP1 | 42 | 50 | 15-01-2024
Raj Kumar | Mathematics | DPP2 | 44 | 50 | 22-01-2024
Neha Singh | Mathematics | DPP1 | 46 | 50 | 15-01-2024
Neha Singh | Mathematics | DPP2 | 47 | 50 | 22-01-2024
```

**Result:** Dashboard shows "ClassMaths" in class dropdown with 4 records loading correctly

---

## Quick Checklist for Manual Sheet Creation

- [ ] Sheet name starts with letter (e.g., `ClassA`, NOT `1A`)
- [ ] Headers in Row 1: Name | Subject | Test | Marks | Total | Date
- [ ] Data starts from Row 2
- [ ] Column D (Marks) = numbers
- [ ] Column E (Total) = numbers
- [ ] Column F (Date) = formatted as date dd-mm-yyyy
- [ ] File saved
- [ ] Dashboard refreshed
- [ ] Sheet appears in class dropdown

If all checks pass and sheet still doesn't work, check browser console or backend logs for errors.
