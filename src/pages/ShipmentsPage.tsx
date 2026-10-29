import React, { useState, useEffect, useMemo } from 'react';
import { Truck, Navigation, Clock, AlertTriangle, CheckCircle, RefreshCw } from 'lucide-react';
import { EntranceWrapper } from '../components/motion/EntranceWrapper.tsx';
import { ScrollReveal } from '../components/motion/ScrollReveal.tsx';
import { useFilter } from '../context/FilterContext.tsx';

export const ShipmentsPage: React.FC = () => {
  const { searchQuery, region } = useFilter();
  const [shipments, setShipments] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  const fetchShipments = () => {
    setIsLoading(true);
    fetch('/api/shipments')
      .then((res) => res.json())
      .then((json) => {
        setShipments(json);
        setIsLoading(false);
      })
      .catch((err) => {
        console.error(err);
        setIsLoading(false);
      });
  };

  useEffect(() => {
    fetchShipments();
  }, []);

  const filteredShipments = useMemo(() => {
    return shipments.filter((sh) => {
      // Region filter
      if (region !== 'ALL') {
        const matchesOrigin = sh.origin?.toUpperCase().includes(region);
        const matchesDest = sh.destination?.toUpperCase().includes(region);
        if (!matchesOrigin && !matchesDest) return false;
      }
      // Search query
      if (searchQuery) {
        const q = searchQuery.toLowerCase();
        const matchesTrack = sh.tracking_number?.toLowerCase().includes(q);
        const matchesCarrier = sh.carrier?.toLowerCase().includes(q);
        const matchesLoc = sh.current_location?.toLowerCase().includes(q);
        if (!matchesTrack && !matchesCarrier && !matchesLoc) return false;
      }
      return true;
    });
  }, [shipments, region, searchQuery]);

  return (
    <div className="w-full space-y-6 pb-12">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-base font-semibold text-white">Inbound Freight & Carrier Tracking</h2>
          <p className="text-xs text-[#A0A0A0]">
            Real-time carrier milestone telemetry and berth/customs monitoring ({filteredShipments.length} shipments shown)
          </p>
        </div>
        <button
          onClick={fetchShipments}
          disabled={isLoading}
          className="p-2 rounded-lg bg-[#202020] hover:bg-[#303030] text-[#A0A0A0] hover:text-white transition-colors border border-[#303030] cursor-pointer"
          title="Refresh Shipments"
        >
          <RefreshCw className={`w-4 h-4 ${isLoading ? 'animate-spin' : ''}`} />
        </button>
      </div>

      <ScrollReveal direction="bottom-right" delay={0.1}>
        <div className="bg-[#202020] border border-[#303030] rounded-xl overflow-hidden shadow-sm card-lift">
          <table className="w-full text-left text-xs">
            <thead className="bg-[#151515] border-b border-[#303030] text-[#737373]">
              <tr>
                <th className="py-3 px-4 font-medium">Tracking Number</th>
                <th className="py-3 px-4 font-medium">Carrier</th>
                <th className="py-3 px-4 font-medium">Origin → Destination</th>
                <th className="py-3 px-4 font-medium">Current Location</th>
                <th className="py-3 px-4 font-medium text-right">Delay</th>
                <th className="py-3 px-4 font-medium text-right">Delivery ETA</th>
                <th className="py-3 px-4 font-medium text-right">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#2B2B2B]">
              {filteredShipments.length === 0 ? (
                <tr>
                  <td colSpan={7} className="py-8 text-center text-[#737373] text-xs">
                    No shipments match the active filter criteria.
                  </td>
                </tr>
              ) : (
                filteredShipments.map((sh) => (
                  <tr key={sh.id} className="hover:bg-[#151515] transition-colors">
                    <td className="py-3.5 px-4 font-mono font-medium text-white">{sh.tracking_number}</td>
                    <td className="py-3.5 px-4 text-white">{sh.carrier}</td>
                    <td className="py-3.5 px-4 text-[#A0A0A0]">
                      {sh.origin} → {sh.destination}
                    </td>
                    <td className="py-3.5 px-4 text-white">
                      <div className="flex items-center gap-1.5">
                        <Navigation className="w-3.5 h-3.5 text-[#FF5938] shrink-0" />
                        <span className="truncate">{sh.current_location}</span>
                      </div>
                    </td>
                    <td className="py-3.5 px-4 font-mono text-right text-[#FF5938] font-bold">
                      +{sh.delay_days} days
                    </td>
                    <td className="py-3.5 px-4 font-mono text-right text-white">
                      {new Date(sh.estimated_delivery_date).toLocaleDateString()}
                    </td>
                    <td className="py-3.5 px-4 text-right">
                      <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-[#FF5938]/20 text-[#FF5938] border border-[#FF5938]/30">
                        {sh.status}
                      </span>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </ScrollReveal>
    </div>
  );
};
