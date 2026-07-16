import { useState } from 'react';
import { ACTORS, STEPS, STEP_TRIGGERS, getPhaseForStep, type UcpPhase, type UcpStep, type UcpTriggerInitiator } from '../data/steps';
import PayloadViewer from './PayloadViewer';

const PHASE_COLOR_MAP: Record<string, string> = {
  discovery: 'phase-bg-discovery phase-discovery',
  catalog: 'phase-bg-catalog phase-catalog',
  negotiation: 'phase-bg-negotiation phase-negotiation',
  payment: 'phase-bg-payment phase-payment',
  checkout: 'phase-bg-checkout phase-checkout',
  order: 'phase-bg-order phase-order',
};

const PHASE_BADGE_MAP: Record<string, string> = {
  discovery: 'bg-blue-500/20 text-blue-300 border-blue-500/30',
  catalog: 'bg-emerald-500/20 text-emerald-300 border-emerald-500/30',
  negotiation: 'bg-violet-500/20 text-violet-300 border-violet-500/30',
  payment: 'bg-yellow-500/20 text-yellow-300 border-yellow-500/30',
  checkout: 'bg-orange-500/20 text-orange-300 border-orange-500/30',
  order: 'bg-cyan-500/20 text-cyan-300 border-cyan-500/30',
};

const actorMap = Object.fromEntries(ACTORS.map(a => [a.id, a]));

const TABS = ['Description', 'UCP Payload', 'Spec Reference'] as const;

type Tab = (typeof TABS)[number];

type StepDetailProps = {
  step?: UcpStep;
  onStepSelect: (step: UcpStep) => void;
};

type SpecReferenceProps = {
  step: UcpStep;
  phase: UcpPhase | undefined;
  phaseBadgeClass: string;
};

type TriggerCalloutProps = {
  stepId: number;
  onStepSelect: (step: UcpStep) => void;
};

type SpecItem = {
  label: string;
  value: string | undefined;
  mono?: boolean;
};

export default function StepDetail({ step, onStepSelect }: StepDetailProps) {
  const [activeTab, setActiveTab] = useState<Tab>('Description');

  if (!step) {
    return (
      <div className="flex flex-col items-center justify-center h-full text-slate-500">
        <div className="text-5xl mb-4">→</div>
        <p className="text-sm">Select a step to view details</p>
      </div>
    );
  }

  const phase = getPhaseForStep(step.id);
  const fromActor = actorMap[step.from];
  const toActor = actorMap[step.to];
  const phaseColorClass = phase ? PHASE_COLOR_MAP[phase.id] : '';
  const phaseBadgeClass = phase ? PHASE_BADGE_MAP[phase.id] : '';

  return (
    <div className="flex flex-col h-full">
      {/* Header */}
      <div className="p-4 border-b border-slate-700/50 flex-shrink-0">
        <div className="flex items-start gap-3 mb-3">
          <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold flex-shrink-0 border ${phaseBadgeClass}`}>
            {step.id}
          </div>
          <div className="flex-1 min-w-0">
            <h2 className="text-base font-semibold text-white leading-tight">{step.label}</h2>
            <p className="text-xs text-slate-400 mt-0.5 font-mono">{step.action}</p>
          </div>
        </div>

        {/* From → To */}
        {fromActor && toActor && (
          <div className="flex items-center gap-2 text-xs text-slate-400 mb-3">
            <span className="px-2 py-0.5 rounded bg-slate-700/50 text-slate-300 font-medium">
              {fromActor.label}
            </span>
            <span className="text-slate-600">→</span>
            <span className="px-2 py-0.5 rounded bg-slate-700/50 text-slate-300 font-medium">
              {toActor.label}
            </span>
          </div>
        )}

        {/* Capability badge */}
        {step.capability && (
          <div className="inline-flex items-center gap-1.5">
            <span className="text-xs text-slate-500">Capability:</span>
            <code className={`text-xs px-2 py-0.5 rounded border font-mono ${phaseColorClass}`}>
              {step.capability}
            </code>
          </div>
        )}
      </div>

      {/* Tabs */}
      <div className="flex border-b border-slate-700/50 flex-shrink-0">
        {TABS.map(tab => (
          <button
            key={tab}
            onClick={() => setActiveTab(tab)}
            className={`px-4 py-2.5 text-xs font-medium transition-colors border-b-2 ${
              activeTab === tab
                ? 'text-white border-violet-500 bg-violet-500/5'
                : 'text-slate-400 border-transparent hover:text-slate-300 hover:bg-slate-700/30'
            }`}
          >
            {tab}
          </button>
        ))}
      </div>

      {/* Tab Content */}
      <div className="flex-1 overflow-hidden">
        {activeTab === 'Description' && (
          <div className="p-4 h-full overflow-auto space-y-3">
            <TriggerCallout stepId={step.id} onStepSelect={onStepSelect} />
            <p className="text-sm text-slate-300 leading-relaxed">{step.description}</p>
            <div className={`p-3 rounded-lg border text-xs leading-relaxed ${phaseColorClass}`}>
              <div className="font-semibold mb-1 uppercase tracking-wide text-xs opacity-70">UCP Spec Detail</div>
              <p className="opacity-90">{step.ucpDetail}</p>
            </div>
          </div>
        )}

        {activeTab === 'UCP Payload' && (
          <div className="h-full bg-slate-900/50">
            <PayloadViewer payload={step.payload} />
          </div>
        )}

        {activeTab === 'Spec Reference' && (
          <div className="p-4 h-full overflow-auto">
            <SpecReference step={step} phase={phase} phaseBadgeClass={phaseBadgeClass} />
          </div>
        )}
      </div>
    </div>
  );
}

function SpecReference({ step, phase, phaseBadgeClass }: SpecReferenceProps) {
  const specItems: SpecItem[] = [
    { label: 'Phase', value: phase?.label },
    { label: 'Step', value: `${step.id} of ${STEPS.length}` },
    { label: 'Action', value: step.action },
    { label: 'Source Actor', value: ACTORS.find(a => a.id === step.from)?.label },
    { label: 'Target Actor', value: ACTORS.find(a => a.id === step.to)?.label },
    ...(step.capability ? [{ label: 'UCP Capability', value: step.capability, mono: true }] : []),
  ];

  const capabilityDocs: Record<string, string> = {
    'dev.ucp.shopping.catalog.search': 'Enables agent-initiated product catalog queries with structured filters and UCP context headers.',
    'dev.ucp.shopping.cart': 'Stateful cart management. Returns a cart_id for session binding in subsequent checkout.',
    'dev.ucp.shopping.checkout': 'Core checkout capability. Enables negotiated sessions, payment handler resolution, and order completion.',
    'dev.ucp.shopping.fulfillment': 'Extension of checkout. Adds shipping method selection and fulfillment tracking.',
    'dev.ucp.shopping.discount': 'Extension of checkout. Enables agent-qualified discount codes and promotional pricing.',
    'dev.ucp.shopping.order': 'Post-purchase order management. Returns order ID, status, receipt, and fulfillment info.',
    'dev.ucp.common.identity_linking': 'Links agent identity to a wallet/credential provider for payment credential retrieval.',
  };

  return (
    <div className="space-y-4">
      <div className="space-y-2">
        {specItems.map(item => (
          <div key={item.label} className="flex gap-3 text-sm">
            <span className="text-slate-500 flex-shrink-0 w-32">{item.label}</span>
            {item.mono ? (
              <code className={`text-xs px-1.5 py-0.5 rounded border font-mono ${phaseBadgeClass}`}>
                {item.value}
              </code>
            ) : (
              <span className="text-slate-300">{item.value}</span>
            )}
          </div>
        ))}
      </div>

      {step.capability && capabilityDocs[step.capability] && (
        <div className="p-3 rounded-lg bg-slate-800/50 border border-slate-700/50">
          <div className="text-xs font-semibold text-slate-400 uppercase tracking-wide mb-2">Capability Definition</div>
          <p className="text-sm text-slate-300 leading-relaxed">{capabilityDocs[step.capability]}</p>
        </div>
      )}

      <div className="p-3 rounded-lg bg-slate-800/50 border border-slate-700/50">
        <div className="text-xs font-semibold text-slate-400 uppercase tracking-wide mb-2">UCP Protocol Notes</div>
        <ul className="text-xs text-slate-400 space-y-1.5">
          <li>• Agent identity carried via <code className="text-slate-300 bg-slate-700 px-1 rounded">UCP-Agent</code> header as a profile URI</li>
          <li>• Merchant resolves profile independently — no self-reported trust</li>
          <li>• Capability intersection uses highest mutual version</li>
          <li>• Extensions pruned if parent capability absent from either party</li>
          <li>• PSP tokenization keeps raw card data off merchant servers</li>
        </ul>
      </div>
    </div>
  );
}

const INITIATOR_LABEL: Record<UcpTriggerInitiator, { label: string; icon: string; cls: string }> = {
  user:     { label: 'User Instruction',   icon: '👤', cls: 'text-slate-400  bg-slate-700/50  border-slate-600/50' },
  agent:    { label: 'AI Buyer Agent',     icon: '🤖', cls: 'text-violet-300 bg-violet-500/10 border-violet-500/30' },
  merchant: { label: 'Merchant Server',    icon: '🏪', cls: 'text-blue-300   bg-blue-500/10   border-blue-500/30' },
  psp:      { label: 'PSP Orchestration',  icon: '🔄', cls: 'text-yellow-300 bg-yellow-500/10 border-yellow-500/30' },
  network:  { label: 'Card Network',       icon: '💳', cls: 'text-emerald-300 bg-emerald-500/10 border-emerald-500/30' },
};

function TriggerCallout({ stepId, onStepSelect }: TriggerCalloutProps) {
  const trigger = STEP_TRIGGERS[stepId];
  if (!trigger) return null;

  const init = INITIATOR_LABEL[trigger.initiator] || INITIATOR_LABEL.agent;
  const prevStep = trigger.causedBy ? STEPS.find(s => s.id === trigger.causedBy) : null;

  return (
    <div className="rounded-lg border border-slate-600/50 bg-slate-800/60 overflow-hidden">
      {/* Header row */}
      <div className="flex items-center gap-2 px-3 py-2 border-b border-slate-700/50 bg-slate-800/40">
        <span className="text-xs font-bold text-slate-400 uppercase tracking-widest">⚡ Triggered By</span>
      </div>

      <div className="p-3 space-y-2.5">
        {/* Initiator + previous step link */}
        <div className="flex items-center gap-2 flex-wrap">
          <span className={`inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full text-xs font-semibold border ${init.cls}`}>
            <span>{init.icon}</span>
            <span>{init.label}</span>
          </span>
          {prevStep && (
            <>
              <span className="text-slate-600 text-xs">←</span>
              <button
                onClick={() => onStepSelect?.(prevStep)}
                className="inline-flex items-center gap-1 text-xs text-slate-400 hover:text-white transition-colors group"
              >
                <span className="w-4 h-4 rounded-full bg-slate-700 flex items-center justify-center text-xs font-bold group-hover:bg-slate-600">
                  {prevStep.id}
                </span>
                <span className="underline underline-offset-2 decoration-slate-600 group-hover:decoration-slate-400">
                  {prevStep.label}
                </span>
              </button>
            </>
          )}
        </div>

        {/* Event */}
        <p className="text-xs text-slate-300 leading-relaxed">{trigger.event}</p>

        {/* Condition */}
        <p className="text-xs text-slate-500 leading-relaxed italic">{trigger.condition}</p>

        {/* Field */}
        {trigger.field && (
          <code className="block text-xs font-mono text-amber-300/80 bg-slate-900/60 px-2.5 py-1.5 rounded border border-slate-700/50 leading-relaxed break-all">
            {trigger.field}
          </code>
        )}
      </div>
    </div>
  );
}
