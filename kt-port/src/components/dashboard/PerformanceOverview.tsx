'use client';

import { useState, useEffect } from 'react';

interface KPIData {
  total_portfolio_value: number;
  total_revenue: number;
  total_expenses: number;
  total_noi: number;
  avg_vacancy: number;
  property_count: number;
  noi_variance: number;
  revenue_variance: number;
}

export default function PerformanceOverview() {
  const [kpis, setKpis] = useState<KPIData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetchKPIData();
  }, []);

  const fetchKPIData = async () => {
    try {
      setLoading(true);
      const year = 2024; // Using 2024 as we have data for this year
      const response = await fetch(`/api/dashboard/kpis?year=${year}`);
      
      if (!response.ok) {
        throw new Error('Failed to fetch KPI data');
      }
      
      const data = await response.json();
      setKpis(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load data');
    } finally {
      setLoading(false);
    }
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0
    }).format(amount);
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
        <h4 className="alert-heading">Error Loading Dashboard</h4>
        <p>{error}</p>
        <button className="btn btn-outline-danger" onClick={fetchKPIData}>
          Try Again
        </button>
      </div>
    );
  }

  if (!kpis) {
    return (
      <div className="alert alert-warning" role="alert">
        No data available
      </div>
    );
  }

  return (
    <>
      {/* KPI Cards */}
      <div className="row g-3 mb-4">
        <div className="col-md-6 col-lg-3">
          <div className="metric-card">
            <div className="metric-value">{formatCurrency(kpis.total_portfolio_value)}</div>
            <div className="metric-label">Portfolio Value</div>
            <div className="metric-change">On Track</div>
          </div>
        </div>
        <div className="col-md-6 col-lg-3">
          <div className="metric-card">
            <div className="metric-value">{formatCurrency(kpis.total_noi)}</div>
            <div className="metric-label">YTD NOI</div>
            <div className={`metric-change ${kpis.noi_variance >= 0 ? 'text-success' : 'text-danger'}`}>
              {kpis.noi_variance >= 0 ? '+' : ''}{kpis.noi_variance.toFixed(1)}%
            </div>
          </div>
        </div>
        <div className="col-md-6 col-lg-3">
          <div className="metric-card">
            <div className="metric-value">{formatCurrency(kpis.total_revenue)}</div>
            <div className="metric-label">YTD Revenue</div>
            <div className={`metric-change ${kpis.revenue_variance >= 0 ? 'text-success' : 'text-danger'}`}>
              {kpis.revenue_variance >= 0 ? '+' : ''}{kpis.revenue_variance.toFixed(1)}%
            </div>
          </div>
        </div>
        <div className="col-md-6 col-lg-3">
          <div className="metric-card">
            <div className="metric-value">{kpis.avg_vacancy.toFixed(1)}%</div>
            <div className="metric-label">Avg Vacancy</div>
            <div className={`metric-change ${kpis.avg_vacancy <= 5 ? 'text-success' : 'text-warning'}`}>
              {kpis.avg_vacancy <= 5 ? 'Good' : 'Above Target'}
            </div>
          </div>
        </div>
      </div>

      {/* Financial Snapshot */}
      <div className="row g-4">
        <div className="col-lg-6">
          <div className="financial-card">
            <h4 className="financial-title">Current Period</h4>
            <div className="mb-3">
              <strong>Total Revenue:</strong> 
              <span className="float-end text-accent">{formatCurrency(kpis.total_revenue)}</span>
            </div>
            <div className="mb-3">
              <strong>Total Expenses:</strong> 
              <span className="float-end">{formatCurrency(kpis.total_expenses)}</span>
            </div>
            <div className="mb-3">
              <strong>Net Operating Income:</strong> 
              <span className="float-end text-accent">{formatCurrency(kpis.total_noi)}</span>
            </div>
            <div>
              <strong>Properties:</strong> 
              <span className="float-end">{kpis.property_count}</span>
            </div>
          </div>
        </div>
        <div className="col-lg-6">
          <div className="financial-card">
            <h4 className="financial-title">Year-over-Year Comparison</h4>
            <div className="mb-3">
              <strong>NOI Change:</strong> 
              <span className={`float-end ${kpis.noi_variance >= 0 ? 'text-success' : 'text-danger'}`}>
                {kpis.noi_variance >= 0 ? '+' : ''}{kpis.noi_variance.toFixed(1)}%
              </span>
            </div>
            <div className="mb-3">
              <strong>Revenue Change:</strong> 
              <span className={`float-end ${kpis.revenue_variance >= 0 ? 'text-success' : 'text-danger'}`}>
                {kpis.revenue_variance >= 0 ? '+' : ''}{kpis.revenue_variance.toFixed(1)}%
              </span>
            </div>
            <div className="mb-3">
              <strong>Avg Vacancy:</strong> 
              <span className="float-end">{kpis.avg_vacancy.toFixed(1)}%</span>
            </div>
            <div>
              <strong>Performance:</strong> 
              <span className={`float-end badge ${kpis.noi_variance > 5 ? 'bg-success' : 'bg-secondary'}`}>
                {kpis.noi_variance > 5 ? 'Strong' : 'Stable'}
              </span>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}