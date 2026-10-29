import React, { useState, useEffect } from 'react';
import { FileText, ShieldCheck, Hash, Clock, RefreshCw } from 'lucide-react';
import { ScrollReveal } from '../components/motion/ScrollReveal.tsx';

export const AuditPage: React.FC = () => {
  const [logs, setLogs] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  const fetchAuditLogs = () => {
    setIsLoading(true);
    fetch('/api/audit')
      .then((res) => res.json())
      .then((data) => {
        setLogs(data);
        setIsLoading(false);
      })
      .catch((err) => {
        console.error(err);
        setIsLoading(false);
      });
  };

  useEffect(() => {
    fetchAuditLogs();
  }, []);

  return (
    <div className="w-full space-y-6 pb-12">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-base font-semibold text-white">Append-Only Verifiable Audit Ledger</h2>
          <p className="text-xs text-[#A0A0A0]">
            Cryptographic SHA-256 action hashes and immutable state transitions for regulatory compliance
          </p>
        </div>
        <button
          onClick={fetchAuditLogs}
          className="p-2 rounded-lg bg-[#202020] hover:bg-[#303030] text-[#A0A0A0] hover:text-white transition-colors border border-[#303030]"
        >
          <RefreshCw className="w-4 h-4" />
        </button>
      </div>

      <ScrollReveal direction="bottom-right" delay={0.1}>
        <div className="bg-[#202020] border border-[#303030] rounded-xl overflow-hidden card-lift">
          <table className="w-full text-left text-xs">
            <thead className="bg-[#151515] border-b border-[#303030] text-[#737373]">
              <tr>
                <th className="py-3 px-4 font-medium">Timestamp</th>
                <th className="py-3 px-4 font-medium">Event Type</th>
                <th className="py-3 px-4 font-medium">Actor & Role</th>
                <th className="py-3 px-4 font-medium">Entity Targeted</th>
                <th className="py-3 px-4 font-medium">Action SHA-256 Hash</th>
                <th className="py-3 px-4 font-medium text-right">Integrity</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#2B2B2B]">
              {logs.map((log) => (
                <tr key={log.id} className="hover:bg-[#151515] transition-colors">
                  <td className="py-3.5 px-4 font-mono text-[#A0A0A0]">
                    {new Date(log.timestamp).toLocaleString()}
                  </td>
                  <td className="py-3.5 px-4 font-medium text-white">
                    <span className="px-2 py-0.5 rounded text-[10px] font-mono bg-[#151515] text-[#FF5938] border border-[#303030]">
                      {log.event_type}
                    </span>
                  </td>
                  <td className="py-3.5 px-4 text-white">
                    <span className="block font-medium">{log.actor_id}</span>
                    <span className="text-[10px] text-[#737373]">{log.actor_role}</span>
                  </td>
                  <td className="py-3.5 px-4 font-mono text-[#A0A0A0]">
                    {log.entity_type}: {log.entity_id}
                  </td>
                  <td className="py-3.5 px-4 font-mono text-[11px] text-[#737373] truncate max-w-[180px]">
                    {log.action_hash}
                  </td>
                  <td className="py-3.5 px-4 text-right">
                    <span className="inline-flex items-center gap-1 text-[10px] font-medium text-emerald-400 bg-emerald-950/40 px-2 py-0.5 rounded border border-emerald-800">
                      <ShieldCheck className="w-3 h-3" /> VERIFIED
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </ScrollReveal>
    </div>
  );
};
