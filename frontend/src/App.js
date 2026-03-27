import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { Bar } from 'react-chartjs-2';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  BarElement,
  Title,
  Tooltip,
  Legend,
} from 'chart.js';

ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  BarElement,
  Title,
  Tooltip,
  Legend
);

// Utility function to convert date format to dd-mm-yyyy
const formatDate = (dateString) => {
  // Backend now sends dates already in dd-mm-yyyy format
  if (!dateString) return '';
  
  try {
    // If already in dd-mm-yyyy format, return as is
    if (typeof dateString === 'string' && /^\d{2}-\d{2}-\d{4}$/.test(dateString.trim())) {
      return dateString.trim();
    }
    
    return String(dateString).trim();
  } catch {
    return String(dateString).trim();
  }
};

function App() {
  const [allData, setAllData] = useState([]);
  const [availableClasses, setAvailableClasses] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  
  // Filter states
  const [selectedClass, setSelectedClass] = useState('');
  const [selectedDate, setSelectedDate] = useState('');
  const [selectedTest, setSelectedTest] = useState('');
  const [selectedStudent, setSelectedStudent] = useState('');
  const [selectedSubject, setSelectedSubject] = useState('');

  // Fetch all available classes on mount
  useEffect(() => {
    fetchAvailableClasses();
  }, []);

  // Fetch data when class is selected
  useEffect(() => {
    if (selectedClass) {
      fetchClassData(selectedClass);
    }
  }, [selectedClass]);

  const fetchAvailableClasses = async () => {
    try {
      setLoading(true);
      setError(null);
      const response = await axios.get('http://localhost:5000/classes');
      setAvailableClasses(response.data.classes || []);
      if (response.data.classes && response.data.classes.length > 0) {
        setSelectedClass(response.data.classes[0]);
      }
    } catch (err) {
      setError('Failed to fetch available classes. Make sure the backend is running on port 5000.');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const fetchClassData = async (className) => {
    try {
      setLoading(true);
      setError(null);
      const response = await axios.get(`http://localhost:5000/marks/${className}`);
      setAllData(response.data.data || []);
      
      // If no data, show helpful message
      if (!response.data.data || response.data.data.length === 0) {
        setError(`ℹ️ Sheet "${className}" is empty or has incorrect format. Expected columns: Name, Subject, Test, Marks, Total, Date`);
      }
      
      // Reset filters when class changes
      setSelectedDate('');
      setSelectedTest('');
      setSelectedStudent('');
      setSelectedSubject('');
    } catch (err) {
      setError(`Failed to fetch data for class ${className}: ${err.message}`);
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  // Get unique dates from all data
  const getUniqueDates = () => {
    const dates = [...new Set(allData
      .map(item => item.Date)
      .filter(date => date && typeof date === 'string') // Filter valid strings only
    )];
    
    // Sort dates in dd-mm-yyyy format (earliest to latest)
    return dates.sort((a, b) => {
      try {
        // Safely parse dates
        if (!a || !b) return 0;
        const dateA = new Date(a.split('-').reverse().join('-'));
        const dateB = new Date(b.split('-').reverse().join('-'));
        return isNaN(dateA) || isNaN(dateB) ? 0 : dateA - dateB;
      } catch {
        return 0;
      }
    });
  };

  // Get unique tests from filtered data
  const getUniqueTests = () => {
    let filtered = allData;
    if (selectedDate) {
      filtered = filtered.filter(item => item.Date === selectedDate);
    }
    const tests = [...new Set(filtered.map(item => item.Test))].filter(Boolean);
    return tests.sort();
  };

  // Get unique students from filtered data
  const getUniqueStudents = () => {
    let filtered = allData;
    if (selectedDate) {
      filtered = filtered.filter(item => item.Date === selectedDate);
    }
    if (selectedTest) {
      filtered = filtered.filter(item => item.Test === selectedTest);
    }
    const students = [...new Set(filtered.map(item => item.Name))].filter(Boolean);
    return students.sort();
  };

  // Get unique subjects from filtered data
  const getUniqueSubjects = () => {
    let filtered = allData;
    if (selectedDate) {
      filtered = filtered.filter(item => item.Date === selectedDate);
    }
    if (selectedTest) {
      filtered = filtered.filter(item => item.Test === selectedTest);
    }
    if (selectedStudent) {
      filtered = filtered.filter(item => item.Name === selectedStudent);
    }
    const subjects = [...new Set(filtered.map(item => item.Subject))].filter(Boolean);
    return subjects.sort();
  };

  // Get filtered data based on all selections
  const getFilteredData = () => {
    let filtered = allData;

    if (selectedDate) {
      filtered = filtered.filter(item => item.Date === selectedDate);
    }

    if (selectedTest) {
      filtered = filtered.filter(item => item.Test === selectedTest);
    }

    if (selectedStudent) {
      filtered = filtered.filter(item => item.Name === selectedStudent);
    }

    if (selectedSubject) {
      filtered = filtered.filter(item => item.Subject === selectedSubject);
    }

    return filtered;
  };

  // Get class view data (grouped by student with selected date)
  const getClassViewData = () => {
    let filtered = allData;
    if (selectedDate) {
      filtered = filtered.filter(item => item.Date === selectedDate);
    }
    if (selectedTest) {
      filtered = filtered.filter(item => item.Test === selectedTest);
    }
    if (selectedSubject) {
      filtered = filtered.filter(item => item.Subject === selectedSubject);
    }

    // Group by student and calculate totals for selected date
    const studentMap = {};
    filtered.forEach(item => {
      const name = item.Name;
      if (!studentMap[name]) {
        studentMap[name] = {
          name: name,
          subjects: {},
          totalMarks: 0,
          totalPossible: 0,
          recordCount: 0,
        };
      }
      const subject = item.Subject;
      if (!studentMap[name].subjects[subject]) {
        studentMap[name].subjects[subject] = { marks: 0, total: 0 };
      }
      studentMap[name].subjects[subject].marks += Number(item.Marks) || 0;
      studentMap[name].subjects[subject].total += Number(item.Total) || 0;
      studentMap[name].totalMarks += Number(item.Marks) || 0;
      studentMap[name].totalPossible += Number(item.Total) || 0;
      studentMap[name].recordCount += 1;
    });

    return Object.values(studentMap);
  };

  // Get student-subject-wise stats for selected test
  const getStudentSubjectStats = () => {
    const filteredData = getFilteredData();
    const statMap = {};

    filteredData.forEach(item => {
      const subject = item.Subject || 'Unknown';
      if (!statMap[subject]) {
        statMap[subject] = { marks: 0, total: 0, count: 0 };
      }
      statMap[subject].marks += Number(item.Marks) || 0;
      statMap[subject].total += Number(item.Total) || 0;
      statMap[subject].count += 1;
    });

    return statMap;
  };

  // Calculate overall stats
  const calculateStats = () => {
    const filteredData = getFilteredData();

    if (filteredData.length === 0) {
      return {
        totalMarks: 0,
        totalPossible: 0,
        percentage: 0,
        recordCount: 0,
      };
    }

    const totalMarks = filteredData.reduce((sum, item) => sum + (Number(item.Marks) || 0), 0);
    const totalPossible = filteredData.reduce((sum, item) => sum + (Number(item.Total) || 0), 0);
    const percentage = totalPossible > 0 ? ((totalMarks / totalPossible) * 100).toFixed(2) : 0;

    return {
      totalMarks,
      totalPossible,
      percentage,
      recordCount: filteredData.length,
    };
  };

  // Prepare class view graph data
  const prepareClassViewChartData = () => {
    const classData = getClassViewData();
    
    return {
      labels: classData.map(s => s.name),
      datasets: [
        {
          label: 'Total Marks',
          data: classData.map(s => s.totalMarks),
          backgroundColor: 'rgba(102, 126, 234, 0.8)',
          borderColor: 'rgba(102, 126, 234, 1)',
          borderWidth: 2,
        },
      ],
    };
  };

  // Prepare test-based graph data (by subject)
  const prepareTestGraphData = () => {
    const stats = getStudentSubjectStats();
    const subjects = Object.keys(stats).sort();

    return {
      labels: subjects,
      datasets: [
        {
          label: 'Marks',
          data: subjects.map(s => stats[s].marks),
          backgroundColor: 'rgba(102, 126, 234, 0.8)',
          borderColor: 'rgba(102, 126, 234, 1)',
          borderWidth: 2,
        },
      ],
    };
  };

  const stats = calculateStats();
  const classData = getClassViewData();
  const subjectStats = getStudentSubjectStats();
  const filteredData = getFilteredData();
  const classViewChart = prepareClassViewChartData();
  const testChart = prepareTestGraphData();

  return (
    <div className="dashboard-container">
      {/* Header */}
      <div className="header">
        <h1>📚 Student Marks Dashboard</h1>
        <p>Track and analyze student performance</p>
      </div>

      {/* Error Message */}
      {error && <div className="error">{error}</div>}

      {/* Loading State */}
      {loading ? (
        <div className="loading">Loading data...</div>
      ) : (
        <>
          {/* Filters Section */}
          <div className="filters-section">
            <div className="filters-header">
              <h2>🔍 Filters</h2>
              <button className="refresh-btn" onClick={fetchAvailableClasses}>
                🔄 Refresh Data
              </button>
            </div>

            <div className="filters-group">
              <div className="filter-item">
                <label htmlFor="class-select">Select Class</label>
                <select
                  id="class-select"
                  value={selectedClass}
                  onChange={(e) => setSelectedClass(e.target.value)}
                >
                  <option value="">-- Choose a Class --</option>
                  {availableClasses.map(cls => (
                    <option key={cls} value={cls}>{cls}</option>
                  ))}
                </select>
              </div>

              <div className="filter-item">
                <label htmlFor="date-select">Select Date</label>
                <select
                  id="date-select"
                  value={selectedDate}
                  onChange={(e) => {
                    setSelectedDate(e.target.value);
                    setSelectedTest('');
                  }}
                  disabled={allData.length === 0}
                >
                  <option value="">-- All Dates --</option>
                  {getUniqueDates().map(date => (
                    <option key={date} value={date}>{date}</option>
                  ))}
                </select>
              </div>

              <div className="filter-item">
                <label htmlFor="test-select">Select Test (Optional)</label>
                <select
                  id="test-select"
                  value={selectedTest}
                  onChange={(e) => {
                    setSelectedTest(e.target.value);
                    setSelectedStudent('');
                  }}
                  disabled={allData.length === 0}
                >
                  <option value="">-- All Tests --</option>
                  {getUniqueTests().map(test => (
                    <option key={test} value={test}>{test}</option>
                  ))}
                </select>
              </div>

              <div className="filter-item">
                <label htmlFor="student-select">Select Student</label>
                <select
                  id="student-select"
                  value={selectedStudent}
                  onChange={(e) => setSelectedStudent(e.target.value)}
                  disabled={allData.length === 0}
                >
                  <option value="">-- All Students --</option>
                  {getUniqueStudents().map(student => (
                    <option key={student} value={student}>{student}</option>
                  ))}
                </select>
              </div>

              <div className="filter-item">
                <label htmlFor="subject-select">Select Subject</label>
                <select
                  id="subject-select"
                  value={selectedSubject}
                  onChange={(e) => setSelectedSubject(e.target.value)}
                  disabled={allData.length === 0}
                >
                  <option value="">-- All Subjects --</option>
                  {getUniqueSubjects().map(subject => (
                    <option key={subject} value={subject}>{subject}</option>
                  ))}
                </select>
              </div>
            </div>
          </div>

          {/* Stats Cards */}
          {filteredData.length > 0 && (
            <div className="stats-section">
              <div className="stat-card">
                <h3>Total Marks</h3>
                <div className="stat-value">{stats.totalMarks}</div>
                <div className="stat-unit">out of {stats.totalPossible}</div>
              </div>

              <div className="stat-card">
                <h3>Percentage</h3>
                <div className="stat-value">{stats.percentage}%</div>
                <div className="stat-unit">Overall Performance</div>
              </div>

              <div className="stat-card">
                <h3>Records</h3>
                <div className="stat-value">{stats.recordCount}</div>
                <div className="stat-unit">Total Entries</div>
              </div>
            </div>
          )}

          {/* Content Section */}
          <div className="content-section">
            {allData.length === 0 ? (
              <div className="no-data">
                No data available. Please select a class to load data.
              </div>
            ) : (
              <>
                {/* CLASS VIEW (No Student Selected) */}
                {!selectedStudent && (
                  <>
                    {classData.length > 0 && (
                      <div className="chart-container">
                        <h3 className="section-title">📊 Class Performance - Total Marks by Student</h3>
                        <Bar
                          data={classViewChart}
                          options={{
                            responsive: true,
                            maintainAspectRatio: false,
                            plugins: {
                              legend: {
                                position: 'top',
                              },
                              title: {
                                display: false,
                              },
                            },
                            scales: {
                              y: {
                                beginAtZero: true,
                              },
                            },
                          }}
                        />
                      </div>
                    )}

                    {/* Class View Table */}
                    {classData.length > 0 && (
                      <div className="table-container">
                        <h3 className="section-title">📝 Class Summary</h3>
                        <table>
                          <thead>
                            <tr>
                              <th>Student Name</th>
                              <th>Subjects</th>
                              <th>Total Marks</th>
                            </tr>
                          </thead>
                          <tbody>
                            {classData.map((student, idx) => (
                              <tr key={idx} style={{ cursor: 'pointer' }} onClick={() => setSelectedStudent(student.name)}>
                                <td>{student.name}</td>
                                <td>{Object.keys(student.subjects).join(', ')}</td>
                                <td>
                                  {student.totalMarks} / {student.totalPossible} ({student.totalPossible > 0 ? ((student.totalMarks / student.totalPossible) * 100).toFixed(1) : 0}%)
                                </td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    )}
                  </>
                )}

                {/* STUDENT VIEW (Student Selected) */}
                {selectedStudent && (
                  <>
                    <div style={{ marginBottom: '20px' }}>
                      <button 
                        className="refresh-btn" 
                        onClick={() => setSelectedStudent('')}
                        style={{ padding: '8px 16px', fontSize: '14px' }}
                      >
                        ← Back to Class View
                      </button>
                    </div>

                    {/* Test-Based Graph */}
                    {Object.keys(subjectStats).length > 0 && selectedTest && (
                      <div className="chart-container">
                        <h3 className="section-title">📊 Subject-wise Marks for {selectedTest}</h3>
                        <Bar
                          data={testChart}
                          options={{
                            responsive: true,
                            maintainAspectRatio: false,
                            plugins: {
                              legend: {
                                position: 'top',
                              },
                              title: {
                                display: false,
                              },
                            },
                            scales: {
                              y: {
                                beginAtZero: true,
                              },
                            },
                          }}
                        />
                      </div>
                    )}

                    {/* Student Detail Table */}
                    <div className="tables-grid">
                      <div className="table-container">
                        <h3 className="section-title">📋 {selectedStudent} - Detailed Marks</h3>
                        <table>
                          <thead>
                            <tr>
                              <th>Subject</th>
                              <th>Test</th>
                              <th>Marks</th>
                              <th>Total</th>
                              <th>%</th>
                              <th>Date</th>
                            </tr>
                          </thead>
                          <tbody>
                            {filteredData.length > 0 ? (
                              filteredData.map((item, idx) => (
                                <tr key={idx}>
                                  <td>{item.Subject}</td>
                                  <td>{item.Test}</td>
                                  <td>{item.Marks}</td>
                                  <td>{item.Total}</td>
                                  <td>
                                    {Number(item.Total) > 0
                                      ? ((Number(item.Marks) / Number(item.Total)) * 100).toFixed(1)
                                      : 0}
                                    %
                                  </td>
                                  <td>{formatDate(item.Date)}</td>
                                </tr>
                              ))
                            ) : (
                              <tr>
                                <td colSpan="6" style={{ textAlign: 'center' }}>No records found</td>
                              </tr>
                            )}
                          </tbody>
                        </table>
                      </div>

                      {/* Subject-wise Summary for Student */}
                      {Object.keys(subjectStats).length > 0 && (
                        <div className="table-container">
                          <h3 className="section-title">📚 Subject-wise Summary</h3>
                          <table>
                            <thead>
                              <tr>
                                <th>Subject</th>
                                <th>Marks</th>
                                <th>Total</th>
                                <th>%</th>
                              </tr>
                            </thead>
                            <tbody>
                              {Object.entries(subjectStats).map(([subject, stats], idx) => (
                                <tr key={idx}>
                                  <td>{subject}</td>
                                  <td>{stats.marks}</td>
                                  <td>{stats.total}</td>
                                  <td>
                                    {stats.total > 0
                                      ? ((stats.marks / stats.total) * 100).toFixed(1)
                                      : 0}
                                    %
                                  </td>
                                </tr>
                              ))}
                            </tbody>
                          </table>
                        </div>
                      )}
                    </div>
                  </>
                )}

                {/* FULL DATA TABLE */}
                <div className="table-container" style={{ marginTop: '30px' }}>
                  <h3 className="section-title">📋 All Records</h3>
                  <table>
                    <thead>
                      <tr>
                        <th>Name</th>
                        <th>Subject</th>
                        <th>Test</th>
                        <th>Marks</th>
                        <th>Total</th>
                        <th>%</th>
                        <th>Date</th>
                      </tr>
                    </thead>
                    <tbody>
                      {allData.length > 0 ? (
                        allData.map((item, idx) => (
                          <tr key={idx}>
                            <td>{item.Name}</td>
                            <td>{item.Subject}</td>
                            <td>{item.Test}</td>
                            <td>{item.Marks}</td>
                            <td>{item.Total}</td>
                            <td>
                              {Number(item.Total) > 0
                                ? ((Number(item.Marks) / Number(item.Total)) * 100).toFixed(1)
                                : 0}
                              %
                            </td>
                            <td>{formatDate(item.Date)}</td>
                          </tr>
                        ))
                      ) : (
                        <tr>
                          <td colSpan="7" style={{ textAlign: 'center' }}>No data available</td>
                        </tr>
                      )}
                    </tbody>
                  </table>
                </div>
              </>
            )}
          </div>
        </>
      )}
    </div>
  );
}

export default App;
