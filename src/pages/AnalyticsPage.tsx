import React, { useState } from 'react';
import { TrendingUp, BarChart3, Clock, AlertTriangle, ArrowUpRight, ArrowDownRight } from 'lucide-react';
import { ScrollReveal } from '../components/motion/ScrollReveal.tsx';

export const AnalyticsPage: React.FC = () => {
  const [timeRange, setTimeRange] = useState('Quarter');

  const carrierPerformance = [
    { carrier: 'Maersk Line', mode: 'Ocean Freight', reliability: 91.2, avgDelayDays: 2.1, volume: '42%', onTimeScore: 94 },
    { carrier: 'DHL Global Forwarding', mode: 'Air Express', reliability: 97.8, avgDelayDays: 0.4, volume: '28%', onTimeScore: 98 },
    { carrier: 'FedEx Freight', mode: 'Domestic Intermodal', reliability: 95.4, avgDelayDays: 0.8, volume: '18%', onTimeScore: 96 },
    { carrier: 'Hapag-Lloyd', mode: 'Ocean Freight', reliability: 86.5, avgDelayDays: 3.4, volume: '12%', onTimeScore: 88 },
  ];

  return (
    <div className="w-full space-y-6 pb-12">
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="bg-[#202020] border border-[#303030] rounded-xl p-4">
          <span className="text-xs text-[#A0A0A0]">Lead Time Variability</span>
          <h3 className="text-2xl font-bold font-mono text-white mt-1">± 2.4 <span className="text-xs font-normal text-[#A0A0A0]">Days</span></h3>
          <p className="text-[11px] text-emerald-400 mt-2 flex items-center gap-1">
            <ArrowDownRight className="w-3.5 h-3.5" /> -0.6d vs prior period
          </p>
        </div>
        <div className="bg-[#202020] border border-[#303030] rounded-xl p-4">
          <span className="text-xs text-[#A0A0A0]">Expedited Freight Spend</span>
          <h3 className="text-2xl font-bold font-mono text-white mt-1">$48,250</h3>
          <p className="text-[11px] text-[#FF5938] mt-2 flex items-center gap-1">
            <ArrowUpRight className="w-3.5 h-3.5" /> +12% during Long Beach event
          </p>
        </div>
        <div className="bg-[#202020] border border-[#303030] rounded-xl p-4">
          <span className="text-xs text-[#A0A0A0]">Critical Path Margin</span>
          <h3 className="text-2xl font-bold font-mono text-white mt-1">94.1%</h3>
          <p className="text-[11px] text-emerald-400 mt-2 flex items-center gap-1">
            <ArrowUpRight className="w-3.5 h-3.5" /> Resilient buffer maintained
          </p>
        </div>
        <div className="bg-[#202020] border border-[#303030] rounded-xl p-4">
          <span className="text-xs text-[#A0A0A0]">Customer SLA Breach Rate</span>
          <h3 className="text-2xl font-bold font-mono text-white mt-1">0.8%</h3>
          <p className="text-[11px] text-emerald-400 mt-2 flex items-center gap-1">
            <ArrowDownRight className="w-3.5 h-3.5" /> Target &lt; 1.5%
          </p>
        </div>
      </div>

      {/* Carrier Performance Table */}
      <ScrollReveal direction="bottom-right" delay={0.1}>
        <div className="bg-[#202020] border border-[#303030] rounded-xl p-5 card-lift">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h3 className="text-sm font-semibold text-white">Carrier Performance & Transit Reliability</h3>
              <p className="text-xs text-[#A0A0A0]">Historical transit variance across primary logistics partners</p>
            </div>
            <span className="text-xs font-mono text-[#737373]">Q4 Benchmarks</span>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead>
                <tr className="border-b border-[#303030] text-[#737373]">
                  <th className="pb-3 font-medium">Carrier</th>
                  <th className="pb-3 font-medium">Modality</th>
                  <th className="pb-3 font-medium text-right">Volume Share</th>
                  <th className="pb-3 font-medium text-right">Avg Dwell / Delay</th>
                  <th className="pb-3 font-medium text-right">Reliability Index</th>
                  <th className="pb-3 font-medium text-right">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#2B2B2B]">
                {carrierPerformance.map((c) => (
                  <tr key={c.carrier} className="hover:bg-[#151515] transition-colors">
                    <td className="py-3 font-medium text-white">{c.carrier}</td>
                    <td className="py-3 text-[#A0A0A0]">{c.mode}</td>
                    <td className="py-3 font-mono text-right text-white">{c.volume}</td>
                    <td className="py-3 font-mono text-right text-[#A0A0A0]">{c.avgDelayDays} days</td>
                    <td className="py-3 font-mono text-right font-medium text-emerald-400">{c.reliability}%</td>
                    <td className="py-3 text-right">
                      <span className="px-2 py-0.5 rounded text-[10px] font-medium bg-[#151515] border border-[#303030] text-emerald-300">
                        OPTIMAL
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </ScrollReveal>
    </div>
  );
};
