import React from 'react';
import { Bar } from 'react-chartjs-2';

const Chart = ({ data, title }) => (
  <div className="w-full h-96">
    <Bar
      data={data}
      options={{
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
          legend: {
            position: 'top',
            labels: {
              font: {
                size: 14,
                family: "'Inter', sans-serif",
              },
              color: '#4B5563',
            },
          },
          title: {
            display: true,
            text: title,
            font: {
              size: 18,
              weight: 'bold',
              family: "'Inter', sans-serif",
            },
            color: '#111827',
            padding: {
              top: 10,
              bottom: 30,
            },
          },
          tooltip: {
            enabled: true,
            backgroundColor: '#111827',
            titleFont: {
              size: 14,
              weight: 'bold',
              family: "'Inter', sans-serif",
            },
            bodyFont: {
              size: 12,
              family: "'Inter', sans-serif",
            },
            padding: 12,
            cornerRadius: 8,
            boxPadding: 4,
            callbacks: {
              label: function (context) {
                let label = context.dataset.label || '';
                if (label) {
                  label += ': ';
                }
                if (context.parsed.y !== null) {
                  label += `${context.parsed.y.toFixed(2)}%`;
                }
                return label;
              },
            },
          },
        },
        scales: {
          y: {
            beginAtZero: true,
            max: 100,
            ticks: {
              callback: function (value) {
                return value + '%';
              },
              font: {
                size: 12,
                family: "'Inter', sans-serif",
              },
              color: '#4B5563',
            },
            grid: {
              color: '#E5E7EB',
              borderDash: [2, 4],
            },
          },
          x: {
            ticks: {
              font: {
                size: 12,
                family: "'Inter', sans-serif",
              },
              color: '#4B5563',
            },
            grid: {
              display: false,
            },
          },
        },
        interaction: {
          mode: 'index',
          intersect: false,
        },
        elements: {
          bar: {
            borderRadius: 5,
            borderSkipped: 'bottom',
          },
        },
      }}
    />
  </div>
);

export default Chart;
