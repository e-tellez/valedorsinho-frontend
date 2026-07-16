function Dots() {
  return (
    <div className="flex gap-1">
      {[0,1,2].map(i => (
        <div key={i} className="w-1.5 h-1.5 rounded-full bg-current animate-bounce" style={{ animationDelay: `${i*150}ms` }} />
      ))}
    </div>
  );
}

type ProductCardProps = {
  name: string;
  stars: number;
  reviews: number;
  price: number;
  badge?: string;
  selected?: boolean;
};

type DiscoveringScreenProps = {
  stepId: number;
};

type SearchScreenProps = {
  stepId: number;
};

type CheckoutScreenProps = {
  hasDeal: boolean;
};

type PaymentScreenProps = {
  tokenized: boolean;
};

type ProcessingScreenProps = {
  authorized: boolean;
};

function ProductCard({ name, stars, reviews, price, badge, selected }: ProductCardProps) {
  return (
    <div className={`rounded-xl border-2 p-4 bg-white ${selected ? 'border-indigo-500 shadow-lg shadow-indigo-100' : 'border-slate-200'}`}>
      {badge && <span className="inline-block mb-2 px-2 py-0.5 rounded-full text-xs font-semibold bg-indigo-600 text-white">{badge}</span>}
      <div className={`w-full h-20 rounded-lg flex items-center justify-center text-4xl mb-3 ${selected ? 'bg-indigo-50' : 'bg-slate-50'}`}>🎧</div>
      <div className="text-sm font-semibold text-slate-800 mb-1 leading-tight">{name}</div>
      <div className="text-xs text-slate-500 mb-2">{'★'.repeat(Math.floor(stars))} {stars} ({reviews.toLocaleString()})</div>
      <div className="flex items-center justify-between">
        <div className="text-base font-bold text-slate-800">${price.toFixed(2)}</div>
        {selected && <span className="text-xs text-indigo-600 font-medium">✓ Selected</span>}
      </div>
    </div>
  );
}

export function DiscoveringScreen({ stepId }: DiscoveringScreenProps) {
  const connected = stepId === 2;
  return (
    <div className="flex flex-col items-center justify-center py-10">
      <div className="text-6xl mb-3">🛍️</div>
      <h1 className="text-2xl font-bold text-slate-800 mb-1">Acme Shop</h1>
      <p className="text-slate-500 text-sm mb-6">Premium Electronics & Audio</p>
      <div className={`flex items-center gap-3 px-5 py-2.5 rounded-full border-2 text-sm font-medium ${connected ? 'bg-emerald-50 border-emerald-300 text-emerald-700' : 'bg-blue-50 border-blue-300 text-blue-700'}`}>
        {connected ? <span>✓ AI Agent connected!</span> : <><Dots /><span>AI Agent connecting…</span></>}
      </div>
      {connected && (
        <div className="mt-5 grid grid-cols-3 gap-2">
          {['Cart','Catalog','Checkout','Orders','Fulfillment','Discounts'].map(c => (
            <div key={c} className="px-3 py-2 rounded-lg bg-emerald-50 border border-emerald-200 text-xs font-medium text-emerald-700 text-center">✓ {c}</div>
          ))}
        </div>
      )}
    </div>
  );
}

export function SearchScreen({ stepId }: SearchScreenProps) {
  const searching = stepId === 3;
  return (
    <div>
      <div className={`flex items-center gap-3 p-3 rounded-xl border-2 mb-5 bg-white ${searching ? 'border-indigo-400 shadow-md shadow-indigo-100' : 'border-slate-200'}`}>
        <span className="text-slate-400">🔍</span>
        <span className="text-slate-700 text-sm flex-1">wireless noise-cancelling headphones</span>
        {searching ? <span className="text-blue-500"><Dots /></span> : <span className="text-xs text-slate-400">2 results</span>}
      </div>
      {!searching && (
        <>
          <div className="flex gap-2 mb-4 flex-wrap">
            {['Electronics','Under $350','In Stock','4.5+ Stars'].map((f,i) => (
              <span key={f} className={`px-3 py-1 rounded-full text-xs font-medium border ${i<2 ? 'bg-indigo-600 text-white border-indigo-600' : 'bg-white text-slate-600 border-slate-300'}`}>{f}</span>
            ))}
          </div>
          <div className="grid grid-cols-2 gap-4">
            <ProductCard name="Sony WH-1000XM5" stars={4.8} reviews={2847} price={279.99} badge="Best Match" selected />
            <ProductCard name="Bose QuietComfort 45" stars={4.7} reviews={1923} price={329.00} />
          </div>
        </>
      )}
    </div>
  );
}

export function CartScreen() {
  return (
    <div className="max-w-md">
      <h2 className="text-lg font-bold text-slate-800 mb-4">Shopping Cart</h2>
      <div className="bg-white rounded-xl border border-slate-200 p-4 mb-3">
        <div className="flex gap-4">
          <div className="w-16 h-16 rounded-lg bg-indigo-50 flex items-center justify-center text-3xl flex-shrink-0">🎧</div>
          <div className="flex-1">
            <div className="text-sm font-semibold text-slate-800">Sony WH-1000XM5</div>
            <div className="text-xs text-slate-500 mt-0.5">Wireless Noise-Cancelling</div>
            <div className="flex items-center justify-between mt-2">
              <div className="flex items-center gap-2 px-2 py-1 rounded border border-slate-200 text-sm">
                <span className="text-slate-400">−</span><span className="w-4 text-center font-medium">1</span><span className="text-slate-400">+</span>
              </div>
              <span className="text-base font-bold text-slate-800">$279.99</span>
            </div>
          </div>
        </div>
      </div>
      <div className="bg-white rounded-xl border border-slate-200 p-4">
        <div className="flex justify-between text-sm mb-1.5"><span className="text-slate-500">Subtotal</span><span className="font-medium">$279.99</span></div>
        <div className="flex justify-between text-sm mb-3"><span className="text-slate-500">Shipping</span><span className="text-emerald-600 font-medium">Free</span></div>
        <button className="w-full py-2.5 rounded-xl bg-indigo-600 text-white font-semibold text-sm">Proceed to Checkout →</button>
      </div>
      <p className="mt-3 text-center text-xs text-slate-400">🤖 Agent is proceeding automatically…</p>
    </div>
  );
}

export function CheckoutScreen({ hasDeal }: CheckoutScreenProps) {
  return (
    <div className="max-w-md">
      <h2 className="text-lg font-bold text-slate-800 mb-4">Checkout</h2>
      <div className="bg-white rounded-xl border border-slate-200 p-4 mb-3">
        <div className="text-xs font-semibold text-slate-500 uppercase tracking-wide mb-2">Shipping</div>
        <div className="text-sm text-slate-700">123 Main St, San Francisco, CA 94105</div>
        <div className="text-xs text-indigo-600 mt-1">✓ Standard · Free · Est. Jan 18</div>
      </div>
      <div className="bg-white rounded-xl border border-slate-200 p-4 mb-3">
        <div className="text-xs font-semibold text-slate-500 uppercase tracking-wide mb-3">Order Summary</div>
        <div className="flex items-center gap-3 mb-3">
          <div className="w-10 h-10 rounded-lg bg-indigo-50 flex items-center justify-center text-xl flex-shrink-0">🎧</div>
          <div className="flex-1"><div className="text-xs font-medium text-slate-800">Sony WH-1000XM5</div><div className="text-xs text-slate-500">Qty 1</div></div>
          <span className="text-sm font-semibold text-slate-800">$279.99</span>
        </div>
        {hasDeal ? (
          <div className="flex items-center gap-2 px-3 py-2 rounded-lg bg-emerald-50 border border-emerald-200 mb-3">
            <span>🏷️</span>
            <div className="flex-1"><div className="text-xs font-semibold text-emerald-700">Agent Discount Applied!</div><div className="text-xs text-emerald-600">AGENT10 — 10% off for AI agents</div></div>
            <span className="text-sm font-bold text-emerald-700">−$27.99</span>
          </div>
        ) : (
          <div className="flex items-center gap-2 py-1 text-violet-600 text-xs mb-3"><Dots /><span>Agent negotiating discount…</span></div>
        )}
        <div className="border-t border-slate-100 pt-3 space-y-1">
          <div className="flex justify-between text-xs text-slate-500"><span>Subtotal</span><span>$279.99</span></div>
          {hasDeal && <div className="flex justify-between text-xs text-emerald-600"><span>Discount (AGENT10)</span><span>−$27.99</span></div>}
          <div className="flex justify-between text-xs text-slate-500"><span>Tax</span><span>$20.16</span></div>
          <div className="flex justify-between text-sm font-bold text-slate-800 pt-1 border-t border-slate-100"><span>Total</span><span>{hasDeal ? '$272.16' : '$300.15'}</span></div>
        </div>
      </div>
      {hasDeal && (
        <div className="flex flex-wrap gap-2">
          {['Fulfillment Tracking','Agent Discount','Priority Support','Instant Checkout'].map(c => (
            <span key={c} className="px-2.5 py-1 rounded-full text-xs font-medium bg-violet-50 border border-violet-200 text-violet-700">✓ {c}</span>
          ))}
        </div>
      )}
    </div>
  );
}

export function PaymentScreen({ tokenized }: PaymentScreenProps) {
  return (
    <div className="max-w-md">
      <h2 className="text-lg font-bold text-slate-800 mb-4">Secure Payment</h2>
      <div className="bg-white rounded-xl border border-slate-200 p-5">
        <div className="flex items-center gap-3 mb-4">
          <div className="w-12 h-12 rounded-xl bg-slate-800 flex items-center justify-center text-2xl">👛</div>
          <div><div className="text-sm font-semibold text-slate-800">Digital Wallet</div><div className="text-xs text-slate-500">ShopBot Secure Wallet</div></div>
          <div className={`ml-auto px-2.5 py-1 rounded-full text-xs font-medium border ${tokenized ? 'bg-emerald-50 border-emerald-200 text-emerald-700' : 'bg-yellow-50 border-yellow-200 text-yellow-700'}`}>
            {tokenized ? '✓ Authenticated' : '⟳ Authenticating…'}
          </div>
        </div>
        <div className="p-4 rounded-xl bg-gradient-to-br from-slate-800 to-slate-700 text-white mb-4">
          <div className="flex justify-between mb-5"><div className="w-8 h-5 rounded bg-yellow-400/80" /><span className="text-xs text-slate-300">VISA</span></div>
          <div className="text-sm font-mono tracking-widest mb-3">•••• •••• •••• 4242</div>
          <div className="flex justify-between text-xs text-slate-300"><span>SHOPBOT USER</span><span>12/27</span></div>
        </div>
        <div className="flex items-center gap-2 p-3 rounded-lg bg-slate-50 border border-slate-200">
          <span>{tokenized ? '🔒' : '🔐'}</span>
          <div>
            <div className="text-xs font-semibold text-slate-700">{tokenized ? 'Card Secured via PSP' : 'Authenticating with wallet…'}</div>
            <div className="text-xs text-slate-500">{tokenized ? 'tok_1OxKmJ2… · Card never shared with store' : 'Verifying payment mandate'}</div>
          </div>
        </div>
      </div>
    </div>
  );
}

export function ProcessingScreen({ authorized }: ProcessingScreenProps) {
  return (
    <div className="flex flex-col items-center justify-center py-12">
      {authorized ? (
        <>
          <div className="w-20 h-20 rounded-full bg-emerald-100 border-4 border-emerald-400 flex items-center justify-center text-3xl mb-4">✅</div>
          <h2 className="text-xl font-bold text-slate-800 mb-1">Payment Authorized!</h2>
          <p className="text-slate-500 text-sm mb-3">Visa approved · Auth code: AUTH_892XKL</p>
          <div className="px-4 py-2 rounded-full bg-emerald-50 border border-emerald-200 text-xs font-medium text-emerald-700">$272.16 captured · Creating order…</div>
        </>
      ) : (
        <>
          <div className="relative w-20 h-20 mb-5">
            <div className="absolute inset-0 rounded-full border-4 border-slate-200" />
            <div className="absolute inset-0 rounded-full border-4 border-indigo-600 border-t-transparent animate-spin" />
            <div className="absolute inset-0 flex items-center justify-center text-2xl">💳</div>
          </div>
          <h2 className="text-xl font-bold text-slate-800 mb-1">Processing Payment</h2>
          <p className="text-slate-500 text-sm mb-4">Routing via Stripe → Visa network</p>
          <div className="flex gap-2">
            {['Encrypting','Routing','Authorizing'].map(s => (
              <span key={s} className="px-3 py-1.5 rounded-full bg-indigo-50 border border-indigo-200 text-xs text-indigo-700 font-medium">{s}…</span>
            ))}
          </div>
        </>
      )}
    </div>
  );
}

export function ConfirmedScreen() {
  return (
    <div className="max-w-md mx-auto">
      <div className="flex flex-col items-center py-6">
        <div className="w-20 h-20 rounded-full bg-emerald-100 border-4 border-emerald-400 flex items-center justify-center text-3xl mb-4 shadow-lg shadow-emerald-100">🎁</div>
        <h2 className="text-2xl font-bold text-slate-800 mb-1">Order Confirmed!</h2>
        <p className="text-slate-500 text-sm">Your AI agent completed the purchase automatically</p>
      </div>
      <div className="bg-white rounded-xl border border-slate-200 p-4 mb-3">
        <div className="flex items-center gap-3 mb-3">
          <div className="w-12 h-12 rounded-lg bg-indigo-50 flex items-center justify-center text-2xl">🎧</div>
          <div className="flex-1"><div className="text-sm font-semibold text-slate-800">Sony WH-1000XM5</div><div className="text-xs text-slate-500">Wireless Noise-Cancelling</div></div>
          <span className="text-sm font-bold text-slate-800">$272.16</span>
        </div>
        <div className="text-xs text-emerald-600 font-medium px-2 py-1 rounded bg-emerald-50 border border-emerald-100">✓ 10% agent discount applied — you saved $27.99</div>
      </div>
      <div className="bg-white rounded-xl border border-slate-200 p-4 mb-3 grid grid-cols-2 gap-3 text-xs">
        <div><div className="text-slate-500 mb-0.5">Order ID</div><div className="font-mono font-medium text-slate-800">ORD-892XKL</div></div>
        <div><div className="text-slate-500 mb-0.5">Payment</div><div className="font-medium text-slate-800">Visa ····4242</div></div>
        <div><div className="text-slate-500 mb-0.5">Carrier</div><div className="font-medium text-slate-800">UPS Standard</div></div>
        <div><div className="text-slate-500 mb-0.5">Delivery</div><div className="font-medium text-emerald-700">Est. January 18</div></div>
      </div>
      <div className="bg-indigo-50 rounded-xl border border-indigo-200 p-4">
        <div className="flex items-center gap-2 mb-1.5"><span>🤖</span><span className="text-xs font-semibold text-indigo-800">Completed by AI agent in 15 steps</span></div>
        <p className="text-xs text-indigo-600 leading-relaxed">Discovered store → searched catalog → negotiated 10% discount → secured payment via PSP → authorized by Visa — all in seconds, no manual input required.</p>
      </div>
    </div>
  );
}
