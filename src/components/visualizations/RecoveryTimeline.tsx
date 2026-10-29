import React, { useState, useEffect } from 'react';
import { GitBranch, CheckCircle2, Clock, ShieldCheck, ArrowRight, Activity, AlertCircle } from 'lucide-react';

export const RecoveryTimeline: React.FC = () => {
  const [stages, setStages] = useState<any[]>([]);

  useEffect(() => {
    fetch('/api/recovery/timeline')
      .then((res) => res.json())
      .then((json) => setStages(json.stages || []))
      .catch((err) => console.error(err));
  }, []);

  return (
    <div className="bg-white dark:bg-[#202020] border border-slate-200 dark:border-[#303030] rounded-xl p-6 space-y-5 card-lift transition-colors">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-slate-200 dark:border-[#2D2D2D]">
        <div>
          <div className="flex items-center gap-2">
            <GitBranch className="w-4 h-4 text-[#FF5938]" />
            <h3 className="text-base font-semibold text-slate-900 dark:text-white">Operational Recovery Lifecycle</h3>
          </div>
          <p className="text-xs text-slate-500 dark:text-[#A0A0A0] mt-0.5">
            Traceable operational sequence: from anomaly ingestion through four-eyes sign-off to recalculated risk.
          </p>
        </div>

        <span className="text-xs font-mono text-emerald-600 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800 px-2.5 py-1 rounded font-semibold">
          Four-Eyes Principle Active
        </span>
      </div>

      {/* Horizontal / Grid Timeline Steps */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-6 gap-3">
        {stages.map((stage) => {
          const isDone = stage.status === 'COMPLETED';
          const isPending = stage.status === 'PENDING_DECISION';

          return (
            <div
              key={stage.stageNumber}
              className={`p-3.5 rounded-xl border flex flex-col justify-between transition-all ${
                isDone
                  ? 'bg-slate-50 dark:bg-[#151515] border-emerald-300 dark:border-emerald-900/60 shadow-sm'
                  : isPending
                  ? 'bg-amber-50/50 dark:bg-[#181818] border-amber-400 dark:border-amber-500/60 ring-1 ring-amber-400/30'
                  : 'bg-slate-50/60 dark:bg-[#151515] border-slate-200 dark:border-[#2B2B2B] opacity-80'
              }`}
            >
              <div>
                <div className="flex items-center justify-between pb-2 border-b border-slate-200 dark:border-[#252525]">
                  <span className="text-xs font-mono text-slate-400 dark:text-[#737373]">
                    0{stage.stageNumber}
                  </span>
                  {isDone ? (
                    <span className="flex items-center gap-1 text-[11px] font-bold text-emerald-600 dark:text-emerald-400 font-mono">
                      <CheckCircle2 className="w-3.5 h-3.5" /> DONE
                    </span>
                  ) : isPending ? (
                    <span className="flex items-center gap-1 text-[11px] font-bold text-amber-600 dark:text-amber-400 font-mono animate-pulse">
                      <Clock className="w-3.5 h-3.5" /> PENDING
                    </span>
                  ) : (
                    <span className="text-[11px] font-mono text-slate-400 dark:text-[#737373]">
                      QUEUED
                    </span>
                  )}
                </div>

                <h4 className="text-xs font-bold text-slate-900 dark:text-white mt-2 leading-tight">
                  {stage.name}
                </h4>
                <p className="text-xs text-slate-600 dark:text-[#A0A0A0] mt-1.5 leading-relaxed">
                  {stage.detail}
                </p>
              </div>

              <div className="mt-4 pt-2 border-t border-slate-200 dark:border-[#252525] text-[11px] text-slate-500 dark:text-[#737373] font-mono truncate">
                <span>{stage.actor}</span>
              </div>
            </div>
          );
        })}
      </div>

      <div className="flex items-center justify-between text-xs text-slate-500 dark:text-[#737373] pt-2 border-t border-slate-200 dark:border-[#2D2D2D]">
        <span>All recovery actions remain deterministic and require explicit separation-of-duties authorization.</span>
        <span className="font-mono text-slate-600 dark:text-[#A0A0A0] font-semibold">Audit Lineage: Guaranteed</span>
      </div>
    </div>
  );
};
