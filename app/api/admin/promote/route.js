import { createClient } from '@supabase/supabase-js';
import { NextResponse } from 'next/server';

// Standard client for verification
const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
);

// Admin client for database updates
const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

export async function POST(request) {
  try {
    // Get the auth token from headers
    const authHeader = request.headers.get('Authorization');
    if (!authHeader) {
      return NextResponse.json({ error: 'Missing authentication' }, { status: 401 });
    }

    const token = authHeader.replace('Bearer ', '');

    // 1. VERIFY identity using the real user token
    const { data: { user }, error: authError } = await supabase.auth.getUser(token);

    if (authError || !user) {
      return NextResponse.json({ error: 'Invalid session' }, { status: 401 });
    }

    // 2. CHECK if the verified user is the Super Admin
    const SUPER_ADMIN_EMAIL = 'nickjohnpokharel13@gmail.com';
    if (user.email !== SUPER_ADMIN_EMAIL) {
      console.warn(`Unauthorized elevation attempt by: ${user.email}`);
      return NextResponse.json({ error: 'Unauthorized. Master Control only.' }, { status: 403 });
    }

    // Now it is safe to proceed
    const { userId, plan } = await request.json();

    if (!userId || !plan) {
      return NextResponse.json({ error: 'Missing parameters' }, { status: 400 });
    }

    // 3. Update database using the Admin client
    const { error: dbError } = await supabaseAdmin
      .from('user_plans')
      .upsert({ 
        user_id: userId, 
        plan: plan, 
        updated_at: new Date().toISOString() 
      }, { onConflict: 'user_id' });

    if (dbError) throw dbError;

    return NextResponse.json({ success: true, message: `User upgraded to ${plan}` });
  } catch (error) {
    console.error('Master Control Error:', error.message);
    return NextResponse.json({ error: 'System error processing request' }, { status: 500 });
  }
}
