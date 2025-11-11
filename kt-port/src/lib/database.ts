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

export async function testConnection(): Promise<{ success: boolean; message: string; tableCount?: number }> {
  try {
    const client = getSupabaseClient();

    // Query to count tables
    const { data, error } = await client
      .from('information_schema.tables')
      .select('table_name', { count: 'exact' })
      .eq('table_schema', 'public')
      .eq('table_type', 'BASE TABLE');

    if (error) {
      // Fallback: just test connection with a simple query
      const { error: testError } = await client.from('properties').select('count').limit(1);

      if (testError) {
        throw testError;
      }

      return {
        success: true,
        message: 'Supabase connection successful'
      };
    }

    return {
      success: true,
      message: 'Supabase connection successful',
      tableCount: data?.length || 0
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

    // Get current year metrics
    const { data: currentData, error: currentError } = await client.rpc('get_portfolio_kpis', {
      p_year: year
    });

    if (currentError) {
      console.log('⚠️ RPC function not available, using manual calculation');
      // Fallback to manual calculation if RPC doesn't exist
      const startDate = `${year}-01-01`;
      const endDate = `${year}-12-31`;

      const { data: financials, error: finError } = await client
        .from('monthlyfinancials')
        .select('totalincome, totalexpenses, noi, vacancy, propertyid')
        .gte('reportingmonth', startDate)
        .lte('reportingmonth', endDate);

      if (finError) {
        console.error('❌ Error fetching financials for KPIs:', finError);
        throw finError;
      }
      console.log(`✅ Fetched ${financials?.length || 0} financial records for ${year}`);

      const { data: properties, error: propError } = await client
        .from('properties')
        .select('propertyid, purchaseprice');

      if (propError) {
        console.error('❌ Error fetching properties:', propError);
        throw propError;
      }
      console.log(`✅ Fetched ${properties?.length || 0} properties`);

      const { data: prevFinancials } = await client
        .from('monthlyfinancials')
        .select('totalincome, noi')
        .gte('reportingmonth', `${year - 1}-01-01`)
        .lte('reportingmonth', `${year - 1}-12-31`);

      const total_revenue = financials?.reduce((sum, f) => sum + Number(f.totalincome || 0), 0) || 0;
      const total_expenses = financials?.reduce((sum, f) => sum + Number(f.totalexpenses || 0), 0) || 0;
      const total_noi = financials?.reduce((sum, f) => sum + Number(f.noi || 0), 0) || 0;
      const avg_vacancy = financials?.length
        ? Math.min(Math.max(financials.reduce((sum, f) => sum + Number(f.vacancy || 0), 0) / financials.length, 0), 100)
        : 0;
      const property_count = new Set(financials?.map(f => f.propertyid)).size;
      const total_portfolio_value = properties?.reduce((sum, p) => sum + Number(p.purchaseprice || 0), 0) || 0;

      const prev_revenue = prevFinancials?.reduce((sum, f) => sum + Number(f.totalincome || 0), 0) || 0;
      const prev_noi = prevFinancials?.reduce((sum, f) => sum + Number(f.noi || 0), 0) || 0;

      const noi_variance = prev_noi !== 0 ? ((total_noi - prev_noi) / prev_noi * 100) : 0;
      const revenue_variance = prev_revenue !== 0 ? ((total_revenue - prev_revenue) / prev_revenue * 100) : 0;

      return {
        total_portfolio_value,
        total_revenue,
        total_expenses,
        total_noi,
        avg_vacancy,
        property_count,
        noi_variance,
        revenue_variance,
        prev_noi,
        prev_revenue
      };
    }

    return currentData[0];
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

    const { data, error} = await client
      .from('monthlyfinancials')
      .select('reportingmonth, totalincome, totalexpenses, noi, cashflow, vacancy')
      .gte('reportingmonth', startDate)
      .lte('reportingmonth', endDate)
      .order('reportingmonth');

    if (error) throw error;

    // Group by month and aggregate
    const monthlyMap = new Map<string, MonthlyPerformance>();

    data?.forEach(record => {
      const monthKey = record.reportingmonth;
      if (!monthlyMap.has(monthKey)) {
        monthlyMap.set(monthKey, {
          ReportingMonth: new Date(record.reportingmonth),
          Revenue: 0,
          Expenses: 0,
          NOI: 0,
          CashFlow: 0,
          Vacancy: 0
        });
      }

      const monthData = monthlyMap.get(monthKey)!;
      monthData.Revenue += Number(record.totalincome || 0);
      monthData.Expenses += Number(record.totalexpenses || 0);
      monthData.NOI += Number(record.noi || 0);
      monthData.CashFlow += Number(record.cashflow || 0);
      monthData.Vacancy += Number(record.vacancy || 0);
    });

    const result = Array.from(monthlyMap.values());

    // Calculate average vacancy
    result.forEach(month => {
      const count = data?.filter(d => d.reportingmonth === month.ReportingMonth.toISOString().split('T')[0]).length || 1;
      month.Vacancy = Math.min(Math.max(month.Vacancy / count, 0), 100);
    });

    return result;
  } catch (error) {
    console.error('Error fetching monthly performance:', error);
    throw error;
  }
}

export interface PropertyDetail {
  PropertyID: number;
  PropertyName: string;
  TotalUnits: number;
  TotalRevenue: number;
  TotalExpenses: number;
  TotalNOI: number;
  AvgVacancy: number;
  MonthsReported: number;
}

export async function getPropertyDetails(year: number): Promise<PropertyDetail[]> {
  try {
    const client = getSupabaseClient();
    const startDate = `${year}-01-01`;
    const endDate = `${year}-12-31`;

    const { data: properties, error: propError } = await client
      .from('properties')
      .select('PropertyID, PropertyName, Units');

    if (propError) throw propError;

    const { data: financials, error: finError } = await client
      .from('monthlyfinancials')
      .select('PropertyID, TotalIncome, TotalExpenses, NOI, Vacancy, ReportingMonth')
      .gte('ReportingMonth', startDate)
      .lte('ReportingMonth', endDate);

    if (finError) throw finError;

    return properties.map(prop => {
      const propFinancials = financials?.filter(f => f.PropertyID === prop.PropertyID) || [];
      const totalRevenue = propFinancials.reduce((sum, f) => sum + Number(f.TotalIncome || 0), 0);
      const totalExpenses = propFinancials.reduce((sum, f) => sum + Number(f.TotalExpenses || 0), 0);
      const totalNOI = propFinancials.reduce((sum, f) => sum + Number(f.NOI || 0), 0);
      const avgVacancy = propFinancials.length
        ? Math.min(Math.max(propFinancials.reduce((sum, f) => sum + Number(f.Vacancy || 0), 0) / propFinancials.length, 0), 100)
        : 0;
      const monthsReported = new Set(propFinancials.map(f => f.ReportingMonth)).size;

      return {
        PropertyID: prop.PropertyID,
        PropertyName: prop.PropertyName,
        TotalUnits: prop.Units,
        TotalRevenue: totalRevenue,
        TotalExpenses: totalExpenses,
        TotalNOI: totalNOI,
        AvgVacancy: avgVacancy,
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
      .select('PropertyID, PropertyName')
      .order('PropertyName');

    if (error) {
      console.error('❌ Error fetching property list:', error);
      console.error('Error code:', error.code);
      console.error('Error message:', error.message);
      console.error('Error details:', error.details);
      throw error;
    }

    console.log('✅ Property list fetched:', data?.length || 0, 'properties');
    return data || [];
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

    // Check if record exists
    const { data: existing, error: checkError } = await client
      .from('monthlyfinancials')
      .select('FinancialID')
      .eq('PropertyID', propertyId)
      .eq('ReportingMonth', monthStr)
      .single();

    const financialData = {
      PropertyID: propertyId,
      ReportingMonth: monthStr,
      GrossRent: data.GrossRent,
      Vacancy: data.Vacancy,
      OtherIncome: data.OtherIncome,
      TotalIncome: data.TotalIncome,
      RepairsMaintenance: data.RepairsMaintenance,
      Utilities: data.Utilities,
      PropertyManagement: data.PropertyManagement,
      PropertyTaxes: data.PropertyTaxes,
      Insurance: data.Insurance,
      Marketing: data.Marketing,
      Administrative: data.Administrative,
      TotalExpenses: data.TotalExpenses,
      NOI: data.NOI,
      DebtService: data.DebtService,
      CashFlow: data.CashFlow,
      Occupancy: data.Occupancy,
      FilePath: data.FilePath || 'Next.js Import'
    };

    if (existing && !checkError) {
      // Update existing record
      const { error: updateError } = await client
        .from('monthlyfinancials')
        .update(financialData)
        .eq('FinancialID', existing.FinancialID);

      if (updateError) throw updateError;
    } else {
      // Insert new record
      const { error: insertError } = await client
        .from('monthlyfinancials')
        .insert(financialData);

      if (insertError) throw insertError;
    }

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
      .from('monthlyfinancials')
      .select(`
        FinancialID,
        PropertyID,
        ReportingMonth,
        GrossRent,
        Vacancy,
        OtherIncome,
        TotalIncome,
        RepairsMaintenance,
        Utilities,
        PropertyManagement,
        PropertyTaxes,
        Insurance,
        Marketing,
        Administrative,
        TotalExpenses,
        NOI,
        DebtService,
        CashFlow,
        Occupancy,
        FilePath,
        Properties (
          PropertyName
        )
      `)
      .order('ReportingMonth', { ascending: false });

    if (year) {
      const startDate = `${year}-01-01`;
      const endDate = `${year}-12-31`;
      query = query.gte('ReportingMonth', startDate).lte('ReportingMonth', endDate);
    }

    if (propertyId) {
      query = query.eq('PropertyID', propertyId);
    }

    const { data, error } = await query;

    if (error) throw error;

    return data.map((record: any) => ({
      FinancialID: record.FinancialID,
      PropertyID: record.PropertyID,
      PropertyName: record.Properties?.PropertyName || '',
      ReportingMonth: new Date(record.ReportingMonth),
      GrossRent: Number(record.GrossRent),
      Vacancy: Number(record.Vacancy),
      OtherIncome: Number(record.OtherIncome),
      TotalIncome: Number(record.TotalIncome),
      RepairsMaintenance: Number(record.RepairsMaintenance),
      Utilities: Number(record.Utilities),
      PropertyManagement: Number(record.PropertyManagement),
      PropertyTaxes: Number(record.PropertyTaxes),
      Insurance: Number(record.Insurance),
      Marketing: Number(record.Marketing),
      Administrative: Number(record.Administrative),
      TotalExpenses: Number(record.TotalExpenses),
      NOI: Number(record.NOI),
      DebtService: Number(record.DebtService),
      CashFlow: Number(record.CashFlow),
      Occupancy: Number(record.Occupancy),
      FilePath: record.FilePath || ''
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
      .from('monthlyfinancials')
      .delete()
      .eq('FinancialID', financialId);

    if (error) throw error;

    return true;
  } catch (error) {
    console.error('Error deleting financial record:', error);
    throw error;
  }
}
