import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

type CancelAction = 'request' | 'confirm' | 'reject';

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
    const { collaborationId, action, reason } = body as {
      collaborationId?: string;
      action?: CancelAction;
      reason?: string;
    };

    if (!collaborationId || !action) {
      return NextResponse.json(
        { error: 'collaborationId ou action manquant' },
        { status: 400 },
      );
    }

    if (!['request', 'confirm', 'reject'].includes(action)) {
      return NextResponse.json(
        { error: 'Action invalide' },
        { status: 400 },
      );
    }

    // Load collaboration and roles
    const { data: collab, error: collabError } = await supabase
      .from('collaborations')
      .select(
        `
        id,
        status,
        cancel_requested_by,
        cancel_reason,
        applications:application_id (
          creator_profiles:creator_id (
            profile_id
          ),
          saas_companies:saas_id (
            profile_id
          )
        )
      `,
      )
      .eq('id', collaborationId)
      .single();

    if (collabError || !collab) {
      return NextResponse.json(
        { error: 'Collaboration introuvable' },
        { status: 404 },
      );
    }

    const creatorProfileId = (collab.applications as any)?.creator_profiles
      ?.profile_id;
    const saasProfileId = (collab.applications as any)?.saas_companies
      ?.profile_id;

    const isCreator = user.id === creatorProfileId;
    const isSaas = user.id === saasProfileId;

    if (!isCreator && !isSaas) {
      return NextResponse.json(
        { error: 'Non autorisé' },
        { status: 403 },
      );
    }

    // REQUEST: one side asks to cancel
    if (action === 'request') {
      if (collab.status !== 'active') {
        return NextResponse.json(
          { error: "Seules les collaborations actives peuvent être arrêtées" },
          { status: 400 },
        );
      }

      const requestedBy = isCreator ? 'creator' : 'saas';

      const { error: updateError } = await supabase
        .from('collaborations')
        .update({
          cancel_requested_by: requestedBy,
          cancel_reason: reason || null,
        })
        .eq('id', collaborationId);

      if (updateError) {
        return NextResponse.json(
          { error: updateError.message },
          { status: 500 },
        );
      }

      return NextResponse.json({ success: true });
    }

    // CONFIRM: other side confirms cancellation
    if (action === 'confirm') {
      const requestedBy = collab.cancel_requested_by as 'creator' | 'saas' | null;

      if (!requestedBy) {
        return NextResponse.json(
          { error: "Aucune demande d'arrêt en cours" },
          { status: 400 },
        );
      }

      const requesterIsCreator = requestedBy === 'creator';
      const requesterIsSaas = requestedBy === 'saas';

      // Only the OTHER side can confirm
      if (
        (requesterIsCreator && !isSaas) ||
        (requesterIsSaas && !isCreator)
      ) {
        return NextResponse.json(
          { error: "Seule l'autre partie peut confirmer l'arrêt" },
          { status: 403 },
        );
      }

      const { error: updateError } = await supabase
        .from('collaborations')
        .update({
          status: 'cancelled',
          completed_at: new Date().toISOString(),
          cancel_requested_by: null,
          cancel_reason: null,
        })
        .eq('id', collaborationId);

      if (updateError) {
        return NextResponse.json(
          { error: updateError.message },
          { status: 500 },
        );
      }

      return NextResponse.json({ success: true });
    }

    // REJECT: clear cancellation request, keep collab active
    if (action === 'reject') {
      const { error: updateError } = await supabase
        .from('collaborations')
        .update({
          cancel_requested_by: null,
          cancel_reason: null,
        })
        .eq('id', collaborationId);

      if (updateError) {
        return NextResponse.json(
          { error: updateError.message },
          { status: 500 },
        );
      }

      return NextResponse.json({ success: true });
    }

    return NextResponse.json({ error: 'Action non gérée' }, { status: 400 });
  } catch (err: any) {
    console.error('[cancel-collaboration] error:', err);
    return NextResponse.json(
      { error: err.message || 'Erreur serveur' },
      { status: 500 },
    );
  }
}

