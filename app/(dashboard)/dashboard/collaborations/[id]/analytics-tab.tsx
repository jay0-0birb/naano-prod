'use client'

import { useEffect, useState } from 'react'
import { BarChart3, MousePointerClick, Target, Users, TrendingUp, TrendingDown } from 'lucide-react'
import { getCollaborationAnalytics } from './actions-v2'

interface AnalyticsTabProps {
  collaborationId: string
}

interface AnalyticsData {
  totalImpressions: number
  totalClicks: number
  qualifiedClicks: number
  leadsCount: number
  totalLeadCost: number
  savingsVsLinkedIn: number
}

export default function AnalyticsTab({ collaborationId }: AnalyticsTabProps) {
  const [analytics, setAnalytics] = useState<AnalyticsData | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    async function fetchAnalytics() {
      try {
        setLoading(true)
        const result = await getCollaborationAnalytics(collaborationId)
        
        if (result.error) {
          setError(result.error)
        } else if (result.success && result.analytics) {
          setAnalytics(result.analytics)
        }
      } catch (err) {
        setError('Erreur lors du chargement des analytics')
        console.error(err)
      } finally {
        setLoading(false)
      }
    }

    fetchAnalytics()
  }, [collaborationId])

  if (loading) {
    return (
      <div className="bg-[#0A0C10] border border-white/10 rounded-2xl p-6">
        <div className="animate-pulse space-y-4">
          <div className="h-6 bg-white/5 rounded w-48"></div>
          <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
            {[1, 2, 3, 4, 5].map((i) => (
              <div key={i} className="h-24 bg-white/5 rounded-xl"></div>
            ))}
          </div>
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="bg-red-500/10 border border-red-500/20 rounded-xl p-4">
        <p className="text-sm text-red-400">⚠️ {error}</p>
      </div>
    )
  }

  if (!analytics) {
    return (
      <div className="bg-[#0A0C10] border border-white/10 rounded-2xl p-6 text-center">
        <p className="text-slate-400 text-sm">Aucune donnée disponible</p>
      </div>
    )
  }

  const formatNumber = (num: number) => {
    return new Intl.NumberFormat('fr-FR').format(num)
  }

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('fr-FR', {
      style: 'currency',
      currency: 'EUR',
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    }).format(amount)
  }

  const kpiCards = [
    {
      label: 'Total Impressions',
      value: formatNumber(analytics.totalImpressions),
      icon: BarChart3,
      color: 'text-blue-400',
      bgColor: 'bg-blue-500/10',
      borderColor: 'border-blue-500/20',
    },
    {
      label: 'Total Clicks (Brut)',
      value: formatNumber(analytics.totalClicks),
      icon: MousePointerClick,
      color: 'text-purple-400',
      bgColor: 'bg-purple-500/10',
      borderColor: 'border-purple-500/20',
    },
    {
      label: 'Qualified Clicks (Billable)',
      value: formatNumber(analytics.qualifiedClicks),
      icon: Target,
      color: 'text-green-400',
      bgColor: 'bg-green-500/10',
      borderColor: 'border-green-500/20',
      description: 'Filtrés: bots, doublons IP, règle des 3 secondes',
    },
    {
      label: 'Conversions / Leads',
      value: formatNumber(analytics.leadsCount),
      icon: Users,
      color: 'text-amber-400',
      bgColor: 'bg-amber-500/10',
      borderColor: 'border-amber-500/20',
    },
    {
      label: 'Coût Total Naano',
      value: formatCurrency(analytics.totalLeadCost),
      icon: TrendingDown,
      color: 'text-slate-400',
      bgColor: 'bg-slate-500/10',
      borderColor: 'border-slate-500/20',
    },
    {
      label: 'Économies vs LinkedIn Ads',
      value: formatCurrency(analytics.savingsVsLinkedIn),
      icon: TrendingUp,
      color: analytics.savingsVsLinkedIn >= 0 ? 'text-green-400' : 'text-red-400',
      bgColor: analytics.savingsVsLinkedIn >= 0 ? 'bg-green-500/10' : 'bg-red-500/10',
      borderColor: analytics.savingsVsLinkedIn >= 0 ? 'border-green-500/20' : 'border-red-500/20',
      description: `(Qualified Clicks × 8€) - Coût Naano`,
    },
  ]

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h2 className="text-lg font-medium text-white mb-2">Analytics de Performance</h2>
        <p className="text-sm text-slate-400">
          Métriques clés pour mesurer l'impact de votre collaboration
        </p>
      </div>

      {/* KPI Cards Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {kpiCards.map((kpi, index) => {
          const Icon = kpi.icon
          return (
            <div
              key={index}
              className={`${kpi.bgColor} ${kpi.borderColor} border rounded-xl p-4`}
            >
              <div className="flex items-start justify-between mb-2">
                <div className={`${kpi.color} p-2 rounded-lg bg-white/5`}>
                  <Icon className="w-5 h-5" />
                </div>
              </div>
              <div className="mt-2">
                <p className="text-2xl font-semibold text-white mb-1">{kpi.value}</p>
                <p className="text-xs text-slate-400 mb-1">{kpi.label}</p>
                {kpi.description && (
                  <p className="text-xs text-slate-500 mt-1">{kpi.description}</p>
                )}
              </div>
            </div>
          )
        })}
      </div>

      {/* Info Note */}
      <div className="bg-blue-500/10 border border-blue-500/20 rounded-xl p-4">
        <p className="text-sm text-blue-400">
          <strong>Note:</strong> Les Qualified Clicks sont filtrés automatiquement pour exclure les bots, les doublons IP, et les clics de moins de 3 secondes. 
          Les données géographiques sont collectées automatiquement pour l'analyse (non utilisées pour le filtrage).
        </p>
      </div>
    </div>
  )
}

