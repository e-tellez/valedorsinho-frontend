import { useState } from 'react';
import { PHASES, STEPS, type UcpStep } from '../data/steps';

const PHASE_COLORS: Record<string, { dot: string; text: string; badge: string; bar: string }> = {
  discovery: { dot: 'bg-blue-400', text: 'text-blue-400', badge: 'bg-blue-500/20 text-blue-300 border-blue-500/30', bar: 'bg-blue-400' },
  catalog: { dot: 'bg-emerald-400', text: 'text-emerald-400', badge: 'bg-emerald-500/20 text-emerald-300 border-emerald-500/30', bar: 'bg-emerald-400' },
  negotiation: { dot: 'bg-violet-400', text: 'text-violet-400', badge: 'bg-violet-500/20 text-violet-300 border-violet-500/30', bar: 'bg-violet-400' },
  payment: { dot: 'bg-yellow-400', text: 'text-yellow-400', badge: 'bg-yellow-500/20 text-yellow-300 border-yellow-500/30', bar: 'bg-yellow-400' },
  checkout: { dot: 'bg-orange-400', text: 'text-orange-400', badge: 'bg-orange-500/20 text-orange-300 border-orange-500/30', bar: 'bg-orange-400' },
  order: { dot: 'bg-cyan-400', text: 'text-cyan-400', badge: 'bg-cyan-500/20 text-cyan-300 border-cyan-500/30', bar: 'bg-cyan-400' },
};

type StepSidebarProps = {
  currentStep?: UcpStep;
  onStepSelect: (step: UcpStep) => void;
};

export default function StepSidebar({ currentStep, onStepSelect }: StepSidebarProps) {
  const [collapsed, setCollapsed] = useState<Record<string, boolean>>({});

  function togglePhase(phaseId: string) {
    setCollapsed(prev => ({ ...prev, [phaseId]: !prev[phaseId] }));
  }

  const stepMap: Record<number, UcpStep | undefined> = Object.fromEntries(STEPS.map(s => [s.id, s]));

  return (
    <div className="h-full overflow-auto py-3">
      {PHASES.map(phase => {
        const colors = PHASE_COLORS[phase.id];
        const isCollapsed = collapsed[phase.id];
        const phaseSteps = phase.steps.map(id => stepMap[id]).filter((s): s is UcpStep => !!s);
        const isPhaseActive = currentStep !== undefined && phase.steps.includes(currentStep.id);

        return (
          <div key={phase.id} className="mb-1">
            {/* Phase Header */}
            <button
              onClick={() => togglePhase(phase.id)}
              className={`w-full flex items-center gap-2 px-3 py-2 text-left hover:bg-slate-700/30 transition-colors rounded-lg mx-1 ${isPhaseActive ? 'bg-slate-700/20' : ''}`}
            >
              <div className={`w-1.5 h-1.5 rounded-full flex-shrink-0 ${colors.dot} ${isPhaseActive ? 'shadow-lg' : 'opacity-50'}`} />
              <span className={`text-xs font-semibold flex-1 leading-tight ${isPhaseActive ? colors.text : 'text-slate-400'}`}>
                {phase.label}
              </span>
              <span className={`text-xs transition-transform ${isCollapsed ? '' : 'rotate-180'} text-slate-500`}>▾</span>
            </button>

            {/* Steps */}
            {!isCollapsed && (
              <div className="ml-3 border-l border-slate-700/50 pl-2 mb-1">
                {phaseSteps.map(step => {
                  const isActive = currentStep?.id === step.id;
                  return (
                    <button
                      key={step.id}
                      onClick={() => onStepSelect(step)}
                      className={`w-full flex items-start gap-2.5 px-2 py-2 rounded-lg text-left transition-all group ${
                        isActive
                          ? 'bg-violet-500/15 border border-violet-500/20'
                          : 'hover:bg-slate-700/30 border border-transparent'
                      }`}
                    >
                      <div className={`w-5 h-5 rounded-full flex items-center justify-center text-xs font-bold flex-shrink-0 mt-0.5 border ${
                        isActive
                          ? `${colors.badge} border`
                          : 'bg-slate-700/50 text-slate-400 border-slate-600/50 group-hover:border-slate-500'
                      }`}>
                        {step.id}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className={`text-xs font-medium leading-tight ${isActive ? 'text-white' : 'text-slate-300 group-hover:text-white'}`}>
                          {step.label}
                        </p>
                        <p className="text-xs text-slate-500 mt-0.5 font-mono truncate">
                          {step.action}
                        </p>
                      </div>
                    </button>
                  );
                })}
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}
