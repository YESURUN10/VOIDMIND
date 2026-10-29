import React, { useState, useEffect } from 'react';
import { ShieldAlert, ArrowRight, AlertTriangle, Package, ShoppingCart, DollarSign, Building } from 'lucide-react';

export const DisruptionImpactGraph: React.FC = () => {
  const [activeStep, setActiveStep] = useState<number>(3); // Default highlighting customer orders
  const [lineageData, setLineageData] = useState<any>(null);

  useEffect(() => {
    fetch('/api/disruptions/dis_port_longbeach_01/lineage')
      .then((res) => (res.ok ? res.json() : null))
      .then((data) => {
        if (data) setLineageData(data);
      })
      .catch((err) => console.log('Lineage fallback active:', err));
  }, []);

  const totalAtRisk = lineageData?.disruption?.total_revenue_at_risk || 285000;
  const delayDays = lineageData?.shipment?.delay_days || 6;
  const trackingNumber = lineageData?.shipment?.tracking_number || 'TRK-MAERSK-9021';
  const poNumber = lineageData?.po?.po_number || 'PO-2026-8819';

  const impactPath = [
    {
      step: 1,
      title: 'Carrier Webhook Incident',
      badge: 'ROOT CAUSE',
      badgeColor: 'text-[#FF5938] border-[#FF5938]/30 bg-[#FF5938]/10',
      icon: ShieldAlert,
      entity: trackingNumber,
      description: 'Maersk container vessel delayed at Port of Long Beach berthing queue.',
      metrics: { delay: `+${delayDays} Days Dwell`, carrier: 'Maersk Line', origin: 'Keelung, Taiwan' },
    },
    {
      step: 2,
      title: 'Inbound Purchase Order',
      badge: 'IMPACTED PO',
      badgeColor: 'text-amber-400 border-amber-500/30 bg-amber-500/10',
      icon: ShoppingCart,
      entity: poNumber,
      description: 'Scheduled batch replenishment of silicon substrate wafers.',
      metrics: { supplier: 'ABC Supplies Ltd.', value: '$45,000', expectedEta: `Nov 01 (+${delayDays}d late)` },
    },
    {
      step: 3,
      title: 'Inventory Buffer Deficit',
      badge: 'BUFFER BREACH',
      badgeColor: 'text-rose-400 border-rose-500/30 bg-rose-500/10',
      icon: Package,
      entity: 'SKU-12345 (Silicon Wafers)',
      description: 'Current stock 45 units fails to cover 80 unit safety buffer threshold.',
      metrics: { current: '45 Units', safetyStock: '80 Units', netDeficit: '-35 Units' },
    },
    {
      step: 4,
      title: 'Downstream Customer Orders',
      badge: 'REVENUE AT RISK',
      badgeColor: 'text-[#FF5938] border-[#FF5938]/30 bg-[#FF5938]/10',
      icon: DollarSign,
      entity: `${lineageData?.customerOrders?.length || 3} Customer Orders ($${(totalAtRisk / 1000).toFixed(0)}k)`,
      description: 'Tier-1 client assemblies impended; daily penalty clauses active.',
      metrics: { totalRevenue: `$${totalAtRisk.toLocaleString()}`, penaltyRisk: '$87,000', riskIndex: `${lineageData?.disruption?.risk_score || 78} / 100` },
    },
  ];

  return (
    <div className="bg-[#202020] border border-[#303030] rounded-xl p-6 space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-[#2D2D2D]">
        <div>
          <div className="flex items-center gap-2">
            <AlertTriangle className="w-4 h-4 text-[#FF5938]" />
            <h3 className="text-sm font-semibold text-white">Downstream Lineage & Impact Graph</h3>
          </div>
          <p className="text-xs text-[#A0A0A0] mt-0.5">
            Deterministic causal trace from port delay through purchase order lines to customer delivery deadlines.
          </p>
        </div>

        <div className="flex items-center gap-3 text-xs font-mono">
          <span className="text-[#A0A0A0]">Total Revenue at Risk:</span>
          <span className="text-[#FF5938] font-bold text-sm">$285,000</span>
        </div>
      </div>

      {/* Sequential Node Path */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-3 relative">
        {impactPath.map((item, index) => {
          const Icon = item.icon;
          const isSelected = activeStep === item.step;

          return (
            <div
              key={item.step}
              tabIndex={0}
              role="button"
              aria-label={`Select step ${item.step}: ${item.title}`}
              onClick={() => setActiveStep(item.step)}
              onKeyDown={(e) => {
                if (e.key === 'Enter' || e.key === ' ') {
                  e.preventDefault();
                  setActiveStep(item.step);
                }
              }}
              className={`p-4 rounded-xl border cursor-pointer transition-all flex flex-col justify-between focus:outline-none focus:ring-2 focus:ring-[#FF5938] ${
                isSelected
                  ? 'bg-[#181818] border-[#FF5938] ring-1 ring-[#FF5938]/40 shadow-lg'
                  : 'bg-[#151515] border-[#2D2D2D] hover:border-[#404040]'
              }`}
            >
              <div>
                <div className="flex items-center justify-between">
                  <span className={`px-2 py-0.5 rounded text-[10px] font-bold font-mono border ${item.badgeColor}`}>
                    {item.badge}
                  </span>
                  <span className="text-[10px] text-[#737373] font-mono">Step 0{item.step}</span>
                </div>

                <div className="flex items-center gap-2 mt-3">
                  <Icon className="w-4 h-4 text-[#FF5938] shrink-0" />
                  <h4 className="text-xs font-bold text-white truncate">{item.entity}</h4>
                </div>
                <p className="text-[11px] text-[#A0A0A0] mt-1 line-clamp-2 leading-relaxed">
                  {item.description}
                </p>
              </div>

              <div className="mt-4 pt-3 border-t border-[#252525] space-y-1 text-[11px] font-mono">
                {Object.entries(item.metrics).map(([k, v]) => (
                  <div key={k} className="flex justify-between">
                    <span className="text-[#737373] capitalize">{k.replace(/([A-Z])/g, ' $1')}:</span>
                    <span className="text-white font-medium">{v}</span>
                  </div>
                ))}
              </div>
            </div>
          );
        })}
      </div>

      {/* Deep Customer Order Breakdown */}
      <div className="bg-[#151515] rounded-xl p-4 border border-[#2D2D2D] space-y-3">
        <div className="flex items-center justify-between pb-2 border-b border-[#252525]">
          <span className="text-xs font-semibold text-white">Impended Customer Sales Orders Detail</span>
          <span className="text-[10px] text-[#A0A0A0] font-mono">3 Strategic Clients Affected</span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-3 text-xs">
          <div className="p-3 bg-[#1D1D1D] rounded-lg border border-[#2F2F2F]">
            <div className="flex justify-between font-mono">
              <span className="text-white font-bold">SO-2026-9041</span>
              <span className="text-[#FF5938] font-bold">$145,000</span>
            </div>
            <p className="text-white font-medium mt-1">AeroDynamics Global Defense</p>
            <div className="mt-2 text-[11px] text-[#A0A0A0] space-y-0.5">
              <div>Tier: <span className="text-[#FF5938]">Tier 1 Strategic</span></div>
              <div>Promise Date: <span className="font-mono text-white">Nov 04</span></div>
              <div className="text-rose-400 font-mono">$8,500/day late penalty clause</div>
            </div>
          </div>

          <div className="p-3 bg-[#1D1D1D] rounded-lg border border-[#2F2F2F]">
            <div className="flex justify-between font-mono">
              <span className="text-white font-bold">SO-2026-9042</span>
              <span className="text-[#FF5938] font-bold">$85,000</span>
            </div>
            <p className="text-white font-medium mt-1">NovaTech Healthcare Robotics</p>
            <div className="mt-2 text-[11px] text-[#A0A0A0] space-y-0.5">
              <div>Tier: <span className="text-[#FF5938]">Tier 1 Strategic</span></div>
              <div>Promise Date: <span className="font-mono text-white">Nov 05</span></div>
              <div className="text-rose-400 font-mono">$12,000/day late penalty clause</div>
            </div>
          </div>

          <div className="p-3 bg-[#1D1D1D] rounded-lg border border-[#2F2F2F]">
            <div className="flex justify-between font-mono">
              <span className="text-white font-bold">SO-2026-9043</span>
              <span className="text-white font-bold">$55,000</span>
            </div>
            <p className="text-white font-medium mt-1">Apex Industrial Automation</p>
            <div className="mt-2 text-[11px] text-[#A0A0A0] space-y-0.5">
              <div>Tier: <span className="text-amber-400">Tier 2 Enterprise</span></div>
              <div>Promise Date: <span className="font-mono text-white">Nov 07</span></div>
              <div className="text-[#737373] font-mono">Buffer depleted; assembly hold</div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
