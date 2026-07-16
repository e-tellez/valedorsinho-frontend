import { STEPS, type UcpStep } from '../data/steps';
import {
  DiscoveringScreen, SearchScreen, CartScreen,
  CheckoutScreen, PaymentScreen, ProcessingScreen, ConfirmedScreen,
} from './StoreScreens';

const STEP_SCREEN: Record<number, string> = {
  1: 'discovering', 2: 'connected',
  3: 'searching',   4: 'results',   5: 'cart',
  6: 'checkout',    7: 'checkout',  8: 'checkout',  9: 'deal',
  10: 'wallet',     11: 'tokenizing',
  12: 'processing', 13: 'processing', 14: 'authorized',
  15: 'confirmed',
};

const STEP_URLS: Record<string, string> = {
  discovering: 'shop.acme.com',
  connected:   'shop.acme.com',
  searching:   'shop.acme.com/search?q=noise-cancelling+headphones',
  results:     'shop.acme.com/search?q=noise-cancelling+headphones',
  cart:        'shop.acme.com/cart',
  checkout:    'shop.acme.com/checkout',
  deal:        'shop.acme.com/checkout',
  wallet:      'shop.acme.com/checkout/payment',
  tokenizing:  'shop.acme.com/checkout/payment',
  processing:  'shop.acme.com/checkout/processing',
  authorized:  'shop.acme.com/checkout/processing',
  confirmed:   'shop.acme.com/orders/ORD-892XKL/confirmation',
};

const AGENT_STEPS = [
  { id: 1,  phase: 'Discovery',   emoji: '🔍', msg: 'Connecting to Acme Shop…',               sub: 'Fetching store profile via UCP protocol' },
  { id: 2,  phase: 'Discovery',   emoji: '🏪', msg: 'Store connected! 6 capabilities found.',  sub: 'Cart · Catalog · Checkout · Orders · Fulfillment · Discounts' },
  { id: 3,  phase: 'Catalog',     emoji: '🔎', msg: 'Searching headphones under $350…',        sub: 'Using catalog.search capability' },
  { id: 4,  phase: 'Catalog',     emoji: '📦', msg: 'Found 2 great options!',                  sub: 'Sony WH-1000XM5 · 4.8★ · $279.99 — best match' },
  { id: 5,  phase: 'Catalog',     emoji: '🛒', msg: 'Added to cart!',                          sub: '1 item · Sony WH-1000XM5 · $279.99' },
  { id: 6,  phase: 'Negotiation', emoji: '🤝', msg: 'Starting checkout session…',             sub: 'Advertising agent capabilities to merchant' },
  { id: 7,  phase: 'Negotiation', emoji: '🔐', msg: 'Store is verifying my identity…',        sub: 'Merchant resolving agent signing keys' },
  { id: 8,  phase: 'Negotiation', emoji: '⚙️',  msg: 'Finding the best deal for you…',         sub: 'Running capability intersection algorithm' },
  { id: 9,  phase: 'Negotiation', emoji: '🏷️',  msg: '10% agent discount unlocked!',           sub: '$279.99 → $272.16 · You saved $27.99' },
  { id: 10, phase: 'Payment',     emoji: '👛', msg: 'Opening your digital wallet…',            sub: 'Requesting payment authorization' },
  { id: 11, phase: 'Payment',     emoji: '🔒', msg: 'Card secured — never shared with store.', sub: 'PSP tokenized your Visa ····4242' },
  { id: 12, phase: 'Checkout',    emoji: '📤', msg: 'Submitting order securely…',              sub: 'Encrypted payment token + trust signals sent' },
  { id: 13, phase: 'Checkout',    emoji: '💳', msg: 'Processing payment via Stripe…',         sub: 'Routing authorization to Visa network' },
  { id: 14, phase: 'Checkout',    emoji: '✅', msg: 'Payment authorized by Visa!',             sub: 'Auth code: AUTH_892XKL · $272.16 captured' },
  { id: 15, phase: 'Complete',    emoji: '🎁', msg: "Order confirmed! You're all set.",        sub: 'Delivery by Jan 18 · UPS tracking ready' },
];

const PHASE_STYLE: Record<string, { text: string; border: string; bg: string }> = {
  Discovery:   { text: 'text-blue-400',    border: 'border-blue-500/20',    bg: 'bg-blue-500/10' },
  Catalog:     { text: 'text-emerald-400', border: 'border-emerald-500/20', bg: 'bg-emerald-500/10' },
  Negotiation: { text: 'text-violet-400',  border: 'border-violet-500/20',  bg: 'bg-violet-500/10' },
  Payment:     { text: 'text-yellow-400',  border: 'border-yellow-500/20',  bg: 'bg-yellow-500/10' },
  Checkout:    { text: 'text-orange-400',  border: 'border-orange-500/20',  bg: 'bg-orange-500/10' },
  Complete:    { text: 'text-cyan-400',    border: 'border-cyan-500/20',    bg: 'bg-cyan-500/10' },
};

type StoreContentProps = {
  screen: string;
  stepId: number;
};

type ShopperViewProps = {
  currentStep?: UcpStep;
  onStepSelect: (step: UcpStep) => void;
};

function StoreContent({ screen, stepId }: StoreContentProps) {
  switch (screen) {
    case 'discovering':
    case 'connected':    return <DiscoveringScreen stepId={stepId} />;
    case 'searching':
    case 'results':      return <SearchScreen stepId={stepId} />;
    case 'cart':         return <CartScreen />;
    case 'checkout':     return <CheckoutScreen hasDeal={false} />;
    case 'deal':         return <CheckoutScreen hasDeal={true} />;
    case 'wallet':       return <PaymentScreen tokenized={false} />;
    case 'tokenizing':   return <PaymentScreen tokenized={true} />;
    case 'processing':   return <ProcessingScreen authorized={false} />;
    case 'authorized':   return <ProcessingScreen authorized={true} />;
    case 'confirmed':    return <ConfirmedScreen />;
    default:             return <DiscoveringScreen stepId={stepId} />;
  }
}

export default function ShopperView({ currentStep, onStepSelect }: ShopperViewProps) {
  const currentId = currentStep?.id || 1;
  const agentStep = AGENT_STEPS.find(s => s.id === currentId) || AGENT_STEPS[0];
  const screen    = STEP_SCREEN[currentId] || 'discovering';
  const url       = STEP_URLS[screen] || 'shop.acme.com';
  const style     = PHASE_STYLE[agentStep.phase];

  const cartVisible = ['cart','checkout','deal','wallet','tokenizing','processing','authorized','confirmed'].includes(screen);

  function jump(id: number) {
    const full = STEPS.find(s => s.id === id);
    if (full) onStepSelect(full);
  }

  return (
    <div className="flex h-full">

      {/* ── LEFT: Agent Panel ── */}
      <div className="w-72 flex-shrink-0 border-r border-slate-700/50 flex flex-col bg-slate-900/60">

        {/* Avatar */}
        <div className="p-4 border-b border-slate-700/50 flex-shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-gradient-to-br from-violet-600 to-violet-900 border border-violet-500/40 flex items-center justify-center text-xl shadow-lg">
              🤖
            </div>
            <div>
              <div className="text-sm font-semibold text-white">ShopBot Agent</div>
              <div className="flex items-center gap-1.5">
                <div className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                <span className="text-xs text-emerald-400 font-medium">Active</span>
              </div>
            </div>
          </div>
        </div>

        {/* Current action */}
        <div className="p-3 border-b border-slate-700/30 flex-shrink-0">
          <div className={`p-3 rounded-xl border ${style.bg} ${style.border}`}>
            <div className="text-2xl mb-1.5 leading-none">{agentStep.emoji}</div>
            <div className="text-sm font-semibold text-white leading-snug mb-1">{agentStep.msg}</div>
            <div className="text-xs text-slate-400 leading-relaxed">{agentStep.sub}</div>
            <div className={`text-xs font-semibold mt-2 ${style.text}`}>{agentStep.phase}</div>
          </div>
        </div>

        {/* Activity log */}
        <div className="flex-1 overflow-auto p-3">
          <div className="text-xs text-slate-500 font-semibold uppercase tracking-wide px-1 mb-2">Activity</div>
          <div className="space-y-0.5">
            {AGENT_STEPS.filter(s => s.id <= currentId).map(step => {
              const done    = step.id < currentId;
              const current = step.id === currentId;
              const s = PHASE_STYLE[step.phase];
              return (
                <button
                  key={step.id}
                  onClick={() => jump(step.id)}
                  className={`w-full flex items-center gap-2.5 px-2 py-1.5 rounded-lg text-left transition-all ${
                    current ? `border ${s.bg} ${s.border}` : 'hover:bg-slate-700/30 border border-transparent'
                  }`}
                >
                  <div className={`w-5 h-5 rounded-full flex items-center justify-center text-xs flex-shrink-0 font-bold ${
                    done    ? 'bg-emerald-500/20 text-emerald-400'
                    : current ? `${s.bg} ${s.text}`
                    : 'bg-slate-700 text-slate-500'
                  }`}>
                    {done ? '✓' : step.id}
                  </div>
                  <span className={`text-xs truncate ${current ? 'text-white font-medium' : 'text-slate-400'}`}>
                    {step.msg}
                  </span>
                </button>
              );
            })}
          </div>
        </div>
      </div>

      {/* ── RIGHT: Storefront ── */}
      <div className="flex-1 flex flex-col p-4 overflow-hidden">

        {/* Browser chrome */}
        <div className="flex-1 flex flex-col rounded-2xl overflow-hidden shadow-2xl border border-slate-700/40">

          {/* Browser top bar */}
          <div className="flex items-center gap-3 px-4 py-2.5 bg-slate-800 border-b border-slate-700/50 flex-shrink-0">
            <div className="flex gap-1.5">
              <div className="w-3 h-3 rounded-full bg-red-400/60" />
              <div className="w-3 h-3 rounded-full bg-yellow-400/60" />
              <div className="w-3 h-3 rounded-full bg-emerald-400/60" />
            </div>
            <div className="flex gap-0.5 text-slate-500 text-sm">
              <button className="px-1">‹</button>
              <button className="px-1">›</button>
            </div>
            <div className="flex-1 flex items-center gap-2 px-3 py-1 rounded-lg bg-slate-700/50 border border-slate-600/50">
              <span className="text-emerald-400 text-xs">🔒</span>
              <span className="text-xs text-slate-300 font-mono truncate">{url}</span>
            </div>
          </div>

          {/* Store */}
          <div className="flex-1 bg-slate-50 overflow-auto flex flex-col">

            {/* Store nav */}
            <nav className="flex items-center justify-between px-6 py-3 bg-white border-b border-slate-200 shadow-sm flex-shrink-0">
              <div className="flex items-center gap-2">
                <span className="text-xl">🛍️</span>
                <span className="font-bold text-slate-800">Acme Shop</span>
              </div>
              <div className="flex items-center gap-4">
                <span className="hidden sm:block text-xs text-slate-400">Electronics · Audio · Deals</span>
                <div className="flex items-center gap-1 px-2.5 py-1 rounded-full bg-indigo-50 border border-indigo-200">
                  <span className="text-sm">🛒</span>
                  <span className="text-xs font-semibold text-indigo-700">{cartVisible ? '1' : '0'}</span>
                </div>
              </div>
            </nav>

            {/* Screen content */}
            <div className="flex-1 p-5 overflow-auto">
              <StoreContent screen={screen} stepId={currentId} />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
