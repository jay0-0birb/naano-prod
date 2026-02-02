'use client'

import { useState } from 'react'
import { useTranslations } from 'next-intl'
import { FileText, BarChart3, Users } from 'lucide-react'
import AnalyticsTab from './analytics-tab'
import PostsTab from './posts-tab'
import { LeadFeedTab } from './lead-feed-tab'

interface Post {
  id: string
  linkedin_post_url: string
  screenshot_url: string | null
  submitted_at: string
  validated: boolean
  validated_at: string | null
}

interface CollaborationTabsProps {
  collaborationId: string
  isCreator: boolean
  isSaaS: boolean
  subscriptionTier: string | null
  posts: Post[]
  collaborationStatus: string
  initialTab?: 'posts' | 'analytics' | 'leads'
  saasWalletCredits?: number // For blocking post submission when credits = 0
  creatorTotalPosts?: number // Total posts across all collaborations
  creatorPostLimit?: number // Max 25 posts per creator
}

export default function CollaborationTabs({
  collaborationId,
  isCreator,
  isSaaS,
  subscriptionTier,
  posts,
  collaborationStatus,
  initialTab = 'posts',
  saasWalletCredits,
  creatorTotalPosts,
  creatorPostLimit = 25,
}: CollaborationTabsProps) {
  const t = useTranslations('collaborationTabs')
  const [selectedTab, setSelectedTab] = useState<'posts' | 'analytics' | 'leads'>(initialTab)

  // Determine which tabs to show
  const tabs = [
    {
      id: 'posts' as const,
      label: t('posts'),
      icon: FileText,
      available: true, // Everyone can see posts
    },
    {
      id: 'analytics' as const,
      label: t('analytics'),
      icon: BarChart3,
      // Analytics only for SaaS with paying tier (starter, growth, or scale)
      // Part 1 (KPIs) is available to all paying tiers
      available: isSaaS && subscriptionTier !== null,
    },
    {
      id: 'leads' as const,
      label: t('leadFeed'),
      icon: Users,
      // Lead Feed only for SaaS with Growth or Scale tier
      // Temporarily available for all SaaS for testing
      available: isSaaS && (subscriptionTier === 'growth' || subscriptionTier === 'scale' || subscriptionTier === 'starter'),
    },
  ].filter(tab => tab.available)

  return (
    <div>
      {/* Tabs Navigation */}
      <div className="flex gap-2 mb-6">
        {tabs.map((tab) => {
          const Icon = tab.icon
          return (
            <button
              key={tab.id}
              type="button"
              onClick={() => setSelectedTab(tab.id)}
              className={`px-4 py-2 rounded-lg text-sm font-medium transition-all flex items-center gap-2 ${
                selectedTab === tab.id
                  ? 'bg-white text-[#111827] shadow-sm'
                  : 'text-[#64748B] hover:text-[#111827] hover:bg-gray-50'
              }`}
            >
              <Icon className="w-4 h-4" />
              {tab.label}
            </button>
          )
        })}
      </div>

      {/* Tab Content */}
      <div>
        {selectedTab === 'posts' && (
          <PostsTab 
            collaborationId={collaborationId} 
            isCreator={isCreator}
            posts={posts}
            collaborationStatus={collaborationStatus}
            saasWalletCredits={saasWalletCredits}
            creatorTotalPosts={creatorTotalPosts}
            creatorPostLimit={creatorPostLimit}
          />
        )}
        {selectedTab === 'analytics' && isSaaS && (
          <AnalyticsTab collaborationId={collaborationId} />
        )}
        {selectedTab === 'leads' && isSaaS && (
          <LeadFeedTab collaborationId={collaborationId} />
        )}
      </div>
    </div>
  )
}

