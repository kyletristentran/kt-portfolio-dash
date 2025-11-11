import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

export async function GET() {
  try {
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

    if (!supabaseUrl || !supabaseKey) {
      return NextResponse.json({
        success: false,
        message: 'Supabase credentials not configured'
      });
    }

    const supabase = createClient(supabaseUrl, supabaseKey);

    // Test connection
    const { data, error } = await supabase.from('Properties').select('count').limit(1);

    if (error) {
      return NextResponse.json({
        success: false,
        message: `Database error: ${error.message}`,
        error: error
      });
    }

    return NextResponse.json({
      success: true,
      message: 'Supabase connection successful!',
      url: supabaseUrl
    });
  } catch (error) {
    return NextResponse.json({
      success: false,
      message: error instanceof Error ? error.message : 'Unknown error'
    });
  }
}
