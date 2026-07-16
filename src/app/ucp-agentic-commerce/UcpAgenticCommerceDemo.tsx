"use client";

import { useCallback, useEffect, useState } from 'react';
import { STEPS, PHASES, getPhaseForStep, type UcpStep } from './data/steps';
import StepSidebar from './components/StepSidebar';
import FlowDiagram from './components/FlowDiagram';
import StepDetail from './components/StepDetail';
import ShopperView from './components/ShopperView';

const PHASE_COLORS: Record<string, string> = {
  discovery: 'bg-blue-400',
  catalog: 'bg-emerald-400',
  negotiation: 'bg-violet-400',
  payment: 'bg-yellow-400',
  checkout: 'bg-orange-400',
  order: 'bg-cyan-400',
};

type ViewMode = 'shopper' | 'technical';

const AUTO_PLAY_INTERVAL = 2800;

export default function UcpAgenticCommerceDemo() {
  const [currentStep, setCurrentStep] = useState<UcpStep>(STEPS[0]);
  const [isPlaying, setIsPlaying] = useState(false);
  const [animKey, setAnimKey] = useState(0);
  const [viewMode, setViewMode] = useState<ViewMode>('shopper');

  const currentPhase = getPhaseForStep(currentStep?.id);

  const goToStep = useCallback((step: UcpStep) => {
    setCurrentStep(step);
    setAnimKey(k => k + 1);
  }, []);

  const goNext = useCallback(() => {
    const idx = STEPS.findIndex(s => s.id === currentStep?.id);
    if (idx < STEPS.length - 1) {
      goToStep(STEPS[idx + 1]);
    } else {
      setIsPlaying(false);
    }
  }, [currentStep, goToStep]);

  const goPrev = useCallback(() => {
    const idx = STEPS.findIndex(s => s.id === currentStep?.id);
    if (idx > 0) goToStep(STEPS[idx - 1]);
  }, [currentStep, goToStep]);

  const handleReset = () => {
    setIsPlaying(false);
    goToStep(STEPS[0]);
  };

  useEffect(() => {
    if (!isPlaying) return;
    const timer = setInterval(goNext, AUTO_PLAY_INTERVAL);
    return () => clearInterval(timer);
  }, [isPlaying, goNext]);

  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      if (e.key === 'ArrowRight' || e.key === 'ArrowDown') { e.preventDefault(); goNext(); }
      if (e.key === 'ArrowLeft' || e.key === 'ArrowUp') { e.preventDefault(); goPrev(); }
      if (e.key === ' ') { e.preventDefault(); setIsPlaying(p => !p); }
    }
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [goNext, goPrev]);

  const progress = ((currentStep?.id - 1) / (STEPS.length - 1)) * 100;

  return (
    <div className="fixed inset-0 z-0 flex flex-col h-screen bg-slate-950 overflow-hidden">
      {/* Top bar */}
      <header className="flex-shrink-0 border-b border-slate-700/50 bg-slate-900/80 backdrop-blur-sm">
        <div className="flex items-center gap-4 px-4 py-3">
          <div className="flex items-center gap-2.5">
            <div className="w-6 h-6 rounded bg-violet-600 flex items-center justify-center text-xs font-bold text-white">U</div>
            <h1 className="text-sm font-semibold text-white">UCP Agentic Commerce Flow</h1>
            <span className="text-xs text-slate-500 hidden sm:inline">Universal Commerce Protocol · End-to-End Transaction Lifecycle</span>
          </div>

          <div className="flex-1" />

          {/* View toggle */}
          <div className="flex items-center rounded-lg bg-slate-800 border border-slate-700/50 p-0.5">
            <button
              onClick={() => setViewMode('shopper')}
              className={`px-3 py-1 rounded text-xs font-medium transition-colors ${
                viewMode === 'shopper' ? 'bg-violet-600 text-white shadow' : 'text-slate-400 hover:text-slate-300'
              }`}
            >
              Shopper
            </button>
            <button
              onClick={() => setViewMode('technical')}
              className={`px-3 py-1 rounded text-xs font-medium transition-colors ${
                viewMode === 'technical' ? 'bg-slate-600 text-white shadow' : 'text-slate-400 hover:text-slate-300'
              }`}
            >
              Technical
            </button>
          </div>

          {currentPhase && (
            <div className="hidden md:flex items-center gap-2 text-xs">
              <div className={`w-2 h-2 rounded-full ${PHASE_COLORS[currentPhase.id]}`} />
              <span className="text-slate-300 font-medium">{currentPhase.label}</span>
            </div>
          )}

          <div className="flex items-center gap-1.5">
            <button
              onClick={goPrev}
              disabled={currentStep?.id === 1}
              className="p-1.5 rounded text-slate-400 hover:text-white hover:bg-slate-700 disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
              title="Previous (←)"
            >
              <ChevronLeft />
            </button>
            <button
              onClick={() => setIsPlaying(p => !p)}
              className={`px-3 py-1.5 rounded text-xs font-medium transition-colors ${
                isPlaying
                  ? 'bg-violet-600 hover:bg-violet-500 text-white'
                  : 'bg-slate-700 hover:bg-slate-600 text-slate-200'
              }`}
            >
              {isPlaying ? 'Pause' : 'Play'}
            </button>
            <button
              onClick={goNext}
              disabled={currentStep?.id === STEPS.length}
              className="p-1.5 rounded text-slate-400 hover:text-white hover:bg-slate-700 disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
              title="Next (→)"
            >
              <ChevronRight />
            </button>
            <button
              onClick={handleReset}
              className="p-1.5 rounded text-slate-400 hover:text-white hover:bg-slate-700 transition-colors ml-1"
              title="Reset"
            >
              <ResetIcon />
            </button>
          </div>

          <div className="text-xs text-slate-500 tabular-nums">
            <span className="text-slate-300 font-medium">{currentStep?.id}</span>
            <span> / {STEPS.length}</span>
          </div>
        </div>

        <div className="h-0.5 bg-slate-800">
          <div
            className="h-full bg-gradient-to-r from-violet-500 to-violet-400 transition-all duration-500"
            style={{ width: `${progress}%` }}
          />
        </div>
      </header>

      {/* Phase pills */}
      <div className="flex-shrink-0 flex items-center gap-2 px-4 py-2 border-b border-slate-700/30 bg-slate-900/40 overflow-x-auto">
        {PHASES.map(phase => {
          const isActive = currentPhase?.id === phase.id;
          const color = PHASE_COLORS[phase.id];
          return (
            <button
              key={phase.id}
              onClick={() => {
                const firstStep = STEPS.find(s => s.phase === phase.id);
                if (firstStep) goToStep(firstStep);
              }}
              className={`flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium whitespace-nowrap transition-all ${
                isActive
                  ? 'bg-slate-700 text-white'
                  : 'text-slate-500 hover:text-slate-300 hover:bg-slate-800'
              }`}
            >
              <div className={`w-1.5 h-1.5 rounded-full ${color} ${!isActive && 'opacity-50'}`} />
              {phase.label.replace(/Phase \d+ — /, '')}
            </button>
          );
        })}
        <div className="flex-1" />
        <span className="text-xs text-slate-600 hidden sm:block">← → to navigate · Space to play</span>
      </div>

      {/* Main content */}
      <div className="flex flex-1 overflow-hidden">
        {viewMode === 'shopper' ? (
          <ShopperView currentStep={currentStep} onStepSelect={goToStep} />
        ) : (
          <>
            <aside className="w-56 flex-shrink-0 border-r border-slate-700/50 bg-slate-900/30 overflow-hidden">
              <StepSidebar currentStep={currentStep} onStepSelect={goToStep} />
            </aside>

            <main className="flex-1 overflow-hidden bg-slate-950/50 relative">
              <div className="absolute inset-0 overflow-auto p-4">
                <FlowDiagram key={animKey} currentStep={currentStep} onStepSelect={goToStep} />
              </div>
            </main>

            <aside className="w-80 flex-shrink-0 border-l border-slate-700/50 bg-slate-900/30 overflow-hidden flex flex-col">
              <StepDetail step={currentStep} onStepSelect={goToStep} />
            </aside>
          </>
        )}
      </div>
    </div>
  );
}

function ChevronLeft() {
  return (
    <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
      <path d="M10 12L6 8l4-4" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

function ChevronRight() {
  return (
    <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
      <path d="M6 4l4 4-4 4" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

function ResetIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
      <path d="M2.5 8a5.5 5.5 0 1 0 1-3.18" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
      <path d="M2.5 4.5V8h3.5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}
