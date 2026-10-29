import React, { useState, useEffect, useMemo } from 'react';
import { Package, AlertTriangle, Plus, Check, RefreshCw, Search } from 'lucide-react';
import { ReorderModal } from '../components/modals/ReorderModal.tsx';
import { EntranceWrapper } from '../components/motion/EntranceWrapper.tsx';
import { ScrollReveal } from '../components/motion/ScrollReveal.tsx';
import { useFilter } from '../context/FilterContext.tsx';

interface InventoryPageProps {
  onNavigate?: (path: string) => void;
}

export const InventoryPage: React.FC<InventoryPageProps> = () => {
  const { selectedCategory, selectedSupplier, searchQuery } = useFilter();
  const [skus, setSkus] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [selectedSkuForReorder, setSelectedSkuForReorder] = useState<any>(null);

  const fetchInventory = () => {
    setIsLoading(true);
    fetch('/api/inventory')
      .then((res) => res.json())
      .then((data) => {
        setSkus(data);
        setIsLoading(false);
      })
      .catch((err) => {
        console.error(err);
        setIsLoading(false);
      });
  };

  useEffect(() => {
    fetchInventory();
  }, []);

  const filteredSkus = useMemo(() => {
    return skus.filter((item) => {
      // Category filter
      if (selectedCategory !== 'All Products' && item.category !== selectedCategory) {
        return false;
      }
      // Supplier filter
      if (selectedSupplier !== 'All Suppliers' && item.supplier_name !== selectedSupplier) {
        return false;
      }
      // Search query
      if (searchQuery) {
        const q = searchQuery.toLowerCase();
        const matchesSku = item.sku?.toLowerCase().includes(q);
        const matchesName = item.name?.toLowerCase().includes(q);
        const matchesCat = item.category?.toLowerCase().includes(q);
        if (!matchesSku && !matchesName && !matchesCat) {
          return false;
        }
      }
      return true;
    });
  }, [skus, selectedCategory, selectedSupplier, searchQuery]);

  return (
    <div className="w-full space-y-6 pb-12">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-base font-semibold text-white">SKU Inventory & Warehouse Allocation</h2>
          <p className="text-xs text-[#A0A0A0]">
            Safety stock buffers, reorder thresholds, and active storage allocations ({filteredSkus.length} items shown)
          </p>
        </div>
        <button
          onClick={fetchInventory}
          disabled={isLoading}
          className="p-2 rounded-lg bg-[#202020] hover:bg-[#303030] text-[#A0A0A0] hover:text-white transition-colors border border-[#303030] cursor-pointer"
          title="Refresh Inventory"
        >
          <RefreshCw className={`w-4 h-4 ${isLoading ? 'animate-spin' : ''}`} />
        </button>
      </div>

      <ScrollReveal direction="bottom-right" delay={0.1}>
        <div className="bg-[#202020] border border-[#303030] rounded-xl overflow-hidden shadow-sm card-lift">
          <table className="w-full text-left text-xs">
            <thead className="bg-[#151515] border-b border-[#303030] text-[#737373]">
              <tr>
                <th className="py-3 px-4 font-medium">SKU ID</th>
                <th className="py-3 px-4 font-medium">Product Name & Category</th>
                <th className="py-3 px-4 font-medium">Warehouse</th>
                <th className="py-3 px-4 font-medium text-right">Stock On Hand</th>
                <th className="py-3 px-4 font-medium text-right">Safety Stock</th>
                <th className="py-3 px-4 font-medium text-right">Reorder Point</th>
                <th className="py-3 px-4 font-medium text-right">Status</th>
                <th className="py-3 px-4 font-medium text-right">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#2B2B2B]">
              {filteredSkus.length === 0 ? (
                <tr>
                  <td colSpan={8} className="py-8 text-center text-[#737373] text-xs">
                    No SKU records match the current filter selection ({selectedCategory}, {selectedSupplier}, "{searchQuery}").
                  </td>
                </tr>
              ) : (
                filteredSkus.map((item) => (
                  <tr key={item.id} className="hover:bg-[#151515] transition-colors">
                    <td className="py-3.5 px-4 font-mono font-medium text-white">{item.sku}</td>
                    <td className="py-3.5 px-4">
                      <span className="text-white font-medium block">{item.name}</span>
                      <span className="text-[11px] text-[#737373]">{item.category}</span>
                    </td>
                    <td className="py-3.5 px-4 text-[#A0A0A0]">{item.warehouse_name || 'Chicago Hub'}</td>
                    <td className="py-3.5 px-4 font-mono text-right font-bold text-white">
                      {item.current_stock?.toLocaleString()}
                    </td>
                    <td className="py-3.5 px-4 font-mono text-right text-[#A0A0A0]">
                      {item.safety_stock?.toLocaleString()}
                    </td>
                    <td className="py-3.5 px-4 font-mono text-right text-[#A0A0A0]">
                      {item.reorder_point?.toLocaleString()}
                    </td>
                    <td className="py-3.5 px-4 text-right">
                      {item.status === 'LOW_STOCK' || item.current_stock < item.safety_stock ? (
                        <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-[#FF5938]/20 text-[#FF5938] border border-[#FF5938]/40">
                          LOW STOCK
                        </span>
                      ) : (
                        <span className="px-2 py-0.5 rounded text-[10px] font-medium bg-emerald-950/40 text-emerald-400 border border-emerald-800">
                          HEALTHY
                        </span>
                      )}
                    </td>
                    <td className="py-3.5 px-4 text-right">
                      <button
                        onClick={() =>
                          setSelectedSkuForReorder({
                            sku: item.sku,
                            category: item.category,
                            name: item.name,
                            currentStock: item.current_stock,
                            expectedStock: item.expected_stock || 150,
                            leadTimeDays: item.lead_time_days || 5,
                            supplierName: item.supplier_name || 'ABC Supplies Ltd.',
                          })
                        }
                        className="px-2.5 py-1 rounded bg-[#151515] hover:bg-[#FF5938] hover:text-white border border-[#303030] text-[11px] text-[#A0A0A0] font-medium transition-colors cursor-pointer"
                      >
                        Reorder
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </ScrollReveal>

      {/* Functional Reorder Modal */}
      {selectedSkuForReorder && (
        <ReorderModal
          isOpen={!!selectedSkuForReorder}
          onClose={() => setSelectedSkuForReorder(null)}
          skuInfo={selectedSkuForReorder}
          onSuccess={() => fetchInventory()}
        />
      )}
    </div>
  );
};
