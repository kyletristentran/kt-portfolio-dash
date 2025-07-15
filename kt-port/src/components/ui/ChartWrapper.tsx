'use client';

import { useEffect, useRef } from 'react';
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
  ArcElement,
} from 'chart.js';
import { Chart } from 'react-chartjs-2';

// Register Chart.js components
ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  BarElement,
  Title,
  Tooltip,
  Legend,
  ArcElement
);

interface ChartWrapperProps {
  type: 'line' | 'bar' | 'doughnut';
  data: any;
  options?: any;
  height?: number;
}

export default function ChartWrapper({ type, data, options, height = 400 }: ChartWrapperProps) {
  const chartRef = useRef<ChartJS>(null);

  useEffect(() => {
    // Cleanup function to destroy chart on unmount
    return () => {
      if (chartRef.current) {
        chartRef.current.destroy();
      }
    };
  }, []);

  const defaultOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        position: 'top' as const,
      },
    },
    scales: type !== 'doughnut' ? {
      y: {
        beginAtZero: true,
      },
    } : undefined,
    ...options,
  };

  return (
    <div style={{ height: `${height}px`, position: 'relative' }}>
      <Chart
        ref={chartRef}
        type={type}
        data={data}
        options={defaultOptions}
      />
    </div>
  );
}