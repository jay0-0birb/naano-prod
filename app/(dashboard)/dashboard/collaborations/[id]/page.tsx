import { createClient } from '@/lib/supabase/server';
import { redirect, notFound } from 'next/navigation';
import Link from 'next/link';
import { ArrowLeft, Building2, Users, MessageSquare, ExternalLink, CheckCircle2, Clock, Plus } from 'lucide-react';
import SubmitPostForm from '@/components/collaborations/submit-post-form';
import PostCard from '@/components/collaborations/post-card';
import TrackingLinkCardV2 from '@/components/collaborations/tracking-link-card-v2';
import { getOrCreateTrackingLink } from './actions-v2';

interface PageProps {
  params: Promise<{ id: string }>;
}

interface PublicationProof {
  id: string;
  linkedin_post_url: string;
  screenshot_url: string | null;
  submitted_at: string;
  validated: boolean;
  validated_at: string | null;
}

export default async function CollaborationDetailPage({ params }: PageProps) {
  const { id } = await params;
  const supabase = await createClient();
  
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect('/login');

  const { data: profile } = await supabase
    .from('profiles')
    .select('role, onboarding_completed')
    .eq('id', user.id)
    .single();

  if (!profile?.onboarding_completed) {
    redirect('/dashboard/onboarding');
  }

  const isCreator = profile?.role === 'influencer';

  // Get collaboration with all details
  const { data: collaboration } = await supabase
    .from('collaborations')
    .select(`
      *,
      applications:application_id (
        id,
        creator_profiles:creator_id (
          id,
          profile_id,
          bio,
          linkedin_url,
          followers_count,
          profiles:profile_id (
            id,
            full_name,
            avatar_url
          )
        ),
        saas_companies:saas_id (
          id,
          profile_id,
          company_name,
          logo_url,
          industry,
          website,
          commission_rate,
          description,
          profiles:profile_id (
            id,
            full_name
          )
        )
      ),
      conversations (
        id
      ),
      publication_proofs (
        id,
        linkedin_post_url,
        screenshot_url,
        submitted_at,
        validated,
        validated_at
      )
    `)
    .eq('id', id)
    .single();

  if (!collaboration) {
    notFound();
  }

  // Verify access
  const app = collaboration.applications;
  const creatorProfileId = app?.creator_profiles?.profile_id;
  const saasProfileId = app?.saas_companies?.profile_id;

  if (user.id !== creatorProfileId && user.id !== saasProfileId) {
    redirect('/dashboard/collaborations');
  }

  const partner = isCreator ? app?.saas_companies : app?.creator_profiles;
  const partnerProfile = partner?.profiles;
  const conversation = collaboration.conversations?.[0];
  const posts: PublicationProof[] = collaboration.publication_proofs || [];

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('fr-FR', {
      day: 'numeric',
      month: 'long',
      year: 'numeric',
    });
  };

  const pendingPosts = posts.filter((p) => !p.validated);
  const validatedPosts = posts.filter((p) => p.validated);

  // Get or create tracking link for this collaboration
  const trackingLinkResult = await getOrCreateTrackingLink(collaboration.id);
  const trackingLink = trackingLinkResult.success ? trackingLinkResult.link : null;
  const impressions = trackingLinkResult.success ? (trackingLinkResult.impressions as number) : 0;
  const clicks = trackingLinkResult.success ? (trackingLinkResult.clicks as number) : 0;
  const revenue = trackingLinkResult.success ? (trackingLinkResult.revenue as number) : 0;

  return (
    <div className="max-w-4xl">
      {/* Back Link */}
      <Link 
        href="/dashboard/collaborations"
        className="inline-flex items-center gap-2 text-slate-400 hover:text-white transition-colors mb-6"
      >
        <ArrowLeft className="w-4 h-4" />
        Retour aux collaborations
      </Link>

      {/* Header */}
      <div className="bg-[#0A0C10] border border-white/10 rounded-2xl p-6 mb-6">
        <div className="flex items-start justify-between">
          <div className="flex items-center gap-4">
            {isCreator ? (
              partner?.logo_url ? (
                <img 
                  src={partner.logo_url} 
                  alt={partner.company_name}
                  className="w-16 h-16 rounded-xl object-cover"
                />
              ) : (
                <div className="w-16 h-16 rounded-xl bg-gradient-to-br from-blue-500/20 to-purple-500/20 border border-white/10 flex items-center justify-center">
                  <Building2 className="w-8 h-8 text-blue-400" />
                </div>
              )
            ) : (
              partnerProfile?.avatar_url ? (
                <img 
                  src={partnerProfile.avatar_url} 
                  alt={partnerProfile.full_name}
                  className="w-16 h-16 rounded-xl object-cover"
                />
              ) : (
                <div className="w-16 h-16 rounded-xl bg-gradient-to-br from-purple-500/20 to-pink-500/20 border border-white/10 flex items-center justify-center">
                  <Users className="w-8 h-8 text-purple-400" />
                </div>
              )
            )}

            <div>
              <h1 className="text-xl font-medium text-white mb-1">
                Collaboration avec {isCreator ? partner?.company_name : partnerProfile?.full_name}
              </h1>
              <div className="flex items-center gap-3">
                {isCreator ? (
                  <>
                    <span className="text-sm text-slate-500">{partner?.industry}</span>
                    {partner?.commission_rate && (
                      <span className="text-sm text-green-400">{partner.commission_rate}% commission</span>
                    )}
                  </>
                ) : (
                  <span className="text-sm text-slate-500">
                    {partner?.followers_count?.toLocaleString()} followers
                  </span>
                )}
              </div>
            </div>
          </div>

          <div className="flex items-center gap-3">
            {isCreator && partner?.website && (
              <a 
                href={partner.website}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-2 px-3 py-1.5 bg-white/5 hover:bg-white/10 text-slate-300 rounded-lg text-sm transition-colors"
              >
                <ExternalLink className="w-4 h-4" />
                Site web
              </a>
            )}
            {conversation && (
              <Link 
                href={`/dashboard/messages?conversation=${conversation.id}`}
                className="flex items-center gap-2 px-3 py-1.5 bg-blue-600 hover:bg-blue-500 text-white rounded-lg text-sm transition-colors"
              >
                <MessageSquare className="w-4 h-4" />
                Messages
              </Link>
            )}
          </div>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-3 gap-4 mt-6 pt-6 border-t border-white/5">
          <div>
            <div className="text-2xl font-semibold text-white">{posts.length}</div>
            <div className="text-xs text-slate-500">Posts soumis</div>
          </div>
          <div>
            <div className="text-2xl font-semibold text-green-400">{validatedPosts.length}</div>
            <div className="text-xs text-slate-500">Posts validés</div>
          </div>
          <div>
            <div className="text-2xl font-semibold text-amber-400">{pendingPosts.length}</div>
            <div className="text-xs text-slate-500">En attente</div>
          </div>
        </div>
      </div>

      {/* Tracking Link Section */}
      {trackingLink && collaboration.status === 'active' && (
        <div className="mb-6">
          <TrackingLinkCardV2 
            hash={trackingLink.hash}
            impressions={impressions}
            clicks={clicks}
            revenue={revenue}
            isCreator={isCreator}
            trackImpressions={trackingLink.track_impressions ?? true}
            trackClicks={trackingLink.track_clicks ?? true}
            trackRevenue={trackingLink.track_revenue ?? true}
          />
        </div>
      )}

      {/* Error message if tracking link couldn't be created */}
      {!trackingLink && trackingLinkResult.error && (
        <div className="bg-red-500/10 border border-red-500/20 rounded-xl p-4 mb-6">
          <p className="text-sm text-red-400">
            ⚠️ {trackingLinkResult.error}
          </p>
        </div>
      )}

      {/* Submit Post Section (Creator only) */}
      {isCreator && collaboration.status === 'active' && (
        <div className="bg-[#0A0C10] border border-white/10 rounded-2xl p-6 mb-6">
          <h2 className="text-lg font-medium text-white mb-4 flex items-center gap-2">
            <Plus className="w-5 h-5" />
            Soumettre un post LinkedIn
          </h2>
          <SubmitPostForm collaborationId={collaboration.id} />
        </div>
      )}

      {/* Posts List */}
      <div className="space-y-6">
        {/* Pending Posts */}
        {pendingPosts.length > 0 && (
          <div>
            <h2 className="text-lg font-medium text-white mb-4 flex items-center gap-2">
              <Clock className="w-5 h-5 text-amber-400" />
              En attente de validation ({pendingPosts.length})
            </h2>
            <div className="space-y-4">
              {pendingPosts.map((post) => (
                <PostCard 
                  key={post.id} 
                  post={post} 
                  canValidate={!isCreator}
                />
              ))}
            </div>
          </div>
        )}

        {/* Validated Posts */}
        {validatedPosts.length > 0 && (
          <div>
            <h2 className="text-lg font-medium text-white mb-4 flex items-center gap-2">
              <CheckCircle2 className="w-5 h-5 text-green-400" />
              Posts validés ({validatedPosts.length})
            </h2>
            <div className="space-y-4">
              {validatedPosts.map((post) => (
                <PostCard 
                  key={post.id} 
                  post={post} 
                  canValidate={false}
                />
              ))}
            </div>
          </div>
        )}

        {/* Empty State */}
        {posts.length === 0 && (
          <div className="text-center py-12 bg-[#0A0C10] border border-white/10 rounded-2xl">
            <div className="w-12 h-12 rounded-full bg-white/5 flex items-center justify-center mx-auto mb-3">
              <MessageSquare className="w-6 h-6 text-slate-500" />
            </div>
            <p className="text-slate-400 text-sm">
              {isCreator 
                ? 'Aucun post soumis. Partagez votre premier post LinkedIn !'
                : 'Le créateur n\'a pas encore soumis de post.'}
            </p>
          </div>
        )}
      </div>
    </div>
  );
}

