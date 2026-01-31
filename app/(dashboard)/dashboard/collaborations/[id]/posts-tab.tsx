'use client'

import { Plus, MessageSquare } from 'lucide-react'
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
  saasWalletCredits?: number // For blocking post submission when credits = 0
}

export default function PostsTab({ 
  collaborationId, 
  isCreator, 
  posts,
  collaborationStatus,
  saasWalletCredits
}: PostsTabProps) {
  return (
    <div className="space-y-6">
      {/* Submit Post Section (Creator only) */}
      {isCreator && collaborationStatus === 'active' && (
        <div className="bg-white border border-gray-200 rounded-2xl p-6 mb-6 shadow-sm">
          <h2 className="text-lg font-semibold text-[#111827] mb-4 flex items-center gap-2">
            <Plus className="w-5 h-5" />
            Soumettre un post LinkedIn
          </h2>
          {saasWalletCredits !== undefined && saasWalletCredits <= 0 ? (
            <div className="p-4 bg-red-50 border border-red-200 rounded-xl">
              <p className="text-sm text-red-700 font-medium mb-2">
                ⚠️ Budget épuisé
              </p>
              <p className="text-xs text-red-600">
                Le budget du SaaS est épuisé. Les posts ne peuvent pas être soumis jusqu'à ce que le budget soit renouvelé.
              </p>
            </div>
          ) : (
            <SubmitPostForm collaborationId={collaborationId} />
          )}
        </div>
      )}

      {/* Posts List */}
      <div className="space-y-6">
        {posts.length > 0 && (
          <div>
            <h2 className="text-lg font-semibold text-[#111827] mb-4">
              Posts ({posts.length})
            </h2>
            <div className="space-y-4">
              {posts.map((post) => (
                <PostCard key={post.id} post={post} />
              ))}
            </div>
          </div>
        )}

        {/* Empty State */}
        {posts.length === 0 && (
          <div className="text-center py-12 bg-white border border-gray-200 rounded-2xl shadow-sm">
            <div className="w-12 h-12 rounded-full bg-gray-50 flex items-center justify-center mx-auto mb-3">
              <MessageSquare className="w-6 h-6 text-[#94A3B8]" />
            </div>
            <p className="text-[#64748B] text-sm">
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

