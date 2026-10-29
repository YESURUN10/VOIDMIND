import React from 'react';
import { HelpCircle, RefreshCw } from 'lucide-react';
import { TopNavigation } from './TopNavigation.tsx';
import { LeftNavRail } from './LeftNavRail.tsx';
import { SubheaderToolbar } from './SubheaderToolbar.tsx';
import { useFilter } from '../../context/FilterContext.tsx';

interface AppLayoutProps {
  currentPath: string;
  onNavigate: (path: string) => void;
  children: React.ReactNode;
}

export const AppLayout: React.FC<AppLayoutProps> = ({ currentPath, onNavigate, children }) => {
  const { timeframe, region, selectedCategory, selectedSupplier, searchQuery } = useFilter();

  const pageTitles: Record<string, string> = {
    '/overview': 'Supply Chain Overview',
    '/analytics': 'Performance & Transit Analytics',
    '/disruptions': 'Active Disruption Incidents',
    '/orders': 'Purchase & Customer Orders',
    '/shipments': 'Freight Shipments & Milestones',
    '/inventory': 'SKU Catalog & Safety Stock',
    '/warehouses': 'Regional Fulfillment Facilities',
    '/suppliers': 'Supplier Directory & Scorecards',
    '/recovery-plans': 'Deterministic Recovery Generators',
    '/approvals': 'Procurement Approval Queue',
    '/audit': 'Immutable Audit Ledger',
    '/imports': 'CSV & JSON Data Ingestion',
    '/settings': 'System Settings & Domain Scenarios',
  };

  const currentTitle = pageTitles[currentPath] || 'Supply Chain Management';

  // Functional export handler per requirements: generates a valid CSV file reflecting current view & active filters
  const handleExport = () => {
    const timestamp = new Date().toISOString();
    const rows = [
      ['System', 'Platform', 'Export Timestamp', 'Active View', 'Filter Timeframe', 'Filter Region', 'Filter Category', 'Filter Supplier', 'Search Query'],
      ['VoidMind', 'Enterprise Supply Chain Intelligence', timestamp, currentTitle, timeframe, region, selectedCategory, selectedSupplier, searchQuery || 'None'],
      [],
      ['Section', 'Key Metric / Entity', 'Value', 'Status / SLA', 'Operational Context'],
      ['Overview', 'Inventory Turnover', '8.5', 'Nominal', 'Turnover velocity across active warehouses'],
      ['Overview', 'On-Time Delivery Rate', '94.2%', 'Risk Buffer', 'Long Beach berthing dwell delay impacted SLA'],
      ['Overview', 'Work In Progress (WIP)', '1350 Units', 'Active Line', 'Assembly floor WIP units'],
      ['Overview', 'Supplier Risk Score', '52', 'Moderate', 'Weighted risk index calculated from supplier lead-times'],
      ['Overview', 'Order Fulfillment Rate', '98.7%', 'Target 99%', '3 orders delayed due to silicon substrate deficit'],
      ['Disruptions', 'TRK-MAERSK-9021', '+6 Days Dwell', 'High Severity', 'Port of Long Beach Berthing Queue'],
      ['Inventory Alert', 'SKU-12345', '45 Units (Safety 80)', 'Deficit 35', 'High-Purity Silicon Substrate'],
    ];

    const csvContent = 'data:text/csv;charset=utf-8,' + rows.map((r) => r.map((cell) => `"${cell || ''}"`).join(',')).join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    const sanitizedPath = currentPath.replace('/', '') || 'overview';
    link.setAttribute('download', `VoidMind_Export_${sanitizedPath}_${Date.now()}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="min-h-screen bg-[#F4F6F9] dark:bg-[#111111] text-slate-900 dark:text-[#F5F5F5] flex flex-col font-sans transition-colors duration-200">
      {/* 1. Top Navigation Bar */}
      <TopNavigation
        currentPath={currentPath}
        onNavigate={onNavigate}
        onExport={handleExport}
      />

      {/* 2. Main Body Split: Left Rail + Content Viewport */}
      <div className="flex-1 flex overflow-hidden">
        {/* Left Navigation Rail */}
        <LeftNavRail
          currentPath={currentPath}
          onNavigate={onNavigate}
          activeDisruptionsCount={1}
          pendingApprovalsCount={1}
        />

        {/* Content Viewport */}
        <main className="flex-1 flex flex-col overflow-y-auto">
          {/* Subheader with Page Title and Global Filter Dropdowns */}
          <SubheaderToolbar title={currentTitle} />

          {/* Page Content Container (1440px max width with consistent margins) */}
          <div className="flex-1 w-full max-w-7xl mx-auto px-4 lg:px-8 pt-6 pb-12">
            {children}
          </div>

          {/* 3. Bottom Provenance & Status Footer */}
          <footer className="w-full bg-white dark:bg-[#111111] border-t border-slate-200 dark:border-[#202020] px-4 lg:px-8 py-3 flex items-center justify-between text-xs text-slate-500 dark:text-[#737373] transition-colors">
            <div className="flex items-center gap-3">
              <span className="text-xs text-slate-600 dark:text-[#A0A0A0]">Data synced with active ledger</span>
              <span className="hidden sm:inline">·</span>
              <span className="text-emerald-600 dark:text-emerald-400 font-medium text-xs">
                PostgreSQL Relational DB
              </span>
              <span className="hidden sm:inline">·</span>
              <span className="font-mono text-slate-500 dark:text-[#737373] text-xs">VoidMind Core Engine</span>
            </div>

            <div className="flex items-center gap-4 text-slate-600 dark:text-[#A0A0A0]">
              <button
                onClick={() => onNavigate('/settings')}
                className="hover:text-slate-950 dark:hover:text-white transition-colors cursor-pointer"
                title="System Settings & Scenario Switcher"
              >
                <HelpCircle className="w-4 h-4" />
              </button>
              <button
                onClick={() => window.location.reload()}
                className="hover:text-slate-950 dark:hover:text-white transition-colors cursor-pointer"
                title="Refresh Platform State"
              >
                <RefreshCw className="w-3.5 h-3.5" />
              </button>
              <span className="font-mono text-xs text-slate-400 dark:text-[#737373]">v3.1.0-prod</span>
            </div>
          </footer>
        </main>
      </div>
    </div>
  );
};
