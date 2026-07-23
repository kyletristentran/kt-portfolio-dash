import { createClient, SupabaseClient } from '@supabase/supabase-js';

// Supabase configuration
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;

// Create Supabase client
let supabase: SupabaseClient | null = null;

export function getSupabaseClient(): SupabaseClient {
  if (!supabase) {
    if (!supabaseUrl || !supabaseAnonKey) {
      console.error('❌ Supabase credentials missing!');
      console.error('NEXT_PUBLIC_SUPABASE_URL:', supabaseUrl ? 'Set' : 'Missing');
      console.error('NEXT_PUBLIC_SUPABASE_ANON_KEY:', supabaseAnonKey ? 'Set' : 'Missing');
      throw new Error('Supabase credentials not configured');
    }
    supabase = createClient(supabaseUrl, supabaseAnonKey);
    console.log('✅ Connected to Supabase:', supabaseUrl);
  }
  return supabase;
}

export async function testConnection(): Promise<{ success: boolean; message: string }> {
  try {
    const client = getSupabaseClient();

    const { error } = await client.from('properties').select('id').limit(1);

    if (error) throw error;

    return {
      success: true,
      message: 'Supabase connection successful'
    };
  } catch (error) {
    return {
      success: false,
      message: error instanceof Error ? error.message : 'Unknown database error'
    };
  }
}

// Dashboard Data Queries
export interface DashboardKPIs {
  total_portfolio_value: number;
  total_revenue: number;
  total_expenses: number;
  total_noi: number;
  avg_vacancy: number;
  property_count: number;
  noi_variance: number;
  revenue_variance: number;
  prev_noi: number;
  prev_revenue: number;
}

export async function getPortfolioKPIs(year: number): Promise<DashboardKPIs> {
  try {
    const client = getSupabaseClient();
    console.log(`📊 Fetching portfolio KPIs for year: ${year}`);

    const { data, error } = await client.rpc('get_portfolio_kpis', {
      p_year: year
    });

    if (error) {
      console.error('❌ get_portfolio_kpis RPC failed:', error);
      throw error;
    }

    const row = Array.isArray(data) ? data[0] : data;
    if (!row) {
      throw new Error('get_portfolio_kpis returned no data');
    }

    return {
      total_portfolio_value: Number(row.total_portfolio_value || 0),
      total_revenue: Number(row.total_revenue || 0),
      total_expenses: Number(row.total_expenses || 0),
      total_noi: Number(row.total_noi || 0),
      avg_vacancy: Math.min(Math.max(100 - Number(row.avg_occupancy_pct || 0), 0), 100),
      property_count: Number(row.property_count || 0),
      noi_variance: Number(row.noi_variance_pct || 0),
      revenue_variance: Number(row.revenue_variance_pct || 0),
      prev_noi: Number(row.prev_noi || 0),
      prev_revenue: Number(row.prev_revenue || 0)
    };
  } catch (error) {
    console.error('Error fetching KPIs:', error);
    throw error;
  }
}

export interface MonthlyPerformance {
  ReportingMonth: Date;
  Revenue: number;
  Expenses: number;
  NOI: number;
  CashFlow: number;
  Vacancy: number;
}

export async function getMonthlyPerformance(year: number): Promise<MonthlyPerformance[]> {
  try {
    const client = getSupabaseClient();
    const startDate = `${year}-01-01`;
    const endDate = `${year}-12-31`;

    const { data, error } = await client
      .from('monthly_financials')
      .select('reporting_month, total_income, total_expenses, noi, cash_flow, occupancy_pct')
      .gte('reporting_month', startDate)
      .lte('reporting_month', endDate)
      .order('reporting_month');

    if (error) throw error;

    // Group by month and aggregate
    const monthlyMap = new Map<string, { agg: MonthlyPerformance; count: number }>();

    data?.forEach(record => {
      const monthKey = record.reporting_month;
      if (!monthlyMap.has(monthKey)) {
        monthlyMap.set(monthKey, {
          agg: {
            ReportingMonth: new Date(record.reporting_month),
            Revenue: 0,
            Expenses: 0,
            NOI: 0,
            CashFlow: 0,
            Vacancy: 0
          },
          count: 0
        });
      }

      const entry = monthlyMap.get(monthKey)!;
      entry.agg.Revenue += Number(record.total_income || 0);
      entry.agg.Expenses += Number(record.total_expenses || 0);
      entry.agg.NOI += Number(record.noi || 0);
      entry.agg.CashFlow += Number(record.cash_flow || 0);
      entry.agg.Vacancy += 100 - Number(record.occupancy_pct || 0);
      entry.count += 1;
    });

    // Vacancy is the average vacancy percentage across properties for the month
    return Array.from(monthlyMap.values()).map(({ agg, count }) => ({
      ...agg,
      Vacancy: Math.min(Math.max(count ? agg.Vacancy / count : 0, 0), 100)
    }));
  } catch (error) {
    console.error('Error fetching monthly performance:', error);
    throw error;
  }
}

export interface PropertyDetail {
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

export async function getPropertyDetails(year: number): Promise<PropertyDetail[]> {
  try {
    const client = getSupabaseClient();
    const startDate = `${year}-01-01`;
    const endDate = `${year}-12-31`;

    const { data: properties, error: propError } = await client
      .from('properties')
      .select('id, name, address, city, state, purchase_price, units');

    if (propError) {
      console.error('❌ Error fetching properties:', propError);
      throw propError;
    }

    const { data: financials, error: finError } = await client
      .from('monthly_financials')
      .select('property_id, total_income, total_expenses, noi, occupancy_pct, reporting_month')
      .gte('reporting_month', startDate)
      .lte('reporting_month', endDate);

    if (finError) {
      console.error('❌ Error fetching financials:', finError);
      throw finError;
    }

    return properties.map((prop: any) => {
      const propFinancials = financials?.filter((f: any) => f.property_id === prop.id) || [];
      const totalRevenue = propFinancials.reduce((sum, f: any) => sum + Number(f.total_income || 0), 0);
      const totalExpenses = propFinancials.reduce((sum, f: any) => sum + Number(f.total_expenses || 0), 0);
      const totalNOI = propFinancials.reduce((sum, f: any) => sum + Number(f.noi || 0), 0);
      const avgOccupancy = propFinancials.length
        ? Math.min(Math.max(propFinancials.reduce((sum, f: any) => sum + Number(f.occupancy_pct || 0), 0) / propFinancials.length, 0), 100)
        : 0;
      const monthsReported = new Set(propFinancials.map((f: any) => f.reporting_month)).size;

      return {
        PropertyID: prop.id,
        PropertyName: prop.name,
        Address: prop.address || 'N/A',
        City: prop.city || 'N/A',
        State: prop.state || 'N/A',
        PurchasePrice: Number(prop.purchase_price || 0),
        TotalUnits: prop.units,
        TotalRevenue: totalRevenue,
        TotalExpenses: totalExpenses,
        TotalNOI: totalNOI,
        AvgVacancy: 100 - avgOccupancy,
        OccupancyRate: avgOccupancy,
        MonthsReported: monthsReported
      };
    }).sort((a, b) => a.PropertyName.localeCompare(b.PropertyName));
  } catch (error) {
    console.error('Error fetching property details:', error);
    throw error;
  }
}

export interface Property {
  PropertyID: number;
  PropertyName: string;
}

export async function getPropertyList(): Promise<Property[]> {
  try {
    const client = getSupabaseClient();
    console.log('📋 Fetching property list from Supabase...');

    const { data, error } = await client
      .from('properties')
      .select('id, name')
      .order('name');

    if (error) {
      console.error('❌ Error fetching property list:', error);
      throw error;
    }

    console.log('✅ Property list fetched:', data?.length || 0, 'properties');
    return (data || []).map((prop: any) => ({
      PropertyID: prop.id,
      PropertyName: prop.name
    }));
  } catch (error) {
    console.error('❌ Exception in getPropertyList:', error);
    throw error;
  }
}

export interface FinancialData {
  GrossRent: number;
  Vacancy: number;
  OtherIncome: number;
  TotalIncome: number;
  RepairsMaintenance: number;
  Utilities: number;
  PropertyManagement: number;
  PropertyTaxes: number;
  Insurance: number;
  Marketing: number;
  Administrative: number;
  TotalExpenses: number;
  NOI: number;
  DebtService: number;
  CashFlow: number;
  Occupancy: number;
  FilePath?: string;
}

export async function importMonthlyFinancials(
  propertyId: number,
  reportingMonth: Date,
  data: FinancialData
): Promise<boolean> {
  try {
    const client = getSupabaseClient();
    const monthStr = reportingMonth.toISOString().split('T')[0];

    const financialData = {
      property_id: propertyId,
      reporting_month: monthStr,
      gross_rent: data.GrossRent,
      vacancy_loss: data.Vacancy,
      other_income: data.OtherIncome,
      total_income: data.TotalIncome,
      repairs_maintenance: data.RepairsMaintenance,
      utilities: data.Utilities,
      property_management: data.PropertyManagement,
      property_taxes: data.PropertyTaxes,
      insurance: data.Insurance,
      marketing: data.Marketing,
      administrative: data.Administrative,
      total_expenses: data.TotalExpenses,
      noi: data.NOI,
      debt_service: data.DebtService,
      cash_flow: data.CashFlow,
      occupancy_pct: data.Occupancy,
      source_file: data.FilePath || 'Next.js Import'
    };

    // UNIQUE (property_id, reporting_month) makes upsert safe
    const { error } = await client
      .from('monthly_financials')
      .upsert(financialData, { onConflict: 'property_id,reporting_month' });

    if (error) throw error;

    return true;
  } catch (error) {
    console.error('Error importing financial data:', error);
    throw error;
  }
}

export interface MonthlyFinancialRecord {
  FinancialID: number;
  PropertyID: number;
  PropertyName: string;
  ReportingMonth: Date;
  GrossRent: number;
  Vacancy: number;
  OtherIncome: number;
  TotalIncome: number;
  RepairsMaintenance: number;
  Utilities: number;
  PropertyManagement: number;
  PropertyTaxes: number;
  Insurance: number;
  Marketing: number;
  Administrative: number;
  TotalExpenses: number;
  NOI: number;
  DebtService: number;
  CashFlow: number;
  Occupancy: number;
  FilePath: string;
}

export async function getMonthlyFinancialRecords(year?: number, propertyId?: number): Promise<MonthlyFinancialRecord[]> {
  try {
    const client = getSupabaseClient();

    let query = client
      .from('monthly_financials')
      .select(`
        id,
        property_id,
        reporting_month,
        gross_rent,
        vacancy_loss,
        other_income,
        total_income,
        repairs_maintenance,
        utilities,
        property_management,
        property_taxes,
        insurance,
        marketing,
        administrative,
        total_expenses,
        noi,
        debt_service,
        cash_flow,
        occupancy_pct,
        source_file,
        properties (
          name
        )
      `)
      .order('reporting_month', { ascending: false });

    if (year) {
      const startDate = `${year}-01-01`;
      const endDate = `${year}-12-31`;
      query = query.gte('reporting_month', startDate).lte('reporting_month', endDate);
    }

    if (propertyId) {
      query = query.eq('property_id', propertyId);
    }

    const { data, error } = await query;

    if (error) throw error;

    return data.map((record: any) => ({
      FinancialID: record.id,
      PropertyID: record.property_id,
      PropertyName: record.properties?.name || '',
      ReportingMonth: new Date(record.reporting_month),
      GrossRent: Number(record.gross_rent),
      Vacancy: Number(record.vacancy_loss),
      OtherIncome: Number(record.other_income),
      TotalIncome: Number(record.total_income),
      RepairsMaintenance: Number(record.repairs_maintenance),
      Utilities: Number(record.utilities),
      PropertyManagement: Number(record.property_management),
      PropertyTaxes: Number(record.property_taxes),
      Insurance: Number(record.insurance),
      Marketing: Number(record.marketing),
      Administrative: Number(record.administrative),
      TotalExpenses: Number(record.total_expenses),
      NOI: Number(record.noi),
      DebtService: Number(record.debt_service),
      CashFlow: Number(record.cash_flow),
      Occupancy: Number(record.occupancy_pct),
      FilePath: record.source_file || ''
    }));
  } catch (error) {
    console.error('Error fetching monthly financial records:', error);
    throw error;
  }
}

export async function deleteMonthlyFinancialRecord(financialId: number): Promise<boolean> {
  try {
    const client = getSupabaseClient();

    const { error } = await client
      .from('monthly_financials')
      .delete()
      .eq('id', financialId);

    if (error) throw error;

    return true;
  } catch (error) {
    console.error('Error deleting financial record:', error);
    throw error;
  }
}
