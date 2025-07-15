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
  data: {
    labels: string[];
    datasets: Array<{
      label?: string;
      data: number[];
      [key: string]: unknown;
    }>;
  };
  options?: Record<string, unknown>;
  height?: number;
}

export default function ChartWrapper({ type, data, options, height = 400 }: ChartWrapperProps) {
  const chartRef = useRef<ChartJS>(null);

  useEffect(() => {
    const currentChartRef = chartRef.current;
    // Cleanup function to destroy chart on unmount
    return () => {
      if (currentChartRef) {
        currentChartRef.destroy();
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
        options={defaultOptions as Record<string, unknown>}
      />
    </div>
  );
}