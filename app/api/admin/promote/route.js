import { createClient } from '@supabase/supabase-js';
import { NextResponse } from 'next/server';

const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

export async function POST(request) {
  try {
    const { userId, plan, adminEmail } = await request.json();

    if (adminEmail !== 'nickjohnpokharel13@gmail.com') {
      return NextResponse.json({ error: 'Unauthorized. Master Control only.' }, { status: 403 });
    }

    if (!userId || !plan) {
      return NextResponse.json({ error: 'Missing parameters' }, { status: 400 });
    }

    const { error } = await supabaseAdmin
      .from('user_plans')
      .upsert({ 
        user_id: userId, 
        plan: plan, 
        updated_at: new Date().toISOString() 
      }, { onConflict: 'user_id' });

    if (error) throw error;

    return NextResponse.json({ success: true, message: `User upgraded to ${plan}` });
  } catch (error) {
    console.error('Admin API Error:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
