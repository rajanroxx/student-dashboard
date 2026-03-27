# TROUBLESHOOTING GUIDE

Comprehensive troubleshooting for common issues in Student Marks Dashboard.

## Installation & Setup Issues

### Issue 1: Node.js is not installed

**Symptoms:**
```
'node' is not recognized as an internal or external command
```

**Root Cause:**
Node.js is not installed or not in system PATH.

**Solutions:**

**Solution A (Recommended):**
1. Download from: https://nodejs.org/
2. Choose LTS version (v18 or v20)
3. Run installer
4. Check "Add to PATH" during installation
5. Restart command prompt
6. Verify: `node --version`

**Solution B (Windows):**
1. Download from nodejs.org
2. Run installer as Administrator
3. Click "Add to PATH" when prompted
4. Complete installation
5. Restart computer
6. Open new terminal and verify

**Solution C (Mac):**
```bash
# Using Homebrew
brew install node

# Verify
node --version
npm --version
```

**Solution D (Linux):**
```bash
# Ubuntu
sudo apt-get install nodejs npm

# Fedora
sudo dnf install nodejs npm

# Verify
node --version
npm --version
```

---

### Issue 2: npm command not found

**Symptoms:**
```
npm: command not found
```

**Root Cause:**
npm not installed or Node.js installation incomplete.

**Solutions:**

1. Reinstall Node.js (npm comes with it)
2. Check PATH environment variable
3. Restart terminal/command prompt
4. Try: `node -v` and `npm -v`

**Check PATH (Windows):**
1. Windows Key + R
2. Type: `sysdm.cpl`
3. System Properties → Environment Variables
4. Check PATH includes Node.js directory (usually `C:\Program Files\nodejs`)

**Check PATH (Mac/Linux):**
```bash
echo $PATH
which node
which npm
```

---

### Issue 3: npm install takes too long or fails

**Symptoms:**
```
npm ERR! timeout
npm ERR! network
npm ERR! 404 not found
```

**Root Cause:**
Slow internet, npm registry issues, or corrupted cache.

**Solutions:**

**Solution A: Clear npm cache**
```bash
npm cache clean --force
npm install
```

**Solution B: Change npm registry**
```bash
npm config set registry https://registry.npmjs.org/
npm install
```

**Solution C: Use yarn instead**
```bash
npm install -g yarn
yarn install
```

**Solution D: Retry with verbose output**
```bash
npm install --verbose
npm install --loglevel verbose
```

**Solution E: Delete and reinstall**
```bash
rm -rf node_modules package-lock.json  # Mac/Linux
del /s node_modules package-lock.json  # Windows

npm install
```

---

### Issue 4: Permission denied errors

**Symptoms:**
```
npm ERR! Error: EACCES: permission denied
npm WARN checkPermissions Missing write access
```

**Root Cause:**
Insufficient permissions to write to node_modules directory.

**Solutions:**

**Solution A: Use sudo (Not recommended)**
```bash
sudo npm install
```

**Solution B: Fix npm permissions**
```bash
mkdir ~/.npm-global
npm config set prefix '~/.npm-global'
export PATH=~/.npm-global/bin:$PATH
```

**Solution C: Change directory permissions**
```bash
sudo chown -R $(whoami) .
npm install
```

**Solution D: Use nvm (Node Version Manager)**
```bash
curl -o- https://raw.githubusercontent.com/nvm-sh/nvm/v0.39.0/install.sh | bash
nvm install node
npm install
```

---

## Backend Issues

### Issue 5: Backend won't start

**Symptoms:**
```
Error: listen EADDRINUSE: address already in use :::5000
```

**Root Cause:**
Port 5000 is already in use by another process.

**Solutions:**

**Solution A: Use different port**
Edit `backend/server.js`:
```javascript
const PORT = 5000; // Change to 5001, 5002, etc.
```

**Solution B: Kill process using port 5000**

**Windows:**
```bash
netstat -ano | findstr :5000
taskkill /PID <PID> /F
```

**Mac/Linux:**
```bash
lsof -i :5000
kill -9 <PID>
```

**Solution C: Wait a moment and retry**
Sometimes the port takes time to be released.
```bash
# Wait 30 seconds, then try again
npm start
```

---

### Issue 6: Excel file not found error

**Symptoms:**
```
Error reading Excel file: ENOENT: no such file or directory
```

**Root Cause:**
`students.xlsx` doesn't exist in `/data` folder.

**Solutions:**

**Solution A: Generate sample data**
```bash
cd backend
node generateData.js
cd ..
npm start
```

**Solution B: Create Excel file manually**
1. Open Excel or Calc (LibreOffice)
2. Create columns: Name, Class, Subject, Test, Marks, Total, Date
3. Add sample data
4. Save as: `data/students.xlsx`

**Solution C: Check file path**
Verify in `backend/server.js`:
```javascript
const filePath = path.join(__dirname, '../data/students.xlsx');
console.log('Looking for file at:', filePath);
```

**Solution D: Copy Excel file to correct location**
```bash
# Copy your Excel file to data folder
cp /path/to/students.xlsx data/students.xlsx
```

---

### Issue 7: Cannot read undefined (reading 'SheetNames')

**Symptoms:**
```
TypeError: Cannot read property 'SheetNames' of undefined
```

**Root Cause:**
Excel file is corrupted or not a valid Excel file.

**Solutions:**

**Solution A: Regenerate sample data**
```bash
cd backend
del students.xlsx  # Windows
rm students.xlsx   # Mac/Linux
node generateData.js
```

**Solution B: Verify Excel file**
1. Open Excel file manually
2. Check if it opens correctly
3. Ensure columns are named: Name, Class, Subject, Test, Marks, Total, Date
4. Save file

**Solution C: Check file format**
Excel file must be `.xlsx` format, not `.xls` or `.csv`.

**Solution D: Validate with minimal data**
Create new Excel with just one row of data to test.

---

### Issue 8: CORS error - backend won't communicate with frontend

**Symptoms:**
```
Access to XMLHttpRequest blocked by CORS policy
```

**Root Cause:**
CORS not properly configured on backend.

**Solutions:**

**Solution A: Verify CORS middleware in server.js**
```javascript
app.use(cors());  // Should match this line
```

**Solution B: Check backend URL in frontend**
In `frontend/src/App.js`:
```javascript
const response = await axios.get('http://localhost:5000/marks');
// Make sure URL is correct
```

**Solution C: Clear browser cache**
1. F12 to open DevTools
2. Application → Clear storage
3. Reload page

**Solution D: Check both servers are running**
- Backend: `http://localhost:5000/health`
- Frontend: `http://localhost:3000`

---

### Issue 9: Backend API returns empty array

**Symptoms:**
```json
{
  "success": true,
  "data": [],
  "count": 0
}
```

**Root Cause:**
Excel file is empty or data is not formatted correctly.

**Solutions:**

**Solution A: Check Excel content**
1. Open `data/students.xlsx`
2. Verify it has data
3. Check column names (exact case): Name, Class, Subject, Test, Marks, Total, Date

**Solution B: Regenerate sample data**
```bash
cd backend
node generateData.js
```

**Solution C: Add test data manually**
Add at least one row of data to Excel file.

**Solution D: Check backend console**
Terminal should show:
```
Server is running on http://localhost:5000
```

---

## Frontend Issues

### Issue 10: Frontend won't start

**Symptoms:**
```
npm ERR! code ENOENT
npm ERR! errno -2
npm ERR! enoent ENOSUCHFILE spawn sh
```

**Root Cause:**
Missing dependencies or corrupted Node modules.

**Solutions:**

**Solution A: Reinstall dependencies**
```bash
cd frontend
rm -rf node_modules package-lock.json  # Mac/Linux
del /s node_modules package-lock.json  # Windows
npm install
npm start
```

**Solution B: Check Node.js version**
```bash
node --version  # Should be v14 or higher
npm --version
```

**Solution C: Check for port conflicts**
```bash
# Port 3000 might be in use
# Use different port
PORT=3001 npm start
```

---

### Issue 11: Browser page is blank

**Symptoms:**
- Website opens but shows nothing
- Console shows errors

**Root Cause:**
Frontend can't connect to backend or JavaScript error.

**Solutions:**

**Solution A: Check browser console**
1. F12 to open DevTools
2. Console tab
3. Look for red errors
4. Common: "Cannot GET /api/marks"

**Solution B: Verify backend is running**
1. Open browser
2. Visit: `http://localhost:5000/health`
3. Should show: `{"status":"Backend server is running"}`

**Solution C: Check API URL in App.js**
```javascript
const response = await axios.get('http://localhost:5000/marks');
// Verify URL is correct
```

**Solution D: Clear React cache**
```bash
cd frontend
npm start -- --reset-cache
```

---

### Issue 12: Charts not displaying

**Symptoms:**
- No error messages
- Chart area is empty
- "Test-wise Performance" section shows nothing

**Root Cause:**
Chart library not loaded or data format incorrect.

**Solutions:**

**Solution A: Verify chart data exists**
1. Open F12 DevTools
2. Console tab
3. Add temporary log in App.js:
```javascript
console.log('Chart data:', chartData);
console.log('Filtered data:', getFilteredData());
```

**Solution B: Check Chart.js installation**
```bash
cd frontend
npm list chart.js react-chartjs-2
```

**Solution C: Reinstall chart libraries**
```bash
cd frontend
npm install chart.js react-chartjs-2
npm start
```

**Solution D: Verify data filtering**
1. Select Class and Student from filters
2. Should show some data
3. Check console logs

---

### Issue 13: Filters not working

**Symptoms:**
- Filters show but don't change data
- Data stays the same regardless of selection

**Root Cause:**
Filtering logic issue or no data loaded.

**Solutions:**

**Solution A: Verify data loaded**
1. Check browser console
2. Look for data array in App component
3. Click "Refresh Data" button

**Solution B: Check filter states**
Add console log in App.js:
```javascript
useEffect(() => {
  console.log('Selected:', { selectedClass, selectedStudent });
  console.log('Filtered:', getFilteredData());
}, [selectedClass, selectedStudent]);
```

**Solution C: Test API directly**
1. Browser: `http://localhost:5000/marks`
2. Should show JSON data
3. Verify column names

**Solution D: Hard refresh browser**
```
Ctrl + Shift + R  (Windows/Linux)
Cmd + Shift + R   (Mac)
```

---

### Issue 14: Tables showing but no data

**Symptoms:**
- Table headers display
- Table body is empty

**Root Cause:**
Filtered data is empty or table not receiving props.

**Solutions:**

**Solution A: Check filter selections**
1. Ensure Class is selected
2. Ensure Student is selected (if needed)
3. Data should populate

**Solution B: Load sample data**
1. Click "Refresh Data"
2. Select filters
3. Should show data

**Solution C: Verify Excel data format**
1. Check Excel has correct columns
2. Verify data types (numbers, not text)
3. No unnecessary spaces

**Solution D: Check console errors**
1. F12 → Console
2. Look for JavaScript errors
3. Check network tab for failed requests

---

## Performance Issues

### Issue 15: Dashboard is slow

**Symptoms:**
- Page takes long time to load
- Filtering is slow
- Charts take time to render

**Root Cause:**
Large dataset or inefficient rendering.

**Solutions:**

**Solution A: Reduce Excel data**
- Test with smaller dataset first
- Check if performance improves

**Solution B: Filter data on backend**
Modify `backend/server.js` to add filtering endpoint:
```javascript
app.get('/marks/:class', (req, res) => {
  const data = readExcelFile();
  const filtered = data.filter(item => item.Class === req.params.class);
  res.json({ success: true, data: filtered });
});
```

**Solution C: Implement pagination**
Show 50 records at a time instead of all.

**Solution D: Check browser resources**
1. F12 → Performance tab
2. Click record
3. Identify slow functions

---

### Issue 16: API responses are slow

**Symptoms:**
- Dashboard loads slowly
- API takes long time to return data

**Root Cause:**
Large Excel file or slow system.

**Solutions:**

**Solution A: Cache data on backend**
```javascript
let cachedData = null;
const getDataCached = () => {
  if (!cachedData) {
    cachedData = readExcelFile();
  }
  return cachedData;
};
```

**Solution B: Use refresh endpoint**
Click "Refresh Data" button to reload manually.

**Solution C: Split Excel file**
- Create separate files per class
- Load only needed file

**Solution D: Check system resources**
- Check RAM usage
- Close other applications
- Restart computer

---

## Data Issues

### Issue 17: Data shows as "0" or "NaN"

**Symptoms:**
```
Percentage: NaN%
Marks: 0
```

**Root Cause:**
Data type issue (numbers stored as text in Excel).

**Solutions:**

**Solution A: Fix Excel data types**
1. Select Marks column
2. Format → Number
3. Repeat for Total column
4. Save and refresh

**Solution B: Update calculation in frontend**
In `App.js`, ensure conversion:
```javascript
const marks = Number(item.Marks) || 0;
const total = Number(item.Total) || 0;
```

**Solution C: Regenerate sample data**
```bash
cd backend
node generateData.js
```

---

### Issue 18: Wrong calculations

**Symptoms:**
- Percentage doesn't match expected
- Totals are incorrect

**Root Cause:**
Calculation logic error or data issue.

**Solutions:**

**Solution A: Verify formula**
Percentage should be: `(obtained / total) × 100`
```javascript
const percentage = (45 / 50) * 100; // Should be 90
```

**Solution B: Check Excel data**
1. Make sure Marks < Total
2. Both are numbers
3. No negative values

**Solution C: Add validation**
```javascript
const getPercentage = (marks, total) => {
  if (total <= 0) return 0;
  if (marks < 0 || marks > total) return 0;
  return ((marks / total) * 100).toFixed(2);
};
```

---

## Network & Connection Issues

### Issue 19: Cannot connect to backend

**Symptoms:**
```
Error: connect ECONNREFUSED 127.0.0.1:5000
```

**Root Cause:**
Backend is not running or port is wrong.

**Solutions:**

**Solution A: Start backend**
```bash
cd backend
npm start
```

**Solution B: Verify port**
1. Check `backend/server.js`
2. Confirm PORT is 5000
3. Or verify you're using correct port in frontend

**Solution C: Check firewall**
1. Windows Firewall might block port 5000
2. Add exception for Node.js
3. Or use different port

**Solution D: Test connectivity**
```bash
# Windows
telnet localhost 5000

# Mac/Linux
nc -zv localhost 5000
```

---

### Issue 20: "proxy" error in network requests

**Symptoms:**
```
GET http://localhost:3000/marks 404
```

**Root Cause:**
Frontend proxy configuration issue.

**Solutions:**

**Solution A: Verify proxy in package.json**
In `frontend/package.json`:
```json
"proxy": "http://localhost:5000"
```

**Solution B: Use full URL in axios**
In `frontend/src/App.js`:
```javascript
const response = await axios.get('http://localhost:5000/marks');
```

**Solution C: Restart frontend**
```bash
cd frontend
npm start
```

---

## File & Permission Issues

### Issue 21: Cannot write to Excel file

**Symptoms:**
```
EACCES: permission denied, open 'data/students.xlsx'
```

**Root Cause:**
File is open in Excel or has restricted permissions.

**Solutions:**

**Solution A: Close Excel file**
1. Close Excel if open
2. Restart backend
3. Try again

**Solution B: Check file permissions**
```bash
# Mac/Linux
ls -la data/students.xlsx
chmod 644 data/students.xlsx

# Windows - Right-click → Properties → Security
```

**Solution C: Move file to different location**
Create new Excel file in a different folder and update path.

---

### Issue 22: Sample data generator fails

**Symptoms:**
```
Error creating Excel file: ...
```

**Root Cause:**
XLSX package not installed or permission issue.

**Solutions:**

**Solution A: Install XLSX globally**
```bash
npm install -g xlsx
npm install xlsx --save-dev
```

**Solution B: Run from backend directory**
```bash
cd backend
npm install
node generateData.js
```

**Solution C: Create Excel manually**
1. Use Excel or Calc
2. Add sample data
3. Save as `data/students.xlsx`

---

## Debugging Checklist

Use this checklist to solve issues systematically:

- [ ] Node.js installed? (`node --version`)
- [ ] npm working? (`npm --version`)
- [ ] Both dependencies installed? (`npm install`)
- [ ] Backend running? (`http://localhost:5000/health`)
- [ ] Frontend running? (`http://localhost:3000`)
- [ ] Browser console clear? (F12)
- [ ] Excel file exists? (`data/students.xlsx`)
- [ ] Excel file has data?
- [ ] Excel columns named correctly?
- [ ] Ports 3000 and 5000 available?
- [ ] No other app using ports?
- [ ] CORS enabled on backend?
- [ ] API URL correct in frontend?
- [ ] Tried Refresh Data button?
- [ ] Tried hard refresh (Ctrl+Shift+R)?
- [ ] Tried clearing browser cache?
- [ ] Tried restarting servers?
- [ ] Tried deleting node_modules?

---

## Getting Help

### Check Logs

**Backend logs:**
- Terminal where `npm start` runs
- Shows server messages and errors

**Frontend logs:**
- Browser F12 → Console
- Shows JavaScript errors
- Network tab shows API calls

### Ask for Help

When getting help, provide:
1. Error message (exact text)
2. Steps to reproduce
3. Terminal output
4. Browser console errors
5. What you were doing when error occurred

### Additional Resources

- [Node.js Docs](https://nodejs.org/docs/)
- [Express.js Guide](https://expressjs.com/en/guide/error-handling.html)
- [React Error Boundaries](https://react.dev/reference/react/Component#catching-rendering-errors-with-an-error-boundary)
- [Browser DevTools](https://developer.chrome.com/docs/devtools/)

---

**Still having issues? Check the full [README.md](README.md) and [DEVELOPMENT_GUIDE.md](DEVELOPMENT_GUIDE.md)**
