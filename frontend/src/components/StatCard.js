import React from 'react';

const StatCard = ({ title, value, unit }) => (
  <div className="bg-white p-6 rounded-lg shadow-md text-center">
    <h3 className="text-sm font-medium text-gray-500 uppercase tracking-wider">{title}</h3>
    <p className="text-3xl font-bold text-gray-900 mt-2">{value}</p>
    {unit && <p className="text-sm text-gray-500 mt-1">{unit}</p>}
  </div>
);

export default StatCard;
