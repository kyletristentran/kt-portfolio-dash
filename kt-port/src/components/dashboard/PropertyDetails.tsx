'use client';

import { useState, useEffect } from 'react';

interface PropertyDetail {
  PropertyID: number;
  PropertyName: string;
  Address: string;
  City: string;
  State: string;
  PurchasePrice: number;
  TotalUnits: number;
  TotalRevenue: number;
  TotalExpenses: number;
  TotalNOI: number;
  AvgVacancy: number;
  OccupancyRate: number;
  MonthsReported: number;
}

export default function PropertyDetails() {
  const [properties, setProperties] = useState<PropertyDetail[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetchPropertyDetails();
  }, []);

  const fetchPropertyDetails = async () => {
    try {
      setLoading(true);
      const year = 2024; // Changed from current year to 2024 where data exists
      const response = await fetch(`/api/dashboard/property-details?year=${year}`);
      
      if (!response.ok) {
        throw new Error('Failed to fetch property details');
      }
      
      const data = await response.json();
      setProperties(data);
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

  const downloadCSV = () => {
    if (properties.length === 0) return;
    
    const headers = ['Property Name', 'Purchase Price', 'Units', 'Revenue', 'Expenses', 'NOI', 'Vacancy %', 'Months Reported'];
    const csvContent = [
      headers.join(','),
      ...properties.map(prop => [
        `"${prop.PropertyName}"`,
        prop.PurchasePrice,
        prop.TotalUnits,
        prop.TotalRevenue,
        prop.TotalExpenses,
        prop.TotalNOI,
        prop.AvgVacancy.toFixed(1),
        prop.MonthsReported
      ].join(','))
    ].join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `property_details_${new Date().getFullYear()}.csv`;
    a.click();
    window.URL.revokeObjectURL(url);
  };

  if (loading) {
    return (
      <div className="loading">
        <div className="spinner"></div>
        <div>Loading properties...</div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="alert alert-danger" role="alert">
        <h4 className="alert-heading">Error Loading Properties</h4>
        <p>{error}</p>
        <button className="btn-primary" onClick={fetchPropertyDetails}>
          Try Again
        </button>
      </div>
    );
  }

  const totalUnits = properties.reduce((sum, p) => sum + p.TotalUnits, 0);
  const totalRevenue = properties.reduce((sum, p) => sum + p.TotalRevenue, 0);
  const totalNOI = properties.reduce((sum, p) => sum + p.TotalNOI, 0);
  const totalValue = properties.reduce((sum, p) => sum + p.PurchasePrice, 0);

  return (
    <>
      {properties.length === 0 ? (
        <div className="alert alert-info" role="alert">
          <h5 className="alert-heading">No Properties Found</h5>
          <p>No properties found in the database. Add some properties to see details.</p>
        </div>
      ) : (
        <>
          {/* Summary metrics */}
          <div className="metrics-grid">
            <div className="metric-card">
              <div className="metric-header">
                <div className="metric-label">Total Properties</div>
                <div className="metric-icon"><i className="fas fa-building"></i></div>
              </div>
              <div className="metric-value">{properties.length}</div>
              <div className="metric-subtitle">Active properties in portfolio</div>
            </div>
            <div className="metric-card">
              <div className="metric-header">
                <div className="metric-label">Total Units</div>
                <div className="metric-icon"><i className="fas fa-home"></i></div>
              </div>
              <div className="metric-value">{totalUnits.toLocaleString()}</div>
              <div className="metric-subtitle">Total rental units</div>
            </div>
            <div className="metric-card">
              <div className="metric-header">
                <div className="metric-label">Portfolio Value</div>
                <div className="metric-icon"><i className="fas fa-dollar-sign"></i></div>
              </div>
              <div className="metric-value">{formatCurrency(totalValue)}</div>
              <div className="metric-subtitle">Total purchase price</div>
            </div>
            <div className="metric-card">
              <div className="metric-header">
                <div className="metric-label">Portfolio NOI</div>
                <div className="metric-icon"><i className="fas fa-chart-line"></i></div>
              </div>
              <div className="metric-value">{formatCurrency(totalNOI)}</div>
              <div className="metric-subtitle">Net operating income</div>
            </div>
          </div>

          {/* Property Details Table */}
          <div className="table-container">
            <div className="chart-header">
              <div>
                <h3 className="chart-title">Property Portfolio Details</h3>
                <p className="chart-subtitle">Comprehensive property information with location and performance metrics</p>
              </div>
              <button className="btn-secondary" onClick={downloadCSV}>
                <i className="fas fa-download"></i> Export
              </button>
            </div>
            <table>
              <thead>
                <tr>
                  <th>Property Name</th>
                  <th>Location</th>
                  <th>Units</th>
                  <th>Purchase Price</th>
                  <th>Occupancy Rate</th>
                  <th>YTD Revenue</th>
                  <th>YTD NOI</th>
                  <th>NOI Margin</th>
                  <th>Performance</th>
                </tr>
              </thead>
              <tbody>
                {properties.map((property) => {
                  const noiMargin = property.TotalRevenue > 0
                    ? (property.TotalNOI / property.TotalRevenue * 100)
                    : 0;

                  let performanceStatus = 'Poor';
                  let statusClass = 'status-badge poor';

                  if (noiMargin >= 30 && property.OccupancyRate >= 95) {
                    performanceStatus = 'Excellent';
                    statusClass = 'status-badge excellent';
                  } else if (noiMargin >= 20 && property.OccupancyRate >= 90) {
                    performanceStatus = 'Good';
                    statusClass = 'status-badge good';
                  } else if (noiMargin >= 10) {
                    performanceStatus = 'Fair';
                    statusClass = 'status-badge warning';
                  }

                  return (
                    <tr key={property.PropertyID}>
                      <td className="property-name">{property.PropertyName}</td>
                      <td>
                        <i className="fas fa-map-marker-alt" style={{ color: 'var(--accent-gold)', marginRight: '8px' }}></i>
                        {property.City}, {property.State}
                        <br/>
                        <small style={{ color: 'var(--text-light)' }}>{property.Address}</small>
                      </td>
                      <td>{property.TotalUnits}</td>
                      <td>{formatCurrency(property.PurchasePrice)}</td>
                      <td>
                        <strong style={{ color: property.OccupancyRate >= 95 ? 'var(--success)' : property.OccupancyRate >= 90 ? 'var(--warning)' : 'var(--danger)' }}>
                          {property.OccupancyRate.toFixed(1)}%
                        </strong>
                      </td>
                      <td>{formatCurrency(property.TotalRevenue)}</td>
                      <td style={{ color: property.TotalNOI >= 0 ? 'var(--success)' : 'var(--danger)' }}>
                        <strong>{formatCurrency(property.TotalNOI)}</strong>
                      </td>
                      <td>{noiMargin.toFixed(1)}%</td>
                      <td>
                        <span className={statusClass}>{performanceStatus}</span>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </>
      )}
    </>
  );
}