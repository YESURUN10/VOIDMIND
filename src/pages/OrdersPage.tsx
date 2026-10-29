import React, { useState, useEffect, useMemo } from 'react';
import { ShoppingCart, Package, AlertCircle, FileText, CheckCircle2 } from 'lucide-react';
import { EntranceWrapper } from '../components/motion/EntranceWrapper.tsx';
import { ScrollReveal } from '../components/motion/ScrollReveal.tsx';
import { useFilter } from '../context/FilterContext.tsx';

export const OrdersPage: React.FC = () => {
  const { searchQuery, selectedSupplier } = useFilter();
  const [activeTab, setActiveTab] = useState<'purchase' | 'customer'>('purchase');
  const [data, setData] = useState<any>({ purchaseOrders: [], customerOrders: [] });
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    fetch('/api/orders')
      .then((res) => res.json())
      .then((json) => {
        setData(json);
        setIsLoading(false);
      })
      .catch((err) => {
        console.error(err);
        setIsLoading(false);
      });
  }, []);

  const filteredPurchaseOrders = useMemo(() => {
    return (data.purchaseOrders || []).filter((po: any) => {
      if (selectedSupplier !== 'All Suppliers' && po.supplier_name !== selectedSupplier) {
        return false;
      }
      if (searchQuery) {
        const q = searchQuery.toLowerCase();
        const matchesPo = po.po_number?.toLowerCase().includes(q);
        const matchesSup = po.supplier_name?.toLowerCase().includes(q);
        const matchesWh = po.warehouse_name?.toLowerCase().includes(q);
        if (!matchesPo && !matchesSup && !matchesWh) return false;
      }
      return true;
    });
  }, [data.purchaseOrders, selectedSupplier, searchQuery]);

  const filteredCustomerOrders = useMemo(() => {
    return (data.customerOrders || []).filter((co: any) => {
      if (searchQuery) {
        const q = searchQuery.toLowerCase();
        const matchesNum = co.order_number?.toLowerCase().includes(q);
        const matchesCust = co.customer_name?.toLowerCase().includes(q);
        const matchesTier = co.customer_tier?.toLowerCase().includes(q);
        if (!matchesNum && !matchesCust && !matchesTier) return false;
      }
      return true;
    });
  }, [data.customerOrders, searchQuery]);

  return (
    <div className="w-full space-y-6 pb-12">
      {/* Header */}
      <div>
        <h2 className="text-base font-semibold text-white">Purchase & Customer Orders</h2>
        <p className="text-xs text-[#A0A0A0]">
          Upstream supplier commitments and downstream customer delivery SLA obligations
        </p>
      </div>

      {/* Tab Switcher */}
      <div className="flex items-center gap-1.5 p-1 bg-[#151515] border border-[#303030] rounded-lg w-fit">
        <button
          onClick={() => setActiveTab('purchase')}
          className={`px-3 py-1.5 rounded-md text-xs font-medium transition-colors cursor-pointer ${
            activeTab === 'purchase'
              ? 'bg-[#202020] text-white shadow-sm'
              : 'text-[#A0A0A0] hover:text-white'
          }`}
        >
          Purchase Orders ({filteredPurchaseOrders.length})
        </button>
        <button
          onClick={() => setActiveTab('customer')}
          className={`px-3 py-1.5 rounded-md text-xs font-medium transition-colors cursor-pointer ${
            activeTab === 'customer'
              ? 'bg-[#202020] text-white shadow-sm'
              : 'text-[#A0A0A0] hover:text-white'
          }`}
        >
          Customer Sales Orders ({filteredCustomerOrders.length})
        </button>
      </div>

      <ScrollReveal direction="bottom-right" delay={0.1}>
        {activeTab === 'purchase' ? (
          <div className="bg-[#202020] border border-[#303030] rounded-xl overflow-hidden shadow-sm card-lift">
            <table className="w-full text-left text-xs">
              <thead className="bg-[#151515] border-b border-[#303030] text-[#737373]">
                <tr>
                  <th className="py-3 px-4 font-medium">PO Number</th>
                  <th className="py-3 px-4 font-medium">Supplier</th>
                  <th className="py-3 px-4 font-medium">Warehouse</th>
                  <th className="py-3 px-4 font-medium text-right">Commitment Cost</th>
                  <th className="py-3 px-4 font-medium text-right">Expected Date</th>
                  <th className="py-3 px-4 font-medium text-right">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#2B2B2B]">
                {filteredPurchaseOrders.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="py-8 text-center text-[#737373] text-xs">
                      No purchase orders match the active filters.
                    </td>
                  </tr>
                ) : (
                  filteredPurchaseOrders.map((po: any) => (
                    <tr key={po.id} className="hover:bg-[#151515] transition-colors">
                      <td className="py-3.5 px-4 font-mono font-medium text-white">{po.po_number}</td>
                      <td className="py-3.5 px-4 text-white">{po.supplier_name || 'ABC Supplies Ltd.'}</td>
                      <td className="py-3.5 px-4 text-[#A0A0A0]">{po.warehouse_name || 'Chicago Hub'}</td>
                      <td className="py-3.5 px-4 font-mono text-right text-white">
                        ${po.total_cost?.toLocaleString()}
                      </td>
                      <td className="py-3.5 px-4 font-mono text-right text-[#A0A0A0]">
                        {new Date(po.expected_delivery_date).toLocaleDateString()}
                      </td>
                      <td className="py-3.5 px-4 text-right">
                        <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-[#FF5938]/20 text-[#FF5938] border border-[#FF5938]/30">
                          {po.status}
                        </span>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        ) : (
          <div className="bg-[#202020] border border-[#303030] rounded-xl overflow-hidden shadow-sm">
            <table className="w-full text-left text-xs">
              <thead className="bg-[#151515] border-b border-[#303030] text-[#737373]">
                <tr>
                  <th className="py-3 px-4 font-medium">Order #</th>
                  <th className="py-3 px-4 font-medium">Customer</th>
                  <th className="py-3 px-4 font-medium">Tier</th>
                  <th className="py-3 px-4 font-medium text-right">Total Value</th>
                  <th className="py-3 px-4 font-medium text-right">Promised Date</th>
                  <th className="py-3 px-4 font-medium text-right">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#2B2B2B]">
                {filteredCustomerOrders.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="py-8 text-center text-[#737373] text-xs">
                      No customer orders match the active filters.
                    </td>
                  </tr>
                ) : (
                  filteredCustomerOrders.map((co: any) => (
                    <tr key={co.id} className="hover:bg-[#151515] transition-colors">
                      <td className="py-3.5 px-4 font-mono font-medium text-white">{co.order_number}</td>
                      <td className="py-3.5 px-4 text-white">{co.customer_name}</td>
                      <td className="py-3.5 px-4">
                        <span className="px-1.5 py-0.5 rounded text-[10px] font-mono bg-[#151515] text-[#A0A0A0] border border-[#303030]">
                          {co.customer_tier || 'STRATEGIC'}
                        </span>
                      </td>
                      <td className="py-3.5 px-4 font-mono text-right text-white font-bold">
                        ${co.total_value?.toLocaleString()}
                      </td>
                      <td className="py-3.5 px-4 font-mono text-right text-[#A0A0A0]">
                        {new Date(co.promised_delivery_date).toLocaleDateString()}
                      </td>
                      <td className="py-3.5 px-4 text-right">
                        <span
                          className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                            co.status === 'PROCESSING'
                              ? 'bg-amber-950/40 text-amber-400 border border-amber-800'
                              : 'bg-emerald-950/40 text-emerald-400 border border-emerald-800'
                          }`}
                        >
                          {co.status}
                        </span>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        )}
      </ScrollReveal>
    </div>
  );
};
