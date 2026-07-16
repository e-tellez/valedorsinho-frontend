import { useMemo } from 'react';
import { ACTORS, STEPS, type UcpStep } from '../data/steps';

const PHASE_ARROW_COLORS: Record<string, string> = {
  discovery: '#60a5fa',
  catalog: '#34d399',
  negotiation: '#a78bfa',
  payment: '#fbbf24',
  checkout: '#f97316',
  order: '#22d3ee',
};

const PHASE_GLOW_COLORS: Record<string, string> = {
  discovery: 'rgba(96,165,250,0.3)',
  catalog: 'rgba(52,211,153,0.3)',
  negotiation: 'rgba(167,139,250,0.3)',
  payment: 'rgba(251,191,36,0.3)',
  checkout: 'rgba(249,115,22,0.3)',
  order: 'rgba(34,211,238,0.3)',
};

type FlowDiagramProps = {
  currentStep?: UcpStep;
  onStepSelect: (step: UcpStep) => void;
};

type ArrowProps = {
  fromX: number;
  toX: number;
  y: number;
  color: string;
  isActive: boolean;
};

type SelfArrowProps = {
  x: number;
  y: number;
  color: string;
  isActive: boolean;
};

type StepBadgeProps = {
  x: number;
  y: number;
  stepId: number;
  color: string;
  isActive: boolean;
};

const LANE_WIDTH = 160;
const LANE_GAP = 20;
const HEADER_H = 72;
const ROW_H = 42;
const SVG_PADDING_TOP = 12;
const SVG_PADDING_BOTTOM = 20;

export default function FlowDiagram({ currentStep, onStepSelect }: FlowDiagramProps) {
  const totalW = ACTORS.length * LANE_WIDTH + (ACTORS.length - 1) * LANE_GAP;
  const totalH = HEADER_H + STEPS.length * ROW_H + SVG_PADDING_TOP + SVG_PADDING_BOTTOM;

  const laneX = useMemo(() =>
    ACTORS.map((_, i) => i * (LANE_WIDTH + LANE_GAP) + LANE_WIDTH / 2),
    []
  );

  function getStepY(stepId: number) {
    return HEADER_H + SVG_PADDING_TOP + (stepId - 1) * ROW_H + ROW_H / 2;
  }

  return (
    <div className="w-full h-full overflow-auto">
      <svg
        width={totalW}
        height={totalH}
        viewBox={`0 0 ${totalW} ${totalH}`}
        className="min-w-full"
        style={{ minHeight: totalH }}
      >
        {/* Background lane stripes */}
        {ACTORS.map((actor, i) => {
          const x = i * (LANE_WIDTH + LANE_GAP);
          return (
            <rect
              key={actor.id}
              x={x}
              y={0}
              width={LANE_WIDTH}
              height={totalH}
              fill={
                currentStep && (currentStep.from === actor.id || currentStep.to === actor.id)
                  ? 'rgba(139,92,246,0.06)'
                  : 'rgba(30,41,59,0.25)'
              }
              rx={8}
            />
          );
        })}

        {/* Lane headers */}
        {ACTORS.map((actor, i) => {
          const x = laneX[i];
          const isActive = currentStep && (currentStep.from === actor.id || currentStep.to === actor.id);
          return (
            <g key={actor.id}>
              <rect
                x={i * (LANE_WIDTH + LANE_GAP)}
                y={0}
                width={LANE_WIDTH}
                height={HEADER_H - 4}
                rx={8}
                fill={isActive ? 'rgba(139,92,246,0.15)' : 'rgba(30,41,59,0.6)'}
                stroke={isActive ? 'rgba(139,92,246,0.4)' : 'rgba(148,163,184,0.08)'}
                strokeWidth={1}
              />
              <text
                x={x}
                y={HEADER_H / 2 - 8}
                textAnchor="middle"
                fill={isActive ? '#c4b5fd' : '#94a3b8'}
                fontSize={11}
                fontWeight={isActive ? '600' : '500'}
                fontFamily="system-ui, sans-serif"
              >
                {actor.label}
              </text>
              <text
                x={x}
                y={HEADER_H / 2 + 10}
                textAnchor="middle"
                fill={isActive ? '#a78bfa' : '#64748b'}
                fontSize={10}
                fontFamily="system-ui, sans-serif"
              >
                {actor.sublabel}
              </text>
            </g>
          );
        })}

        {/* Vertical lane center lines */}
        {ACTORS.map((_, i) => (
          <line
            key={`vline-${i}`}
            x1={laneX[i]}
            y1={HEADER_H}
            x2={laneX[i]}
            y2={totalH - SVG_PADDING_BOTTOM}
            stroke="rgba(148,163,184,0.08)"
            strokeWidth={1}
            strokeDasharray="4,6"
          />
        ))}

        {/* Steps */}
        {STEPS.map(step => {
          const isActive = currentStep?.id === step.id;
          const y = getStepY(step.id);
          const phase = step.phase || 'discovery';
          const color = PHASE_ARROW_COLORS[phase];
          const glowColor = PHASE_GLOW_COLORS[phase];

          const fromIdx = ACTORS.findIndex(a => a.id === step.from);
          const toIdx = ACTORS.findIndex(a => a.id === step.to);
          if (fromIdx === -1 || toIdx === -1) return null;
          const fromX = laneX[fromIdx];
          const toX = laneX[toIdx];
          const isSelf = step.from === step.to;

          return (
            <g key={step.id} onClick={() => onStepSelect(step)} style={{ cursor: 'pointer' }}>
              {/* Step row background (hover/active) */}
              <rect
                x={0}
                y={y - ROW_H / 2 + 2}
                width={totalW}
                height={ROW_H - 4}
                rx={4}
                fill={isActive ? `${glowColor}` : 'transparent'}
                opacity={isActive ? 0.8 : 0}
              />

              {/* Arrow line */}
              {isSelf ? (
                <SelfArrow x={fromX} y={y} color={color} isActive={isActive} />
              ) : (
                <Arrow
                  fromX={fromX}
                  toX={toX}
                  y={y}
                  color={color}
                  isActive={isActive}
                />
              )}

              {/* Step number badge */}
              <StepBadge
                x={isSelf ? fromX + 30 : (fromX + toX) / 2}
                y={y}
                stepId={step.id}
                color={color}
                isActive={isActive}
              />

              {/* Label */}
              <text
                x={isSelf ? fromX + 50 : (fromX + toX) / 2}
                y={y + 4}
                textAnchor={isSelf ? 'start' : 'middle'}
                fill={isActive ? '#ffffff' : '#94a3b8'}
                fontSize={9.5}
                fontFamily="system-ui, sans-serif"
                fontWeight={isActive ? '600' : '400'}
              >
                {truncate(step.label, isSelf ? 20 : 22)}
              </text>
            </g>
          );
        })}
      </svg>
    </div>
  );
}

function Arrow({ fromX, toX, y, color, isActive }: ArrowProps) {
  const direction = toX > fromX ? 1 : -1;
  const gap = 14;
  const x1 = fromX + direction * gap;
  const x2 = toX - direction * gap;
  const midX = (x1 + x2) / 2;
  const arrowSize = 6;

  const arrowPoints = toX > fromX
    ? `${x2 - arrowSize},${y - arrowSize / 2} ${x2},${y} ${x2 - arrowSize},${y + arrowSize / 2}`
    : `${x2 + arrowSize},${y - arrowSize / 2} ${x2},${y} ${x2 + arrowSize},${y + arrowSize / 2}`;

  return (
    <g>
      {isActive && (
        <line
          x1={x1}
          y1={y}
          x2={x2}
          y2={y}
          stroke={color}
          strokeWidth={6}
          opacity={0.15}
          strokeLinecap="round"
        />
      )}
      <line
        x1={x1}
        y1={y}
        x2={x2}
        y2={y}
        stroke={isActive ? color : 'rgba(148,163,184,0.2)'}
        strokeWidth={isActive ? 2 : 1}
        strokeLinecap="round"
        className={isActive ? 'arrow-animated' : ''}
      />
      <polygon
        points={arrowPoints}
        fill={isActive ? color : 'rgba(148,163,184,0.25)'}
      />

      {/* Source dot */}
      <circle cx={x1} cy={y} r={3} fill={isActive ? color : 'rgba(148,163,184,0.25)'} />
    </g>
  );
}

function SelfArrow({ x, y, color, isActive }: SelfArrowProps) {
  const w = 36;
  const h = 16;
  return (
    <g>
      <path
        d={`M ${x} ${y - 4} C ${x + w} ${y - h} ${x + w} ${y + h} ${x} ${y + 4}`}
        fill="none"
        stroke={isActive ? color : 'rgba(148,163,184,0.2)'}
        strokeWidth={isActive ? 2 : 1}
      />
      <polygon
        points={`${x - 4},${y} ${x + 4},${y - 4} ${x + 4},${y + 4}`}
        fill={isActive ? color : 'rgba(148,163,184,0.25)'}
      />
    </g>
  );
}

function StepBadge({ x, y, stepId, color, isActive }: StepBadgeProps) {
  const r = 9;
  return (
    <g>
      {isActive && <circle cx={x} cy={y - 14} r={r + 3} fill={color} opacity={0.2} />}
      <circle cx={x} cy={y - 14} r={r} fill={isActive ? color : 'rgba(30,41,59,0.9)'} stroke={isActive ? 'transparent' : 'rgba(148,163,184,0.2)'} strokeWidth={1} />
      <text
        x={x}
        y={y - 10}
        textAnchor="middle"
        fill={isActive ? '#000' : '#94a3b8'}
        fontSize={8}
        fontWeight="700"
        fontFamily="system-ui, sans-serif"
      >
        {stepId}
      </text>
    </g>
  );
}

function truncate(str: string, max: number) {
  return str.length > max ? str.slice(0, max) + '…' : str;
}
