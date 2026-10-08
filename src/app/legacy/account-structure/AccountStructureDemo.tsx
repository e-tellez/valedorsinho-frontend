"use client";

import { useState } from 'react';
import { NODES, DEVELOPER_CONCERNS, type AccountNode } from './data/nodes';
import { ChevronDown, Terminal, Building2, Store } from 'lucide-react';

type TabType = 'settlement' | 'reconciliation' | 'operations' | 'uplift';

const NODE_COLORS = {
  company: {
    primary: '#818cf8',
    secondary: '#6366f1',
    glow: 'rgba(129, 140, 248, 0.4)',
    border: 'border-indigo-400/40',
    borderHover: 'hover:border-indigo-400',
    borderActive: 'border-indigo-400',
    text: 'text-indigo-300',
    textDark: 'text-indigo-600',
    icon: 'text-indigo-400',
    iconBorder: 'border-indigo-500/50',
  },
  merchant: {
    primary: '#38bdf8',
    secondary: '#0ea5e9',
    glow: 'rgba(56, 189, 248, 0.4)',
    border: 'border-sky-400/40',
    borderHover: 'hover:border-sky-400',
    borderActive: 'border-sky-400',
    text: 'text-sky-300',
    textDark: 'text-sky-600',
    icon: 'text-sky-400',
    iconBorder: 'border-sky-500/40',
  },
  store: {
    primary: '#34d399',
    secondary: '#10b981',
    glow: 'rgba(52, 211, 153, 0.4)',
    border: 'border-emerald-400/40',
    borderHover: 'hover:border-emerald-400',
    borderActive: 'border-emerald-400',
    text: 'text-emerald-300',
    textDark: 'text-emerald-600',
    icon: 'text-emerald-400',
    iconBorder: 'border-emerald-500/30',
  },
};

const TAB_COLORS: Record<TabType, { border: string; text: string; bg: string }> = {
  settlement: {
    border: 'border-violet-400/30',
    text: 'text-violet-400',
    bg: 'bg-violet-500/5',
  },
  reconciliation: {
    border: 'border-blue-400/30',
    text: 'text-blue-400',
    bg: 'bg-blue-500/5',
  },
  operations: {
    border: 'border-teal-400/30',
    text: 'text-teal-400',
    bg: 'bg-teal-500/5',
  },
  uplift: {
    border: 'border-pink-400/30',
    text: 'text-pink-400',
    bg: 'bg-pink-500/5',
  },
};

export default function AccountStructureDemo() {
  const [activeNode, setActiveNode] = useState<AccountNode | null>(null);
  const [activeTab, setActiveTab] = useState<TabType>('settlement');
  const [showDeveloperConcerns, setShowDeveloperConcerns] = useState(false);

  const handleNodeClick = (node: AccountNode) => {
    setActiveNode(node);
    setShowDeveloperConcerns(false);
    if (node.type === 'company') {
      setActiveTab('reconciliation');
    } else {
      setActiveTab('settlement');
    }
  };

  const handleDeveloperConcernsClick = () => {
    setActiveNode(null);
    setShowDeveloperConcerns(true);
  };

  const availableTabs = activeNode
    ? (Object.keys(activeNode.details) as TabType[])
    : [];

  return (
    <div className="fixed inset-0 z-0 flex flex-col h-screen bg-[#0a1628] overflow-hidden font-mono">
      <style jsx global>{`
        @import url('https://fonts.googleapis.com/css2?family=JetBrains+Mono:wght@400;500;600;700&display=swap');
        
        .blueprint-grid {
          background-image: 
            linear-gradient(rgba(6, 182, 212, 0.03) 1px, transparent 1px),
            linear-gradient(90deg, rgba(6, 182, 212, 0.03) 1px, transparent 1px);
          background-size: 20px 20px;
          position: relative;
        }
        
        .blueprint-grid::before {
          content: '';
          position: absolute;
          inset: 0;
          background: radial-gradient(circle at 50% 50%, transparent 0%, rgba(10, 22, 40, 0.8) 100%);
          pointer-events: none;
        }
        
        .connection-line {
          position: absolute;
          width: 2px;
          background: linear-gradient(180deg, 
            rgba(6, 182, 212, 0.6) 0%, 
            rgba(6, 182, 212, 0.3) 50%,
            rgba(6, 182, 212, 0.6) 100%
          );
          left: 50%;
          transform: translateX(-50%);
          animation: pulse-line 2s ease-in-out infinite;
        }
        
        @keyframes pulse-line {
          0%, 100% { opacity: 0.4; }
          50% { opacity: 0.8; }
        }
        
        .node-schematic {
          position: relative;
          transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
        }
        
        .node-schematic::before {
          content: '';
          position: absolute;
          inset: -2px;
          background: linear-gradient(135deg, rgba(6, 182, 212, 0.2), transparent);
          opacity: 0;
          transition: opacity 0.3s;
          pointer-events: none;
        }
        
        .node-schematic:hover::before {
          opacity: 1;
        }
        
        .node-schematic.active {
          box-shadow: 0 0 30px rgba(6, 182, 212, 0.4);
        }
        
        .technical-label {
          font-family: 'JetBrains Mono', monospace;
          letter-spacing: 0.05em;
          text-transform: uppercase;
        }
        
        .detail-section {
          border-left: 2px solid rgba(6, 182, 212, 0.3);
          position: relative;
          animation: slide-in 0.4s ease-out;
        }
        
        @keyframes slide-in {
          from {
            opacity: 0;
            transform: translateX(20px);
          }
          to {
            opacity: 1;
            transform: translateX(0);
          }
        }
        
        .corner-bracket {
          position: absolute;
          width: 12px;
          height: 12px;
          border: 1px solid rgba(6, 182, 212, 0.5);
        }
        
        .corner-bracket.tl { top: -1px; left: -1px; border-right: none; border-bottom: none; }
        .corner-bracket.tr { top: -1px; right: -1px; border-left: none; border-bottom: none; }
        .corner-bracket.bl { bottom: -1px; left: -1px; border-right: none; border-top: none; }
        .corner-bracket.br { bottom: -1px; right: -1px; border-left: none; border-top: none; }
      `}</style>

      {/* Technical Header */}
      <header className="shrink-0 border-b border-cyan-500/20 bg-[#0d1b2e]/90 backdrop-blur-sm px-6 py-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <div className="w-8 h-8 border border-cyan-500 flex items-center justify-center text-xs font-bold text-cyan-400 relative">
              <div className="corner-bracket tl"></div>
              <div className="corner-bracket tr"></div>
              <div className="corner-bracket bl"></div>
              <div className="corner-bracket br"></div>
              A
            </div>
            <div>
              <h1 className="text-sm font-bold text-cyan-400 technical-label tracking-wider">
                Account Structure
              </h1>
              <p className="text-[10px] text-cyan-600 technical-label mt-0.5">
                SCHEMATIC v1.0 // HIERARCHY DIAGRAM
              </p>
            </div>
          </div>
          <div className="text-[10px] text-cyan-700 technical-label hidden sm:block">
            COMPANY → MERCHANT → STORE
          </div>
        </div>
      </header>

      {/* Main Blueprint Area */}
      <div className="flex-1 flex overflow-hidden">
        {/* Diagram */}
        <div className="flex-1 flex items-center justify-center p-8 overflow-auto blueprint-grid">
          <div className="relative w-full max-w-6xl py-12">
            {/* Connection Lines */}
            <div className="connection-line" style={{ top: '140px', height: '80px', background: 'linear-gradient(180deg, rgba(129, 140, 248, 0.6) 0%, rgba(56, 189, 248, 0.6) 100%)' }}></div>
            <div className="connection-line" style={{ top: '340px', height: '80px', background: 'linear-gradient(180deg, rgba(56, 189, 248, 0.6) 0%, rgba(52, 211, 153, 0.6) 100%)' }}></div>
            
            {/* Company Level */}
            <div className="flex justify-center mb-20 relative">
              <button
                onClick={() => handleNodeClick(NODES[0])}
                className={`node-schematic ${activeNode?.id === 'company' ? 'active' : ''} 
                  w-[420px] p-8 bg-[#0d1b2e]/80 border-2 ${NODE_COLORS.company.border} 
                  ${NODE_COLORS.company.borderHover} transition-all relative group`}
                style={{ 
                  clipPath: 'polygon(12px 0, 100% 0, 100% calc(100% - 12px), calc(100% - 12px) 100%, 0 100%, 0 12px)',
                  boxShadow: activeNode?.id === 'company' ? `0 0 30px ${NODE_COLORS.company.glow}` : 'none'
                }}
              >
                <div className="corner-bracket tl" style={{ borderColor: NODE_COLORS.company.primary }}></div>
                <div className="corner-bracket tr" style={{ borderColor: NODE_COLORS.company.primary }}></div>
                <div className="corner-bracket bl" style={{ borderColor: NODE_COLORS.company.primary }}></div>
                <div className="corner-bracket br" style={{ borderColor: NODE_COLORS.company.primary }}></div>
                
                <div className="flex items-start gap-4">
                  <div className={`w-12 h-12 border ${NODE_COLORS.company.iconBorder} flex items-center justify-center ${NODE_COLORS.company.icon} shrink-0`}>
                    <Building2 className="w-6 h-6" />
                  </div>
                  <div className="flex-1 text-left">
                    <div className={`text-[10px] ${NODE_COLORS.company.textDark} technical-label mb-1`}>LEVEL_01</div>
                    <div className={`text-xl font-bold ${NODE_COLORS.company.text} mb-2 technical-label`}>COMPANY ACCOUNT</div>
                    <div className="text-[11px] text-slate-400 leading-relaxed">
                      Global configuration · Consolidated reporting · All merchants
                    </div>
                  </div>
                </div>
                
                <div className={`absolute -bottom-8 left-1/2 -translate-x-1/2 ${NODE_COLORS.company.textDark}`}>
                  <ChevronDown className="w-5 h-5 animate-bounce" />
                </div>
              </button>
            </div>

            {/* Merchant Level */}
            <div className="flex justify-center gap-8 mb-20 relative">
              {[NODES[1], NODES[2]].map((node, idx) => (
                <button
                  key={node.id}
                  onClick={() => handleNodeClick(node)}
                  className={`node-schematic ${activeNode?.id === node.id ? 'active' : ''} 
                    w-80 p-6 bg-[#0d1b2e]/70 border-2 ${NODE_COLORS.merchant.border} 
                    ${NODE_COLORS.merchant.borderHover} transition-all relative`}
                  style={{ 
                    clipPath: 'polygon(10px 0, 100% 0, 100% calc(100% - 10px), calc(100% - 10px) 100%, 0 100%, 0 10px)',
                    animationDelay: `${idx * 0.1}s`,
                    boxShadow: activeNode?.id === node.id ? `0 0 30px ${NODE_COLORS.merchant.glow}` : 'none'
                  }}
                >
                  <div className="corner-bracket tl" style={{ borderColor: NODE_COLORS.merchant.primary }}></div>
                  <div className="corner-bracket tr" style={{ borderColor: NODE_COLORS.merchant.primary }}></div>
                  <div className="corner-bracket bl" style={{ borderColor: NODE_COLORS.merchant.primary }}></div>
                  <div className="corner-bracket br" style={{ borderColor: NODE_COLORS.merchant.primary }}></div>
                  
                  <div className="flex items-start gap-3">
                    <div className={`w-10 h-10 border ${NODE_COLORS.merchant.iconBorder} flex items-center justify-center ${NODE_COLORS.merchant.icon} shrink-0`}>
                      <Terminal className="w-5 h-5" />
                    </div>
                    <div className="flex-1 text-left">
                      <div className={`text-[10px] ${NODE_COLORS.merchant.textDark} technical-label mb-1`}>LEVEL_02.{idx + 1}</div>
                      <div className={`text-base font-bold ${NODE_COLORS.merchant.text} mb-1.5 technical-label`}>{node.label.toUpperCase()}</div>
                      <div className="text-[10px] text-slate-400 leading-relaxed">
                        Settlement · Payment methods · 3DS · Risk
                      </div>
                    </div>
                  </div>
                </button>
              ))}
              
              <div className={`absolute -bottom-8 left-1/2 -translate-x-1/2 ${NODE_COLORS.merchant.textDark}`}>
                <ChevronDown className="w-5 h-5 animate-bounce" style={{ animationDelay: '0.2s' }} />
              </div>
            </div>

            {/* Store Level - Grouped by Merchant */}
            <div className="flex justify-center gap-8 relative">
              {/* Merchant 1 Stores Group */}
              <div className="relative">
                <div className="absolute -top-6 left-1/2 -translate-x-1/2 text-[9px] text-sky-600 technical-label whitespace-nowrap">
                  MERCHANT 1 STORES
                </div>
                <div className="flex gap-3">
                  {NODES.slice(3, 5).map((node, idx) => (
                <button
                  key={node.id}
                  onClick={() => handleNodeClick(node)}
                  className={`node-schematic ${activeNode?.id === node.id ? 'active' : ''} 
                    w-32 p-4 bg-[#0d1b2e]/60 border ${NODE_COLORS.store.border} 
                    ${NODE_COLORS.store.borderHover} transition-all relative`}
                  style={{ 
                    clipPath: 'polygon(8px 0, 100% 0, 100% calc(100% - 8px), calc(100% - 8px) 100%, 0 100%, 0 8px)',
                    animationDelay: `${idx * 0.05}s`,
                    boxShadow: activeNode?.id === node.id ? `0 0 30px ${NODE_COLORS.store.glow}` : 'none'
                  }}
                >
                  <div className="text-center">
                    <div className={`w-8 h-8 border ${NODE_COLORS.store.iconBorder} flex items-center justify-center ${NODE_COLORS.store.icon} mx-auto mb-2`}>
                      <Store className="w-4 h-4" />
                    </div>
                    <div className={`text-[9px] ${NODE_COLORS.store.textDark} technical-label mb-1`}>L03.{idx + 1}</div>
                    <div className={`text-[11px] font-bold ${NODE_COLORS.store.text} technical-label mb-1`}>{node.label.toUpperCase()}</div>
                    <div className="text-[8px] text-slate-500 leading-tight">
                      Online + In-Person
                    </div>
                  </div>
                </button>
                  ))}
                </div>
              </div>
              
              {/* Merchant 2 Stores Group */}
              <div className="relative">
                <div className="absolute -top-6 left-1/2 -translate-x-1/2 text-[9px] text-sky-600 technical-label whitespace-nowrap">
                  MERCHANT 2 STORES
                </div>
                <div className="flex gap-3">
                  {NODES.slice(5).map((node, idx) => (
                <button
                  key={node.id}
                  onClick={() => handleNodeClick(node)}
                  className={`node-schematic ${activeNode?.id === node.id ? 'active' : ''} 
                    w-32 p-4 bg-[#0d1b2e]/60 border ${NODE_COLORS.store.border} 
                    ${NODE_COLORS.store.borderHover} transition-all relative`}
                  style={{ 
                    clipPath: 'polygon(8px 0, 100% 0, 100% calc(100% - 8px), calc(100% - 8px) 100%, 0 100%, 0 8px)',
                    animationDelay: `${(idx + 2) * 0.05}s`,
                    boxShadow: activeNode?.id === node.id ? `0 0 30px ${NODE_COLORS.store.glow}` : 'none'
                  }}
                >
                  <div className="text-center">
                    <div className={`w-8 h-8 border ${NODE_COLORS.store.iconBorder} flex items-center justify-center ${NODE_COLORS.store.icon} mx-auto mb-2`}>
                      <Store className="w-4 h-4" />
                    </div>
                    <div className={`text-[9px] ${NODE_COLORS.store.textDark} technical-label mb-1`}>L03.{idx + 3}</div>
                    <div className={`text-[11px] font-bold ${NODE_COLORS.store.text} technical-label mb-1`}>{node.label.toUpperCase()}</div>
                    <div className="text-[8px] text-slate-500 leading-tight">
                      Online + In-Person
                    </div>
                  </div>
                </button>
                  ))}
                </div>
              </div>
            </div>

            {/* Developer Concerns */}
            <div className="flex justify-center mt-16">
              <button
                onClick={handleDeveloperConcernsClick}
                className={`px-8 py-4 border-2 transition-all relative ${
                  showDeveloperConcerns
                    ? 'bg-amber-500/10 border-amber-500/60 text-amber-400 cursor-pointer'
                    : 'bg-amber-500/5 border-amber-500/30 text-amber-500 hover:border-amber-500/60 cursor-pointer'
                }`}
                style={{ clipPath: 'polygon(10px 0, 100% 0, 100% calc(100% - 10px), calc(100% - 10px) 100%, 0 100%, 0 10px)' }}
              >
                <div className="corner-bracket tl" style={{ borderColor: 'rgba(245, 158, 11, 0.5)' }}></div>
                <div className="corner-bracket tr" style={{ borderColor: 'rgba(245, 158, 11, 0.5)' }}></div>
                <div className="corner-bracket bl" style={{ borderColor: 'rgba(245, 158, 11, 0.5)' }}></div>
                <div className="corner-bracket br" style={{ borderColor: 'rgba(245, 158, 11, 0.5)' }}></div>
                <span className="text-xs technical-label">DEVELOPER CONCERNS</span>
              </button>
            </div>
          </div>
        </div>

        {/* Technical Detail Panel */}
        <div className="w-[500px] shrink-0 border-l border-cyan-500/20 bg-[#0d1b2e]/50 overflow-y-auto">
          <div className="p-6 pb-16">
              {activeNode ? (
              <>
                <div className="mb-6 pb-4 border-b" style={{ borderColor: `${NODE_COLORS[activeNode.type].primary}33` }}>
                  <div className={`text-[10px] ${NODE_COLORS[activeNode.type].textDark} technical-label mb-2`}>
                    {activeNode.type.toUpperCase()}_LEVEL
                  </div>
                  <h2 className={`text-2xl font-bold ${NODE_COLORS[activeNode.type].text} mb-2 technical-label`}>
                    {activeNode.label.toUpperCase()}
                  </h2>
                  <p className="text-sm text-slate-400">{activeNode.description}</p>
                </div>

                <div className="space-y-6">
                  {availableTabs.map((tab, idx) => {
                    const borderColors = {
                      settlement: '#a78bfa',
                      reconciliation: '#60a5fa',
                      operations: '#2dd4bf',
                      uplift: '#f472b6',
                    };
                    return (
                    <div 
                      key={tab} 
                      className="detail-section pl-4"
                      style={{ 
                        animationDelay: `${idx * 0.1}s`,
                        borderLeftColor: borderColors[tab]
                      }}
                    >
                      <h3 className={`text-xs font-bold ${TAB_COLORS[tab].text} technical-label mb-3`}>
                        {tab.toUpperCase().replace('_', ' ')}
                      </h3>
                      <div className={`${TAB_COLORS[tab].bg} border ${TAB_COLORS[tab].border} p-4 relative`}
                        style={{ clipPath: 'polygon(8px 0, 100% 0, 100% calc(100% - 8px), calc(100% - 8px) 100%, 0 100%, 0 8px)' }}
                      >
                        <p className="text-[13px] text-slate-300 leading-relaxed">
                          {activeNode.details[tab]}
                        </p>
                      </div>
                    </div>
                    );
                  })}
                </div>
              </>
              ) : showDeveloperConcerns ? (
                <>
                  <div className="mb-6 pb-4 border-b border-amber-500/20">
                    <h2 className="text-2xl font-bold text-amber-400 technical-label">
                      DEVELOPER CONCERNS
                    </h2>
                    <p className="text-xs text-amber-600 mt-2 technical-label">
                      CROSS-HIERARCHY CONFIGURATION
                    </p>
                  </div>
                  <div className="space-y-4">
                    {DEVELOPER_CONCERNS.map((concern, idx) => (
                      <div
                        key={concern.id}
                        className="detail-section pl-4"
                        style={{ 
                          borderLeftColor: 'rgba(245, 158, 11, 0.3)',
                          animationDelay: `${idx * 0.1}s`
                        }}
                      >
                        <h3 className="text-xs font-bold text-amber-400 technical-label mb-2">
                          {concern.label.toUpperCase()}
                        </h3>
                        <div className="bg-[#0a1628]/60 border border-amber-500/20 p-4 relative"
                          style={{ clipPath: 'polygon(8px 0, 100% 0, 100% calc(100% - 8px), calc(100% - 8px) 100%, 0 100%, 0 8px)' }}
                        >
                          <p className="text-[13px] text-amber-200/70 leading-relaxed">
                            {concern.description}
                          </p>
                        </div>
                      </div>
                    ))}
                  </div>
                </>
              ) : (
                <div className="flex items-center justify-center h-full">
                  <div className="text-center px-8">
                    <div className="w-16 h-16 border-2 border-cyan-500/30 flex items-center justify-center mx-auto mb-4"
                      style={{ clipPath: 'polygon(8px 0, 100% 0, 100% calc(100% - 8px), calc(100% - 8px) 100%, 0 100%, 0 8px)' }}
                    >
                      <div className="corner-bracket tl" style={{ borderColor: 'rgba(6, 182, 212, 0.3)' }}></div>
                      <div className="corner-bracket tr" style={{ borderColor: 'rgba(6, 182, 212, 0.3)' }}></div>
                      <div className="corner-bracket bl" style={{ borderColor: 'rgba(6, 182, 212, 0.3)' }}></div>
                      <div className="corner-bracket br" style={{ borderColor: 'rgba(6, 182, 212, 0.3)' }}></div>
                      <span className="text-2xl text-cyan-600">→</span>
                    </div>
                    <p className="text-sm text-cyan-700 technical-label mb-2">
                      SELECT A NODE
                    </p>
                    <p className="text-xs text-slate-500">
                      Click any account level to view details
                    </p>
                  </div>
                </div>
              )}
          </div>
        </div>
      </div>

      {/* Technical Footer */}
      <div className="shrink-0 border-t border-cyan-500/20 bg-[#0d1b2e]/90 px-6 py-3">
        <p className="text-[10px] text-cyan-700 technical-label text-center">
          INTERACTIVE SCHEMATIC // CLICK NODE TO INSPECT // SETTLEMENT @ MERCHANT LEVEL
        </p>
      </div>
    </div>
  );
}
