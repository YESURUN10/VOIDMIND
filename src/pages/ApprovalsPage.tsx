import React, { useState } from 'react';
import { CheckSquare, CheckCircle, XCircle, AlertTriangle, ShieldCheck, UserX } from 'lucide-react';
import { useAuth } from '../context/AuthContext.tsx';

export const ApprovalsPage: React.FC = () => {
  const { currentUser } = useAuth();
  const [decisionNotes, setDecisionNotes] = useState('');
  const [actionMessage, setActionMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  // Separation of duties rule check
  const isProcurementOrAdmin =
    currentUser.role === 'PROCUREMENT_APPROVER' || currentUser.role === 'ADMINISTRATOR';

  const pendingPlan = {
    id: 'plan_realloc_01',
    title: 'Inter-Facility Stock Reallocation',
    strategy: 'STOCK_REALLOCATION',
    authorId: 'usr_manager_01',
    authorName: 'Marcus Vance',
    authorRole: 'SUPPLY_CHAIN_MANAGER',
    disruptionTitle: 'Long Beach Terminal Congestion (TRK-MAERSK-9021)',
    deltaCost: 1450,
    daysSaved: 5,
    mitigatedRevenue: 285000,
    riskReduction: '78 → 22 (-56 pts)',
    submittedAt: 'Today at 10:45 AM',
  };

  const handleDecision = (action: 'APPROVE' | 'REJECT' | 'MODIFY') => {
    // 1. Separation of duties check: Plan author cannot approve their own plan!
    if (currentUser.id === pendingPlan.authorId) {
      setActionMessage({
        type: 'error',
        text: '❌ Separation of Duties Violation: You are the author of this recovery plan (Marcus Vance). Plan author cannot approve their own proposal. Please switch to Sophia Sterling (Procurement Approver) or Alexander Cole (Admin).',
      });
      return;
    }

    // 2. Role permission check
    if (!isProcurementOrAdmin) {
      setActionMessage({
        type: 'error',
        text: `❌ Unauthorized Role: Role '${currentUser.role}' does not have sign-off authority. Only Procurement Approver or Administrator can approve expedited spend.`,
      });
      return;
    }

    // 3. Success
    setActionMessage({
      type: 'success',
      text: `✅ Action '${action}' successfully committed to PostgreSQL database and append-only audit ledger by ${currentUser.name} (${currentUser.role}).`,
    });
  };

  return (
    <div className="w-full space-y-6 pb-12">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-base font-semibold text-white">Separation-of-Duties Approval Queue</h2>
          <p className="text-xs text-[#A0A0A0]">
            Four-eyes principle: Procurement sign-off required for capital expenditure and freight reallocation
          </p>
        </div>
        <div className="flex items-center gap-2">
          <span className="px-3 py-1 rounded-lg bg-[#202020] border border-[#303030] text-xs font-mono text-white">
            Current Persona: <span className="text-[#FF5938] font-bold">{currentUser.name}</span>
          </span>
        </div>
      </div>

      {actionMessage && (
        <div
          className={`p-4 rounded-xl border text-xs leading-relaxed flex items-start gap-3 ${
            actionMessage.type === 'success'
              ? 'bg-emerald-950/40 border-emerald-800 text-emerald-300'
              : 'bg-rose-950/40 border-rose-800 text-rose-300'
          }`}
        >
          {actionMessage.type === 'success' ? (
            <CheckCircle className="w-5 h-5 text-emerald-400 shrink-0 mt-0.5" />
          ) : (
            <UserX className="w-5 h-5 text-rose-400 shrink-0 mt-0.5" />
          )}
          <span>{actionMessage.text}</span>
        </div>
      )}

      {/* Pending Item Card */}
      <div className="bg-[#202020] border border-[#303030] rounded-xl p-6 space-y-6">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 pb-4 border-b border-[#303030]">
          <div>
            <div className="flex items-center gap-2">
              <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-amber-500/20 text-amber-400 border border-amber-500/30">
                PENDING AUTHORIZATION
              </span>
              <h3 className="text-base font-bold text-white">{pendingPlan.title}</h3>
            </div>
            <p className="text-xs text-[#A0A0A0] mt-1">
              Triggered by: {pendingPlan.disruptionTitle}
            </p>
          </div>

          <div className="text-right">
            <span className="text-[10px] text-[#737373] block uppercase">Plan Author</span>
            <span className="text-xs text-white font-medium">
              {pendingPlan.authorName} ({pendingPlan.authorRole.replace(/_/g, ' ')})
            </span>
          </div>
        </div>

        {/* Financial & Delay Impact Matrix */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs">
          <div className="p-3 bg-[#151515] rounded-xl border border-[#303030]">
            <span className="text-[10px] text-[#737373] uppercase block">Incremental Spend</span>
            <span className="text-lg font-bold font-mono text-white mt-1 block">
              +${pendingPlan.deltaCost.toLocaleString()}
            </span>
          </div>
          <div className="p-3 bg-[#151515] rounded-xl border border-[#303030]">
            <span className="text-[10px] text-[#737373] uppercase block">Lead Time Recovery</span>
            <span className="text-lg font-bold font-mono text-emerald-400 mt-1 block">
              +{pendingPlan.daysSaved} Days Saved
            </span>
          </div>
          <div className="p-3 bg-[#151515] rounded-xl border border-[#303030]">
            <span className="text-[10px] text-[#737373] uppercase block">Mitigated Order Value</span>
            <span className="text-lg font-bold font-mono text-emerald-400 mt-1 block">
              ${pendingPlan.mitigatedRevenue.toLocaleString()}
            </span>
          </div>
          <div className="p-3 bg-[#151515] rounded-xl border border-[#303030]">
            <span className="text-[10px] text-[#737373] uppercase block">Risk Score Delta</span>
            <span className="text-lg font-bold font-mono text-white mt-1 block">
              {pendingPlan.riskReduction}
            </span>
          </div>
        </div>

        {/* Action Controls */}
        <div className="space-y-3 pt-2">
          <label className="text-xs font-medium text-[#A0A0A0] block">
            Procurement Reviewer Notes / Justification
          </label>
          <input
            type="text"
            placeholder="e.g. Surcharge approved within discretionary logistics budget. Safe to dispatch."
            value={decisionNotes}
            onChange={(e) => setDecisionNotes(e.target.value)}
            className="w-full bg-[#151515] border border-[#303030] rounded-lg px-3 py-2 text-xs text-white focus:outline-none focus:border-[#FF5938]"
          />

          <div className="flex flex-wrap items-center justify-end gap-3 pt-2">
            <button
              onClick={() => handleDecision('MODIFY')}
              className="px-4 py-2 rounded-lg bg-[#151515] hover:bg-[#252525] border border-[#303030] text-xs text-amber-400 font-medium transition-colors"
            >
              Request Modification
            </button>
            <button
              onClick={() => handleDecision('REJECT')}
              className="px-4 py-2 rounded-lg bg-[#151515] hover:bg-rose-950/40 border border-rose-900 text-xs text-rose-400 font-medium transition-colors"
            >
              Reject Plan
            </button>
            <button
              onClick={() => handleDecision('APPROVE')}
              className="px-5 py-2 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-xs font-semibold text-white shadow-md transition-colors"
            >
              Approve & Authorize Execution
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
