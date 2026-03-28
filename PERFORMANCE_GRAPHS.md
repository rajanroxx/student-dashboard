# Performance Graphs Feature Documentation

## Overview
Added two new performance visualization features to the Student Marks Dashboard.

## Features Implemented

### 1. **Average Performance by Subject Graph**
**When:** Only a student name is selected (no subject filter)

**What it shows:**
- Bar graph of average performance across all subjects
- Y-axis: Percentage (0-100%)
- X-axis: Subject names
- Color coding:
  - **🟢 Green bars**: Good performance (≥ 60%)
  - **🔴 Red bars**: Needs improvement (< 60%)

**Data calculation:**
- Averages all test scores for each subject
- Calculates average percentage for each subject
- Displays trend across all days/dates for that student

**Example:** If a student has Math tests on multiple dates with scores 70%, 65%, 80%, the graph will show Math with 71.67% (average) in green.

---

### 2. **DPP Comparison Bar Graph**
**When:** Both student name AND subject are selected

**What it shows:**
- Bar graph comparing performance across all DPPs (Daily Practice Problems)
- Each bar represents one DPP test
- X-axis labels show: `DPP_Name (Date)` format
- Y-axis: Percentage Score (0-100%)
- Color coding:
  - **🟢 Green bars**: Good DPP performance (> 60%)
  - **🔴 Red bars**: Needs improvement DPP scores

**Data calculation:**
- Filters data for selected student AND subject only
- Shows each DPP as a separate bar
- Includes date information with each DPP
- Sorted chronologically by date

**Example:** For "John" and "Math", shows:
- DPP1 (15-03-2026): 75% [Green]
- DPP2 (16-03-2026): 55% [Red]
- DPP3 (17-03-2026): 85% [Green]

---

## Color Coding System

| Performance Level | Color | Criteria |
|---|---|---|
| Good | 🟢 Green | ≥ 60% |
| Needs Improvement | 🔴 Red | < 60% |

The threshold of 60% is used as the standard for "good" performance.

---

## UI Layout (Student View)

When a student is selected:
1. **Back button** - Return to class view
2. **Average Performance Graph** - Shows when no subject is selected
3. **DPP Comparison Graph** - Shows when a subject is also selected
4. **Test-Based Graph** - Shows when a date/test filter is applied
5. **Detailed Tables** - All records and subject-wise summary

---

## Implementation Details

### New Functions Added:

#### `getStudentAveragePerformance()`
- Filters all data for selected student
- Groups by subject
- Calculates average percentage for each subject
- Returns object with subject as key and average percentage as value

#### `prepareAveragePerformanceChartData()`
- Prepares Chart.js compatible data
- Applies color coding (green/red) based on 60% threshold
- Returns labels and datasets

#### `getDPPComparisonData()`
- Filters data for selected student AND subject
- Sorts by test name/DPP number
- Returns array of DPP records

#### `prepareDPPComparisonChartData()`
- Converts DPP data to chart format
- Applies color coding based on performance
- Handles horizontal axis for > 6 DPPs
- Returns labels with dates and percentage datasets

---

## How to Use

### View Average Performance:
1. Select a Class
2. Click on any Student name in the class table
3. See the "Average Performance by Subject" graph

### View DPP Comparison:
1. Select a Class
2. Click on any Student name
3. Select a Subject from the Subject dropdown
4. See the "DPP Comparison" graph showing all DPPs for that subject

---

## Notes

- Graphs only appear when there is data to display
- Average performance uses all records regardless of date filter
- DPP comparison shows all attempts for that subject
- Both graphs follow the same color coding system (60% threshold)
- If there are more than 6 DPPs, the graph automatically switches to horizontal view for better readability
