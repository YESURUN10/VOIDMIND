import React, { createContext, useContext, useState, useCallback } from 'react';
import { GlobalTimeframe, GlobalRegion } from '../types/index.ts';

interface FilterContextType {
  timeframe: GlobalTimeframe;
  setTimeframe: (val: GlobalTimeframe) => void;
  region: GlobalRegion;
  setRegion: (val: GlobalRegion) => void;
  selectedCategory: string;
  setSelectedCategory: (val: string) => void;
  selectedSupplier: string;
  setSelectedSupplier: (val: string) => void;
  searchQuery: string;
  setSearchQuery: (val: string) => void;
  resetFilters: () => void;
}

const FilterContext = createContext<FilterContextType | undefined>(undefined);

export const FilterProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [timeframe, setTimeframe] = useState<GlobalTimeframe>('TODAY');
  const [region, setRegion] = useState<GlobalRegion>('ALL');
  const [selectedCategory, setSelectedCategory] = useState<string>('All Products');
  const [selectedSupplier, setSelectedSupplier] = useState<string>('All Suppliers');
  const [searchQuery, setSearchQuery] = useState<string>('');

  const resetFilters = useCallback(() => {
    setTimeframe('TODAY');
    setRegion('ALL');
    setSelectedCategory('All Products');
    setSelectedSupplier('All Suppliers');
    setSearchQuery('');
  }, []);

  return (
    <FilterContext.Provider
      value={{
        timeframe,
        setTimeframe,
        region,
        setRegion,
        selectedCategory,
        setSelectedCategory,
        selectedSupplier,
        setSelectedSupplier,
        searchQuery,
        setSearchQuery,
        resetFilters,
      }}
    >
      {children}
    </FilterContext.Provider>
  );
};

export function useFilter() {
  const context = useContext(FilterContext);
  if (!context) {
    throw new Error('useFilter must be used within a FilterProvider');
  }
  return context;
}
