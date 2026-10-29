import React from 'react';
import {
  LayoutDashboard,
  TrendingUp,
  AlertTriangle,
  ShoppingCart,
  Truck,
  Package,
  Warehouse,
  Users,
  GitBranch,
  CheckSquare,
  FileText,
  UploadCloud,
  Settings,
} from 'lucide-react';

interface LeftNavRailProps {
  currentPath: string;
  onNavigate: (path: string) => void;
  activeDisruptionsCount?: number;
  pendingApprovalsCount?: number;
}

export const LeftNavRail: React.FC<LeftNavRailProps> = ({
  currentPath,
  onNavigate,
  activeDisruptionsCount = 1,
  pendingApprovalsCount = 1,
}) => {
  const routes = [
    { path: '/overview', label: 'Overview', icon: LayoutDashboard },
    { path: '/analytics', label: 'Analytics', icon: TrendingUp },
    { path: '/disruptions', label: 'Disruptions', icon: AlertTriangle, badge: activeDisruptionsCount },
    { path: '/orders', label: 'Orders', icon: ShoppingCart },
    { path: '/shipments', label: 'Shipments', icon: Truck },
    { path: '/inventory', label: 'Inventory', icon: Package },
    { path: '/warehouses', label: 'Warehouses', icon: Warehouse },
    { path: '/suppliers', label: 'Suppliers', icon: Users },
    { path: '/recovery-plans', label: 'Recovery Plans', icon: GitBranch },
    { path: '/approvals', label: 'Approvals', icon: CheckSquare, badge: pendingApprovalsCount },
    { path: '/audit', label: 'Audit Ledger', icon: FileText },
    { path: '/imports', label: 'Data Imports', icon: UploadCloud },
    { path: '/settings', label: 'Settings', icon: Settings },
  ];

  return (
    <aside className="w-16 lg:w-56 shrink-0 bg-white dark:bg-[#151515] border-r border-slate-200 dark:border-[#303030] flex flex-col justify-between py-4 select-none transition-colors duration-200">
      <div className="space-y-1 px-2.5">
        <div className="hidden lg:block px-3 py-1.5 text-[11px] font-bold tracking-wider text-slate-400 dark:text-[#737373] uppercase">
          Workflows
        </div>
        {routes.map((route) => {
          const Icon = route.icon;
          const isActive = currentPath === route.path;

          return (
            <button
              key={route.path}
              onClick={() => onNavigate(route.path)}
              className={`w-full flex items-center justify-center lg:justify-between px-3 py-2 rounded-lg text-xs font-semibold transition-all group relative cursor-pointer ${
                isActive
                  ? 'bg-slate-100 dark:bg-[#202020] text-slate-950 dark:text-white shadow-sm'
                  : 'text-slate-600 dark:text-[#A0A0A0] hover:text-slate-950 dark:hover:text-[#F5F5F5] hover:bg-slate-50 dark:hover:bg-[#202020]/60'
              }`}
              title={route.label}
            >
              <div className="flex items-center gap-3">
                <Icon
                  className={`w-4 h-4 shrink-0 transition-colors ${
                    isActive ? 'text-[#FF5938]' : 'text-slate-500 dark:text-[#A0A0A0] group-hover:text-slate-900 dark:group-hover:text-[#F5F5F5]'
                  }`}
                />
                <span className="hidden lg:inline truncate">{route.label}</span>
              </div>

              {route.badge && route.badge > 0 && (
                <span className="hidden lg:flex items-center justify-center px-1.5 py-0.5 text-[10px] font-bold rounded-full bg-[#FF5938] text-white font-mono">
                  {route.badge}
                </span>
              )}

              {/* Mobile Tooltip */}
              <div className="lg:hidden absolute left-full ml-2 px-2.5 py-1 bg-slate-900 dark:bg-[#202020] border border-slate-800 dark:border-[#303030] rounded-md text-xs text-white whitespace-nowrap opacity-0 group-hover:opacity-100 pointer-events-none transition-opacity z-50 shadow-lg font-medium">
                {route.label}
              </div>
            </button>
          );
        })}
      </div>

      {/* Bottom Status Indicator */}
      <div className="px-3 pt-3 border-t border-slate-200 dark:border-[#303030] hidden lg:block">
        <div className="flex items-center gap-2 text-xs text-slate-500 dark:text-[#737373]">
          <span className="w-2 h-2 rounded-full bg-[#FF5938] shrink-0 animate-pulse" />
          <span className="truncate font-medium">Keelung → Long Beach Lane</span>
        </div>
      </div>
    </aside>
  );
};
