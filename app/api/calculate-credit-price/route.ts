import { NextResponse } from 'next/server';
import { createClient as createSupabaseClient } from '@supabase/supabase-js';

const supabaseAdmin = process.env.NEXT_PUBLIC_SUPABASE_URL && process.env.SUPABASE_SERVICE_ROLE_KEY
  ? createSupabaseClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL,
      process.env.SUPABASE_SERVICE_ROLE_KEY
    )
  : null;

export async function POST(request: Request) {
  try {
    if (!supabaseAdmin) {
      return NextResponse.json({ error: 'Supabase non configuré' }, { status: 503 });
    }

    const { volume } = await request.json();

    if (!volume || volume < 100 || volume > 10000) {
      return NextResponse.json(
        { error: 'Volume invalide (100-10000)' },
        { status: 400 }
      );
    }

    // Use database function to calculate price
    const { data: unitPrice, error } = await supabaseAdmin.rpc(
      'get_credit_unit_price',
      { volume }
    );

    if (error) {
      console.error('Error calculating price:', error);
      return NextResponse.json(
        { error: 'Erreur de calcul' },
        { status: 500 }
      );
    }

    const totalPrice = Number(unitPrice) * volume;

    return NextResponse.json({
      unitPrice: Number(unitPrice),
      totalPrice,
    });
  } catch (error: any) {
    console.error('Calculate price error:', error);
    return NextResponse.json(
      { error: error.message || 'Erreur serveur' },
      { status: 500 }
    );
  }
}
