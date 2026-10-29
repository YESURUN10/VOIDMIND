import React, { useState, useEffect, useRef } from 'react';
import {
  UploadCloud,
  FileText,
  CheckCircle2,
  AlertOctagon,
  Download,
  Database,
  RefreshCw,
  Clock,
  Layers,
  FileCode,
  ShieldCheck,
} from 'lucide-react';
import { EntranceWrapper } from '../components/motion/EntranceWrapper.tsx';
import { useAuth } from '../context/AuthContext.tsx';

export const ImportsPage: React.FC = () => {
  const { currentUser, hasPermission } = useAuth();
  const [selectedEntity, setSelectedEntity] = useState('inventory_skus');
  const [importStatus, setImportStatus] = useState<any>(null);
  const [batches, setBatches] = useState<any[]>([]);
  const [quarantinedRows, setQuarantinedRows] = useState<any[]>([]);
  const [isProcessing, setIsProcessing] = useState(false);
  const [activeTab, setActiveTab] = useState<'upload' | 'batches' | 'quarantine'>('upload');
  const fileInputRef = useRef<HTMLInputElement>(null);

  const sampleCsvTemplates: Record<string, string> = {
    inventory_skus: `sku,name,category,unit_cost,current_stock,safety_stock,reorder_point,lead_time_days
SKU-99101,Fiber Optic Transceiver Module,Finished Goods,320.00,85,40,50,7
SKU-99102,Silicon Carbide Wafer Substrate,Raw Materials,185.00,22,50,60,12
SKU-INVALID,Missing Fields Row,,,,,,`,
    shipments: `tracking_number,carrier,origin,destination,departure_date,estimated_delivery_date
TRK-TEST-01,DHL Express,Frankfurt Hub,Chicago Hub,2026-10-25,2026-10-30
TRK-TEST-02,FedEx Freight,Taipei Port,Long Beach Hub,2026-10-20,2026-11-04`,
  };

  const fetchBatches = () => {
    fetch('/api/imports/batches')
      .then((res) => res.json())
      .then((data) => setBatches(data))
      .catch((err) => console.error(err));
  };

  const fetchQuarantine = () => {
    fetch('/api/imports/quarantine')
      .then((res) => res.json())
      .then((data) => setQuarantinedRows(data))
      .catch((err) => console.error(err));
  };

  useEffect(() => {
    fetchBatches();
    fetchQuarantine();
  }, []);

  const handleFileUpload = async (file: File) => {
    setIsProcessing(true);
    setImportStatus(null);

    const formData = new FormData();
    formData.append('file', file);
    formData.append('entityType', selectedEntity);

    try {
      const res = await fetch('/api/imports/upload', {
        method: 'POST',
        headers: {
          'x-user-id': currentUser.id,
          'x-user-role': currentUser.role,
        },
        body: formData,
      });
      const data = await res.json();
      if (!res.ok) {
        setImportStatus({
          status: 'FAILED',
          totalRows: 0,
          validRows: 0,
          quarantinedRows: 0,
          errors: [
            {
              rowNumber: 0,
              field: 'authorization',
              errorCategory: res.status === 403 ? 'FORBIDDEN_ROLE' : res.status === 413 ? 'LIMIT_FILE_SIZE' : 'HTTP_ERROR',
              errorMessage: data.error || `Server returned HTTP ${res.status}: Upload rejected`,
            },
          ],
        });
      } else {
        setImportStatus(data);
      }
      fetchBatches();
      fetchQuarantine();
    } catch (err: any) {
      console.error('Upload failed:', err);
      setImportStatus({
        status: 'FAILED',
        totalRows: 0,
        validRows: 0,
        quarantinedRows: 0,
        errors: [{ rowNumber: 0, errorCategory: 'NETWORK_ERROR', errorMessage: err.message }],
      });
    } finally {
      setIsProcessing(false);
    }
  };

  const handleQuickTestDataset = async () => {
    setIsProcessing(true);
    setImportStatus(null);

    const content = sampleCsvTemplates[selectedEntity] || sampleCsvTemplates.inventory_skus;
    const blob = new Blob([content], { type: 'text/csv' });
    const file = new File([blob], `synthetic_${selectedEntity}_batch.csv`, { type: 'text/csv' });

    await handleFileUpload(file);
  };

  const downloadSampleTemplate = () => {
    const csvContent = sampleCsvTemplates[selectedEntity] || sampleCsvTemplates.inventory_skus;
    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${selectedEntity}_template.csv`;
    a.click();
  };

  return (
    <div className="w-full space-y-6 pb-12">
      {/* Header and View Selector */}
      <EntranceWrapper staggerIndex={0}>
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-[#202020] border border-[#303030] rounded-xl p-5">
          <div>
            <h2 className="text-base font-semibold text-white flex items-center gap-2">
              <Database className="w-5 h-5 text-[#FF5938]" />
              CSV & JSON Data Ingestion Pipeline
            </h2>
            <p className="text-xs text-[#A0A0A0] mt-1">
              Multipart file streaming, atomic batch transactions, schema validation, and row-level quarantine.
            </p>
          </div>

          <div className="flex items-center gap-2">
            <div className="flex bg-[#151515] p-1 rounded-lg border border-[#303030] text-xs">
              <button
                onClick={() => setActiveTab('upload')}
                className={`px-3 py-1.5 rounded font-medium transition-colors cursor-pointer ${
                  activeTab === 'upload' ? 'bg-[#FF5938] text-white' : 'text-[#A0A0A0] hover:text-white'
                }`}
              >
                Upload File
              </button>
              <button
                onClick={() => {
                  setActiveTab('batches');
                  fetchBatches();
                }}
                className={`px-3 py-1.5 rounded font-medium transition-colors cursor-pointer ${
                  activeTab === 'batches' ? 'bg-[#FF5938] text-white' : 'text-[#A0A0A0] hover:text-white'
                }`}
              >
                Batches ({batches.length})
              </button>
              <button
                onClick={() => {
                  setActiveTab('quarantine');
                  fetchQuarantine();
                }}
                className={`px-3 py-1.5 rounded font-medium transition-colors cursor-pointer ${
                  activeTab === 'quarantine' ? 'bg-[#FF5938] text-white' : 'text-[#A0A0A0] hover:text-white'
                }`}
              >
                Quarantine ({quarantinedRows.length})
              </button>
            </div>

            <button
              onClick={() => {
                fetchBatches();
                fetchQuarantine();
              }}
              className="p-2 rounded-lg bg-[#151515] hover:bg-[#252525] border border-[#303030] text-[#A0A0A0] hover:text-white transition-colors cursor-pointer"
              title="Refresh Records"
            >
              <RefreshCw className="w-4 h-4" />
            </button>
          </div>
        </div>
      </EntranceWrapper>

      {/* Main Content Area */}
      {activeTab === 'upload' && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Upload Panel */}
          <EntranceWrapper staggerIndex={1} className="lg:col-span-2 space-y-4">
            <div className="bg-[#202020] border border-[#303030] rounded-xl p-6 space-y-4">
              <div className="flex items-center justify-between pb-3 border-b border-[#303030]">
                <span className="text-xs font-semibold text-white">Target Relational Entity</span>
                <select
                  value={selectedEntity}
                  onChange={(e) => setSelectedEntity(e.target.value)}
                  className="bg-[#151515] border border-[#303030] rounded-lg px-3 py-1.5 text-xs text-white focus:outline-none focus:border-[#FF5938]"
                >
                  <option value="inventory_skus">Inventory SKUs (inventory_skus)</option>
                  <option value="shipments">Shipment Tracking (shipments)</option>
                  <option value="purchase_orders">Purchase Orders (purchase_orders)</option>
                  <option value="suppliers">Supplier Master Data (suppliers)</option>
                </select>
              </div>

              {/* Real Drag & Drop / File Input Area */}
              <div
                onDragOver={(e) => e.preventDefault()}
                onDrop={(e) => {
                  e.preventDefault();
                  if (e.dataTransfer.files && e.dataTransfer.files[0]) {
                    handleFileUpload(e.dataTransfer.files[0]);
                  }
                }}
                className="border-2 border-dashed border-[#303030] hover:border-[#FF5938] rounded-xl p-8 flex flex-col items-center justify-center text-center transition-colors bg-[#181818]"
              >
                <input
                  type="file"
                  ref={fileInputRef}
                  onChange={(e) => {
                    if (e.target.files && e.target.files[0]) {
                      handleFileUpload(e.target.files[0]);
                    }
                  }}
                  accept=".csv,.json"
                  className="hidden"
                />

                <UploadCloud className="w-10 h-10 text-[#FF5938] mb-3" />
                <h3 className="text-sm font-bold text-white">Upload CSV or JSON Batch</h3>
                <p className="text-xs text-[#A0A0A0] mt-1 max-w-sm">
                  Drag and drop a file here, or click Browse to run row-level schema validation against PostgreSQL constraints.
                </p>

                <div className="flex flex-wrap items-center justify-center gap-3 mt-5">
                  <button
                    onClick={() => fileInputRef.current?.click()}
                    disabled={isProcessing}
                    className="px-4 py-2 rounded-lg bg-[#FF5938] hover:bg-[#F4512C] text-xs font-semibold text-white shadow-md transition-colors cursor-pointer"
                  >
                    {isProcessing ? 'Validating Batch...' : 'Browse Local File'}
                  </button>

                  <button
                    onClick={handleQuickTestDataset}
                    disabled={isProcessing}
                    className="flex items-center gap-1.5 px-3 py-2 rounded-lg bg-[#151515] hover:bg-[#252525] border border-[#303030] text-xs text-[#F5F5F5] font-medium transition-colors cursor-pointer"
                  >
                    <FileCode className="w-3.5 h-3.5 text-[#FF5938]" />
                    <span>Run Synthetic Test Batch</span>
                  </button>

                  <button
                    onClick={downloadSampleTemplate}
                    className="flex items-center gap-1.5 px-3 py-2 rounded-lg bg-[#151515] hover:bg-[#252525] border border-[#303030] text-xs text-[#A0A0A0] hover:text-white transition-colors cursor-pointer"
                  >
                    <Download className="w-3.5 h-3.5" />
                    <span>Template</span>
                  </button>
                </div>
              </div>

              {/* Import Results & Quarantine Inspector */}
              {importStatus && (
                <div className="space-y-4 pt-3">
                  <div className="grid grid-cols-3 gap-3 text-xs">
                    <div className="p-3 bg-[#151515] rounded-lg border border-[#303030]">
                      <span className="text-[10px] text-[#737373] uppercase block">Total Rows</span>
                      <span className="text-base font-bold font-mono text-white mt-0.5 block">{importStatus.totalRows}</span>
                    </div>
                    <div className="p-3 bg-[#151515] rounded-lg border border-emerald-900/50">
                      <span className="text-[10px] text-emerald-400 uppercase block">Valid & Ingested</span>
                      <span className="text-base font-bold font-mono text-emerald-400 mt-0.5 block">{importStatus.validRows}</span>
                    </div>
                    <div className="p-3 bg-[#151515] rounded-lg border border-rose-900/50">
                      <span className="text-[10px] text-rose-400 uppercase block">Quarantined</span>
                      <span className="text-base font-bold font-mono text-rose-400 mt-0.5 block">{importStatus.quarantinedRows}</span>
                    </div>
                  </div>

                  {importStatus.errors && importStatus.errors.length > 0 && (
                    <div className="p-4 bg-rose-950/20 border border-rose-900/50 rounded-xl space-y-2">
                      <div className="flex items-center gap-2 text-rose-400 text-xs font-semibold">
                        <AlertOctagon className="w-4 h-4 shrink-0" />
                        <span>Quarantined Rows Report (Batch ID: {importStatus.batchId})</span>
                      </div>
                      {importStatus.errors.map((q: any, idx: number) => (
                        <div key={idx} className="text-xs bg-[#151515] p-2.5 rounded border border-rose-900/30">
                          <div className="flex justify-between font-mono text-white">
                            <span>Row #{q.rowNumber}: {q.field || 'General Error'}</span>
                            <span className="text-rose-400 font-semibold">{q.errorCategory}</span>
                          </div>
                          <p className="text-[11px] text-[#A0A0A0] mt-1">{q.errorMessage}</p>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              )}
            </div>
          </EntranceWrapper>

          {/* Ingestion Rules & Data Provenance */}
          <EntranceWrapper staggerIndex={2} className="space-y-4">
            <div className="bg-[#202020] border border-[#303030] rounded-xl p-5 space-y-4">
              <h3 className="text-xs font-bold text-white uppercase tracking-wider text-[#A0A0A0]">
                Ingestion Engine Specifications
              </h3>
              <ul className="text-xs text-[#A0A0A0] space-y-2.5">
                <li className="flex items-start gap-2">
                  <span className="w-1.5 h-1.5 rounded-full bg-[#FF5938] shrink-0 mt-1.5" />
                  <span><strong>10MB Streaming Limit:</strong> Memory-buffered multipart uploads with MIME-type verification.</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="w-1.5 h-1.5 rounded-full bg-[#FF5938] shrink-0 mt-1.5" />
                  <span><strong>Strict Foreign Key Validation:</strong> Preferred suppliers and destination warehouses are verified against relational records before upsert.</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="w-1.5 h-1.5 rounded-full bg-[#FF5938] shrink-0 mt-1.5" />
                  <span><strong>Atomic Quarantine Isolation:</strong> Invalid rows are cleanly directed into the quarantine ledger without aborting or rolling back valid records in the batch.</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="w-1.5 h-1.5 rounded-full bg-[#FF5938] shrink-0 mt-1.5" />
                  <span><strong>Full Audit Provenance:</strong> Every batch logs an immutable audit event with actor ID, batch hash, and timestamp.</span>
                </li>
              </ul>
            </div>
          </EntranceWrapper>
        </div>
      )}

      {/* Batches History Tab */}
      {activeTab === 'batches' && (
        <EntranceWrapper staggerIndex={1}>
          <div className="bg-[#202020] border border-[#303030] rounded-xl p-5 space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-[#2B2B2B]">
              <h3 className="text-sm font-semibold text-white">Import Batch Ledger ({batches.length})</h3>
              <span className="text-xs text-[#737373]">Live records from PostgreSQL import_batches table</span>
            </div>

            {batches.length === 0 ? (
              <p className="text-xs text-[#737373] py-4 text-center">No import batches recorded yet. Upload a file to populate.</p>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-xs text-left">
                  <thead className="bg-[#151515] text-[#737373] uppercase text-[10px]">
                    <tr>
                      <th className="p-3">Batch ID</th>
                      <th className="p-3">Filename</th>
                      <th className="p-3">Entity</th>
                      <th className="p-3">Status</th>
                      <th className="p-3 text-right">Total</th>
                      <th className="p-3 text-right text-emerald-400">Valid</th>
                      <th className="p-3 text-right text-rose-400">Quarantine</th>
                      <th className="p-3">Imported By</th>
                      <th className="p-3">Timestamp</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-[#2B2B2B]">
                    {batches.map((b) => (
                      <tr key={b.id} className="hover:bg-[#252525] transition-colors">
                        <td className="p-3 font-mono text-white">{b.id}</td>
                        <td className="p-3 text-[#A0A0A0]">{b.filename}</td>
                        <td className="p-3 font-mono text-[#A0A0A0]">{b.entity_type}</td>
                        <td className="p-3">
                          <span
                            className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                              b.status === 'COMPLETED'
                                ? 'bg-emerald-950 text-emerald-400 border border-emerald-800'
                                : b.status === 'PARTIALLY_QUARANTINED'
                                ? 'bg-amber-950 text-amber-400 border border-amber-800'
                                : 'bg-rose-950 text-rose-400 border border-rose-800'
                            }`}
                          >
                            {b.status}
                          </span>
                        </td>
                        <td className="p-3 text-right font-mono text-white">{b.total_rows}</td>
                        <td className="p-3 text-right font-mono text-emerald-400">{b.valid_rows}</td>
                        <td className="p-3 text-right font-mono text-rose-400">{b.quarantined_rows}</td>
                        <td className="p-3 text-[#A0A0A0]">{b.imported_by}</td>
                        <td className="p-3 font-mono text-[11px] text-[#737373]">
                          {new Date(b.created_at).toLocaleString()}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </EntranceWrapper>
      )}

      {/* Quarantine Ledger Tab */}
      {activeTab === 'quarantine' && (
        <EntranceWrapper staggerIndex={1}>
          <div className="bg-[#202020] border border-[#303030] rounded-xl p-5 space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-[#2B2B2B]">
              <h3 className="text-sm font-semibold text-white">Quarantine Ledger ({quarantinedRows.length})</h3>
              <span className="text-xs text-[#737373]">Live records from PostgreSQL quarantined_import_rows table</span>
            </div>

            {quarantinedRows.length === 0 ? (
              <p className="text-xs text-[#737373] py-4 text-center">No quarantined rows. All batches parsed cleanly!</p>
            ) : (
              <div className="space-y-3">
                {quarantinedRows.map((q) => (
                  <div key={q.id} className="p-3 bg-[#151515] border border-rose-900/40 rounded-xl space-y-2">
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 text-xs">
                      <div className="flex items-center gap-2">
                        <span className="px-2 py-0.5 rounded text-[10px] font-mono font-bold bg-rose-950 text-rose-400 border border-rose-800">
                          {q.error_category}
                        </span>
                        <span className="font-mono text-white font-medium">
                          Row #{q.row_number} (Batch {q.batch_id})
                        </span>
                      </div>
                      <span className="font-mono text-[10px] text-[#737373]">
                        {new Date(q.created_at).toLocaleString()}
                      </span>
                    </div>

                    <p className="text-xs text-rose-300">{q.error_message}</p>

                    {q.raw_data_json && (
                      <div className="text-[11px] font-mono bg-[#111111] p-2 rounded text-[#A0A0A0] overflow-x-auto">
                        Raw: {typeof q.raw_data_json === 'string' ? q.raw_data_json : JSON.stringify(q.raw_data_json)}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>
        </EntranceWrapper>
      )}
    </div>
  );
};
