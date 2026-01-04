'use client'

import { Plus, Clock, CheckCircle2, MessageSquare } from 'lucide-react'
import SubmitPostForm from '@/components/collaborations/submit-post-form'
import PostCard from '@/components/collaborations/post-card'

interface PostsTabProps {
  collaborationId: string
  isCreator: boolean
  posts: Array<{
    id: string
    linkedin_post_url: string
    screenshot_url: string | null
    submitted_at: string
    validated: boolean
    validated_at: string | null
  }>
  collaborationStatus: string
}

export default function PostsTab({ 
  collaborationId, 
  isCreator, 
  posts,
  collaborationStatus 
}: PostsTabProps) {
  const pendingPosts = posts.filter((p) => !p.validated)
  const validatedPosts = posts.filter((p) => p.validated)

  return (
    <div className="space-y-6">
      {/* Submit Post Section (Creator only) */}
      {isCreator && collaborationStatus === 'active' && (
        <div className="bg-[#0A0C10] border border-white/10 rounded-2xl p-6 mb-6">
          <h2 className="text-lg font-medium text-white mb-4 flex items-center gap-2">
            <Plus className="w-5 h-5" />
            Soumettre un post LinkedIn
          </h2>
          <SubmitPostForm collaborationId={collaborationId} />
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
  )
}

