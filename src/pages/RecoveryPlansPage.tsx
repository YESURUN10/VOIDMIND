import React, { useState } from 'react';
import { GitBranch, FastForward, Shuffle, Split, ArrowRight, ShieldCheck, CheckCircle2 } from 'lucide-react';
import { useAuth } from '../context/AuthContext.tsx';

interface RecoveryPlansPageProps {
  onNavigate: (path: string) => void;
}

export const RecoveryPlansPage: React.FC<RecoveryPlansPageProps> = ({ onNavigate }) => {
  const { currentUser, hasPermission } = useAuth();
  const [selectedPlanId, setSelectedPlanId] = useState<string>('plan_realloc_01');
  const [submissionSuccess, setSubmissionSuccess] = useState<string | null>(null);

  const recoveryStrategies = [
    {
      id: 'plan_realloc_01',
      strategy: 'STOCK_REALLOCATION',
      title: 'Inter-Facility Stock Reallocation',
      icon: Shuffle,
      description: 'Reallocate 80 units of SKU-12345 from Frankfurt Central Hub to Chicago Main Fulfillment to avert Tier 1 line stoppage.',
      deltaCost: 1450,
      daysSaved: 5,
      mitigatedRevenue: 285000,
      beforeRisk: 78,
      afterRisk: 22,
      feasibility: 96,
      author: 'Marcus Vance (Supply Chain Manager)',
      details: {
        origin: 'Frankfurt Hub (Surplus: 190 units)',
        destination: 'Chicago Hub (Deficit: 80 units)',
        transitTime: '2 days via Express Air Cargo',
        tradeoff: 'Low-cost domestic transfer; minimal foreign tariff exposure.',
      },
    },
    {
      id: 'plan_expedite_02',
      strategy: 'EXPEDITED_FREIGHT',
      title: 'Air Charter Freight Expedite',
      icon: FastForward,
      description: 'Divert container contents at Long Beach port to priority air charter directly to Chicago logistics park.',
      deltaCost: 5800,
      daysSaved: 6,
      mitigatedRevenue: 285000,
      beforeRisk: 78,
      afterRisk: 18,
      feasibility: 92,
      author: 'Marcus Vance (Supply Chain Manager)',
      details: {
        carrier: 'DHL Global Charter Logistics',
        origin: 'Port of Long Beach Berthing',
        destination: 'Chicago Main Hub',
        tradeoff: 'Higher freight surcharge (+ $5,800), eliminates all downstream SLA penalties.',
      },
    },
    {
      id: 'plan_alternate_03',
      strategy: 'ALTERNATE_SUPPLIER',
      title: 'Pre-Qualified Alternate Supplier PO',
      icon: GitBranch,
      description: 'Activate secondary contract with Synapse Alternate Systems for emergency batch delivery of 100 wafer units.',
      deltaCost: 3200,
      daysSaved: 4,
      mitigatedRevenue: 220000,
      beforeRisk: 78,
      afterRisk: 29,
      feasibility: 88,
      author: 'Marcus Vance (Supply Chain Manager)',
      details: {
        supplier: 'Synapse Alternate Systems (San Jose, CA)',
        leadTime: '4 days domestic lead time',
        tradeoff: 'Unit cost +10% premium ($160/unit vs $145/unit base).',
      },
    },
    {
      id: 'plan_split_04',
      strategy: 'SPLIT_ORDER',
      title: 'Hybrid Split Delivery',
      icon: Split,
      description: 'Split inbound order: air-freight immediate 40 units for critical assembly, allow remaining 65 units to continue on ocean lane.',
      deltaCost: 2600,
      daysSaved: 5,
      mitigatedRevenue: 285000,
      beforeRisk: 78,
      afterRisk: 25,
      feasibility: 94,
      author: 'Marcus Vance (Supply Chain Manager)',
      details: {
        splitRatio: '40 Units Express Air / 65 Units Standard Ocean',
        destination: 'Chicago Hub',
        tradeoff: 'Balanced cost-efficiency and customer SLA preservation.',
      },
    },
  ];

  const activePlan = recoveryStrategies.find((p) => p.id === selectedPlanId) || recoveryStrategies[0];

  const handleSubmitForApproval = () => {
    setSubmissionSuccess(`Plan '${activePlan.title}' submitted to Procurement Approvals.`);
    setTimeout(() => {
      onNavigate('/approvals');
    }, 1000);
  };

  return (
    <div className="w-full space-y-6 pb-12">
      <div>
        <h2 className="text-base font-semibold text-white">Deterministic Disruption Recovery Engines</h2>
        <p className="text-xs text-[#A0A0A0]">
          Compare the 4 mathematically feasible recovery generators against baseline delay and customer penalty curves
        </p>
      </div>

      {submissionSuccess && (
        <div className="p-3 bg-emerald-950/40 border border-emerald-800 rounded-xl text-xs text-emerald-300 flex items-center gap-2">
          <CheckCircle2 className="w-4 h-4 text-emerald-400" />
          <span>{submissionSuccess}</span>
        </div>
      )}

      {/* Strategy Selector Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
        {recoveryStrategies.map((plan) => {
          const Icon = plan.icon;
          const isSelected = plan.id === selectedPlanId;
          return (
            <button
              key={plan.id}
              onClick={() => setSelectedPlanId(plan.id)}
              className={`p-4 rounded-xl text-left border transition-all ${
                isSelected
                  ? 'bg-[#202020] border-[#FF5938] shadow-lg shadow-[#FF5938]/10'
                  : 'bg-[#151515] border-[#303030] hover:border-[#404040]'
              }`}
            >
              <div className="flex items-center justify-between">
                <div
                  className={`w-8 h-8 rounded-lg flex items-center justify-center ${
                    isSelected ? 'bg-[#FF5938] text-white' : 'bg-[#202020] text-[#A0A0A0]'
                  }`}
                >
                  <Icon className="w-4 h-4" />
                </div>
                <span className="text-[10px] font-mono text-emerald-400 font-bold">
                  {plan.feasibility}% Feasible
                </span>
              </div>
              <h3 className="text-xs font-bold text-white mt-3 truncate">{plan.title}</h3>
              <div className="flex items-center justify-between text-[11px] text-[#A0A0A0] mt-2 font-mono">
                <span>+{plan.daysSaved}d saved</span>
                <span className="text-white">+${plan.deltaCost.toLocaleString()}</span>
              </div>
            </button>
          );
        })}
      </div>

      {/* Selected Plan Deep Comparison */}
      <div className="bg-[#202020] border border-[#303030] rounded-xl p-6 space-y-6">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 pb-4 border-b border-[#303030]">
          <div>
            <div className="flex items-center gap-2">
              <span className="px-2 py-0.5 rounded text-[10px] font-mono font-bold bg-[#FF5938]/20 text-[#FF5938] border border-[#FF5938]/30">
                {activePlan.strategy}
              </span>
              <h3 className="text-base font-bold text-white">{activePlan.title}</h3>
            </div>
            <p className="text-xs text-[#A0A0A0] mt-1">{activePlan.description}</p>
          </div>

          <div className="flex items-center gap-2 shrink-0">
            <button
              onClick={handleSubmitForApproval}
              className="flex items-center gap-1.5 px-4 py-2 rounded-lg bg-[#FF5938] hover:bg-[#F4512C] text-xs font-semibold text-white shadow-md transition-colors"
            >
              <span>Submit for Procurement Approval</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Deterministic Before vs After Comparison */}
        <div>
          <h4 className="text-xs font-bold uppercase tracking-wider text-[#737373] mb-3">
            Deterministic Before / After Comparison
          </h4>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="p-3.5 bg-[#151515] rounded-xl border border-[#303030]">
              <span className="text-[10px] text-[#737373] uppercase block">Risk Score Reduction</span>
              <div className="flex items-baseline gap-2 mt-1">
                <span className="text-sm font-mono line-through text-rose-400">{activePlan.beforeRisk}</span>
                <span className="text-xl font-bold font-mono text-emerald-400">{activePlan.afterRisk}</span>
                <span className="text-[10px] text-emerald-400 font-mono">(-{activePlan.beforeRisk - activePlan.afterRisk} pts)</span>
              </div>
            </div>

            <div className="p-3.5 bg-[#151515] rounded-xl border border-[#303030]">
              <span className="text-[10px] text-[#737373] uppercase block">Customer Delivery ETA</span>
              <div className="flex items-baseline gap-2 mt-1">
                <span className="text-sm font-mono line-through text-rose-400">+6d Late</span>
                <span className="text-xl font-bold font-mono text-emerald-400">+1d (On-Time)</span>
              </div>
            </div>

            <div className="p-3.5 bg-[#151515] rounded-xl border border-[#303030]">
              <span className="text-[10px] text-[#737373] uppercase block">Net Incremental Cost</span>
              <div className="flex items-baseline gap-2 mt-1">
                <span className="text-xl font-bold font-mono text-white">+${activePlan.deltaCost.toLocaleString()}</span>
              </div>
            </div>

            <div className="p-3.5 bg-[#151515] rounded-xl border border-[#303030]">
              <span className="text-[10px] text-[#737373] uppercase block">Mitigated Revenue</span>
              <div className="flex items-baseline gap-2 mt-1">
                <span className="text-xl font-bold font-mono text-emerald-400">
                  ${activePlan.mitigatedRevenue.toLocaleString()}
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* Operational Execution Mechanics */}
        <div className="p-4 bg-[#151515] rounded-xl border border-[#303030] text-xs space-y-2">
          <div className="text-[11px] font-semibold text-white">Execution Parameters & Validation Lineage</div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-[#A0A0A0] text-xs">
            <div>
              <span className="text-[#737373] block text-[10px]">Author & Persona</span>
              <span className="text-white font-medium">{activePlan.author}</span>
            </div>
            <div>
              <span className="text-[#737373] block text-[10px]">Feasibility Verification</span>
              <span className="text-emerald-400 font-mono font-medium">Deterministic Engine: 100% Stock Available</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
