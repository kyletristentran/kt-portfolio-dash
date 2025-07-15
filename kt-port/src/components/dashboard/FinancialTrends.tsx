'use client';

import { useState, useEffect } from 'react';
import ChartWrapper from '@/components/ui/ChartWrapper';

interface MonthlyData {
  ReportingMonth: string;
  Revenue: number;
  Expenses: number;
  NOI: number;
  CashFlow: number;
  Vacancy: number;
}

export default function FinancialTrends() {
  const [monthlyData, setMonthlyData] = useState<MonthlyData[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetchMonthlyData();
  }, []);

  const fetchMonthlyData = async () => {
    try {
      setLoading(true);
      const year = new Date().getFullYear();
      const response = await fetch(`/api/dashboard/monthly-performance?year=${year}`);
      
      if (!response.ok) {
        throw new Error('Failed to fetch monthly data');
      }
      
      const data = await response.json();
      setMonthlyData(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load data');
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="d-flex justify-content-center py-5">
        <div className="spinner-border text-primary" role="status">
          <span className="visually-hidden">Loading...</span>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="alert alert-danger" role="alert">
        <h4 className="alert-heading">Error Loading Trends</h4>
        <p>{error}</p>
        <button className="btn btn-outline-danger" onClick={fetchMonthlyData}>
          Try Again
        </button>
      </div>
    );
  }

  if (monthlyData.length === 0) {
    return (
      <div className="content-card">
        <h4 className="mb-4">📈 Financial Trends Analysis</h4>
        <div className="alert alert-info" role="alert">
          <h5 className="alert-heading">No Data Available</h5>
          <p>No monthly performance data found for the current year. Add some financial data to see trends.</p>
        </div>
      </div>
    );
  }

  // Prepare chart data
  const months = monthlyData.map(d => {
    const date = new Date(d.ReportingMonth);
    return date.toLocaleDateString('en-US', { month: 'short' });
  });

  const vacancyTrendData = {
    labels: months,
    datasets: [
      {
        label: 'Vacancy Rate',
        data: monthlyData.map(d => d.Vacancy),
        borderColor: '#0C223A',
        backgroundColor: 'rgba(12, 34, 58, 0.1)',
        borderWidth: 3,
        tension: 0.1,
        fill: true,
      },
    ],
  };

  const noiMarginData = {
    labels: months,
    datasets: [
      {
        label: 'NOI Margin %',
        data: monthlyData.map(d => d.Revenue > 0 ? (d.NOI / d.Revenue * 100) : 0),
        backgroundColor: '#87CEEB',
        borderColor: '#0C223A',
        borderWidth: 1,
      },
    ],
  };

  const vacancyOptions = {
    plugins: {
      title: {
        display: true,
        text: 'Vacancy Rate Trend',
        font: {
          size: 16,
          weight: 'bold',
        },
        color: '#0C223A',
      },
      legend: {
        position: 'top' as const,
      },
    },
    scales: {
      y: {
        beginAtZero: true,
        max: 20,
        ticks: {
          callback: function(value: any) {
            return value + '%';
          },
        },
      },
    },
    elements: {
      point: {
        radius: 6,
        hoverRadius: 8,
      },
    },
    // Add target line at 5%
    plugins: {
      annotation: {
        annotations: {
          targetLine: {
            type: 'line',
            yMin: 5,
            yMax: 5,
            borderColor: '#dc3545',
            borderWidth: 2,
            borderDash: [5, 5],
            label: {
              content: 'Target: 5%',
              enabled: true,
              position: 'end',
            },
          },
        },
      },
    },
  };

  const marginOptions = {
    plugins: {
      title: {
        display: true,
        text: 'NOI Margin %',
        font: {
          size: 16,
          weight: 'bold',
        },
        color: '#0C223A',
      },
      legend: {
        position: 'top' as const,
      },
    },
    scales: {
      y: {
        beginAtZero: true,
        max: 100,
        ticks: {
          callback: function(value: any) {
            return value + '%';
          },
        },
      },
    },
  };

  return (
    <div className="content-card">
      <h4 className="mb-4">📈 Financial Trends Analysis</h4>
      
      <div className="row g-4">
        <div className="col-lg-6">
          <div className="content-card">
            <ChartWrapper
              type="line"
              data={vacancyTrendData}
              options={vacancyOptions}
              height={350}
            />
            <div className="mt-3 text-center">
              <small className="text-muted">
                <i className="fas fa-info-circle"></i> Target vacancy rate is 5% or below
              </small>
            </div>
          </div>
        </div>
        <div className="col-lg-6">
          <div className="content-card">
            <ChartWrapper
              type="bar"
              data={noiMarginData}
              options={marginOptions}
              height={350}
            />
            <div className="mt-3 text-center">
              <small className="text-muted">
                <i className="fas fa-info-circle"></i> Higher margins indicate better operational efficiency
              </small>
            </div>
          </div>
        </div>
      </div>

      {/* Summary Statistics */}
      <div className="row g-3 mt-4">
        <div className="col-md-3">
          <div className="metric-card">
            <div className="metric-value">
              {monthlyData.length > 0 
                ? (monthlyData.reduce((sum, d) => sum + d.Vacancy, 0) / monthlyData.length).toFixed(1) + '%'
                : '0%'
              }
            </div>
            <div className="metric-label">Avg Vacancy</div>
          </div>
        </div>
        <div className="col-md-3">
          <div className="metric-card">
            <div className="metric-value">
              {monthlyData.length > 0 
                ? (monthlyData.reduce((sum, d) => sum + (d.Revenue > 0 ? d.NOI / d.Revenue * 100 : 0), 0) / monthlyData.length).toFixed(1) + '%'
                : '0%'
              }
            </div>
            <div className="metric-label">Avg NOI Margin</div>
          </div>
        </div>
        <div className="col-md-3">
          <div className="metric-card">
            <div className="metric-value">
              {monthlyData.length > 0 
                ? Math.max(...monthlyData.map(d => d.Revenue > 0 ? d.NOI / d.Revenue * 100 : 0)).toFixed(1) + '%'
                : '0%'
              }
            </div>
            <div className="metric-label">Best Month</div>
          </div>
        </div>
        <div className="col-md-3">
          <div className="metric-card">
            <div className="metric-value">
              {monthlyData.length > 0 
                ? monthlyData.filter(d => d.Vacancy <= 5).length
                : 0
              }
            </div>
            <div className="metric-label">Months on Target</div>
          </div>
        </div>
      </div>
    </div>
  );
}