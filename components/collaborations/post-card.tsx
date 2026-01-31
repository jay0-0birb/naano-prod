'use client';

import { ExternalLink, Linkedin } from 'lucide-react';

interface Post {
  id: string;
  linkedin_post_url: string;
  screenshot_url: string | null;
  submitted_at: string;
  validated: boolean;
  validated_at: string | null;
}

interface PostCardProps {
  post: Post;
}

export default function PostCard({ post }: PostCardProps) {
  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('fr-FR', {
      day: 'numeric',
      month: 'long',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  // Extract post ID for embed
  const getEmbedId = (url: string): string => {
    try {
      if (url.includes('activity-')) {
        const match = url.match(/activity-(\d+)/);
        if (match) return `urn:li:activity:${match[1]}`;
      }
      if (url.includes('urn:li:activity:')) {
        const match = url.match(/urn:li:activity:(\d+)/);
        if (match) return `urn:li:activity:${match[1]}`;
      }
      if (url.includes('urn:li:share:')) {
        const match = url.match(/urn:li:share:(\d+)/);
        if (match) return `urn:li:share:${match[1]}`;
      }
      return '';
    } catch {
      return '';
    }
  };

  const embedId = getEmbedId(post.linkedin_post_url);

  return (
    <div className="bg-white border border-gray-200 rounded-2xl overflow-hidden shadow-sm">
      {/* Header */}
      <div className="flex items-center justify-between p-4 border-b border-gray-100">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-lg flex items-center justify-center bg-[#0A66C2]/10">
            <Linkedin className="w-5 h-5 text-[#0A66C2]" />
          </div>
          <div>
            <div className="text-sm font-semibold text-[#111827]">
              Post LinkedIn
            </div>
            <div className="text-xs text-[#64748B]">
              Soumis le {formatDate(post.submitted_at)}
            </div>
          </div>
        </div>

        <a
          href={post.linkedin_post_url}
          target="_blank"
          rel="noopener noreferrer"
          className="flex items-center gap-2 px-3 py-1.5 bg-white border border-gray-200 hover:bg-gray-50 text-[#111827] rounded-lg text-sm transition-colors"
        >
          <ExternalLink className="w-4 h-4" />
          Ouvrir
        </a>
      </div>

      {/* LinkedIn Embed */}
      <div className="p-4">
        {embedId ? (
          <iframe
            src={`https://www.linkedin.com/embed/feed/update/${embedId}`}
            height="400"
            width="100%"
            frameBorder="0"
            allowFullScreen
            title="LinkedIn Post"
            className="rounded-lg bg-white"
          />
        ) : (
          <div className="aspect-video bg-gradient-to-br from-[#0A66C2]/5 to-blue-500/5 rounded-lg flex flex-col items-center justify-center border border-gray-100">
            <Linkedin className="w-12 h-12 text-[#0A66C2] mb-3" />
            <p className="text-[#64748B] text-sm text-center">
              Cliquez sur "Ouvrir" pour voir le post sur LinkedIn
            </p>
            <a
              href={post.linkedin_post_url}
              target="_blank"
              rel="noopener noreferrer"
              className="mt-4 flex items-center gap-2 px-4 py-2 bg-[#0A66C2] hover:bg-[#004182] text-white rounded-lg text-sm transition-colors"
            >
              <ExternalLink className="w-4 h-4" />
              Voir sur LinkedIn
            </a>
          </div>
        )}
      </div>

    </div>
  );
}

