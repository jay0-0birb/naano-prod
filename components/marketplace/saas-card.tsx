'use client';

import { useState } from 'react';
import { Building2, Globe, Percent, ExternalLink, Send } from 'lucide-react';
import type { SaasCompanyWithProfile } from '@/types/database';
import ApplyModal from './apply-modal';

interface SaasCardProps {
  company: SaasCompanyWithProfile;
  hasApplied: boolean;
  creatorProfileId: string | null;
}

export default function SaasCard({ company, hasApplied, creatorProfileId }: SaasCardProps) {
  const [showModal, setShowModal] = useState(false);
  const [applied, setApplied] = useState(hasApplied);

  return (
    <>
      <div className="bg-white border border-gray-200 rounded-2xl p-6 hover:border-gray-300 hover:shadow-md transition-all shadow-sm">
        {/* Header */}
        <div className="flex items-start justify-between mb-4">
          <div className="flex items-center gap-4">
            {company.logo_url ? (
              <img 
                src={company.logo_url} 
                alt={company.company_name}
                className="w-14 h-14 rounded-xl object-cover"
              />
            ) : (
              <div className="w-14 h-14 rounded-xl bg-gradient-to-br from-blue-50 to-purple-50 border border-gray-200 flex items-center justify-center">
                <Building2 className="w-7 h-7 text-[#3B82F6]" />
              </div>
            )}
            <div>
              <h3 className="font-semibold text-[#111827] text-lg">{company.company_name}</h3>
              <span className="text-xs text-[#64748B] bg-gray-50 px-2 py-0.5 rounded-full">
                {company.industry || 'Not specified'}
              </span>
            </div>
          </div>
          {company.website && (
            <a 
              href={company.website}
              target="_blank"
              rel="noopener noreferrer"
              className="text-[#94A3B8] hover:text-[#111827] transition-colors"
            >
              <ExternalLink className="w-5 h-5" />
            </a>
          )}
        </div>

        {/* Description */}
        <p className="text-[#64748B] text-sm mb-4 line-clamp-3">
          {company.description || 'No description available.'}
        </p>

        {/* Commission Badge */}
        {company.commission_rate && (
          <div className="flex items-center gap-2 mb-4">
            <div className="flex items-center gap-1.5 bg-green-50 border border-green-200 text-green-700 px-3 py-1.5 rounded-lg">
              <Percent className="w-4 h-4" />
              <span className="text-sm font-medium">{company.commission_rate}% commission</span>
            </div>
          </div>
        )}

        {/* Conditions Preview */}
        {company.conditions && (
          <div className="text-xs text-[#64748B] mb-4 p-3 bg-gray-50 rounded-lg border border-gray-100">
            <span className="font-medium text-[#475569]">Terms:</span> {company.conditions.slice(0, 100)}
            {company.conditions.length > 100 && '...'}
          </div>
        )}

        {/* Action Button */}
        {creatorProfileId ? (
          applied ? (
            <button 
              disabled
              className="w-full py-2.5 bg-gray-50 text-[#94A3B8] rounded-xl text-sm font-medium cursor-not-allowed border border-gray-200"
            >
              Application sent
            </button>
          ) : (
            <button 
              onClick={() => setShowModal(true)}
              className="w-full py-2.5 bg-[#0F172A] hover:bg-[#1E293B] text-white rounded-xl text-sm font-medium transition-colors flex items-center justify-center gap-2"
            >
              <Send className="w-4 h-4" />
              Apply
            </button>
          )
        ) : (
          <div className="text-xs text-center text-[#64748B] py-2">
            Complete your creator profile to apply
          </div>
        )}
      </div>

      {/* Apply Modal */}
      {showModal && (
        <ApplyModal 
          company={company}
          creatorProfileId={creatorProfileId!}
          onClose={() => setShowModal(false)}
          onSuccess={() => {
            setApplied(true);
            setShowModal(false);
          }}
        />
      )}
    </>
  );
}
