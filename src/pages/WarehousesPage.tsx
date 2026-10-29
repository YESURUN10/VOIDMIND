import React, { useState, useEffect } from 'react';
import { Warehouse as WarehouseIcon, MapPin, Activity, HardDrive } from 'lucide-react';

export const WarehousesPage: React.FC = () => {
  const [warehouses, setWarehouses] = useState<any[]>([]);

  useEffect(() => {
    fetch('/api/warehouses')
      .then((res) => res.json())
      .then((data) => setWarehouses(data))
      .catch((err) => console.error(err));
  }, []);

  return (
    <div className="w-full space-y-6 pb-12">
      <div>
        <h2 className="text-base font-semibold text-white">Fulfillment Hubs & Warehouse Network</h2>
        <p className="text-xs text-[#A0A0A0]">Regional distribution nodes, capacity thresholds, and bin utilization</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {warehouses.map((wh) => {
          const utilPct = Math.round((wh.utilized_units / wh.capacity_units) * 100);
          return (
            <div key={wh.id} className="bg-[#202020] border border-[#303030] rounded-xl p-5 flex flex-col justify-between">
              <div>
                <div className="flex items-center justify-between pb-3 border-b border-[#2B2B2B]">
                  <span className="font-mono text-xs font-semibold text-[#FF5938]">{wh.code}</span>
                  <span className="px-2 py-0.5 rounded text-[10px] font-medium bg-[#151515] border border-[#303030] text-emerald-400">
                    {wh.status}
                  </span>
                </div>
                <h3 className="text-sm font-bold text-white mt-3">{wh.name}</h3>
                <p className="text-xs text-[#A0A0A0] flex items-center gap-1 mt-1">
                  <MapPin className="w-3.5 h-3.5 text-[#737373]" />
                  {wh.city}, {wh.country} ({wh.region})
                </p>
              </div>

              <div className="mt-6 space-y-2">
                <div className="flex items-center justify-between text-xs">
                  <span className="text-[#A0A0A0]">Capacity Utilized</span>
                  <span className="font-mono text-white font-medium">{utilPct}%</span>
                </div>
                <div className="w-full h-2 rounded-full bg-[#151515] overflow-hidden">
                  <div
                    className={`h-full rounded-full ${
                      utilPct > 85 ? 'bg-[#FF5938]' : 'bg-emerald-500'
                    }`}
                    style={{ width: `${utilPct}%` }}
                  />
                </div>
                <div className="flex justify-between text-[11px] text-[#737373] font-mono">
                  <span>{wh.utilized_units?.toLocaleString()} used</span>
                  <span>{wh.capacity_units?.toLocaleString()} max</span>
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};
