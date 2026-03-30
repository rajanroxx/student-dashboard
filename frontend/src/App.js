import React, { useState, useEffect, useMemo } from 'react';
import axios from 'axios';
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
import DataEntryForm from './components/DataEntryForm';
import ExcelUpload from './components/ExcelUpload';
import Chart from './components/Chart';
import StatCard from './components/StatCard';
import Filter from './components/Filter';
import { formatDate } from './utils';

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

function App() {
  const [allData, setAllData] = useState([]);
  const [availableClasses, setAvailableClasses] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [showDataEntry, setShowDataEntry] = useState(false);
  const [showExcelUpload, setShowExcelUpload] = useState(false);

  const [selectedClass, setSelectedClass] = useState('');
  const [selectedDate, setSelectedDate] = useState('');
  const [selectedTest, setSelectedTest] = useState('');
  const [selectedStudent, setSelectedStudent] = useState('');
  const [selectedSubject, setSelectedSubject] = useState('');

  useEffect(() => {
    fetchAvailableClasses();
  }, []);

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
      const classes = response.data.classes || [];
      setAvailableClasses(classes);
      if (classes.length > 0 && !selectedClass) {
        setSelectedClass(classes[0]);
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
      const data = response.data.data || [];
      setAllData(data);
      if (data.length === 0) {
        setError(`ℹ️ No data found for "${className}". You can add data using the form or upload an Excel file.`);
      }
    } catch (err) {
      setError(`Failed to fetch data for class ${className}: ${err.message}`);
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleDataAdded = () => {
    fetchAvailableClasses();
    if (selectedClass) {
      fetchClassData(selectedClass);
    }
  };

  const uniqueDates = useMemo(() => {
    const dates = [...new Set(allData.map(item => item.Date).filter(Boolean))];
    // Sort by date chronologically
    dates.sort((a, b) => new Date(a) - new Date(b));
    // Return formatted unique dates
    return dates.map(date => formatDate(date));
  }, [allData]);

  const uniqueTests = useMemo(() => [...new Set(allData.filter(item => !selectedDate || formatDate(item.Date) === selectedDate).map(item => item.Test).filter(Boolean))].sort(), [allData, selectedDate]);
  const uniqueStudents = useMemo(() => [...new Set(allData.filter(item => (!selectedDate || formatDate(item.Date) === selectedDate) && (!selectedTest || item.Test === selectedTest)).map(item => item.Name).filter(Boolean))].sort(), [allData, selectedDate, selectedTest]);
  const uniqueSubjects = useMemo(() => [...new Set(allData.filter(item => (!selectedDate || formatDate(item.Date) === selectedDate) && (!selectedTest || item.Test === selectedTest) && (!selectedStudent || item.Name === selectedStudent)).map(item => item.Subject).filter(Boolean))].sort(), [allData, selectedDate, selectedTest, selectedStudent]);

  const filteredData = useMemo(() => allData.filter(item => 
    (!selectedDate || formatDate(item.Date) === selectedDate) &&
    (!selectedTest || item.Test === selectedTest) &&
    (!selectedStudent || item.Name === selectedStudent) &&
    (!selectedSubject || item.Subject === selectedSubject)
  ), [allData, selectedDate, selectedTest, selectedStudent, selectedSubject]);

  const stats = useMemo(() => {
    if (filteredData.length === 0) return { totalMarks: 0, totalPossible: 0, percentage: 0, recordCount: 0 };
    const totalMarks = filteredData.reduce((sum, item) => sum + (Number(item.Marks) || 0), 0);
    const totalPossible = filteredData.reduce((sum, item) => sum + (Number(item.Total) || 0), 0);
    const percentage = totalPossible > 0 ? ((totalMarks / totalPossible) * 100).toFixed(2) : 0;
    return { totalMarks, totalPossible, percentage, recordCount: filteredData.length };
  }, [filteredData]);

  const classViewData = useMemo(() => {
    const studentMap = {};
    (allData.filter(item => (!selectedDate || item.Date === selectedDate) && (!selectedTest || item.Test === selectedTest) && (!selectedSubject || item.Subject === selectedSubject)))
    .forEach(item => {
      if (!studentMap[item.Name]) {
        studentMap[item.Name] = { name: item.Name, totalMarks: 0, totalPossible: 0, subjects: new Set() };
      }
      studentMap[item.Name].totalMarks += Number(item.Marks) || 0;
      studentMap[item.Name].totalPossible += Number(item.Total) || 0;
      studentMap[item.Name].subjects.add(item.Subject);
    });
    return Object.values(studentMap).map(s => ({
      ...s,
      percentage: s.totalPossible > 0 ? (s.totalMarks / s.totalPossible) * 100 : 0,
    }));
  }, [allData, selectedDate, selectedTest, selectedSubject]);

  const classViewChart = useMemo(() => ({
    labels: classViewData.map(s => s.name),
    datasets: [{
      label: 'Overall Performance',
      data: classViewData.map(s => s.percentage),
      backgroundColor: 'rgba(79, 70, 229, 0.8)',
      borderColor: 'rgba(79, 70, 229, 1)',
      borderWidth: 1,
    }],
  }), [classViewData]);

  const subjectPerformanceData = useMemo(() => {
    const subjectMap = {};
    (allData.filter(item => (!selectedDate || item.Date === selectedDate) && (!selectedTest || item.Test === selectedTest) && (!selectedStudent || item.Name === selectedStudent)))
    .forEach(item => {
      if (!subjectMap[item.Subject]) {
        subjectMap[item.Subject] = { name: item.Subject, totalMarks: 0, totalPossible: 0 };
      }
      subjectMap[item.Subject].totalMarks += Number(item.Marks) || 0;
      subjectMap[item.Subject].totalPossible += Number(item.Total) || 0;
    });
    return Object.values(subjectMap).map(s => ({
      ...s,
      percentage: s.totalPossible > 0 ? (s.totalMarks / s.totalPossible) * 100 : 0,
    }));
  }, [allData, selectedDate, selectedTest, selectedStudent]);

  const subjectPerformanceChart = useMemo(() => ({
    labels: subjectPerformanceData.map(s => s.name),
    datasets: [{
      label: 'Average Performance',
      data: subjectPerformanceData.map(s => s.percentage),
      backgroundColor: 'rgba(16, 185, 129, 0.8)',
      borderColor: 'rgba(16, 185, 129, 1)',
      borderWidth: 1,
    }],
  }), [subjectPerformanceData]);

  const testPerformanceData = useMemo(() => {
    const testMap = {};
    (allData.filter(item => (!selectedDate || item.Date === selectedDate) && (!selectedSubject || item.Subject === selectedSubject) && (!selectedStudent || item.Name === selectedStudent)))
    .forEach(item => {
      if (!testMap[item.Test]) {
        testMap[item.Test] = { name: item.Test, totalMarks: 0, totalPossible: 0 };
      }
      testMap[item.Test].totalMarks += Number(item.Marks) || 0;
      testMap[item.Test].totalPossible += Number(item.Total) || 0;
    });
    return Object.values(testMap).map(t => ({
      ...t,
      percentage: t.totalPossible > 0 ? (t.totalMarks / t.totalPossible) * 100 : 0,
    }));
  }, [allData, selectedDate, selectedSubject, selectedStudent]);

  const testPerformanceChart = useMemo(() => ({
    labels: testPerformanceData.map(t => t.name),
    datasets: [{
      label: 'Average Performance',
      data: testPerformanceData.map(t => t.percentage),
      backgroundColor: 'rgba(219, 39, 119, 0.8)',
      borderColor: 'rgba(219, 39, 119, 1)',
      borderWidth: 1,
    }],
  }), [testPerformanceData]);

  const studentProgressData = useMemo(() => {
    if (!selectedStudent) return [];
    const progressMap = {};
    allData
      .filter(item => item.Name === selectedStudent && (!selectedSubject || item.Subject === selectedSubject))
      .forEach(item => {
        // Group by the formatted date string to combine entries from the same day
        const formatted = formatDate(item.Date);
        if (!progressMap[formatted]) {
          progressMap[formatted] = { date: item.Date, totalMarks: 0, totalPossible: 0 };
        }
        progressMap[formatted].totalMarks += Number(item.Marks) || 0;
        progressMap[formatted].totalPossible += Number(item.Total) || 0;
      });
  
    return Object.values(progressMap)
      .map(item => ({
        ...item,
        percentage: item.totalPossible > 0 ? (item.totalMarks / item.totalPossible) * 100 : 0,
      }))
      // Sort chronologically by the original date object
      .sort((a, b) => new Date(a.date) - new Date(b.date));
  }, [allData, selectedStudent, selectedSubject]);
  
  const studentProgressChart = useMemo(() => ({
    labels: studentProgressData.map(item => formatDate(item.date)),
    datasets: [{
      label: 'Daily Average Performance',
      data: studentProgressData.map(item => item.percentage),
      backgroundColor: 'rgba(245, 158, 11, 0.8)',
      borderColor: 'rgba(245, 158, 11, 1)',
      borderWidth: 1,
      type: 'line',
      fill: false,
    }],
  }), [studentProgressData]);

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100">
      {/* Header */}
      <header className="bg-white shadow-sm border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="text-center">
            <h1 className="text-3xl md:text-4xl font-bold text-gray-900">📚 Student Marks Dashboard</h1>
            <p className="text-gray-600 mt-2">Track and analyze student performance efficiently</p>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Error Alert */}
        {error && (
          <div className="mb-6 p-4 bg-red-50 border-l-4 border-red-500 text-red-700 rounded">
            <p className="font-medium">{error}</p>
          </div>
        )}

        {/* Loading State */}
        {loading && (
          <div className="flex justify-center items-center py-12">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600"></div>
            <span className="ml-4 text-lg text-gray-600">Loading data...</span>
          </div>
        )}

        {!loading && (
          <>
            {/* Action Buttons */}
            <div className="flex flex-col sm:flex-row gap-3 mb-8">
              <button
                onClick={() => { setShowDataEntry(!showDataEntry); setShowExcelUpload(false); }}
                className={`flex-1 px-4 py-3 rounded-lg font-medium transition-all duration-200 ${
                  showDataEntry
                    ? 'bg-indigo-600 text-white shadow-lg'
                    : 'bg-white text-gray-700 border border-gray-300 hover:border-indigo-500 hover:text-indigo-600'
                }`}
              >
                ✏️ Manual Entry
              </button>
              <button
                onClick={() => { setShowExcelUpload(!showExcelUpload); setShowDataEntry(false); }}
                className={`flex-1 px-4 py-3 rounded-lg font-medium transition-all duration-200 ${
                  showExcelUpload
                    ? 'bg-indigo-600 text-white shadow-lg'
                    : 'bg-white text-gray-700 border border-gray-300 hover:border-indigo-500 hover:text-indigo-600'
                }`}
              >
                📤 Upload Excel
              </button>
              <button
                onClick={handleDataAdded}
                className="flex-1 px-4 py-3 rounded-lg font-medium bg-green-600 text-white hover:bg-green-700 transition-all duration-200 shadow-sm"
              >
                🔄 Refresh
              </button>
            </div>

            {/* Data Entry Forms */}
            {showDataEntry && <div className="mb-8"><DataEntryForm availableClasses={availableClasses} onDataAdded={handleDataAdded} /></div>}
            {showExcelUpload && <div className="mb-8"><ExcelUpload onUploadSuccess={handleDataAdded} /></div>}

            {/* Filters Section */}
            <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 mb-8">
              <h2 className="text-xl font-bold text-gray-900 mb-6">🔍 Filters</h2>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
                <Filter label="Class" value={selectedClass} onChange={e => setSelectedClass(e.target.value)} options={[{value: '', label: '-- All Classes --'}, ...availableClasses.map(c => ({value: c, label: c}))]} />
                <Filter label="Date" value={selectedDate} onChange={e => setSelectedDate(e.target.value)} options={[{value: '', label: '-- All Dates --'}, ...uniqueDates.map(d => ({value: d, label: d}))]} disabled={allData.length === 0} />
                <Filter label="Test" value={selectedTest} onChange={e => setSelectedTest(e.target.value)} options={[{value: '', label: '-- All Tests --'}, ...uniqueTests.map(t => ({value: t, label: t}))]} disabled={allData.length === 0} />
                <Filter label="Student" value={selectedStudent} onChange={e => setSelectedStudent(e.target.value)} options={[{value: '', label: '-- All Students --'}, ...uniqueStudents.map(s => ({value: s, label: s}))]} disabled={allData.length === 0} />
                <Filter label="Subject" value={selectedSubject} onChange={e => setSelectedSubject(e.target.value)} options={[{value: '', label: '-- All Subjects --'}, ...uniqueSubjects.map(s => ({value: s, label: s}))]} disabled={allData.length === 0} />
              </div>
            </div>

            {/* Statistics Cards */}
            {filteredData.length > 0 && (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 mb-8">
                <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 hover:shadow-md transition-shadow">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-gray-600 text-sm font-medium">Total Marks</p>
                      <p className="text-3xl font-bold text-indigo-600 mt-2">{stats.totalMarks}</p>
                      <p className="text-gray-500 text-sm mt-1">out of {stats.totalPossible}</p>
                    </div>
                    <div className="text-4xl">📊</div>
                  </div>
                </div>
                <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 hover:shadow-md transition-shadow">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-gray-600 text-sm font-medium">Percentage</p>
                      <p className="text-3xl font-bold text-green-600 mt-2">{stats.percentage}%</p>
                      <p className="text-gray-500 text-sm mt-1">Overall Performance</p>
                    </div>
                    <div className="text-4xl">📈</div>
                  </div>
                </div>
                <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 hover:shadow-md transition-shadow">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-gray-600 text-sm font-medium">Records</p>
                      <p className="text-3xl font-bold text-blue-600 mt-2">{stats.recordCount}</p>
                      <p className="text-gray-500 text-sm mt-1">Total Entries</p>
                    </div>
                    <div className="text-4xl">📋</div>
                  </div>
                </div>
              </div>
            )}

            {/* Content Area */}
            {allData.length === 0 ? (
              <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-12 text-center">
                <p className="text-gray-500 text-lg">No data available. Add data or upload an Excel file to get started.</p>
              </div>
            ) : (
              <div className="space-y-8">
                {!selectedStudent ? (
                  <>
                    {/* Charts Section */}
                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                      {classViewData.length > 0 && (
                        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-8">
                          <Chart data={classViewChart} title="📊 Class Performance (% by Student)" />
                        </div>
                      )}
                      {subjectPerformanceData.length > 0 && (
                        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-8">
                          <Chart data={subjectPerformanceChart} title="📈 Subject Performance (%)" />
                        </div>
                      )}
                      {testPerformanceData.length > 0 && (
                         <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-8 lg:col-span-2">
                          <Chart data={testPerformanceChart} title="📝 Test Performance (%)" />
                        </div>
                      )}
                    </div>

                    {/* Table Section */}
                    {classViewData.length > 0 && (
                      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-8 mt-8">
                        <h3 className="text-lg font-bold text-gray-900 mb-6">👥 Class Summary</h3>
                        <div className="overflow-x-auto">
                          <table className="w-full">
                            <thead>
                              <tr className="border-b border-gray-200 bg-gray-50">
                                <th className="px-6 py-3 text-left text-sm font-semibold text-gray-900">Student Name</th>
                                <th className="px-6 py-3 text-left text-sm font-semibold text-gray-900">Subjects</th>
                                <th className="px-6 py-3 text-left text-sm font-semibold text-gray-900">Performance</th>
                              </tr>
                            </thead>
                            <tbody>
                              {classViewData.map((student, idx) => (
                                <tr key={idx} onClick={() => setSelectedStudent(student.name)} className="border-b border-gray-100 hover:bg-indigo-50 cursor-pointer transition-colors duration-150">
                                  <td className="px-6 py-4 text-sm text-gray-900 font-medium">{student.name}</td>
                                  <td className="px-6 py-4 text-sm text-gray-600">{[...student.subjects].join(', ')}</td>
                                  <td className="px-6 py-4 text-sm font-semibold text-indigo-600">{student.percentage.toFixed(1)}%</td>
                                </tr>
                              ))}
                            </tbody>
                          </table>
                        </div>
                      </div>
                    )}
                  </>
                ) : (
                  <div>
                    <button
                      onClick={() => setSelectedStudent('')}
                      className="mb-6 px-4 py-2 bg-white text-gray-700 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors font-medium"
                    >
                      ← Back to Class View
                    </button>
                    {studentProgressData.length > 0 && (
                      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-8 mb-8">
                        <Chart data={studentProgressChart} title={`PROGRESS FOR ${selectedStudent.toUpperCase()}`} />
                      </div>
                    )}
                    <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-8">
                      <h3 className="text-lg font-bold text-gray-900 mb-6">📋 {selectedStudent} - Detailed Marks</h3>
                      <div className="overflow-x-auto">
                        <table className="w-full">
                          <thead>
                            <tr className="border-b border-gray-200 bg-gray-50">
                              <th className="px-6 py-3 text-left text-sm font-semibold text-gray-900">Subject</th>
                              <th className="px-6 py-3 text-left text-sm font-semibold text-gray-900">Test</th>
                              <th className="px-6 py-3 text-left text-sm font-semibold text-gray-900">Marks</th>
                              <th className="px-6 py-3 text-left text-sm font-semibold text-gray-900">Total</th>
                              <th className="px-6 py-3 text-left text-sm font-semibold text-gray-900">%</th>
                              <th className="px-6 py-3 text-left text-sm font-semibold text-gray-900">Date</th>
                            </tr>
                          </thead>
                          <tbody>
                            {filteredData.length > 0 ? filteredData.map((item, idx) => (
                              <tr key={idx} className="border-b border-gray-100 hover:bg-indigo-50 transition-colors duration-150">
                                <td className="px-6 py-4 text-sm text-gray-900">{item.Subject}</td>
                                <td className="px-6 py-4 text-sm text-gray-600">{item.Test}</td>
                                <td className="px-6 py-4 text-sm text-gray-600">{item.Marks}</td>
                                <td className="px-6 py-4 text-sm text-gray-600">{item.Total}</td>
                                <td className="px-6 py-4 text-sm font-semibold text-indigo-600">{Number(item.Total) > 0 ? ((Number(item.Marks) / Number(item.Total)) * 100).toFixed(1) : 0}%</td>
                                <td className="px-6 py-4 text-sm text-gray-600">{formatDate(item.Date)}</td>
                              </tr>
                            )) : (
                              <tr><td colSpan="6" className="text-center py-4 text-gray-500">No records found</td></tr>
                            )}
                          </tbody>
                        </table>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            )}
          </>
        )}
      </main>
    </div>
  );
}

export default App;