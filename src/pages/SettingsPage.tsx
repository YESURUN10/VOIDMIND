import React, { useState, useEffect } from 'react';
import {
  Settings,
  Shield,
  Database,
  Cpu,
  RefreshCw,
  Check,
  Send,
  Radio,
  AlertTriangle,
  RotateCcw,
} from 'lucide-react';
import { useAuth } from '../context/AuthContext.tsx';
import { EntranceWrapper } from '../components/motion/EntranceWrapper.tsx';

interface SettingsPageProps {
  onNavigate?: (path: string) => void;
}

export const SettingsPage: React.FC<SettingsPageProps> = ({ onNavigate }) => {
  const { currentUser } = useAuth();
  const [selectedScenario, setSelectedScenario] = useState('High-Tech Electronics & Microelectronics');
  const [dbStatus, setDbStatus] = useState<any>(null);
  const [isCheckingDb, setIsCheckingDb] = useState(false);
  const [notification, setNotification] = useState<string | null>(null);

  // Webhook simulator state
  const [webhookTrackingNum, setWebhookTrackingNum] = useState('TRK-MAERSK-9021');
  const [webhookCarrier, setWebhookCarrier] = useState('Maersk');
  const [webhookStatus, setWebhookStatus] = useState('DELAYED');
  const [webhookDelayDays, setWebhookDelayDays] = useState(6);
  const [isSendingWebhook, setIsSendingWebhook] = useState(false);
  const [webhookResponse, setWebhookResponse] = useState<any>(null);

  useEffect(() => {
    checkDbStatus();
  }, []);

  const checkDbStatus = () => {
    setIsCheckingDb(true);
    fetch('/api/db/status')
      .then((res) => res.json())
      .then((json) => {
        setDbStatus(json);
        setIsCheckingDb(false);
      })
      .catch((err) => {
        console.error(err);
        setIsCheckingDb(false);
      });
  };

  const handleScenarioChange = (scenarioName: string) => {
    setSelectedScenario(scenarioName);
    setNotification(`Switched active operational catalog to: ${scenarioName}`);
    setTimeout(() => setNotification(null), 3500);
  };

  const handleSendWebhook = async () => {
    setIsSendingWebhook(true);
    setWebhookResponse(null);
    try {
      const res = await fetch('/api/webhooks/carrier', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          event_id: `evt_sim_${Date.now()}`,
          tracking_number: webhookTrackingNum,
          carrier: webhookCarrier,
          status: webhookStatus,
          location: 'Terminal Port Gate 4',
          timestamp: new Date().toISOString(),
          delay_days: Number(webhookDelayDays),
          reason: 'Manual telemetry simulation via VoidMind operator console',
        }),
      });
      const data = await res.json();
      setWebhookResponse({ status: res.status, data });
      checkDbStatus();
    } catch (err: any) {
      setWebhookResponse({ status: 500, data: { error: err.message } });
    } finally {
      setIsSendingWebhook(false);
    }
  };

  const scenarios = [
    {
      id: 'scen_electronics',
      name: 'High-Tech Electronics & Microelectronics',
      description: 'Silicon wafers, microcontroller arrays, printed circuit boards, high-risk air/ocean freight lanes.',
      activeCount: '1,350 units WIP',
    },
    {
      id: 'scen_automotive',
      name: 'Automotive Components & Powertrain',
      description: 'Tier-1 castings, electronic brake modules, just-in-time sequential delivery protocols.',
      activeCount: '890 units WIP',
    },
    {
      id: 'scen_pharma',
      name: 'Pharmaceuticals & Cold-Chain Biologics',
      description: 'Temperature-monitored vaccine vials, active temperature loggers, stringent customs clearance.',
      activeCount: '4,200 vials WIP',
    },
    {
      id: 'scen_consumer',
      name: 'Consumer Goods & Retail Distribution',
      description: 'High-volume apparel, seasonal peak logistics, cross-docking distribution centers.',
      activeCount: '12,500 units WIP',
    },
  ];

  return (
    <div className="w-full space-y-6 pb-12">
      {/* Toast notification */}
      {notification && (
        <div className="fixed bottom-6 right-6 z-50 bg-[#202020] border border-[#FF5938] text-white px-4 py-3 rounded-xl shadow-2xl flex items-center gap-3 text-xs animate-in fade-in slide-in-from-bottom-2">
          <Check className="w-4 h-4 text-[#FF5938]" />
          <span>{notification}</span>
        </div>
      )}

      <div>
        <h2 className="text-base font-semibold text-white">System Settings & Scenario Configuration</h2>
        <p className="text-xs text-[#A0A0A0]">
          Platform identity, synthetic industry scenarios, carrier webhook simulation, and relational database health
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Industry Domain Scenario */}
        <EntranceWrapper staggerIndex={0}>
          <div className="bg-[#202020] border border-[#303030] rounded-xl p-5 space-y-4 h-full flex flex-col justify-between">
            <div>
              <div className="flex items-center gap-2 pb-3 border-b border-[#303030]">
                <Cpu className="w-4 h-4 text-[#FF5938]" />
                <h3 className="text-xs font-bold text-white uppercase tracking-wider">
                  Operational Domain Catalog
                </h3>
              </div>
              <p className="text-[11px] text-[#A0A0A0] mt-2 mb-3">
                Select an active supply-chain profile to simulate domain-specific SKU characteristics, freight modalities, and risk buffers.
              </p>
              <div className="space-y-2">
                {scenarios.map((scen) => (
                  <div
                    key={scen.id}
                    onClick={() => handleScenarioChange(scen.name)}
                    className={`p-3 rounded-lg border cursor-pointer transition-all ${
                      selectedScenario === scen.name
                        ? 'bg-[#151515] border-[#FF5938]'
                        : 'bg-[#181818] border-[#303030] hover:border-[#404040]'
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-semibold text-white">{scen.name}</span>
                      {selectedScenario === scen.name ? (
                        <Check className="w-4 h-4 text-[#FF5938]" />
                      ) : (
                        <span className="text-[10px] text-[#737373]">{scen.activeCount}</span>
                      )}
                    </div>
                    <p className="text-[11px] text-[#A0A0A0] mt-1">{scen.description}</p>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </EntranceWrapper>

        {/* Database Diagnostic Status */}
        <EntranceWrapper staggerIndex={1}>
          <div className="bg-[#202020] border border-[#303030] rounded-xl p-5 space-y-4 h-full flex flex-col justify-between">
            <div>
              <div className="flex items-center justify-between pb-3 border-b border-[#303030]">
                <div className="flex items-center gap-2">
                  <Database className="w-4 h-4 text-[#FF5938]" />
                  <h3 className="text-xs font-bold text-white uppercase tracking-wider">
                    Relational Database Diagnostics
                  </h3>
                </div>
                <button
                  onClick={checkDbStatus}
                  disabled={isCheckingDb}
                  className="flex items-center gap-1 text-[11px] text-[#A0A0A0] hover:text-white cursor-pointer"
                >
                  <RefreshCw className={`w-3 h-3 ${isCheckingDb ? 'animate-spin' : ''}`} />
                  <span>Refresh</span>
                </button>
              </div>

              <div className="mt-3 space-y-2 text-xs">
                <div className="flex justify-between p-2 rounded bg-[#151515] border border-[#303030]">
                  <span className="text-[#A0A0A0]">Database Architecture</span>
                  <span className="text-emerald-400 font-mono font-medium">PostgreSQL (Relational Store)</span>
                </div>
                <div className="flex justify-between p-2 rounded bg-[#151515] border border-[#303030]">
                  <span className="text-[#A0A0A0]">Foreign Key Constraints</span>
                  <span className="text-emerald-400 font-mono font-medium">Active (16 Relational Tables)</span>
                </div>
                <div className="flex justify-between p-2 rounded bg-[#151515] border border-[#303030]">
                  <span className="text-[#A0A0A0]">Schema Migration Engine</span>
                  <span className="text-white font-mono">Drizzle ORM</span>
                </div>
                <div className="flex justify-between p-2 rounded bg-[#151515] border border-[#303030]">
                  <span className="text-[#A0A0A0]">Execution Mode</span>
                  <span className="text-amber-400 font-mono">
                    {dbStatus?.isEmulatedPg ? 'In-Memory Relational Engine (pg-mem)' : 'Live PostgreSQL Cluster'}
                  </span>
                </div>

                {dbStatus && (
                  <div className="pt-2 border-t border-[#303030] space-y-1 text-[11px] font-mono">
                    <span className="text-[#737373] block uppercase text-[10px]">Active Record Counts</span>
                    <div className="grid grid-cols-2 gap-1 max-h-40 overflow-y-auto pr-1">
                      {Object.entries(dbStatus.tableCounts || {}).map(([tbl, cnt]: any) => (
                        <div key={tbl} className="flex justify-between text-[#A0A0A0] px-2 py-1 bg-[#181818] rounded">
                          <span className="truncate">{tbl}</span>
                          <span className="text-white font-bold ml-2">{cnt}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
        </EntranceWrapper>

        {/* Carrier Webhook Simulator */}
        <EntranceWrapper staggerIndex={2} className="lg:col-span-2">
          <div className="bg-[#202020] border border-[#303030] rounded-xl p-5 space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-[#303030]">
              <div className="flex items-center gap-2">
                <Radio className="w-4 h-4 text-[#FF5938]" />
                <h3 className="text-xs font-bold text-white uppercase tracking-wider">
                  Carrier Telemetry & Webhook Simulator
                </h3>
              </div>
              <span className="text-[11px] text-[#737373] font-mono">Endpoint: POST /api/webhooks/carrier</span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-4 gap-4 text-xs">
              <div>
                <label className="block text-[11px] text-[#A0A0A0] mb-1">Tracking Number</label>
                <input
                  type="text"
                  value={webhookTrackingNum}
                  onChange={(e) => setWebhookTrackingNum(e.target.value)}
                  className="w-full bg-[#151515] border border-[#303030] rounded-lg px-3 py-2 text-white font-mono focus:outline-none focus:border-[#FF5938]"
                />
              </div>

              <div>
                <label className="block text-[11px] text-[#A0A0A0] mb-1">Carrier</label>
                <select
                  value={webhookCarrier}
                  onChange={(e) => setWebhookCarrier(e.target.value)}
                  className="w-full bg-[#151515] border border-[#303030] rounded-lg px-3 py-2 text-white focus:outline-none focus:border-[#FF5938]"
                >
                  <option value="Maersk">Maersk Line</option>
                  <option value="FedEx Freight">FedEx Freight</option>
                  <option value="Kuehne+Nagel">Kuehne+Nagel</option>
                  <option value="Hapag-Lloyd">Hapag-Lloyd</option>
                </select>
              </div>

              <div>
                <label className="block text-[11px] text-[#A0A0A0] mb-1">Milestone Status</label>
                <select
                  value={webhookStatus}
                  onChange={(e) => setWebhookStatus(e.target.value)}
                  className="w-full bg-[#151515] border border-[#303030] rounded-lg px-3 py-2 text-white focus:outline-none focus:border-[#FF5938]"
                >
                  <option value="IN_TRANSIT">IN_TRANSIT</option>
                  <option value="CUSTOMS_HOLD">CUSTOMS_HOLD</option>
                  <option value="DELAYED">DELAYED</option>
                  <option value="OUT_FOR_DELIVERY">OUT_FOR_DELIVERY</option>
                  <option value="DELIVERED">DELIVERED</option>
                </select>
              </div>

              <div>
                <label className="block text-[11px] text-[#A0A0A0] mb-1">Additional Delay (Days)</label>
                <input
                  type="number"
                  min="0"
                  max="30"
                  value={webhookDelayDays}
                  onChange={(e) => setWebhookDelayDays(Number(e.target.value))}
                  className="w-full bg-[#151515] border border-[#303030] rounded-lg px-3 py-2 text-white font-mono focus:outline-none focus:border-[#FF5938]"
                />
              </div>
            </div>

            <div className="flex items-center justify-between pt-2">
              <span className="text-[11px] text-[#737373]">
                Emulates real-world carrier GPS dwell events and customs holds with atomic deduplication.
              </span>
              <button
                onClick={handleSendWebhook}
                disabled={isSendingWebhook}
                className="flex items-center gap-1.5 px-4 py-2 rounded-lg bg-[#FF5938] hover:bg-[#FF5938]/90 text-white font-medium text-xs shadow-md transition-all cursor-pointer disabled:opacity-50"
              >
                <Send className="w-3.5 h-3.5" />
                <span>{isSendingWebhook ? 'Dispatching...' : 'Dispatch Webhook Event'}</span>
              </button>
            </div>

            {webhookResponse && (
              <div
                className={`p-3 rounded-lg border text-xs font-mono mt-3 ${
                  webhookResponse.status === 200
                    ? 'bg-emerald-950/30 border-emerald-800 text-emerald-300'
                    : 'bg-rose-950/30 border-rose-800 text-rose-300'
                }`}
              >
                <div className="flex items-center justify-between font-bold">
                  <span>HTTP Response {webhookResponse.status}</span>
                  <span>{webhookResponse.data?.processingStatus || 'STATUS'}</span>
                </div>
                <p className="mt-1 text-[11px]">{webhookResponse.data?.message || JSON.stringify(webhookResponse.data)}</p>
              </div>
            )}
          </div>
        </EntranceWrapper>
      </div>
    </div>
  );
};
