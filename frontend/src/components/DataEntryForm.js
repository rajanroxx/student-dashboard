import React, { useState } from 'react';
import axios from 'axios';

function DataEntryForm({ availableClasses, onDataAdded }) {
  const [formData, setFormData] = useState({
    Name: '',
    Class: availableClasses[0] || '',
    Subject: '',
    Test: '',
    Marks: '',
    Total: '',
    Date: new Date().toISOString().split('T')[0],
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(null);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData({ ...formData, [name]: value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsSubmitting(true);
    setError(null);
    setSuccess(null);

    const [year, month, day] = formData.Date.split('-');
    const formattedDate = `${day}-${month}-${year}`;

    try {
      await axios.post('http://localhost:5000/marks', { ...formData, Date: formattedDate });
      setSuccess('✓ Data added successfully!');
      setFormData({
        ...formData,
        Name: '',
        Marks: '',
        Total: '',
      });
      if (onDataAdded) {
        onDataAdded();
      }
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to add data.');
    } finally {
      setIsSubmitting(false);
      setTimeout(() => {
        setSuccess(null);
        setError(null);
      }, 3000);
    }
  };

  return (
    <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
      <h2 className="text-xl font-bold text-gray-900 mb-6">✏️ Manual Data Entry</h2>
      {error && <div className="mb-4 p-3 bg-red-50 border border-red-200 text-red-700 rounded-lg text-sm">{error}</div>}
      {success && <div className="mb-4 p-3 bg-green-50 border border-green-200 text-green-700 rounded-lg text-sm">{success}</div>}
      <form onSubmit={handleSubmit} className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div>
          <label htmlFor="Name" className="block text-sm font-semibold text-gray-700 mb-1">Student Name</label>
          <input type="text" name="Name" value={formData.Name} onChange={handleChange} required className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500" />
        </div>
        <div>
          <label htmlFor="Class" className="block text-sm font-semibold text-gray-700 mb-1">Class</label>
          <select name="Class" value={formData.Class} onChange={handleChange} required className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500">
            {availableClasses.map(c => <option key={c} value={c}>{c}</option>)}
          </select>
        </div>
        <div>
          <label htmlFor="Subject" className="block text-sm font-semibold text-gray-700 mb-1">Subject</label>
          <input type="text" name="Subject" value={formData.Subject} onChange={handleChange} required className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500" />
        </div>
        <div>
          <label htmlFor="Test" className="block text-sm font-semibold text-gray-700 mb-1">Test/DPP</label>
          <input type="text" name="Test" value={formData.Test} onChange={handleChange} required className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500" />
        </div>
        <div>
          <label htmlFor="Marks" className="block text-sm font-semibold text-gray-700 mb-1">Marks Obtained</label>
          <input type="number" name="Marks" value={formData.Marks} onChange={handleChange} required className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500" />
        </div>
        <div>
          <label htmlFor="Total" className="block text-sm font-semibold text-gray-700 mb-1">Total Marks</label>
          <input type="number" name="Total" value={formData.Total} onChange={handleChange} required className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500" />
        </div>
        <div>
          <label htmlFor="Date" className="block text-sm font-semibold text-gray-700 mb-1">Date</label>
          <input type="date" name="Date" value={formData.Date} onChange={handleChange} required className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500" />
        </div>
        <div className="flex items-end">
          <button type="submit" disabled={isSubmitting} className="w-full px-4 py-2 bg-indigo-600 text-white font-semibold rounded-lg hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 disabled:opacity-50 disabled:cursor-not-allowed transition-colors">
            {isSubmitting ? 'Submitting...' : 'Add Entry'}
          </button>
        </div>
      </form>
    </div>
  );
}

export default DataEntryForm;
