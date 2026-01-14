'use client';

import { useState } from 'react';
import { completeCreatorOnboarding } from '@/app/(dashboard)/actions';
import { Loader2, AlertCircle, Linkedin, Users } from 'lucide-react';
import { useRouter } from 'next/navigation';

const EXPERTISE_SECTORS = [
  'Tech / SaaS',
  'Digital Marketing',
  'Finance / Fintech',
  'Entrepreneurship',
  'Productivity',
  'Leadership',
  'Sales',
  'Human Resources',
  'Data / Analytics',
  'Design / UX',
  'AI / Innovation',
  'Other',
];

export default function CreatorOnboardingForm() {
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [selectedSectors, setSelectedSectors] = useState<string[]>([]);

  function toggleSector(sector: string) {
    setSelectedSectors((prev) =>
      prev.includes(sector)
        ? prev.filter((s) => s !== sector)
        : [...prev, sector]
    );
  }

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setIsLoading(true);
    setError(null);

    const formData = new FormData(event.currentTarget);
    formData.append('expertiseSectors', selectedSectors.join(','));

    const result = await completeCreatorOnboarding(formData);

    if (result?.error) {
      setError(result.error);
      setIsLoading(false);
    } else {
      router.push('/dashboard');
      router.refresh();
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {error && (
        <div className="p-4 rounded-xl bg-red-50 border border-red-200 text-red-600 text-sm flex items-center gap-3">
          <AlertCircle className="w-5 h-5 shrink-0" />
          {error}
        </div>
      )}

      <div className="space-y-5">
        {/* Bio */}
        <div>
          <label className="block text-sm font-medium text-[#475569] mb-2">
            Bio *
          </label>
          <textarea
            name="bio"
            required
            rows={4}
            placeholder="Introduce yourself in a few lines: your background, expertise, what you're passionate about..."
            className="w-full bg-gray-50 border border-gray-200 rounded-xl px-4 py-3 text-[#111827] placeholder:text-gray-400 focus:outline-none focus:border-[#8B5CF6] focus:ring-2 focus:ring-[#8B5CF6]/10 transition-all resize-none"
          />
        </div>

        {/* LinkedIn URL */}
        <div>
          <label className="block text-sm font-medium text-[#475569] mb-2">
            LinkedIn Profile *
          </label>
          <div className="relative">
            <Linkedin className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-[#64748B]" />
            <input
              name="linkedinUrl"
              type="url"
              required
              placeholder="https://linkedin.com/in/your-profile"
              className="w-full bg-gray-50 border border-gray-200 rounded-xl pl-12 pr-4 py-3 text-[#111827] placeholder:text-gray-400 focus:outline-none focus:border-[#8B5CF6] focus:ring-2 focus:ring-[#8B5CF6]/10 transition-all"
            />
          </div>
        </div>

        {/* Stats Row */}
        <div className="grid grid-cols-2 gap-4">
          {/* Followers Count */}
          <div>
            <label className="block text-sm font-medium text-[#475569] mb-2">
              Follower Count *
            </label>
            <input
              name="followersCount"
              type="number"
              required
              min="0"
              placeholder="5000"
              className="w-full bg-gray-50 border border-gray-200 rounded-xl px-4 py-3 text-[#111827] placeholder:text-gray-400 focus:outline-none focus:border-[#8B5CF6] focus:ring-2 focus:ring-[#8B5CF6]/10 transition-all"
            />
          </div>

          {/* Engagement Rate */}
          <div>
            <label className="block text-sm font-medium text-[#475569] mb-2">
              Engagement Rate (%)
            </label>
            <div className="relative">
              <input
                name="engagementRate"
                type="number"
                min="0"
                max="100"
                step="0.1"
                placeholder="3.5"
                className="w-full bg-gray-50 border border-gray-200 rounded-xl px-4 py-3 pr-12 text-[#111827] placeholder:text-gray-400 focus:outline-none focus:border-[#8B5CF6] focus:ring-2 focus:ring-[#8B5CF6]/10 transition-all"
              />
              <span className="absolute right-4 top-1/2 -translate-y-1/2 text-[#64748B]">%</span>
            </div>
          </div>
        </div>

        {/* Expertise Sectors */}
        <div>
          <label className="block text-sm font-medium text-[#475569] mb-2">
            Expertise Sectors
          </label>
          <div className="flex flex-wrap gap-2">
            {EXPERTISE_SECTORS.map((sector) => (
              <button
                key={sector}
                type="button"
                onClick={() => toggleSector(sector)}
                className={`px-3 py-1.5 rounded-full text-sm transition-all ${
                  selectedSectors.includes(sector)
                    ? 'bg-[#0F172A] text-white'
                    : 'bg-gray-50 text-[#64748B] hover:bg-gray-100 hover:text-[#111827] border border-gray-200'
                }`}
              >
                {sector}
              </button>
            ))}
          </div>
        </div>

        {/* Hourly Rate */}
        <div>
          <label className="block text-sm font-medium text-[#475569] mb-2">
            Indicative Rate (€/post)
          </label>
          <div className="relative">
            <input
              name="hourlyRate"
              type="number"
              min="0"
              placeholder="150"
              className="w-full bg-gray-50 border border-gray-200 rounded-xl px-4 py-3 pr-12 text-[#111827] placeholder:text-gray-400 focus:outline-none focus:border-[#8B5CF6] focus:ring-2 focus:ring-[#8B5CF6]/10 transition-all"
            />
            <span className="absolute right-4 top-1/2 -translate-y-1/2 text-[#64748B]">€</span>
          </div>
          <p className="text-xs text-[#64748B] mt-1.5">
            Average price you charge for a sponsored LinkedIn post
          </p>
        </div>
      </div>

      <button
        type="submit"
        disabled={isLoading}
        className="w-full h-12 bg-[#0F172A] hover:bg-[#1E293B] text-white rounded-xl font-medium transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
      >
        {isLoading ? (
          <>
            <Loader2 className="w-5 h-5 animate-spin" />
            Saving...
          </>
        ) : (
          <>
            <Users className="w-5 h-5" />
            Create Creator Profile
          </>
        )}
      </button>
    </form>
  );
}
