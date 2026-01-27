import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

export async function POST(request: Request) {
  try {
    const supabase = await createClient();

    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: 'Non authentifié' }, { status: 401 });
    }

    const body = await request.json();
    const { collaborationId, brandId } = body as {
      collaborationId?: string;
      brandId?: string | null;
    };

    if (!collaborationId) {
      return NextResponse.json(
        { error: 'collaborationId manquant' },
        { status: 400 },
      );
    }

    // Verify that user is the SaaS owner of this collaboration
    const { data: collab, error: collabError } = await supabase
      .from('collaborations')
      .select(
        `
        id,
        applications:application_id (
          saas_companies:saas_id (
            id,
            profile_id
          )
        )
      `,
      )
      .eq('id', collaborationId)
      .single();

    if (collabError || !collab) {
      return NextResponse.json(
        { error: "Collaboration introuvable" },
        { status: 404 },
      );
    }

    const saasProfileId = (collab.applications as any)?.saas_companies?.profile_id;
    const saasId = (collab.applications as any)?.saas_companies?.id;

    if (!saasProfileId || saasProfileId !== user.id) {
      return NextResponse.json(
        { error: "Non autorisé" },
        { status: 403 },
      );
    }

    // If a brand is provided, ensure it belongs to this SaaS
    if (brandId) {
      const { data: brand, error: brandError } = await supabase
        .from('saas_brands')
        .select('id, saas_id')
        .eq('id', brandId)
        .single();

      if (brandError || !brand || brand.saas_id !== saasId) {
        return NextResponse.json(
          { error: "Marque invalide pour cette entreprise" },
          { status: 400 },
        );
      }
    }

    const { error: updateError } = await supabase
      .from('collaborations')
      .update({
        brand_id: brandId || null,
      })
      .eq('id', collaborationId);

    if (updateError) {
      return NextResponse.json(
        { error: updateError.message },
        { status: 500 },
      );
    }

    return NextResponse.json({ success: true });
  } catch (err: any) {
    console.error('[brand] error:', err);
    return NextResponse.json(
      { error: err.message || 'Erreur serveur' },
      { status: 500 },
    );
  }
}

