import React, { useState, useEffect } from 'react';
import { Users, ShieldCheck, AlertCircle, Award } from 'lucide-react';

export const SuppliersPage: React.FC = () => {
  const [suppliers, setSuppliers] = useState<any[]>([]);

  useEffect(() => {
    fetch('/api/suppliers')
      .then((res) => res.json())
      .then((data) => setSuppliers(data))
      .catch((err) => console.error(err));
  }, []);

  return (
    <div className="w-full space-y-6 pb-12">
      <div>
        <h2 className="text-base font-semibold text-white">Supplier Scorecard & Sourcing Directory</h2>
        <p className="text-xs text-[#A0A0A0]">Historical SLA performance, defect rates, and multi-tier supplier reliability</p>
      </div>

      <div className="bg-[#202020] border border-[#303030] rounded-xl overflow-hidden">
        <table className="w-full text-left text-xs">
          <thead className="bg-[#151515] border-b border-[#303030] text-[#737373]">
            <tr>
              <th className="py-3 px-4 font-medium">Supplier Code & Name</th>
              <th className="py-3 px-4 font-medium">Country / Region</th>
              <th className="py-3 px-4 font-medium">Tier</th>
              <th className="py-3 px-4 font-medium text-right">Standard Lead Time</th>
              <th className="py-3 px-4 font-medium text-right">On-Time Delivery</th>
              <th className="py-3 px-4 font-medium text-right">Defect Rate</th>
              <th className="py-3 px-4 font-medium text-right">Risk Score</th>
              <th className="py-3 px-4 font-medium text-right">Status</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-[#2B2B2B]">
            {suppliers.map((s) => (
              <tr key={s.id} className="hover:bg-[#151515] transition-colors">
                <td className="py-3.5 px-4">
                  <span className="font-mono text-white font-medium block">{s.name}</span>
                  <span className="text-[11px] text-[#737373]">{s.code}</span>
                </td>
                <td className="py-3.5 px-4 text-[#A0A0A0]">
                  {s.country} ({s.region})
                </td>
                <td className="py-3.5 px-4">
                  <span className="px-2 py-0.5 rounded text-[10px] font-semibold bg-[#151515] text-white border border-[#303030]">
                    Tier {s.tier}
                  </span>
                </td>
                <td className="py-3.5 px-4 font-mono text-right text-white">{s.lead_time_days} days</td>
                <td className="py-3.5 px-4 font-mono text-right text-emerald-400 font-bold">
                  {s.on_time_delivery_rate}%
                </td>
                <td className="py-3.5 px-4 font-mono text-right text-[#A0A0A0]">{s.defect_rate}%</td>
                <td className="py-3.5 px-4 font-mono text-right font-medium">
                  <span
                    className={
                      s.risk_score > 40
                        ? 'text-[#FF5938]'
                        : s.risk_score > 25
                        ? 'text-amber-400'
                        : 'text-emerald-400'
                    }
                  >
                    {s.risk_score} / 100
                  </span>
                </td>
                <td className="py-3.5 px-4 text-right">
                  <span className="px-2 py-0.5 rounded text-[10px] font-medium bg-[#151515] border border-[#303030] text-emerald-400">
                    {s.status}
                  </span>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};
