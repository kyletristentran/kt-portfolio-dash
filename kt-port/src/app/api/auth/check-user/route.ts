import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

export async function POST(request: Request) {
  try {
    const { email } = await request.json();

    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

    if (!supabaseUrl || !supabaseServiceKey) {
      return NextResponse.json({
        success: false,
        message: 'Supabase credentials not configured'
      });
    }

    const supabase = createClient(supabaseUrl, supabaseServiceKey!);

    // Try to get user by email
    const { data: { users }, error } = await supabase.auth.admin.listUsers();

    if (error) {
      return NextResponse.json({
        success: false,
        message: `Error checking user: ${error.message}`,
        error: error
      });
    }

    const user = users?.find(u => u.email === email);

    if (!user) {
      return NextResponse.json({
        success: false,
        message: 'User not found',
        expectedEmail: email
      });
    }

    return NextResponse.json({
      success: true,
      message: 'User found!',
      user: {
        id: user.id,
        email: user.email,
        created_at: user.created_at,
        confirmed_at: user.confirmed_at,
        last_sign_in_at: user.last_sign_in_at,
        has_password: user.encrypted_password ? 'Yes' : 'No - PASSWORD NEEDS TO BE SET!'
      }
    });
  } catch (error) {
    return NextResponse.json({
      success: false,
      message: error instanceof Error ? error.message : 'Unknown error'
    });
  }
}
