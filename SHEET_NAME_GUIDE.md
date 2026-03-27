# Sheet Name Validation Guide

## Why "1A" Doesn't Work

Excel has specific rules for sheet names:
- ❌ **Cannot start with numbers** (1A, 2B, 3C)
- ❌ **Cannot contain special characters** [ ] : * ? / \
- ❌ **Cannot be empty or longer than 31 characters**

## Correct Formats

| ❌ Invalid | ✅ Valid |
|-----------|---------|
| 1A | Class1A |
| 2B | ClassB2 |
| 3-A | Class3A |
| [10A] | Class10A |
| A:1 | ClassA1 |

## How to Create New Classes

### Method 1: Using the Dashboard UI
1. Open the dashboard
2. Scroll to the **"📝 Create New Class"** section
3. Enter class name (e.g., `Class1A`)
4. Click **"➕ Create"** or press Enter
5. Success message appears
6. Class automatically added to dropdown

### Method 2: Using API
```bash
POST http://localhost:5000/classes
Content-Type: application/json

{
  "className": "Class1A"
}
```

**Response:**
```json
{
  "success": true,
  "message": "New class sheet \"Class1A\" created successfully",
  "className": "Class1A",
  "availableClasses": ["10A", "10B", "9A", "11A", "11B", "Class1A"]
}
```

## Error Handling

### Error: "Class name must start with letter"
**Problem:** `1A` starts with a number
**Solution:** Use `Class1A` instead

### Error: "Sheet already exists"
**Problem:** Trying to create a class that already exists
**Solution:** Use a different name or select existing class

### Error: "Invalid characters detected"
**Problem:** Using [ ] : * ? / \ in name
**Solution:** Use only letters, numbers, and underscores

## Sheet Name Rules Applied

✅ Must start with letter or underscore
✅ Can contain letters, numbers, underscores
✅ Max 31 characters
✅ No special characters allowed (except in middle: letters, numbers, underscore)

## Examples

### ✅ Valid Names
- `Class10A`
- `ClassA`
- `Class_1A`
- `Science10`
- `_TestClass`
- `Maths2024`

### ❌ Invalid Names
- `1Class` (starts with number)
- `10A` (starts with number)
- `Class [10A]` (contains brackets)
- `Class:A` (contains colon)
- `Class*` (contains asterisk)

## Technical Implementation

### Backend Validation
- Located in `server.js`: `isValidSheetName()` function
- Validates before creating sheet
- Returns specific error message

### Ex​cel Limitations
- Sheet names are case-insensitive
- Maximum 255 sheets per workbook
- Sheet names must be unique

## Tips
- Use descriptive names: `Class10A`, `Science101`, `MathsAdvanced`
- Make it easy to identify: combine class/subject/year
- Keep names short but meaningful
- Use PascalCase: `ClassTenA` is clearer than `CLASSOTENA`

## Automat​ic Fixes
If you accidentally enter an invalid name, the system will:
1. Show error message with example
2. Suggest correct format
3. Clear input field for retry
4. Not create the sheet until corrected
