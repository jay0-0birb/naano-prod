'use client';

import { useState } from 'react';
import { completeSaasOnboarding, uploadMediaPack } from '@/app/(dashboard)/actions';
import { Loader2, AlertCircle, Upload, CheckCircle2, Building2 } from 'lucide-react';
import { useRouter } from 'next/navigation';

const INDUSTRIES = [
  'SaaS / Software',
  'Fintech',
  'E-commerce',
  'Marketing',
  'Human Resources',
  'Productivity',
  'Cybersecurity',
  'AI / Machine Learning',
  'EdTech',
  'HealthTech',
  'Other',
];

const COUNTRIES = [
  { code: 'FR', name: 'France' },
  { code: 'DE', name: 'Germany' },
  { code: 'ES', name: 'Spain' },
  { code: 'IT', name: 'Italy' },
  { code: 'BE', name: 'Belgium' },
  { code: 'NL', name: 'Netherlands' },
  { code: 'GB', name: 'United Kingdom' },
  { code: 'US', name: 'United States' },
  { code: 'CA', name: 'Canada' },
  { code: 'CH', name: 'Switzerland' },
  { code: 'AT', name: 'Austria' },
  { code: 'PT', name: 'Portugal' },
  { code: 'SE', name: 'Sweden' },
  { code: 'DK', name: 'Denmark' },
  { code: 'NO', name: 'Norway' },
  { code: 'FI', name: 'Finland' },
  { code: 'IE', name: 'Ireland' },
  { code: 'PL', name: 'Poland' },
  { code: 'CZ', name: 'Czech Republic' },
  { code: 'OTHER', name: 'Other' },
];

export default function SaasOnboardingForm() {
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [mediaPackUrl, setMediaPackUrl] = useState<string | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  const [isVatRegistered, setIsVatRegistered] = useState(false);

  async function handleFileUpload(event: React.ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0];
    if (!file) return;

    setIsUploading(true);
    const formData = new FormData();
    formData.append('file', file);

    const result = await uploadMediaPack(formData);
    
    if (result.error) {
      setError(result.error);
    } else if (result.url) {
      setMediaPackUrl(result.url);
    }
    setIsUploading(false);
  }

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setIsLoading(true);
    setError(null);

    const formData = new FormData(event.currentTarget);
    if (mediaPackUrl) {
      formData.append('mediaPackUrl', mediaPackUrl);
    }

    const result = await completeSaasOnboarding(formData);

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
        {/* Company Name */}
        <div>
          <label className="block text-sm font-medium text-[#475569] mb-2">
            Company Name *
          </label>
          <input
            name="companyName"
            type="text"
            required
            placeholder="Acme Inc."
            className="w-full bg-gray-50 border border-gray-200 rounded-xl px-4 py-3 text-[#111827] placeholder:text-gray-400 focus:outline-none focus:border-[#3B82F6] focus:ring-2 focus:ring-[#3B82F6]/10 transition-all"
          />
        </div>

        {/* Description */}
        <div>
          <label className="block text-sm font-medium text-[#475569] mb-2">
            Product Description *
          </label>
          <textarea
            name="description"
            required
            rows={4}
            placeholder="Describe your product/service and what you're looking for in creators..."
            className="w-full bg-gray-50 border border-gray-200 rounded-xl px-4 py-3 text-[#111827] placeholder:text-gray-400 focus:outline-none focus:border-[#3B82F6] focus:ring-2 focus:ring-[#3B82F6]/10 transition-all resize-none"
          />
        </div>

        {/* Website */}
        <div>
          <label className="block text-sm font-medium text-[#475569] mb-2">
            Website
          </label>
          <input
            name="website"
            type="url"
            placeholder="https://www.example.com"
            className="w-full bg-gray-50 border border-gray-200 rounded-xl px-4 py-3 text-[#111827] placeholder:text-gray-400 focus:outline-none focus:border-[#3B82F6] focus:ring-2 focus:ring-[#3B82F6]/10 transition-all"
          />
        </div>

        {/* Industry */}
        <div>
          <label className="block text-sm font-medium text-[#475569] mb-2">
            Industry *
          </label>
          <select
            name="industry"
            required
            className="w-full bg-gray-50 border border-gray-200 rounded-xl px-4 py-3 text-[#111827] focus:outline-none focus:border-[#3B82F6] focus:ring-2 focus:ring-[#3B82F6]/10 transition-all"
          >
            <option value="">Select an industry</option>
            {INDUSTRIES.map((industry) => (
              <option key={industry} value={industry}>
                {industry}
              </option>
            ))}
          </select>
        </div>

        {/* Commission Rate */}
        <div>
          <label className="block text-sm font-medium text-[#475569] mb-2">
            Commission Rate (%) *
          </label>
          <div className="relative">
            <input
              name="commissionRate"
              type="number"
              required
              min="0"
              max="100"
              step="0.5"
              placeholder="15"
              className="w-full bg-gray-50 border border-gray-200 rounded-xl px-4 py-3 pr-12 text-[#111827] placeholder:text-gray-400 focus:outline-none focus:border-[#3B82F6] focus:ring-2 focus:ring-[#3B82F6]/10 transition-all"
            />
            <span className="absolute right-4 top-1/2 -translate-y-1/2 text-[#64748B]">%</span>
          </div>
          <p className="text-xs text-[#64748B] mt-1.5">
            Commission paid to creators on generated sales
          </p>
        </div>

        {/* Conditions */}
        <div>
          <label className="block text-sm font-medium text-[#475569] mb-2">
            Collaboration Terms
          </label>
          <textarea
            name="conditions"
            rows={3}
            placeholder="Minimum duration, exclusivity, specific expectations..."
            className="w-full bg-gray-50 border border-gray-200 rounded-xl px-4 py-3 text-[#111827] placeholder:text-gray-400 focus:outline-none focus:border-[#3B82F6] focus:ring-2 focus:ring-[#3B82F6]/10 transition-all resize-none"
          />
        </div>

        {/* Country */}
        <div>
          <label className="block text-sm font-medium text-[#475569] mb-2">
            Country *
          </label>
          <select
            name="country"
            required
            className="w-full bg-gray-50 border border-gray-200 rounded-xl px-4 py-3 text-[#111827] focus:outline-none focus:border-[#3B82F6] focus:ring-2 focus:ring-[#3B82F6]/10 transition-all"
          >
            <option value="">Select your country</option>
            {COUNTRIES.map((country) => (
              <option key={country.code} value={country.code}>
                {country.name}
              </option>
            ))}
          </select>
          <p className="text-xs text-[#64748B] mt-1.5">
            Used for billing and tax purposes
          </p>
        </div>

        {/* VAT Registration */}
        <div className="space-y-3">
          <div className="flex items-center gap-2">
            <input
              type="checkbox"
              name="isVatRegistered"
              id="isVatRegistered"
              checked={isVatRegistered}
              onChange={(e) => setIsVatRegistered(e.target.checked)}
              className="w-4 h-4 text-[#3B82F6] border-gray-300 rounded focus:ring-[#3B82F6]"
            />
            <label htmlFor="isVatRegistered" className="text-sm text-[#475569]">
              I am VAT registered (EU B2B)
            </label>
          </div>
          {isVatRegistered && (
            <div>
            <label className="block text-sm font-medium text-[#475569] mb-2">
              VAT Number
            </label>
            <input
              name="vatNumber"
              type="text"
              placeholder="FR12345678901"
              className="w-full bg-gray-50 border border-gray-200 rounded-xl px-4 py-3 text-[#111827] placeholder:text-gray-400 focus:outline-none focus:border-[#3B82F6] focus:ring-2 focus:ring-[#3B82F6]/10 transition-all"
            />
              <p className="text-xs text-[#64748B] mt-1.5">
                Your EU VAT number (optional but recommended for B2B)
              </p>
            </div>
          )}
        </div>

        {/* Media Pack Upload */}
        <div>
          <label className="block text-sm font-medium text-[#475569] mb-2">
            Media Pack (logos, guidelines)
          </label>
          <div className="relative">
            <input
              type="file"
              accept=".pdf,.zip,.png,.jpg,.jpeg"
              onChange={handleFileUpload}
              className="hidden"
              id="media-pack-upload"
            />
            <label
              htmlFor="media-pack-upload"
              className={`flex items-center justify-center gap-3 w-full py-4 border-2 border-dashed rounded-xl cursor-pointer transition-all ${
                mediaPackUrl
                  ? 'border-green-200 bg-green-50'
                  : 'border-gray-200 hover:border-gray-300 bg-gray-50'
              }`}
            >
              {isUploading ? (
                <>
                  <Loader2 className="w-5 h-5 animate-spin text-[#3B82F6]" />
                  <span className="text-[#64748B]">Uploading...</span>
                </>
              ) : mediaPackUrl ? (
                <>
                  <CheckCircle2 className="w-5 h-5 text-green-600" />
                  <span className="text-green-700 font-medium">File uploaded</span>
                </>
              ) : (
                <>
                  <Upload className="w-5 h-5 text-[#64748B]" />
                  <span className="text-[#64748B]">Click to upload (PDF, ZIP, images)</span>
                </>
              )}
            </label>
          </div>
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
            <Building2 className="w-5 h-5" />
            Create Company Profile
          </>
        )}
      </button>
    </form>
  );
}
