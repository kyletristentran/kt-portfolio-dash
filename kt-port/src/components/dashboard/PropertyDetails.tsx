'use client';

import { useState, useEffect } from 'react';

interface PropertyDetail {
  PropertyID: number;
  PropertyName: string;
  PurchasePrice: number;
  TotalUnits: number;
  TotalRevenue: number;
  TotalExpenses: number;
  TotalNOI: number;
  AvgVacancy: number;
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
      const year = new Date().getFullYear();
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
        <h4 className="alert-heading">Error Loading Properties</h4>
        <p>{error}</p>
        <button className="btn btn-outline-danger" onClick={fetchPropertyDetails}>
          Try Again
        </button>
      </div>
    );
  }

  const totalUnits = properties.reduce((sum, p) => sum + p.TotalUnits, 0);
  const totalRevenue = properties.reduce((sum, p) => sum + p.TotalRevenue, 0);
  const totalNOI = properties.reduce((sum, p) => sum + p.TotalNOI, 0);

  return (
    <div className="content-card">
      <h4 className="mb-4">🏢 Property Portfolio Details</h4>
      
      {properties.length === 0 ? (
        <div className="alert alert-info" role="alert">
          <h5 className="alert-heading">No Properties Found</h5>
          <p>No properties found in the database. Add some properties to see details.</p>
        </div>
      ) : (
        <>
          {/* Summary metrics */}
          <div className="row g-3 mb-4">
            <div className="col-md-3">
              <div className="metric-card">
                <div className="metric-value">{properties.length}</div>
                <div className="metric-label">Total Properties</div>
              </div>
            </div>
            <div className="col-md-3">
              <div className="metric-card">
                <div className="metric-value">{totalUnits.toLocaleString()}</div>
                <div className="metric-label">Total Units</div>
              </div>
            </div>
            <div className="col-md-3">
              <div className="metric-card">
                <div className="metric-value">{formatCurrency(totalRevenue)}</div>
                <div className="metric-label">Portfolio Revenue</div>
              </div>
            </div>
            <div className="col-md-3">
              <div className="metric-card">
                <div className="metric-value">{formatCurrency(totalNOI)}</div>
                <div className="metric-label">Portfolio NOI</div>
              </div>
            </div>
          </div>

          {/* Export Button */}
          <div className="mb-3">
            <button className="btn btn-trea" onClick={downloadCSV}>
              <i className="fas fa-download"></i> Export Property Details
            </button>
          </div>

          {/* Property Cards */}
          <div className="row g-4">
            {properties.map((property) => {
              const noiMargin = property.TotalRevenue > 0 
                ? (property.TotalNOI / property.TotalRevenue * 100) 
                : 0;

              return (
                <div key={property.PropertyID} className="col-lg-6">
                  <div className="content-card property-card">
                    <h5 className="property-name">{property.PropertyName}</h5>
                    <p className="mb-2">💰 <strong>Purchase Price:</strong> {formatCurrency(property.PurchasePrice)}</p>
                    
                    <div className="row g-3 mb-3">
                      <div className="col-4">
                        <div className="text-center">
                          <strong>{property.TotalUnits}</strong><br/>
                          <small>Units</small>
                        </div>
                      </div>
                      <div className="col-4">
                        <div className="text-center">
                          <strong>{property.AvgVacancy.toFixed(1)}%</strong><br/>
                          <small>Vacancy</small>
                        </div>
                      </div>
                      <div className="col-4">
                        <div className="text-center">
                          <strong>{property.MonthsReported}</strong><br/>
                          <small>Months Active</small>
                        </div>
                      </div>
                    </div>
                    
                    <div className="border-top pt-3">
                      <div className="row g-3">
                        <div className="col-4">
                          <strong>Revenue</strong><br/>
                          {formatCurrency(property.TotalRevenue)}
                        </div>
                        <div className="col-4">
                          <strong>Expenses</strong><br/>
                          {formatCurrency(property.TotalExpenses)}
                        </div>
                        <div className="col-4">
                          <strong>NOI</strong><br/>
                          <span className={property.TotalNOI >= 0 ? 'text-success' : 'text-danger'}>
                            {formatCurrency(property.TotalNOI)}
                          </span>
                        </div>
                      </div>
                      <div className="mt-2">
                        <strong>NOI Margin:</strong> 
                        <span className={`ms-2 ${noiMargin >= 30 ? 'text-success' : noiMargin >= 15 ? 'text-warning' : 'text-danger'}`}>
                          {noiMargin.toFixed(1)}%
                        </span>
                      </div>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>

          {/* Performance Summary Table */}
          <div className="mt-4">
            <h5 className="section-title">Performance Summary</h5>
            <div className="table-responsive">
              <table className="table table-striped table-hover">
                <thead className="table-dark">
                  <tr>
                    <th>Property</th>
                    <th>Units</th>
                    <th>Revenue</th>
                    <th>NOI</th>
                    <th>NOI Margin</th>
                    <th>Vacancy</th>
                    <th>Status</th>
                  </tr>
                </thead>
                <tbody>
                  {properties.map((property) => {
                    const noiMargin = property.TotalRevenue > 0 
                      ? (property.TotalNOI / property.TotalRevenue * 100) 
                      : 0;
                    
                    let performanceStatus = 'Poor';
                    let statusClass = 'badge bg-danger';
                    
                    if (noiMargin >= 30 && property.AvgVacancy <= 5) {
                      performanceStatus = 'Excellent';
                      statusClass = 'badge bg-success';
                    } else if (noiMargin >= 20 && property.AvgVacancy <= 10) {
                      performanceStatus = 'Good';
                      statusClass = 'badge bg-primary';
                    } else if (noiMargin >= 10) {
                      performanceStatus = 'Fair';
                      statusClass = 'badge bg-warning';
                    }

                    return (
                      <tr key={property.PropertyID}>
                        <td><strong>{property.PropertyName}</strong></td>
                        <td>{property.TotalUnits}</td>
                        <td>{formatCurrency(property.TotalRevenue)}</td>
                        <td className={property.TotalNOI >= 0 ? 'text-success' : 'text-danger'}>
                          {formatCurrency(property.TotalNOI)}
                        </td>
                        <td>{noiMargin.toFixed(1)}%</td>
                        <td>
                          <span className={property.AvgVacancy <= 5 ? 'text-success' : property.AvgVacancy <= 10 ? 'text-warning' : 'text-danger'}>
                            {property.AvgVacancy.toFixed(1)}%
                          </span>
                        </td>
                        <td>
                          <span className={statusClass}>{performanceStatus}</span>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        </>
      )}
    </div>
  );
}