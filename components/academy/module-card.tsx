'use client';

import { useState } from 'react';
import { ChevronDown, ChevronUp, Copy, Check, Play, FileText, CheckSquare, HelpCircle } from 'lucide-react';
import type { AcademyModule, AcademyItem } from '@/lib/academy-content';

interface ModuleCardProps {
  module: AcademyModule;
}

export default function ModuleCard({ module }: ModuleCardProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [copiedId, setCopiedId] = useState<string | null>(null);

  const copyToClipboard = (text: string, id: string) => {
    navigator.clipboard.writeText(text);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  const getItemIcon = (type: AcademyItem['type']) => {
    switch (type) {
      case 'video':
        return <Play className="w-4 h-4 text-red-400" />;
      case 'template':
        return <FileText className="w-4 h-4 text-blue-400" />;
      case 'checklist':
        return <CheckSquare className="w-4 h-4 text-green-400" />;
      case 'faq':
        return <HelpCircle className="w-4 h-4 text-amber-400" />;
      default:
        return <FileText className="w-4 h-4 text-slate-400" />;
    }
  };

  return (
    <div className="bg-[#0A0C10] border border-white/10 rounded-2xl overflow-hidden">
      {/* Header */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="w-full flex items-center justify-between p-5 text-left hover:bg-white/[0.02] transition-colors"
      >
        <div className="flex items-center gap-4">
          <div className="text-3xl">{module.icon}</div>
          <div>
            <h3 className="text-lg font-medium text-white">{module.title}</h3>
            <p className="text-sm text-slate-400">{module.description}</p>
          </div>
        </div>
        <div className={`p-2 rounded-lg transition-colors ${isOpen ? 'bg-white/10' : 'bg-white/5'}`}>
          {isOpen ? (
            <ChevronUp className="w-5 h-5 text-slate-400" />
          ) : (
            <ChevronDown className="w-5 h-5 text-slate-400" />
          )}
        </div>
      </button>

      {/* Content */}
      {isOpen && (
        <div className="px-5 pb-5 space-y-4 border-t border-white/5 pt-4">
          {module.items.map((item) => (
            <div
              key={item.id}
              className="bg-white/[0.02] border border-white/5 rounded-xl p-4"
            >
              {/* Item Header */}
              <div className="flex items-center gap-2 mb-3">
                {getItemIcon(item.type)}
                <h4 className="font-medium text-white">{item.title}</h4>
              </div>

              {/* Video */}
              {item.type === 'video' && item.videoUrl && (
                <div className="mb-3 aspect-video rounded-lg overflow-hidden bg-black/50">
                  <iframe
                    src={item.videoUrl}
                    className="w-full h-full"
                    allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                    allowFullScreen
                  />
                </div>
              )}

              {/* Content */}
              <div className={`text-sm text-slate-300 whitespace-pre-wrap ${
                item.type === 'template' ? 'font-mono bg-black/30 rounded-lg p-3 border border-white/5' : ''
              }`}>
                {item.content}
              </div>

              {/* Copy Button for Templates */}
              {item.copyable && (
                <div className="mt-3 flex justify-end">
                  <button
                    onClick={() => copyToClipboard(item.content, item.id)}
                    className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-all ${
                      copiedId === item.id
                        ? 'bg-green-500/20 text-green-400'
                        : 'bg-blue-500/20 text-blue-400 hover:bg-blue-500/30'
                    }`}
                  >
                    {copiedId === item.id ? (
                      <>
                        <Check className="w-4 h-4" />
                        Copié !
                      </>
                    ) : (
                      <>
                        <Copy className="w-4 h-4" />
                        Copier le template
                      </>
                    )}
                  </button>
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

