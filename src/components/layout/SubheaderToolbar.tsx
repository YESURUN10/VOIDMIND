import React, { useState, useRef, useEffect } from 'react';
import { Calendar, Globe, Box, Users, ChevronDown, Check, RotateCcw } from 'lucide-react';
import { GlobalTimeframe, GlobalRegion } from '../../types/index.ts';
import { useFilter } from '../../context/FilterContext.tsx';

interface SubheaderToolbarProps {
  title: string;
}

export const SubheaderToolbar: React.FC<SubheaderToolbarProps> = ({ title }) => {
  const {
    timeframe,
    setTimeframe,
    region,
    setRegion,
    selectedCategory,
    setSelectedCategory,
    selectedSupplier,
    setSelectedSupplier,
    resetFilters,
  } = useFilter();

  const [openDropdown, setOpenDropdown] = useState<string | null>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        setOpenDropdown(null);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const toggleDropdown = (key: string) => {
    setOpenDropdown(openDropdown === key ? null : key);
  };

  const timeframeLabels: Record<GlobalTimeframe, string> = {
    TODAY: 'Today',
    WEEK: 'This Week',
    MONTH: 'This Month',
    QUARTER: 'This Quarter',
    YEAR: 'Full Year',
  };

  const regions: GlobalRegion[] = ['ALL', 'USA', 'EU', 'APAC'];
  const categories = ['All Products', 'Raw Materials', 'WIP', 'Finished Goods', 'Spare Parts', 'Returns / Defective'];
  const suppliers = [
    'All Suppliers',
    'ABC Supplies Ltd.',
    'Apex Precision Micro',
    'Pacific Freight & Assembly',
    'Global Dynamics Industrial',
    'Synapse Alternate Systems',
  ];

  const hasActiveFilters =
    timeframe !== 'TODAY' ||
    region !== 'ALL' ||
    selectedCategory !== 'All Products' ||
    selectedSupplier !== 'All Suppliers';

  return (
    <div
      ref={containerRef}
      className="w-full bg-[#F4F6F9] dark:bg-[#111111] px-4 lg:px-8 pt-6 pb-4 flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-slate-200 dark:border-[#202020] transition-colors duration-200"
    >
      {/* Title - Increased typography for authoritative executive hierarchy */}
      <div>
        <h1 className="text-2xl lg:text-3xl font-bold tracking-tight text-slate-900 dark:text-[#F5F5F5]">
          {title}
        </h1>
      </div>

      {/* Filter Dropdowns (Faithful to Screenshot layout with live interactivity) */}
      <div className="flex flex-wrap items-center gap-2.5 text-xs">
        {/* Reset Filters button if any filter is active */}
        {hasActiveFilters && (
          <button
            onClick={resetFilters}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-white dark:bg-[#202020] hover:bg-slate-50 dark:hover:bg-[#303030] text-[#FF5938] border border-[#FF5938]/40 transition-colors font-medium cursor-pointer shadow-sm"
            title="Reset all filters to defaults"
          >
            <RotateCcw className="w-3.5 h-3.5" />
            <span>Reset</span>
          </button>
        )}

        {/* 1. Timeframe Filter */}
        <div className="relative">
          <button
            onClick={() => toggleDropdown('timeframe')}
            className={`flex items-center gap-2 px-3.5 py-1.5 rounded-lg border transition-all cursor-pointer shadow-sm ${
              timeframe !== 'TODAY'
                ? 'bg-white dark:bg-[#202020] text-[#FF5938] border-[#FF5938] font-semibold'
                : 'bg-white dark:bg-[#151515] hover:bg-slate-50 dark:hover:bg-[#202020] border-slate-200 dark:border-[#303030] text-slate-700 dark:text-[#A0A0A0] hover:text-slate-900 dark:hover:text-[#F5F5F5]'
            }`}
          >
            <Calendar className="w-3.5 h-3.5 text-[#FF5938]" />
            <span>{timeframeLabels[timeframe]}</span>
            <ChevronDown className="w-3.5 h-3.5 text-slate-400 dark:text-[#737373]" />
          </button>
          {openDropdown === 'timeframe' && (
            <div className="absolute right-0 mt-1.5 w-40 bg-white dark:bg-[#202020] border border-slate-200 dark:border-[#303030] rounded-xl shadow-2xl p-1.5 z-50">
              {(Object.keys(timeframeLabels) as GlobalTimeframe[]).map((tf) => (
                <button
                  key={tf}
                  onClick={() => {
                    setTimeframe(tf);
                    setOpenDropdown(null);
                  }}
                  className={`w-full text-left px-3 py-2 rounded-lg text-xs flex items-center justify-between cursor-pointer transition-colors ${
                    timeframe === tf
                      ? 'bg-slate-100 dark:bg-[#151515] text-[#FF5938] font-semibold'
                      : 'text-slate-800 dark:text-[#F5F5F5] hover:bg-slate-50 dark:hover:bg-[#151515]'
                  }`}
                >
                  {timeframeLabels[tf]}
                  {timeframe === tf && <Check className="w-3.5 h-3.5 text-[#FF5938]" />}
                </button>
              ))}
            </div>
          )}
        </div>

        {/* 2. Region Filter */}
        <div className="relative">
          <button
            onClick={() => toggleDropdown('region')}
            className={`flex items-center gap-2 px-3.5 py-1.5 rounded-lg border transition-all cursor-pointer shadow-sm ${
              region !== 'ALL'
                ? 'bg-white dark:bg-[#202020] text-[#FF5938] border-[#FF5938] font-semibold'
                : 'bg-white dark:bg-[#151515] hover:bg-slate-50 dark:hover:bg-[#202020] border-slate-200 dark:border-[#303030] text-slate-700 dark:text-[#A0A0A0] hover:text-slate-900 dark:hover:text-[#F5F5F5]'
            }`}
          >
            <Globe className="w-3.5 h-3.5 text-[#FF5938]" />
            <span>{region === 'ALL' ? 'Region' : region}</span>
            <ChevronDown className="w-3.5 h-3.5 text-slate-400 dark:text-[#737373]" />
          </button>
          {openDropdown === 'region' && (
            <div className="absolute right-0 mt-1.5 w-36 bg-white dark:bg-[#202020] border border-slate-200 dark:border-[#303030] rounded-xl shadow-2xl p-1.5 z-50">
              {regions.map((reg) => (
                <button
                  key={reg}
                  onClick={() => {
                    setRegion(reg);
                    setOpenDropdown(null);
                  }}
                  className={`w-full text-left px-3 py-2 rounded-lg text-xs flex items-center justify-between cursor-pointer transition-colors ${
                    region === reg
                      ? 'bg-slate-100 dark:bg-[#151515] text-[#FF5938] font-semibold'
                      : 'text-slate-800 dark:text-[#F5F5F5] hover:bg-slate-50 dark:hover:bg-[#151515]'
                  }`}
                >
                  {reg === 'ALL' ? 'All Regions' : reg}
                  {region === reg && <Check className="w-3.5 h-3.5 text-[#FF5938]" />}
                </button>
              ))}
            </div>
          )}
        </div>

        {/* 3. Product Category Filter */}
        <div className="relative">
          <button
            onClick={() => toggleDropdown('product')}
            className={`flex items-center gap-2 px-3.5 py-1.5 rounded-lg border transition-all truncate max-w-[170px] cursor-pointer shadow-sm ${
              selectedCategory !== 'All Products'
                ? 'bg-white dark:bg-[#202020] text-[#FF5938] border-[#FF5938] font-semibold'
                : 'bg-white dark:bg-[#151515] hover:bg-slate-50 dark:hover:bg-[#202020] border-slate-200 dark:border-[#303030] text-slate-700 dark:text-[#A0A0A0] hover:text-slate-900 dark:hover:text-[#F5F5F5]'
            }`}
          >
            <Box className="w-3.5 h-3.5 text-[#FF5938]" />
            <span className="truncate">{selectedCategory === 'All Products' ? 'Product' : selectedCategory}</span>
            <ChevronDown className="w-3.5 h-3.5 text-slate-400 dark:text-[#737373] shrink-0" />
          </button>
          {openDropdown === 'product' && (
            <div className="absolute right-0 mt-1.5 w-52 bg-white dark:bg-[#202020] border border-slate-200 dark:border-[#303030] rounded-xl shadow-2xl p-1.5 z-50">
              {categories.map((cat) => (
                <button
                  key={cat}
                  onClick={() => {
                    setSelectedCategory(cat);
                    setOpenDropdown(null);
                  }}
                  className={`w-full text-left px-3 py-2 rounded-lg text-xs flex items-center justify-between cursor-pointer transition-colors ${
                    selectedCategory === cat
                      ? 'bg-slate-100 dark:bg-[#151515] text-[#FF5938] font-semibold'
                      : 'text-slate-800 dark:text-[#F5F5F5] hover:bg-slate-50 dark:hover:bg-[#151515]'
                  }`}
                >
                  <span className="truncate">{cat}</span>
                  {selectedCategory === cat && <Check className="w-3.5 h-3.5 text-[#FF5938] shrink-0" />}
                </button>
              ))}
            </div>
          )}
        </div>

        {/* 4. Supplier Filter */}
        <div className="relative">
          <button
            onClick={() => toggleDropdown('supplier')}
            className={`flex items-center gap-2 px-3.5 py-1.5 rounded-lg border transition-all truncate max-w-[170px] cursor-pointer shadow-sm ${
              selectedSupplier !== 'All Suppliers'
                ? 'bg-white dark:bg-[#202020] text-[#FF5938] border-[#FF5938] font-semibold'
                : 'bg-white dark:bg-[#151515] hover:bg-slate-50 dark:hover:bg-[#202020] border-slate-200 dark:border-[#303030] text-slate-700 dark:text-[#A0A0A0] hover:text-slate-900 dark:hover:text-[#F5F5F5]'
            }`}
          >
            <Users className="w-3.5 h-3.5 text-[#FF5938]" />
            <span className="truncate">{selectedSupplier === 'All Suppliers' ? 'Supplier' : selectedSupplier}</span>
            <ChevronDown className="w-3.5 h-3.5 text-slate-400 dark:text-[#737373] shrink-0" />
          </button>
          {openDropdown === 'supplier' && (
            <div className="absolute right-0 mt-1.5 w-60 bg-white dark:bg-[#202020] border border-slate-200 dark:border-[#303030] rounded-xl shadow-2xl p-1.5 z-50">
              {suppliers.map((sup) => (
                <button
                  key={sup}
                  onClick={() => {
                    setSelectedSupplier(sup);
                    setOpenDropdown(null);
                  }}
                  className={`w-full text-left px-3 py-2 rounded-lg text-xs flex items-center justify-between cursor-pointer transition-colors ${
                    selectedSupplier === sup
                      ? 'bg-slate-100 dark:bg-[#151515] text-[#FF5938] font-semibold'
                      : 'text-slate-800 dark:text-[#F5F5F5] hover:bg-slate-50 dark:hover:bg-[#151515]'
                  }`}
                >
                  <span className="truncate">{sup}</span>
                  {selectedSupplier === sup && <Check className="w-3.5 h-3.5 text-[#FF5938] shrink-0" />}
                </button>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
