import React, { useState } from 'react';
import {
  Search,
  Moon,
  Sun,
  Bell,
  Settings,
  Download,
  ChevronDown,
  Check,
  X,
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext.tsx';
import { useTheme } from '../../context/ThemeContext.tsx';
import { useFilter } from '../../context/FilterContext.tsx';

interface TopNavigationProps {
  currentPath: string;
  onNavigate: (path: string) => void;
  onExport: () => void;
}

export const TopNavigation: React.FC<TopNavigationProps> = ({
  currentPath,
  onNavigate,
  onExport,
}) => {
  const { currentUser, switchUser, allUsers } = useAuth();
  const { theme, setTheme } = useTheme();
  const { searchQuery, setSearchQuery } = useFilter();
  const [showRoleDropdown, setShowRoleDropdown] = useState(false);
  const [showNotifications, setShowNotifications] = useState(false);

  // Primary top links
  const primaryNavItems = [
    { label: 'Overview', path: '/overview' },
    { label: 'Analytics', path: '/analytics' },
    { label: 'Disruptions', path: '/disruptions' },
    { label: 'Orders', path: '/orders' },
    { label: 'Shipments', path: '/shipments' },
    { label: 'Recovery', path: '/recovery-plans' },
    { label: 'Approvals', path: '/approvals' },
  ];

  return (
    <header className="sticky top-0 z-40 w-full bg-white dark:bg-[#151515] border-b border-slate-200 dark:border-[#303030] px-4 lg:px-6 h-16 flex items-center justify-between gap-4 select-none transition-colors duration-200">
      {/* 1. Left: VoidMind Brand Lockup */}
      <div className="flex items-center gap-8 shrink-0">
        <button
          onClick={() => onNavigate('/overview')}
          className="flex items-center gap-3 text-left focus:outline-none group cursor-pointer"
        >
          <div className="flex items-center justify-center w-8 h-8 rounded-lg bg-gradient-to-br from-[#FF5938] to-[#96351D] text-white font-extrabold text-base shadow-sm tracking-wider">
            V
          </div>
          <div className="flex flex-col">
            <span className="text-sm font-bold tracking-widest text-slate-900 dark:text-[#F5F5F5] uppercase group-hover:text-[#FF5938] transition-colors">
              VOIDMIND
            </span>
            <span className="text-[10px] tracking-wider text-slate-500 dark:text-[#A0A0A0] uppercase -mt-0.5">
              Supply Chain Intelligence
            </span>
          </div>
        </button>

        {/* Primary Navigation Links */}
        <nav className="hidden xl:flex items-center gap-1">
          {primaryNavItems.map((item) => {
            const isActive = currentPath === item.path;
            return (
              <button
                key={item.path}
                onClick={() => onNavigate(item.path)}
                className={`relative px-3.5 py-1.5 text-xs font-semibold rounded-lg transition-colors whitespace-nowrap cursor-pointer ${
                  isActive
                    ? 'text-slate-950 dark:text-white bg-slate-100 dark:bg-[#202020]'
                    : 'text-slate-600 dark:text-[#A0A0A0] hover:text-slate-950 dark:hover:text-[#F5F5F5] hover:bg-slate-50 dark:hover:bg-[#202020]/50'
                }`}
              >
                {item.label}
                {isActive && (
                  <span className="absolute bottom-0 left-2 right-2 h-0.5 bg-[#FF5938] rounded-full" />
                )}
              </button>
            );
          })}
        </nav>
      </div>

      {/* 2. Center: Global Search Input with Active Filtering & Clear Button */}
      <div className="flex-1 max-w-md mx-2 relative hidden md:block">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 dark:text-[#737373]" />
          <input
            type="text"
            placeholder="Search SKU, PO, supplier, tracking #..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full bg-slate-50 dark:bg-[#111111] border border-slate-200 dark:border-[#303030] rounded-lg pl-9 pr-8 py-1.5 text-xs text-slate-900 dark:text-[#F5F5F5] placeholder-slate-400 dark:placeholder-[#737373] focus:outline-none focus:border-[#FF5938] transition-colors"
          />
          {searchQuery && (
            <button
              onClick={() => setSearchQuery('')}
              className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-700 dark:text-[#737373] dark:hover:text-white p-0.5 cursor-pointer"
              title="Clear search"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          )}
        </div>
      </div>

      {/* 3. Right: Utility Tools & Role Profile */}
      <div className="flex items-center gap-2.5 shrink-0">
        {/* Working Light / Dark Theme Switcher */}
        <div className="hidden sm:flex items-center bg-slate-100 dark:bg-[#111111] border border-slate-200 dark:border-[#303030] rounded-lg p-0.5 text-xs">
          <button
            onClick={() => setTheme('light')}
            className={`px-2.5 py-1 rounded-md font-medium flex items-center gap-1.5 transition-all cursor-pointer ${
              theme === 'light'
                ? 'bg-white text-slate-900 border border-slate-200 shadow-sm font-semibold'
                : 'text-slate-500 hover:text-slate-900 dark:text-[#737373] dark:hover:text-[#A0A0A0]'
            }`}
            title="Switch to Light Mode"
          >
            <Sun className={`w-3.5 h-3.5 ${theme === 'light' ? 'text-amber-500' : ''}`} /> Light
          </button>
          <button
            onClick={() => setTheme('dark')}
            className={`px-2.5 py-1 rounded-md font-medium flex items-center gap-1.5 transition-all cursor-pointer ${
              theme === 'dark'
                ? 'bg-[#202020] text-white border border-[#303030] shadow-sm font-semibold'
                : 'text-slate-500 hover:text-slate-900 dark:text-[#737373] dark:hover:text-[#A0A0A0]'
            }`}
            title="Switch to Dark Mode"
          >
            <Moon className={`w-3.5 h-3.5 ${theme === 'dark' ? 'text-[#FF5938]' : ''}`} /> Dark
          </button>
        </div>

        {/* Notifications Dropdown */}
        <div className="relative">
          <button
            onClick={() => setShowNotifications(!showNotifications)}
            className="relative p-2 rounded-lg bg-white dark:bg-[#202020] hover:bg-slate-50 dark:hover:bg-[#303030] text-slate-600 dark:text-[#A0A0A0] hover:text-slate-900 dark:hover:text-white transition-colors border border-slate-200 dark:border-[#303030] cursor-pointer shadow-sm"
            title="Active Disruption Alerts"
          >
            <Bell className="w-4 h-4" />
            <span className="absolute top-1.5 right-1.5 w-2 h-2 rounded-full bg-[#FF5938] ring-2 ring-white dark:ring-[#151515]" />
          </button>

          {showNotifications && (
            <div className="absolute right-0 mt-2 w-80 bg-white dark:bg-[#202020] border border-slate-200 dark:border-[#303030] rounded-xl shadow-2xl p-3.5 z-50">
              <div className="flex items-center justify-between pb-2 border-b border-slate-200 dark:border-[#303030]">
                <span className="text-xs font-semibold text-slate-900 dark:text-white">Active Alerts (2)</span>
                <span className="text-[10px] text-slate-500 dark:text-[#A0A0A0]">Real-time telemetry</span>
              </div>
              <div className="mt-2.5 space-y-2">
                <div
                  onClick={() => {
                    onNavigate('/disruptions');
                    setShowNotifications(false);
                  }}
                  className="p-2.5 rounded-lg bg-slate-50 dark:bg-[#151515] border border-slate-200 dark:border-[#303030] hover:border-[#FF5938] cursor-pointer transition-colors"
                >
                  <div className="flex items-center justify-between">
                    <span className="text-[11px] font-bold text-[#FF5938]">PORT CONGESTION</span>
                    <span className="text-[10px] text-slate-500 dark:text-[#737373] font-mono">TRK-MAERSK-9021</span>
                  </div>
                  <p className="text-xs text-slate-800 dark:text-[#F5F5F5] mt-1">Long Beach Terminal queue: +6 days dwell time</p>
                </div>
                <div
                  onClick={() => {
                    onNavigate('/inventory');
                    setShowNotifications(false);
                  }}
                  className="p-2.5 rounded-lg bg-slate-50 dark:bg-[#151515] border border-slate-200 dark:border-[#303030] hover:border-[#FF5938] cursor-pointer transition-colors"
                >
                  <div className="flex items-center justify-between">
                    <span className="text-[11px] font-bold text-amber-500 dark:text-amber-400">LOW STOCK TRIGGER</span>
                    <span className="text-[10px] text-slate-500 dark:text-[#737373] font-mono">SKU-12345</span>
                  </div>
                  <p className="text-xs text-slate-800 dark:text-[#F5F5F5] mt-1">Current stock: 45 units (below safety stock 80)</p>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Settings button */}
        <button
          onClick={() => onNavigate('/settings')}
          className="p-2 rounded-lg bg-white dark:bg-[#202020] hover:bg-slate-50 dark:hover:bg-[#303030] text-slate-600 dark:text-[#A0A0A0] hover:text-slate-900 dark:hover:text-white transition-colors border border-slate-200 dark:border-[#303030] cursor-pointer shadow-sm"
          title="System Settings"
        >
          <Settings className="w-4 h-4" />
        </button>

        {/* Working Export button */}
        <button
          onClick={onExport}
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-white dark:bg-[#202020] hover:bg-slate-50 dark:hover:bg-[#303030] text-xs font-semibold text-slate-800 dark:text-[#F5F5F5] border border-slate-200 dark:border-[#303030] transition-colors cursor-pointer btn-press shadow-sm"
          title="Export Active Dataset as CSV"
        >
          <Download className="w-3.5 h-3.5 text-[#FF5938]" />
          <span>Export</span>
        </button>

        {/* User Profile & Role Switcher */}
        <div className="relative">
          <button
            onClick={() => setShowRoleDropdown(!showRoleDropdown)}
            className="flex items-center gap-2 pl-2 pr-3 py-1 rounded-lg bg-white dark:bg-[#202020] hover:bg-slate-50 dark:hover:bg-[#303030] border border-slate-200 dark:border-[#303030] transition-colors cursor-pointer shadow-sm"
            title="Switch User Persona & Role"
          >
            <div className="w-7 h-7 rounded-full bg-gradient-to-tr from-[#FF5938] to-[#96351D] flex items-center justify-center text-white text-xs font-semibold">
              {currentUser.name.charAt(0)}
            </div>
            <div className="hidden sm:flex flex-col text-left">
              <span className="text-xs font-semibold text-slate-900 dark:text-[#F5F5F5] leading-tight truncate max-w-[120px]">
                {currentUser.name}
              </span>
              <span className="text-[10px] text-slate-500 dark:text-[#A0A0A0] truncate max-w-[120px]">
                {currentUser.role.replace(/_/g, ' ')}
              </span>
            </div>
            <ChevronDown className="w-3.5 h-3.5 text-slate-400 dark:text-[#A0A0A0]" />
          </button>

          {showRoleDropdown && (
            <div className="absolute right-0 mt-2 w-72 bg-white dark:bg-[#202020] border border-slate-200 dark:border-[#303030] rounded-xl shadow-2xl p-2 z-50">
              <div className="px-3 py-2 border-b border-slate-200 dark:border-[#303030]">
                <p className="text-xs font-semibold text-slate-900 dark:text-white">Active Operational Persona</p>
                <p className="text-[10px] text-slate-500 dark:text-[#A0A0A0]">Switch roles to test permissions & workflows</p>
              </div>
              <div className="py-1">
                {allUsers.map((user) => {
                  const isCurrent = user.id === currentUser.id;
                  return (
                    <button
                      key={user.id}
                      onClick={() => {
                        switchUser(user.id);
                        setShowRoleDropdown(false);
                      }}
                      className={`w-full text-left px-3 py-2 rounded-lg text-xs flex items-center justify-between transition-colors cursor-pointer ${
                        isCurrent
                          ? 'bg-slate-100 dark:bg-[#151515] text-[#FF5938] font-semibold'
                          : 'text-slate-800 dark:text-[#F5F5F5] hover:bg-slate-50 dark:hover:bg-[#151515]'
                      }`}
                    >
                      <div className="flex flex-col">
                        <span className="font-medium">{user.name}</span>
                        <span className="text-[10px] text-slate-500 dark:text-[#A0A0A0]">{user.title}</span>
                      </div>
                      {isCurrent && <Check className="w-4 h-4 text-[#FF5938]" />}
                    </button>
                  );
                })}
              </div>
            </div>
          )}
        </div>
      </div>
    </header>
  );
};
