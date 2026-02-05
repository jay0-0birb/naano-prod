import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { notifyCollaborationStopped } from '@/lib/notifications';

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
      reason?: string; // kept for future but unused in simplified flow
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

    // Determine caller role (creator or SaaS) from their profile
    const [{ data: creatorProfile }, { data: saasCompany }] = await Promise.all([
      supabase
        .from('creator_profiles')
        .select('id')
        .eq('profile_id', user.id)
        .maybeSingle(),
      supabase
        .from('saas_companies')
        .select('id')
        .eq('profile_id', user.id)
        .maybeSingle(),
    ]);

    const isCreator = !!creatorProfile;
    const isSaas = !!saasCompany;

    if (!isCreator && !isSaas) {
      return NextResponse.json(
        { error: 'Profil créateur/SaaS introuvable' },
        { status: 403 },
      );
    }

    // Simplified behavior: any allowed user (creator or SaaS on this account)
    // can immediately stop the collaboration. No two-step flow.
    const { data, error } = await supabase
      .from('collaborations')
      .update({
        status: 'cancelled',
        completed_at: new Date().toISOString(),
      })
      .eq('id', collaborationId)
      .eq('status', 'active')
      .select('id')
      .maybeSingle();

    if (error) {
      console.error('[cancel-collaboration] update error', error);
      const message =
        error.code === '42501'
          ? "Non autorisé à modifier cette collaboration"
          : error.message;
      const status = error.code === '42501' ? 403 : 500;
      return NextResponse.json({ error: message }, { status });
    }

    if (!data) {
      return NextResponse.json(
        { error: 'Collaboration introuvable ou déjà arrêtée' },
        { status: 404 },
      );
    }

    // Notify the other party (respects their email_collaboration_stopped preference)
    notifyCollaborationStopped(data.id, user.id).catch(console.error);

    return NextResponse.json({ success: true });
  } catch (err: any) {
    console.error('[cancel-collaboration] error:', err);
    return NextResponse.json(
      { error: err.message || 'Erreur serveur' },
      { status: 500 },
    );
  }
}

