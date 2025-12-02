import { createClient } from '@/lib/supabase/server';
import { redirect } from 'next/navigation';
import { GraduationCap, Sparkles } from 'lucide-react';
import ModuleCard from '@/components/academy/module-card';
import { creatorModules, saasModules } from '@/lib/academy-content';

export default async function AcademyPage() {
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
  const modules = isCreator ? creatorModules : saasModules;

  return (
    <div className="max-w-4xl">
      {/* Hero Section */}
      <div className="relative mb-8 p-8 rounded-2xl bg-gradient-to-br from-purple-500/20 via-blue-500/10 to-transparent border border-purple-500/20 overflow-hidden">
        {/* Background decoration */}
        <div className="absolute top-0 right-0 w-64 h-64 bg-purple-500/10 rounded-full blur-3xl -translate-y-1/2 translate-x-1/2" />
        <div className="absolute bottom-0 left-0 w-48 h-48 bg-blue-500/10 rounded-full blur-3xl translate-y-1/2 -translate-x-1/2" />
        
        <div className="relative">
          <div className="flex items-center gap-3 mb-4">
            <div className="p-3 bg-purple-500/20 rounded-xl">
              <GraduationCap className="w-8 h-8 text-purple-400" />
            </div>
            <div>
              <h1 className="text-2xl font-semibold text-white">Academy</h1>
              <p className="text-purple-300/80 text-sm">Maîtrise le Personal Branding B2B</p>
            </div>
          </div>
          
          <p className="text-slate-300 max-w-xl">
            {isCreator 
              ? 'Des guides, des templates et des checklists pour créer du contenu qui convertit et maximiser tes revenus d\'ambassadeur.'
              : 'Apprends à recruter les meilleurs ambassadeurs, mesurer ton ROI et optimiser tes collaborations.'
            }
          </p>

          <div className="flex items-center gap-2 mt-4 text-sm text-purple-300">
            <Sparkles className="w-4 h-4" />
            <span>{modules.length} modules disponibles</span>
          </div>
        </div>
      </div>

      {/* Modules */}
      <div className="space-y-4">
        {modules.map((module) => (
          <ModuleCard key={module.id} module={module} />
        ))}
      </div>

      {/* Footer tip */}
      <div className="mt-8 p-4 bg-white/[0.02] border border-white/5 rounded-xl text-center">
        <p className="text-sm text-slate-400">
          💡 Conseil : Reviens régulièrement, on ajoute du nouveau contenu chaque semaine !
        </p>
      </div>
    </div>
  );
}

