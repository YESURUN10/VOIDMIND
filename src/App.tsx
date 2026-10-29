/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect, Suspense, lazy } from 'react';
import { AuthProvider } from './context/AuthContext.tsx';
import { ThemeProvider } from './context/ThemeContext.tsx';
import { FilterProvider } from './context/FilterContext.tsx';
import { AppLayout } from './components/layout/AppLayout.tsx';

// Code-split route components via React.lazy for optimized bundle performance
const OverviewPage = lazy(() => import('./pages/OverviewPage.tsx').then((m) => ({ default: m.OverviewPage })));
const AnalyticsPage = lazy(() => import('./pages/AnalyticsPage.tsx').then((m) => ({ default: m.AnalyticsPage })));
const DisruptionsPage = lazy(() => import('./pages/DisruptionsPage.tsx').then((m) => ({ default: m.DisruptionsPage })));
const OrdersPage = lazy(() => import('./pages/OrdersPage.tsx').then((m) => ({ default: m.OrdersPage })));
const ShipmentsPage = lazy(() => import('./pages/ShipmentsPage.tsx').then((m) => ({ default: m.ShipmentsPage })));
const InventoryPage = lazy(() => import('./pages/InventoryPage.tsx').then((m) => ({ default: m.InventoryPage })));
const WarehousesPage = lazy(() => import('./pages/WarehousesPage.tsx').then((m) => ({ default: m.WarehousesPage })));
const SuppliersPage = lazy(() => import('./pages/SuppliersPage.tsx').then((m) => ({ default: m.SuppliersPage })));
const RecoveryPlansPage = lazy(() => import('./pages/RecoveryPlansPage.tsx').then((m) => ({ default: m.RecoveryPlansPage })));
const ApprovalsPage = lazy(() => import('./pages/ApprovalsPage.tsx').then((m) => ({ default: m.ApprovalsPage })));
const AuditPage = lazy(() => import('./pages/AuditPage.tsx').then((m) => ({ default: m.AuditPage })));
const ImportsPage = lazy(() => import('./pages/ImportsPage.tsx').then((m) => ({ default: m.ImportsPage })));
const SettingsPage = lazy(() => import('./pages/SettingsPage.tsx').then((m) => ({ default: m.SettingsPage })));

const RouteLoadingSkeleton = () => (
  <div className="w-full space-y-6 animate-pulse py-4">
    <div className="grid grid-cols-2 lg:grid-cols-5 gap-4">
      {[1, 2, 3, 4, 5].map((i) => (
        <div key={i} className="h-28 rounded-xl bg-[#202020]/70 border border-[#303030]/60" />
      ))}
    </div>
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
      <div className="h-72 rounded-xl bg-[#202020]/70 border border-[#303030]/60 lg:col-span-2" />
      <div className="h-72 rounded-xl bg-[#202020]/70 border border-[#303030]/60" />
    </div>
  </div>
);

export default function App() {
  const [currentPath, setCurrentPath] = useState<string>(() => {
    const hash = window.location.hash.replace('#', '');
    return hash && hash.startsWith('/') ? hash : '/overview';
  });

  useEffect(() => {
    const handlePopState = () => {
      const hash = window.location.hash.replace('#', '');
      if (hash && hash.startsWith('/')) {
        setCurrentPath(hash);
      }
    };
    window.addEventListener('hashchange', handlePopState);
    return () => window.removeEventListener('hashchange', handlePopState);
  }, []);

  const handleNavigate = (path: string) => {
    setCurrentPath(path);
    window.location.hash = path;
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const renderActiveRoute = () => {
    switch (currentPath) {
      case '/overview':
        return <OverviewPage onNavigate={handleNavigate} />;
      case '/analytics':
        return <AnalyticsPage />;
      case '/disruptions':
        return <DisruptionsPage onNavigate={handleNavigate} />;
      case '/orders':
        return <OrdersPage />;
      case '/shipments':
        return <ShipmentsPage />;
      case '/inventory':
        return <InventoryPage onNavigate={handleNavigate} />;
      case '/warehouses':
        return <WarehousesPage />;
      case '/suppliers':
        return <SuppliersPage />;
      case '/recovery-plans':
        return <RecoveryPlansPage onNavigate={handleNavigate} />;
      case '/approvals':
        return <ApprovalsPage />;
      case '/audit':
        return <AuditPage />;
      case '/imports':
        return <ImportsPage />;
      case '/settings':
        return <SettingsPage onNavigate={handleNavigate} />;
      default:
        return <OverviewPage onNavigate={handleNavigate} />;
    }
  };

  return (
    <ThemeProvider>
      <AuthProvider>
        <FilterProvider>
          <AppLayout currentPath={currentPath} onNavigate={handleNavigate}>
            <Suspense fallback={<RouteLoadingSkeleton />}>
              {renderActiveRoute()}
            </Suspense>
          </AppLayout>
        </FilterProvider>
      </AuthProvider>
    </ThemeProvider>
  );
}
