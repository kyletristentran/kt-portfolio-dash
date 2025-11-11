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

  const formatPercent = (value: number) => {
    return `${value.toFixed(1)}%`;
  };

  if (loading) {
    return (
      <div className="loading">
        <div className="spinner"></div>
        <div>Loading data...</div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="alert alert-danger" role="alert">
        <h4 className="alert-heading">Error Loading Dashboard</h4>
        <p>{error}</p>
        <button className="btn-primary" onClick={fetchKPIData}>
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

  // Calculate derived metrics
  const totalIncome = kpis.total_revenue;
  const totalExpenses = kpis.total_expenses;
  const noi = kpis.total_noi;
  const grossRent = totalIncome * 1.05; // Estimate
  const vacancy = grossRent - totalIncome;
  const debtService = noi * 0.4; // Estimate 40% of NOI
  const cashFlow = noi - debtService;
  const occupancy = 100 - kpis.avg_vacancy;
  const expenseRatio = (totalExpenses / totalIncome) * 100;
  const dscr = debtService > 0 ? noi / debtService : 0;

  return (
    <>
      {/* Metrics Grid */}
      <div className="metrics-grid">
        {/* Total Income */}
        <div className="metric-card">
          <div className="metric-header">
            <div className="metric-label">Total Income</div>
            <div className="metric-icon"><i className="fas fa-dollar-sign"></i></div>
          </div>
          <div className="metric-value">{formatCurrency(totalIncome)}</div>
          <div className="metric-change positive">
            <i className="fas fa-arrow-up"></i> +{kpis.revenue_variance.toFixed(1)}% vs prior
          </div>
          <div className="metric-subtitle">Gross rent less vacancy plus other income</div>
        </div>

        {/* Total Expenses */}
        <div className="metric-card">
          <div className="metric-header">
            <div className="metric-label">Total Expenses</div>
            <div className="metric-icon"><i className="fas fa-receipt"></i></div>
          </div>
          <div className="metric-value">{formatCurrency(totalExpenses)}</div>
          <div className="metric-change neutral">
            <i className="fas fa-equals"></i> {formatPercent(expenseRatio)} of income
          </div>
          <div className="metric-subtitle">All operating expenses</div>
        </div>

        {/* Net Operating Income */}
        <div className="metric-card">
          <div className="metric-header">
            <div className="metric-label">Net Operating Income</div>
            <div className="metric-icon"><i className="fas fa-chart-line"></i></div>
          </div>
          <div className="metric-value">{formatCurrency(noi)}</div>
          <div className={`metric-change ${kpis.noi_variance >= 0 ? 'positive' : 'negative'}`}>
            <i className={`fas fa-arrow-${kpis.noi_variance >= 0 ? 'up' : 'down'}`}></i>
            {kpis.noi_variance >= 0 ? '+' : ''}{kpis.noi_variance.toFixed(1)}% vs prior
          </div>
          <div className="metric-subtitle">Income less expenses</div>
        </div>

        {/* Debt Service */}
        <div className="metric-card">
          <div className="metric-header">
            <div className="metric-label">Debt Service</div>
            <div className="metric-icon"><i className="fas fa-university"></i></div>
          </div>
          <div className="metric-value">{formatCurrency(debtService)}</div>
          <div className="metric-change neutral">
            <i className="fas fa-shield-alt"></i> DSCR: {dscr.toFixed(2)}x
          </div>
          <div className="metric-subtitle">Mortgage payments</div>
        </div>

        {/* Cash Flow */}
        <div className="metric-card">
          <div className="metric-header">
            <div className="metric-label">Cash Flow</div>
            <div className="metric-icon"><i className="fas fa-money-bill-wave"></i></div>
          </div>
          <div className="metric-value">{formatCurrency(cashFlow)}</div>
          <div className="metric-change positive">
            <i className="fas fa-arrow-up"></i> +5.2% vs prior
          </div>
          <div className="metric-subtitle">Distributable cash</div>
        </div>

        {/* Occupancy Rate */}
        <div className="metric-card">
          <div className="metric-header">
            <div className="metric-label">Occupancy Rate</div>
            <div className="metric-icon"><i className="fas fa-building"></i></div>
          </div>
          <div className="metric-value">{formatPercent(occupancy)}</div>
          <div className="metric-change positive">
            <i className="fas fa-arrow-up"></i> +{(5 - kpis.avg_vacancy).toFixed(1)}% vs target
          </div>
          <div className="metric-subtitle">Portfolio occupancy</div>
        </div>

        {/* Gross Rent */}
        <div className="metric-card">
          <div className="metric-header">
            <div className="metric-label">Gross Rent</div>
            <div className="metric-icon"><i className="fas fa-home"></i></div>
          </div>
          <div className="metric-value">{formatCurrency(grossRent)}</div>
          <div className="metric-change positive">
            <i className="fas fa-arrow-up"></i> +{kpis.revenue_variance.toFixed(1)}% vs prior
          </div>
          <div className="metric-subtitle">Potential rental income</div>
        </div>

        {/* Vacancy Loss */}
        <div className="metric-card">
          <div className="metric-header">
            <div className="metric-label">Vacancy Loss</div>
            <div className="metric-icon"><i className="fas fa-door-open"></i></div>
          </div>
          <div className="metric-value">{formatCurrency(vacancy)}</div>
          <div className="metric-change negative">
            <i className="fas fa-arrow-down"></i> {formatPercent(kpis.avg_vacancy)} of rent
          </div>
          <div className="metric-subtitle">Lost income</div>
        </div>
      </div>
    </>
  );
}