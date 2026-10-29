import React, { useState } from 'react';
import { X, Package, ShieldCheck, Truck, Calendar, DollarSign, CheckCircle2 } from 'lucide-react';
import { useAuth } from '../../context/AuthContext.tsx';

interface ReorderModalProps {
  isOpen: boolean;
  onClose: () => void;
  skuData?: {
    sku: string;
    category: string;
    name: string;
    currentStock: number;
    expectedStock: number;
    leadTimeDays: number;
    supplierName: string;
  };
  skuInfo?: {
    sku: string;
    category: string;
    name: string;
    currentStock: number;
    expectedStock: number;
    leadTimeDays: number;
    supplierName: string;
  };
  onSuccess?: () => void;
}

export const ReorderModal: React.FC<ReorderModalProps> = ({ isOpen, onClose, skuData, skuInfo, onSuccess }) => {
  const effectiveSkuData = skuData || skuInfo || {
    sku: 'SKU-12345',
    category: 'Raw Materials',
    name: 'Raw Materials - High-Purity Silicon Substrate',
    currentStock: 45,
    expectedStock: 150,
    leadTimeDays: 5,
    supplierName: 'ABC Supplies Ltd.',
  };
  const { currentUser } = useAuth();
  const [quantity, setQuantity] = useState<number>(
    Math.max(effectiveSkuData.expectedStock - effectiveSkuData.currentStock, 100)
  );
  const [reason, setReason] = useState('Safety stock deficit below threshold buffer');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [proposalResult, setProposalResult] = useState<any>(null);

  if (!isOpen) return null;

  const estimatedArrival = new Date(Date.now() + effectiveSkuData.leadTimeDays * 86400000).toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  });

  const estimatedCost = quantity * 145.0; // $145/unit

  const handleCreateProposal = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);

    try {
      const response = await fetch('/api/reorder/create-proposal', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-user-id': currentUser.id,
          'x-user-role': currentUser.role,
        },
        body: JSON.stringify({
          sku: effectiveSkuData.sku,
          quantity,
          reason,
        }),
      });

      if (!response.ok) {
        throw new Error('Failed to create proposal');
      }

      const data = await response.json();
      setProposalResult(data);
      if (onSuccess) {
        onSuccess();
      }
    } catch (err: any) {
      console.error('Error creating reorder proposal:', err);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-xs">
      <div className="w-full max-w-lg bg-[#202020] border border-[#303030] rounded-2xl shadow-2xl overflow-hidden flex flex-col">
        {/* Modal Header */}
        <div className="px-6 py-4 bg-[#151515] border-b border-[#303030] flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Package className="w-5 h-5 text-[#FF5938]" />
            <div>
              <h3 className="text-sm font-semibold text-white">Create Reorder Proposal</h3>
              <p className="text-[11px] text-[#A0A0A0]">Deterministic replenishment calculation</p>
            </div>
          </div>
          <button
            onClick={() => {
              setProposalResult(null);
              onClose();
            }}
            className="p-1 rounded-lg hover:bg-[#303030] text-[#A0A0A0] hover:text-white transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {proposalResult ? (
          // Success State showing generated proposal
          <div className="p-6 space-y-4">
            <div className="p-4 rounded-xl bg-emerald-950/40 border border-emerald-800 text-emerald-300 flex items-start gap-3">
              <CheckCircle2 className="w-5 h-5 text-emerald-400 shrink-0 mt-0.5" />
              <div>
                <h4 className="text-xs font-semibold text-white">Reorder Proposal Generated</h4>
                <p className="text-[11px] text-emerald-200 mt-1">
                  Proposal has been logged with audit verification and submitted to Procurement Approvals. No live PO was auto-committed.
                </p>
              </div>
            </div>

            <div className="bg-[#151515] p-4 rounded-xl border border-[#303030] space-y-2 text-xs">
              <div className="flex justify-between py-1 border-b border-[#252525]">
                <span className="text-[#A0A0A0]">Proposal ID</span>
                <span className="text-[#FF5938] font-mono font-medium">{proposalResult.proposalId}</span>
              </div>
              <div className="flex justify-between py-1 border-b border-[#252525]">
                <span className="text-[#A0A0A0]">SKU</span>
                <span className="text-white font-mono">{proposalResult.sku}</span>
              </div>
              <div className="flex justify-between py-1 border-b border-[#252525]">
                <span className="text-[#A0A0A0]">Supplier</span>
                <span className="text-white">{proposalResult.supplierName}</span>
              </div>
              <div className="flex justify-between py-1 border-b border-[#252525]">
                <span className="text-[#A0A0A0]">Units Proposed</span>
                <span className="text-white font-mono">{proposalResult.recommendedQuantity} units</span>
              </div>
              <div className="flex justify-between py-1 border-b border-[#252525]">
                <span className="text-[#A0A0A0]">Estimated Cost</span>
                <span className="text-white font-mono">${proposalResult.totalEstimatedCost.toLocaleString()}</span>
              </div>
              <div className="flex justify-between py-1">
                <span className="text-[#A0A0A0]">Delivery ETA</span>
                <span className="text-white font-mono">
                  {new Date(proposalResult.expectedDeliveryDate).toLocaleDateString()}
                </span>
              </div>
            </div>

            <button
              onClick={() => {
                setProposalResult(null);
                onClose();
              }}
              className="w-full py-2.5 rounded-lg bg-[#FF5938] hover:bg-[#F4512C] text-white text-xs font-semibold transition-colors"
            >
              Done
            </button>
          </div>
        ) : (
          // Form State
          <form onSubmit={handleCreateProposal} className="p-6 space-y-4">
            <div className="grid grid-cols-2 gap-3 p-3 bg-[#151515] rounded-xl border border-[#303030] text-xs">
              <div>
                <span className="text-[10px] text-[#737373] block uppercase">Target SKU</span>
                <span className="text-white font-mono font-medium">{effectiveSkuData.sku}</span>
              </div>
              <div>
                <span className="text-[10px] text-[#737373] block uppercase">Category</span>
                <span className="text-white">{effectiveSkuData.category}</span>
              </div>
              <div>
                <span className="text-[10px] text-[#737373] block uppercase">Current Stock</span>
                <span className="text-amber-400 font-mono font-medium">{effectiveSkuData.currentStock} units</span>
              </div>
              <div>
                <span className="text-[10px] text-[#737373] block uppercase">Expected Buffer</span>
                <span className="text-emerald-400 font-mono">{effectiveSkuData.expectedStock} units</span>
              </div>
              <div className="col-span-2 pt-2 border-t border-[#252525]">
                <span className="text-[10px] text-[#737373] block uppercase">Designated Supplier</span>
                <span className="text-white">{effectiveSkuData.supplierName}</span>
              </div>
            </div>

            <div>
              <label className="text-xs font-medium text-[#A0A0A0] block mb-1.5">
                Replenishment Units
              </label>
              <input
                type="number"
                min="1"
                value={quantity}
                onChange={(e) => setQuantity(parseInt(e.target.value || '1', 10))}
                className="w-full bg-[#151515] border border-[#303030] rounded-lg px-3 py-2 text-xs text-white font-mono focus:outline-none focus:border-[#FF5938]"
              />
            </div>

            <div>
              <label className="text-xs font-medium text-[#A0A0A0] block mb-1.5">
                Operational Reason
              </label>
              <textarea
                rows={2}
                value={reason}
                onChange={(e) => setReason(e.target.value)}
                className="w-full bg-[#151515] border border-[#303030] rounded-lg px-3 py-2 text-xs text-white focus:outline-none focus:border-[#FF5938]"
              />
            </div>

            <div className="p-3 bg-[#151515] rounded-xl border border-[#303030] space-y-1.5 text-[11px]">
              <div className="flex items-center justify-between text-[#A0A0A0]">
                <span>Supplier Lead Time:</span>
                <span className="text-white font-mono">{effectiveSkuData.leadTimeDays} business days</span>
              </div>
              <div className="flex items-center justify-between text-[#A0A0A0]">
                <span>Estimated Arrival:</span>
                <span className="text-white font-mono">{estimatedArrival}</span>
              </div>
              <div className="flex items-center justify-between text-[#A0A0A0] pt-1 border-t border-[#252525]">
                <span>Total Proposal Commitment:</span>
                <span className="text-[#FF5938] font-bold font-mono text-xs">
                  ${estimatedCost.toLocaleString()}
                </span>
              </div>
            </div>

            <div className="flex items-center justify-end gap-2 pt-2">
              <button
                type="button"
                onClick={onClose}
                className="px-4 py-2 rounded-lg bg-[#151515] hover:bg-[#252525] border border-[#303030] text-xs text-[#A0A0A0] hover:text-white transition-colors"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={isSubmitting}
                className="px-5 py-2 rounded-lg bg-[#FF5938] hover:bg-[#F4512C] text-xs font-semibold text-white shadow-sm transition-colors flex items-center gap-1.5"
              >
                {isSubmitting ? 'Validating...' : 'Generate Reorder Proposal'}
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
};
