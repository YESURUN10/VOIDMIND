import React, { useState, useEffect } from 'react';
import {
  AlertTriangle,
  ShieldAlert,
  ArrowRight,
  RefreshCw,
  Send,
  CheckCircle2,
  AlertOctagon,
  Clock,
  Radio,
  Copy,
  ChevronRight,
  Terminal,
} from 'lucide-react';
import { useAuth } from '../context/AuthContext.tsx';
import { EntranceWrapper } from '../components/motion/EntranceWrapper.tsx';
import { ScrollReveal } from '../components/motion/ScrollReveal.tsx';
import { DisruptionImpactGraph } from '../components/visualizations/DisruptionImpactGraph.tsx';

interface DisruptionsPageProps {
  onNavigate: (path: string) => void;
}

export const DisruptionsPage: React.FC<DisruptionsPageProps> = ({ onNavigate }) => {
  const { hasPermission } = useAuth();
  const [disruptions, setDisruptions] = useState<any[]>([]);
  const [webhookEvents, setWebhookEvents] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isSimulating, setIsSimulating] = useState(false);
  const [simulationResult, setSimulationResult] = useState<any | null>(null);
  const [activeTab, setActiveTab] = useState<'graph' | 'webhook_lab'>('graph');

  const fetchDisruptions = () => {
    setIsLoading(true);
    fetch('/api/disruptions')
      .then((res) => res.json())
      .then((data) => {
        setDisruptions(data);
        setIsLoading(false);
      })
      .catch((err) => {
        console.error(err);
        setIsLoading(false);
      });
  };

  const fetchWebhookEvents = () => {
    fetch('/api/webhooks/events')
      .then((res) => res.json())
      .then((data) => setWebhookEvents(data))
      .catch((err) => console.error(err));
  };

  useEffect(() => {
    fetchDisruptions();
    fetchWebhookEvents();
  }, []);

  // Webhook Test Scenarios
  const runWebhookScenario = async (type: 'STANDARD' | 'DUPLICATE' | 'CONFLICT' | 'STALE' | 'INVALID_TRANSITION') => {
    setIsSimulating(true);
    setSimulationResult(null);

    let payload: any = {};
    const nowIso = new Date().toISOString();

    if (type === 'STANDARD') {
      payload = {
        eventId: `evt_maersk_${Date.now()}`,
        carrier: 'Maersk',
        trackingNumber: 'TRK-MAERSK-9021',
        status: 'CUSTOMS_HOLD',
        eventTimestamp: nowIso,
        location: 'Long Beach Terminal Berthing Pier 400',
        delayDays: 6,
        notes: 'Berthing congestion and queue delay detected by automated port feed.',
      };
    } else if (type === 'DUPLICATE') {
      // Re-use an existing fixed eventId and payload to test idempotency
      payload = {
        eventId: 'evt_idempotent_test_001',
        carrier: 'Maersk',
        trackingNumber: 'TRK-MAERSK-9021',
        status: 'CUSTOMS_HOLD',
        eventTimestamp: '2026-10-29T10:00:00Z',
        location: 'Long Beach Terminal Berthing Pier 400',
        delayDays: 6,
        notes: 'Idempotency verification payload - exact duplicate test.',
      };
    } else if (type === 'CONFLICT') {
      // Re-use evt_idempotent_test_001 with altered delay days to trigger 409 conflict
      payload = {
        eventId: 'evt_idempotent_test_001',
        carrier: 'Maersk',
        trackingNumber: 'TRK-MAERSK-9021',
        status: 'IN_TRANSIT',
        eventTimestamp: '2026-10-29T10:00:00Z',
        location: 'Long Beach Terminal Pier 400',
        delayDays: 99, // Altered content triggers sha256 mismatch
        notes: 'Altered conflicting payload with identical eventId.',
      };
    } else if (type === 'STALE') {
      // Event timestamp far in the past to trigger stale rejection
      payload = {
        eventId: `evt_stale_${Date.now()}`,
        carrier: 'Maersk',
        trackingNumber: 'TRK-MAERSK-9021',
        status: 'BOOKED',
        eventTimestamp: '2026-01-01T00:00:00Z', // Past timestamp
        location: 'Taipei Terminal',
        delayDays: 0,
        notes: 'Stale out-of-order tracking update protection test.',
      };
    } else if (type === 'INVALID_TRANSITION') {
      payload = {
        eventId: `evt_trans_${Date.now()}`,
        carrier: 'FedEx Freight',
        trackingNumber: 'TRK-FEDEX-4011',
        status: 'BOOKED', // Attempting illegal backward transition from DELIVERED to BOOKED
        eventTimestamp: nowIso,
        location: 'Salt Lake City Hub',
        delayDays: 0,
        notes: 'Illegal state machine rollback attempt.',
      };
    }

    try {
      const start = performance.now();
      const res = await fetch('/api/webhooks/carrier', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });
      const responseData = await res.json();
      const durationMs = Math.round(performance.now() - start);

      setSimulationResult({
        httpStatus: res.status,
        durationMs,
        scenario: type,
        sentPayload: payload,
        response: responseData,
      });

      fetchDisruptions();
      fetchWebhookEvents();
    } catch (err: any) {
      setSimulationResult({
        httpStatus: 500,
        scenario: type,
        sentPayload: payload,
        response: { error: err.message },
      });
    } finally {
      setIsSimulating(false);
    }
  };

  return (
    <div className="w-full space-y-6 pb-12">
      {/* 1. Top Header & Mode Toggle */}
      <EntranceWrapper staggerIndex={0}>
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-[#202020] border border-[#303030] rounded-xl p-5">
          <div>
            <h2 className="text-base font-semibold text-white flex items-center gap-2">
              <ShieldAlert className="w-5 h-5 text-[#FF5938]" />
              Active Supply Chain Disruptions & Webhook Engine
            </h2>
            <p className="text-xs text-[#A0A0A0] mt-1">
              Deterministic incident detection, causal order impact tracing, and carrier webhook verification.
            </p>
          </div>

          <div className="flex items-center gap-2">
            <div className="flex bg-[#151515] p-1 rounded-lg border border-[#303030] text-xs">
              <button
                onClick={() => setActiveTab('graph')}
                className={`px-3 py-1.5 rounded font-medium transition-colors cursor-pointer ${
                  activeTab === 'graph' ? 'bg-[#FF5938] text-white' : 'text-[#A0A0A0] hover:text-white'
                }`}
              >
                Lineage Graph
              </button>
              <button
                onClick={() => setActiveTab('webhook_lab')}
                className={`px-3 py-1.5 rounded font-medium transition-colors cursor-pointer ${
                  activeTab === 'webhook_lab' ? 'bg-[#FF5938] text-white' : 'text-[#A0A0A0] hover:text-white'
                }`}
              >
                Webhook Lab
              </button>
            </div>

            <button
              onClick={() => {
                fetchDisruptions();
                fetchWebhookEvents();
              }}
              className="p-2 rounded-lg bg-[#151515] hover:bg-[#252525] border border-[#303030] text-[#A0A0A0] hover:text-white transition-colors cursor-pointer"
              title="Refresh Disruptions"
            >
              <RefreshCw className="w-4 h-4" />
            </button>
          </div>
        </div>
      </EntranceWrapper>

      {/* 2. Visualizations / Impact Lineage */}
      {activeTab === 'graph' ? (
        <EntranceWrapper staggerIndex={1}>
          <DisruptionImpactGraph />
        </EntranceWrapper>
      ) : (
        /* Webhook Lab Panel */
        <EntranceWrapper staggerIndex={1}>
          <div className="bg-[#202020] border border-[#303030] rounded-xl p-6 space-y-6">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-[#2D2D2D]">
              <div>
                <div className="flex items-center gap-2">
                  <Terminal className="w-4 h-4 text-[#FF5938]" />
                  <h3 className="text-sm font-semibold text-white">Carrier Webhook Test Console (POST /api/webhooks/carrier)</h3>
                </div>
                <p className="text-xs text-[#A0A0A0] mt-0.5">
                  Verify cryptographic idempotency, payload conflict detection (HTTP 409), stale event protection (HTTP 422), and valid state progression.
                </p>
              </div>

              <span className="text-[11px] font-mono text-emerald-400 bg-emerald-950/40 border border-emerald-800 px-2.5 py-1 rounded">
                SHA-256 Idempotency Engine Active
              </span>
            </div>

            {/* Test Scenario Buttons */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3">
              <button
                onClick={() => runWebhookScenario('STANDARD')}
                disabled={isSimulating}
                className="p-3 bg-[#151515] border border-[#303030] hover:border-[#FF5938] rounded-xl text-left transition-colors cursor-pointer group"
              >
                <div className="flex items-center justify-between text-xs font-semibold text-white group-hover:text-[#FF5938]">
                  <span>1. Valid Tracking</span>
                  <Radio className="w-3.5 h-3.5 text-emerald-400" />
                </div>
                <p className="text-[10px] text-[#A0A0A0] mt-1 leading-relaxed">
                  Ingests normal Maersk delay (+6d) with SHA-256 hashing.
                </p>
                <span className="text-[10px] font-mono text-emerald-400 mt-2 block">Expected: 200 PROCESSED</span>
              </button>

              <button
                onClick={() => runWebhookScenario('DUPLICATE')}
                disabled={isSimulating}
                className="p-3 bg-[#151515] border border-[#303030] hover:border-[#FF5938] rounded-xl text-left transition-colors cursor-pointer group"
              >
                <div className="flex items-center justify-between text-xs font-semibold text-white group-hover:text-[#FF5938]">
                  <span>2. Duplicate Replay</span>
                  <Copy className="w-3.5 h-3.5 text-cyan-400" />
                </div>
                <p className="text-[10px] text-[#A0A0A0] mt-1 leading-relaxed">
                  Exact identical payload hash; verifies zero duplicate side effects.
                </p>
                <span className="text-[10px] font-mono text-cyan-400 mt-2 block">Expected: 200 IDEMPOTENT</span>
              </button>

              <button
                onClick={() => runWebhookScenario('CONFLICT')}
                disabled={isSimulating}
                className="p-3 bg-[#151515] border border-[#303030] hover:border-[#FF5938] rounded-xl text-left transition-colors cursor-pointer group"
              >
                <div className="flex items-center justify-between text-xs font-semibold text-white group-hover:text-[#FF5938]">
                  <span>3. Payload Conflict</span>
                  <AlertOctagon className="w-3.5 h-3.5 text-amber-400" />
                </div>
                <p className="text-[10px] text-[#A0A0A0] mt-1 leading-relaxed">
                  Reuses eventId but altered payload; detects tamper/conflict.
                </p>
                <span className="text-[10px] font-mono text-amber-400 mt-2 block">Expected: 409 CONFLICT</span>
              </button>

              <button
                onClick={() => runWebhookScenario('STALE')}
                disabled={isSimulating}
                className="p-3 bg-[#151515] border border-[#303030] hover:border-[#FF5938] rounded-xl text-left transition-colors cursor-pointer group"
              >
                <div className="flex items-center justify-between text-xs font-semibold text-white group-hover:text-[#FF5938]">
                  <span>4. Stale Timestamp</span>
                  <Clock className="w-3.5 h-3.5 text-rose-400" />
                </div>
                <p className="text-[10px] text-[#A0A0A0] mt-1 leading-relaxed">
                  Event timestamp predates shipment's last known state.
                </p>
                <span className="text-[10px] font-mono text-rose-400 mt-2 block">Expected: 422 STALE_REJECTED</span>
              </button>

              <button
                onClick={() => runWebhookScenario('INVALID_TRANSITION')}
                disabled={isSimulating}
                className="p-3 bg-[#151515] border border-[#303030] hover:border-[#FF5938] rounded-xl text-left transition-colors cursor-pointer group"
              >
                <div className="flex items-center justify-between text-xs font-semibold text-white group-hover:text-[#FF5938]">
                  <span>5. Invalid State</span>
                  <AlertTriangle className="w-3.5 h-3.5 text-orange-400" />
                </div>
                <p className="text-[10px] text-[#A0A0A0] mt-1 leading-relaxed">
                  Illegal state rollback (e.g. DELIVERED back to BOOKED).
                </p>
                <span className="text-[10px] font-mono text-orange-400 mt-2 block">Expected: 422 INVALID_TRANS</span>
              </button>
            </div>

            {/* Simulation Response Output Terminal */}
            {simulationResult && (
              <div className="p-4 bg-[#111111] border border-[#303030] rounded-xl space-y-3 font-mono text-xs">
                <div className="flex items-center justify-between border-b border-[#252525] pb-2 text-[11px]">
                  <div className="flex items-center gap-2">
                    <span
                      className={`px-2 py-0.5 rounded font-bold ${
                        simulationResult.httpStatus === 200
                          ? 'bg-emerald-950 text-emerald-400 border border-emerald-800'
                          : simulationResult.httpStatus === 409
                          ? 'bg-amber-950 text-amber-400 border border-amber-800'
                          : 'bg-rose-950 text-rose-400 border border-rose-800'
                      }`}
                    >
                      HTTP {simulationResult.httpStatus}
                    </span>
                    <span className="text-white font-medium">Scenario: {simulationResult.scenario}</span>
                  </div>
                  <span className="text-[#737373]">{simulationResult.durationMs}ms latency</span>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <span className="text-[10px] text-[#737373] uppercase block mb-1">Payload Sent:</span>
                    <pre className="p-2.5 bg-[#151515] rounded text-[#A0A0A0] overflow-x-auto text-[11px] border border-[#252525]">
                      {JSON.stringify(simulationResult.sentPayload, null, 2)}
                    </pre>
                  </div>
                  <div>
                    <span className="text-[10px] text-[#737373] uppercase block mb-1">Carrier Engine Response:</span>
                    <pre className="p-2.5 bg-[#151515] rounded text-emerald-400 overflow-x-auto text-[11px] border border-[#252525]">
                      {JSON.stringify(simulationResult.response, null, 2)}
                    </pre>
                  </div>
                </div>
              </div>
            )}
          </div>
        </EntranceWrapper>
      )}

      {/* 3. Disruptions List */}
      <ScrollReveal direction="bottom-right" delay={0.15}>
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-semibold text-white">Active Incident Incidents ({disruptions.length})</h3>
            <span className="text-xs text-[#737373]">Ranked by total revenue-at-risk</span>
          </div>

          {disruptions.map((d) => (
            <div key={d.id} className="bg-[#202020] border border-[#303030] hover:border-[#404040] rounded-xl p-5 transition-all card-lift">
              <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 pb-4 border-b border-[#2B2B2B]">
                <div className="flex items-start gap-3">
                  <div className="w-9 h-9 rounded-lg bg-[#FF5938]/10 border border-[#FF5938]/30 flex items-center justify-center text-[#FF5938] shrink-0 mt-0.5">
                    <AlertTriangle className="w-5 h-5" />
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <h3 className="text-sm font-bold text-white">{d.title}</h3>
                      <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-[#FF5938] text-white">
                        {d.severity}
                      </span>
                      <span className="text-[10px] font-mono text-[#A0A0A0]">
                        {d.type}
                      </span>
                    </div>
                    <p className="text-xs text-[#A0A0A0] mt-1">{d.description}</p>
                  </div>
                </div>

                <div className="flex items-center gap-4 shrink-0">
                  <div className="text-right">
                    <span className="text-[10px] text-[#737373] block uppercase">Revenue At Risk</span>
                    <span className="text-base font-bold font-mono text-[#FF5938]">
                      ${d.total_revenue_at_risk?.toLocaleString() || '285,000'}
                    </span>
                  </div>
                  <div className="text-right">
                    <span className="text-[10px] text-[#737373] block uppercase">Risk Index</span>
                    <span className="text-base font-bold font-mono text-white">
                      {d.risk_score} <span className="text-xs font-normal text-[#737373]">/ 100</span>
                    </span>
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 pt-4 text-xs">
                <div>
                  <span className="text-[10px] text-[#737373] block uppercase">Affected Shipment</span>
                  <span className="font-mono text-white">{d.tracking_number || 'TRK-MAERSK-9021'}</span>
                </div>
                <div>
                  <span className="text-[10px] text-[#737373] block uppercase">Carrier & Delay</span>
                  <span className="text-white">{d.carrier || 'Maersk'} (+{d.delay_impact_days} days)</span>
                </div>
                <div>
                  <span className="text-[10px] text-[#737373] block uppercase">Downstream Orders</span>
                  <span className="text-white font-medium">{d.affected_orders_count || 3} Customer Orders</span>
                </div>
                <div className="flex items-center justify-end">
                  <button
                    onClick={() => onNavigate('/recovery-plans')}
                    className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-[#FF5938] hover:bg-[#F4512C] text-white text-xs font-semibold shadow-sm transition-colors cursor-pointer"
                  >
                    <span>Generate Recovery</span>
                    <ArrowRight className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      </ScrollReveal>
    </div>
  );
};
