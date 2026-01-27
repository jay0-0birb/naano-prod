import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

export async function POST() {
  try {
    const supabase = await createClient();

    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: 'Non authentifié' }, { status: 401 });
    }

    // Load SaaS company
    const { data: saasCompany, error: saasError } = await supabase
      .from('saas_companies')
      .select('id')
      .eq('profile_id', user.id)
      .single();

    if (saasError || !saasCompany) {
      return NextResponse.json(
        { error: 'Entreprise SaaS introuvable' },
        { status: 404 },
      );
    }

    // Check current debt
    const { data: debt } = await supabase
      .from('saas_billing_debt')
      .select('current_debt')
      .eq('saas_id', saasCompany.id)
      .single();

    const currentDebt = Number(debt?.current_debt || 0);

    // Check for unpaid invoices
    const { data: unpaidInvoices } = await supabase
      .from('billing_invoices')
      .select('id, amount_ht, status')
      .eq('saas_id', saasCompany.id)
      .neq('status', 'paid')
      .limit(1);

    const hasUnpaidInvoices =
      unpaidInvoices && unpaidInvoices.length > 0 &&
      Number(unpaidInvoices[0]?.amount_ht || 0) > 0;

    if (currentDebt > 0 || hasUnpaidInvoices) {
      return NextResponse.json(
        {
          error:
            "Impossible de supprimer la carte : des paiements sont encore dus. Merci de contacter Naano pour régler la situation.",
          blocking: true,
        },
        { status: 400 },
      );
    }

    // Soft-remove card: clear card flags so the app requires reconnection
    const { error: updateError } = await supabase
      .from('saas_companies')
      .update({
        card_on_file: false,
        card_last4: null,
        card_brand: null,
        stripe_setup_intent_id: null,
      })
      .eq('id', saasCompany.id);

    if (updateError) {
      return NextResponse.json(
        { error: updateError.message },
        { status: 500 },
      );
    }

    return NextResponse.json({ success: true });
  } catch (error: any) {
    console.error('remove-card error:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

