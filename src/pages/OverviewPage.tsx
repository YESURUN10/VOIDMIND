import React, { useState, useEffect } from 'react';
import {
  DollarSign,
  Truck,
  CheckCircle2,
  AlertOctagon,
  PackageCheck,
  ChevronDown,
  Globe,
  Network,
  Activity,
  Layers,
  Sparkles,
} from 'lucide-react';
import { ReorderModal } from '../components/modals/ReorderModal.tsx';
import { EntranceWrapper } from '../components/motion/EntranceWrapper.tsx';
import { ScrollReveal } from '../components/motion/ScrollReveal.tsx';
import { SupplyNetworkMap } from '../components/visualizations/SupplyNetworkMap.tsx';
import { RecoveryTimeline } from '../components/visualizations/RecoveryTimeline.tsx';
import { useFilter } from '../context/FilterContext.tsx';
import { useTheme } from '../context/ThemeContext.tsx';

interface OverviewPageProps {
  onNavigate: (path: string) => void;
}

export const OverviewPage: React.FC<OverviewPageProps> = ({ onNavigate }) => {
  const { theme } = useTheme();
  const { timeframe, region, selectedCategory, selectedSupplier } = useFilter();
  const [data, setData] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isReorderModalOpen, setIsReorderModalOpen] = useState(false);

  useEffect(() => {
    setIsLoading(true);
    const params = new URLSearchParams({
      timeframe,
      region,
      category: selectedCategory,
      supplier: selectedSupplier,
    });

    fetch(`/api/overview/kpis?${params.toString()}`)
      .then((res) => res.json())
      .then((json) => {
        setData(json);
        setIsLoading(false);
      })
      .catch((err) => {
        console.error('Failed to load overview KPIs:', err);
        setIsLoading(false);
      });
  }, [timeframe, region, selectedCategory, selectedSupplier]);

  const kpis = data?.kpis || {
    inventoryTurnover: { value: 8.5, delta: '+6% vs last quarter', isPositive: true },
    onTimeDeliveryRate: { value: 94.2, unit: '%', delta: '↓ 1.8% vs last quarter', isPositive: false },
    workInProgress: { value: 1350, unit: 'Units', delta: '↑ 2% vs last quarter', isPositive: true },
    supplierRiskScore: { value: 52, statusText: 'Updated 2 days ago' },
    orderFulfillment: { value: 98.7, unit: '%', target: '99%' },
  };

  const skuInfo = data?.lowStockAlert || {
    sku: 'SKU-12345',
    category: 'Raw Materials',
    name: 'High-Purity Silicon Substrate',
    currentStock: 45,
    expectedStock: 150,
    leadTimeDays: 5,
    supplierName: 'ABC Supplies Ltd.',
  };

  const trendPoints: { label: string; value: number }[] = data?.weeklyTrends || [
    { label: '0', value: 120 },
    { label: 'w1', value: 620 },
    { label: 'w2', value: 380 },
    { label: 'w3', value: 850 },
    { label: 'w4', value: 280 },
    { label: 'w5', value: 410 },
    { label: 'w6', value: 240 },
    { label: 'w7', value: 190 },
  ];

  const warehouseMetrics = data?.warehouseMetrics || {
    count: region === 'ALL' ? 4 : region === 'USA' ? 2 : region === 'EU' ? 1 : 2,
    capacityText: region === 'USA' ? '520,000 Units Capacity' : region === 'EU' ? '180,000 Units Capacity' : region === 'APAC' ? '260,000 Units Capacity' : '830,000 Units Capacity',
  };

  const inventoryDist = data?.inventoryDistribution || {
    totalUnits: 50000,
    categories: [
      { category: 'Raw Materials', units: 17500, percentage: 35 },
      { category: 'Finished Goods', units: 15000, percentage: 30 },
      { category: 'WIP', units: 10000, percentage: 20 },
      { category: 'Spare Parts', units: 5000, percentage: 10 },
      { category: 'Returns / Defective', units: 2500, percentage: 5 },
    ],
  };

  // Convert SVG coordinates for trend chart
  const maxTrend = 1000;
  const svgWidth = 450;
  const svgHeight = 200;
  const paddingLeft = 45;
  const paddingRight = 20;
  const chartWidth = svgWidth - paddingLeft - paddingRight;
  const chartHeight = 155; // 20 to 175

  const pointsFormatted = trendPoints.map((pt, idx) => {
    const x = paddingLeft + (idx / Math.max(trendPoints.length - 1, 1)) * chartWidth;
    const y = 175 - (pt.value / maxTrend) * (chartHeight - 15);
    return { x, y, label: pt.label, value: pt.value };
  });

  const pathD = pointsFormatted.reduce((acc, pt, i) => {
    return i === 0 ? `M ${pt.x} ${pt.y}` : `${acc} L ${pt.x} ${pt.y}`;
  }, '');

  const areaD = `${pathD} L ${pointsFormatted[pointsFormatted.length - 1]?.x || 430} 180 L ${pointsFormatted[0]?.x || 45} 180 Z`;

  const isDark = theme === 'dark';
  const gridStroke = isDark ? '#2B2B2B' : '#E2E8F0';
  const axisColor = isDark ? '#737373' : '#64748B';
  const mapLandFill = isDark ? '#2E2E2E' : '#E2E8F0';
  const mapLandStroke = isDark ? '#3A3A3A' : '#CBD5E1';

  return (
    <div className="w-full space-y-6 pb-16">
      {/* 1. TOP KPI ROW (5 CARDS WITH STAGGERED MOTION ENTRANCE & CARD LIFT) */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
        {/* KPI 1: Inventory Turnover */}
        <EntranceWrapper staggerIndex={0}>
          <div className="bg-white dark:bg-[#202020] border border-slate-200 dark:border-[#303030] rounded-xl p-5 flex flex-col justify-between card-lift h-full transition-colors">
            <div className="flex items-center gap-3.5">
              <div className="w-11 h-11 rounded-xl bg-gradient-to-br from-[#FF5938] to-[#96351D] flex items-center justify-center text-white shadow-md shrink-0">
                <DollarSign className="w-5 h-5 text-white" />
              </div>
              <div>
                <p className="text-xs text-slate-500 dark:text-[#A0A0A0] font-medium leading-tight">
                  Inventory Turnover
                </p>
                <h2 className="text-3xl font-bold text-slate-900 dark:text-[#F5F5F5] font-mono tracking-tight tabular-nums mt-0.5">
                  {kpis.inventoryTurnover.value}
                </h2>
              </div>
            </div>
            <div className="mt-4 pt-2 border-t border-slate-100 dark:border-[#2B2B2B] text-xs text-slate-500 dark:text-[#A0A0A0] flex items-center justify-between">
              <span className={`font-semibold tabular-nums ${kpis.inventoryTurnover.isPositive ? 'text-emerald-500 dark:text-emerald-400' : 'text-rose-500 dark:text-rose-400'}`}>
                {kpis.inventoryTurnover.delta}
              </span>
              <span className="text-[11px] text-slate-400 dark:text-[#737373]">{region !== 'ALL' ? region : 'Global'}</span>
            </div>
          </div>
        </EntranceWrapper>

        {/* KPI 2: On-Time Delivery Rate */}
        <EntranceWrapper staggerIndex={1}>
          <div className="bg-white dark:bg-[#202020] border border-slate-200 dark:border-[#303030] rounded-xl p-5 flex flex-col justify-between card-lift h-full transition-colors">
            <div className="flex items-center gap-3.5">
              <div className="w-11 h-11 rounded-xl bg-slate-100 dark:bg-[#151515] border border-slate-200 dark:border-[#303030] flex items-center justify-center text-slate-700 dark:text-white shrink-0">
                <Truck className="w-5 h-5" />
              </div>
              <div>
                <p className="text-xs text-slate-500 dark:text-[#A0A0A0] font-medium leading-tight">
                  On-Time Delivery Rate
                </p>
                <h2 className="text-3xl font-bold text-slate-900 dark:text-[#F5F5F5] font-mono tracking-tight tabular-nums mt-0.5">
                  {kpis.onTimeDeliveryRate.value}%
                </h2>
              </div>
            </div>
            <div className="mt-4 pt-2 border-t border-slate-100 dark:border-[#2B2B2B] text-xs text-slate-500 dark:text-[#A0A0A0] flex items-center justify-between">
              <span className={`font-semibold tabular-nums ${kpis.onTimeDeliveryRate.isPositive ? 'text-emerald-500 dark:text-emerald-400' : 'text-rose-500 dark:text-rose-400'}`}>
                {kpis.onTimeDeliveryRate.delta}
              </span>
              <span className="text-[11px] text-slate-400 dark:text-[#737373]">SLA Target</span>
            </div>
          </div>
        </EntranceWrapper>

        {/* KPI 3: Work In Progress (WIP) */}
        <EntranceWrapper staggerIndex={2}>
          <div className="bg-white dark:bg-[#202020] border border-slate-200 dark:border-[#303030] rounded-xl p-5 flex flex-col justify-between card-lift h-full transition-colors">
            <div className="flex items-center gap-3.5">
              <div className="w-11 h-11 rounded-xl bg-slate-100 dark:bg-[#151515] border border-slate-200 dark:border-[#303030] flex items-center justify-center text-slate-700 dark:text-white shrink-0">
                <CheckCircle2 className="w-5 h-5" />
              </div>
              <div>
                <p className="text-xs text-slate-500 dark:text-[#A0A0A0] font-medium leading-tight">
                  Work In Progress (WIP)
                </p>
                <div className="flex items-baseline gap-1 mt-0.5">
                  <h2 className="text-3xl font-bold text-slate-900 dark:text-[#F5F5F5] font-mono tracking-tight tabular-nums">
                    {kpis.workInProgress.value.toLocaleString()}
                  </h2>
                  <span className="text-xs text-slate-500 dark:text-[#A0A0A0] font-normal">Units</span>
                </div>
              </div>
            </div>
            <div className="mt-4 pt-2 border-t border-slate-100 dark:border-[#2B2B2B] text-xs text-slate-500 dark:text-[#A0A0A0] flex items-center justify-between">
              <span className="text-emerald-500 dark:text-emerald-400 font-semibold tabular-nums">{kpis.workInProgress.delta}</span>
              <span className="text-[11px] text-slate-400 dark:text-[#737373]">Active Floors</span>
            </div>
          </div>
        </EntranceWrapper>

        {/* KPI 4: Supplier Risk Score */}
        <EntranceWrapper staggerIndex={3}>
          <div className="bg-white dark:bg-[#202020] border border-slate-200 dark:border-[#303030] rounded-xl p-5 flex flex-col justify-between card-lift h-full transition-colors">
            <div className="flex items-center gap-3.5">
              <div className="w-11 h-11 rounded-xl bg-slate-100 dark:bg-[#151515] border border-slate-200 dark:border-[#303030] flex items-center justify-center text-slate-700 dark:text-white shrink-0">
                <AlertOctagon className="w-5 h-5" />
              </div>
              <div>
                <p className="text-xs text-slate-500 dark:text-[#A0A0A0] font-medium leading-tight">
                  Supplier Risk Score
                </p>
                <h2 className="text-3xl font-bold text-slate-900 dark:text-[#F5F5F5] font-mono tracking-tight tabular-nums mt-0.5">
                  {kpis.supplierRiskScore.value}
                </h2>
              </div>
            </div>
            <div className="mt-4 pt-2 border-t border-slate-100 dark:border-[#2B2B2B] text-xs text-slate-500 dark:text-[#A0A0A0] truncate">
              <span className="text-slate-500 dark:text-[#737373] text-[11px]">{kpis.supplierRiskScore.statusText}</span>
            </div>
          </div>
        </EntranceWrapper>

        {/* KPI 5: Order Fulfillment */}
        <EntranceWrapper staggerIndex={4}>
          <div className="bg-white dark:bg-[#202020] border border-slate-200 dark:border-[#303030] rounded-xl p-5 flex flex-col justify-between card-lift h-full transition-colors">
            <div className="flex items-center gap-3.5">
              <div className="w-11 h-11 rounded-xl bg-slate-100 dark:bg-[#151515] border border-slate-200 dark:border-[#303030] flex items-center justify-center text-slate-700 dark:text-white shrink-0">
                <PackageCheck className="w-5 h-5" />
              </div>
              <div>
                <p className="text-xs text-slate-500 dark:text-[#A0A0A0] font-medium leading-tight">
                  Order Fulfillment
                </p>
                <h2 className="text-3xl font-bold text-slate-900 dark:text-[#F5F5F5] font-mono tracking-tight tabular-nums mt-0.5">
                  {kpis.orderFulfillment.value}%
                </h2>
              </div>
            </div>
            <div className="mt-4 pt-2 border-t border-slate-100 dark:border-[#2B2B2B] text-xs text-slate-500 dark:text-[#A0A0A0] flex items-center justify-between">
              <span className="text-slate-500 dark:text-[#737373]">{kpis.orderFulfillment.target}</span>
              <span className="text-emerald-500 dark:text-emerald-400 font-semibold text-[11px]">Nominal</span>
            </div>
          </div>
        </EntranceWrapper>
      </div>

      {/* 2. MIDDLE ROW: TRENDS, LOW STOCK ALERT HERO, WAREHOUSE LOCATIONS (SCROLL-TRIGGERED REVEAL) */}
      <ScrollReveal direction="bottom-right" delay={0.1}>
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-4">
          {/* Left: Inventory Trends (5 cols) */}
          <div className="lg:col-span-5 bg-white dark:bg-[#202020] border border-slate-200 dark:border-[#303030] rounded-xl p-5 flex flex-col justify-between card-lift transition-colors">
            <div className="flex items-center justify-between mb-4">
              <div>
                <h3 className="text-base font-semibold text-slate-900 dark:text-[#F5F5F5]">
                  Inventory Trends Over {timeframe.toLowerCase()}
                </h3>
                <span className="text-[11px] text-slate-500 dark:text-[#737373]">
                  Dynamic velocity based on {timeframe} filter
                </span>
              </div>
              <span className="px-2.5 py-1 rounded bg-slate-100 dark:bg-[#151515] border border-slate-200 dark:border-[#303030] text-xs font-mono font-medium text-slate-700 dark:text-[#A0A0A0]">
                {timeframe}
              </span>
            </div>

            {/* SVG Trend Line Chart */}
            <div className="relative w-full h-52">
              <svg viewBox="0 0 450 200" className="w-full h-full overflow-visible">
                <defs>
                  <linearGradient id="trendGradient" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="#FF5938" stopOpacity="0.45" />
                    <stop offset="100%" stopColor="#FF5938" stopOpacity="0.0" />
                  </linearGradient>
                </defs>

                {/* Grid Lines */}
                <line x1="40" y1="20" x2="440" y2="20" stroke={gridStroke} strokeDasharray="3 3" />
                <line x1="40" y1="65" x2="440" y2="65" stroke={gridStroke} strokeDasharray="3 3" />
                <line x1="40" y1="110" x2="440" y2="110" stroke={gridStroke} strokeDasharray="3 3" />
                <line x1="40" y1="155" x2="440" y2="155" stroke={gridStroke} strokeDasharray="3 3" />
                <line x1="40" y1="180" x2="440" y2="180" stroke={isDark ? '#3D3D3D' : '#CBD5E1'} />

                {/* Y-Axis Labels */}
                <text x="32" y="24" fill={axisColor} fontSize="10" textAnchor="end" fontFamily="monospace">1000</text>
                <text x="32" y="69" fill={axisColor} fontSize="10" textAnchor="end" fontFamily="monospace">750</text>
                <text x="32" y="114" fill={axisColor} fontSize="10" textAnchor="end" fontFamily="monospace">500</text>
                <text x="32" y="159" fill={axisColor} fontSize="10" textAnchor="end" fontFamily="monospace">250</text>
                <text x="32" y="184" fill={axisColor} fontSize="10" textAnchor="end" fontFamily="monospace">0</text>

                {/* Area & Line */}
                <path d={areaD} fill="url(#trendGradient)" />
                <path
                  d={pathD}
                  fill="none"
                  stroke="#FF5938"
                  strokeWidth="2.5"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />

                {/* Data points */}
                {pointsFormatted.map((pt, idx) => (
                  <circle
                    key={idx}
                    cx={pt.x}
                    cy={pt.y}
                    r="4"
                    fill="#FF5938"
                    stroke={isDark ? '#111111' : '#FFFFFF'}
                    strokeWidth="1.5"
                  />
                ))}

                {/* X-Axis Labels */}
                {pointsFormatted.map((pt, idx) => (
                  <text
                    key={idx}
                    x={pt.x}
                    y="196"
                    fill={axisColor}
                    fontSize="10"
                    textAnchor="middle"
                    fontFamily="monospace"
                  >
                    {pt.label}
                  </text>
                ))}
              </svg>
            </div>
            <div className="text-xs text-center text-slate-500 dark:text-[#737373] mt-2 font-medium">
              Timeline: {timeframe}
            </div>
          </div>

          {/* Center: Low Stock Alerts Hero (Orange-Red Gradient Card) (3 cols) */}
          <div className="lg:col-span-3 rounded-xl p-5 flex flex-col justify-between shadow-xl text-white relative overflow-hidden bg-gradient-to-br from-[#F4512C] to-[#96351D] border border-[#FF5938]/30 card-lift">
            <div>
              <div className="flex items-center justify-between pb-3 border-b border-white/20">
                <div className="flex items-center gap-1.5">
                  <span className="w-2 h-2 rounded-full bg-white animate-pulse" />
                  <h3 className="text-sm font-bold tracking-tight text-white uppercase">Low Stock Alerts</h3>
                </div>
                <button
                  onClick={() => onNavigate('/inventory')}
                  className="flex items-center gap-1 text-xs text-white/90 hover:text-white cursor-pointer"
                >
                  <span>View All</span>
                  <ChevronDown className="w-3 h-3" />
                </button>
              </div>

              <div className="mt-4 flex items-start justify-between">
                <div>
                  <h4 className="text-lg font-bold leading-tight text-white">{skuInfo.category}</h4>
                  <p className="text-xs text-white/90 mt-1 font-medium">{skuInfo.name}</p>
                  <p className="text-xs text-white/80 mt-0.5">Supplier: {skuInfo.supplierName}</p>
                </div>
                <span className="text-xs font-mono bg-black/25 px-2.5 py-1 rounded-md text-white font-semibold shrink-0">
                  {skuInfo.sku}
                </span>
              </div>

              <div className="grid grid-cols-2 gap-2.5 mt-5 p-3 rounded-lg bg-black/25 border border-white/15 text-xs">
                <div>
                  <span className="text-[10px] text-white/70 block uppercase font-medium">Current Stock</span>
                  <span className="font-bold text-white text-base font-mono tabular-nums">{skuInfo.currentStock} units</span>
                </div>
                <div>
                  <span className="text-[10px] text-white/70 block uppercase font-medium">Expected Stock</span>
                  <span className="font-bold text-white text-base font-mono tabular-nums">{skuInfo.expectedStock} units</span>
                </div>
              </div>
            </div>

            <div className="mt-6 flex items-center justify-between pt-3 border-t border-white/20">
              <span className="text-xs text-white/90 font-medium">
                Lead Time: <span className="font-bold text-white font-mono">{skuInfo.leadTimeDays} days</span>
              </span>
              <button
                onClick={() => setIsReorderModalOpen(true)}
                className="px-4 py-2 bg-white text-slate-950 hover:bg-slate-100 rounded-lg text-xs font-bold shadow-lg transition-transform active:scale-95 cursor-pointer btn-press"
              >
                Reorder Now
              </button>
            </div>
          </div>

          {/* Right: Warehouse Locations (World Map) (4 cols) */}
          <div className="lg:col-span-4 bg-white dark:bg-[#202020] border border-slate-200 dark:border-[#303030] rounded-xl p-5 flex flex-col justify-between card-lift transition-colors">
            <div className="flex items-center justify-between mb-2">
              <div>
                <h3 className="text-base font-semibold text-slate-900 dark:text-[#F5F5F5]">
                  Warehouse Locations
                </h3>
                <span className="text-[11px] text-slate-500 dark:text-[#737373]">
                  Regional fulfillment hubs
                </span>
              </div>
              <div className="flex items-center gap-1.5 px-2.5 py-1 rounded bg-slate-100 dark:bg-[#151515] border border-slate-200 dark:border-[#303030] text-xs text-slate-700 dark:text-[#A0A0A0]">
                <Globe className="w-3.5 h-3.5 text-[#FF5938]" />
                <span className="font-semibold">{region === 'ALL' ? 'Global' : region}</span>
              </div>
            </div>

            {/* World Map SVG with glowing warehouse nodes */}
            <div className="relative w-full h-52 flex items-center justify-center bg-slate-50 dark:bg-[#151515] rounded-lg p-2 border border-slate-200 dark:border-[#2B2B2B]">
              <svg viewBox="0 0 500 260" className="w-full h-full opacity-85">
                {/* Simplified world map silhouettes with theme adaptive colors */}
                {/* North America */}
                <path
                  d="M 50 40 Q 90 35 140 45 Q 160 80 130 110 Q 90 120 70 90 Z"
                  fill={mapLandFill}
                  stroke={mapLandStroke}
                />
                {/* South America */}
                <path
                  d="M 120 125 Q 150 130 160 170 Q 140 220 120 200 Z"
                  fill={mapLandFill}
                  stroke={mapLandStroke}
                />
                {/* Europe */}
                <path
                  d="M 220 40 Q 270 35 290 70 Q 250 85 220 60 Z"
                  fill={mapLandFill}
                  stroke={mapLandStroke}
                />
                {/* Africa */}
                <path
                  d="M 220 90 Q 280 90 280 150 Q 240 200 220 140 Z"
                  fill={mapLandFill}
                  stroke={mapLandStroke}
                />
                {/* Asia */}
                <path
                  d="M 290 40 Q 420 30 440 90 Q 380 140 310 110 Z"
                  fill={mapLandFill}
                  stroke={mapLandStroke}
                />
                {/* Australia */}
                <path
                  d="M 380 160 Q 430 160 420 200 Q 370 200 380 160 Z"
                  fill={mapLandFill}
                  stroke={mapLandStroke}
                />

                {/* Operational Transit arcs */}
                <path
                  d="M 105 75 Q 180 30 250 60"
                  fill="none"
                  stroke="#FF5938"
                  strokeWidth="1.5"
                  strokeDasharray="4 2"
                  className="opacity-70"
                />
                <path
                  d="M 370 85 Q 260 20 105 75"
                  fill="none"
                  stroke="#FF5938"
                  strokeWidth="1.5"
                  strokeDasharray="4 2"
                  className="opacity-60"
                />

                {/* Warehouse Node 1: Chicago (USA Hub) */}
                <circle cx="105" cy="75" r="5" fill="#FF5938" />
                <circle cx="105" cy="75" r="9" fill="none" stroke="#FF5938" strokeWidth="1" opacity="0.6" />

                {/* Warehouse Node 2: Long Beach */}
                <circle cx="85" cy="85" r="4.5" fill="#FF5938" />

                {/* Warehouse Node 3: Frankfurt (EU) */}
                <circle cx="250" cy="60" r="4.5" fill="#FF5938" />

                {/* Warehouse Node 4: Singapore (APAC Hub) */}
                <circle cx="370" cy="130" r="5" fill="#FF5938" />
                <circle cx="370" cy="130" r="8" fill="none" stroke="#FF5938" strokeWidth="1" opacity="0.6" />
              </svg>

              {/* Warehouse Quick Legend */}
              <div className="absolute bottom-2 left-2 right-2 flex items-center justify-between text-xs text-slate-700 dark:text-[#A0A0A0] bg-white/90 dark:bg-[#111111]/90 px-3 py-1.5 rounded-md border border-slate-200 dark:border-[#303030] shadow-sm">
                <span className="flex items-center gap-2 font-medium">
                  <span className="w-2 h-2 rounded-full bg-[#FF5938]" />
                  {warehouseMetrics.count} Active Facilities
                </span>
                <span className="font-mono text-slate-900 dark:text-white font-semibold">
                  {warehouseMetrics.capacityText}
                </span>
              </div>
            </div>
          </div>
        </div>
      </ScrollReveal>

      {/* 3. BOTTOM ROW: TOP 5 SUPPLIERS & INVENTORY DISTRIBUTION DONUT (SCROLL-TRIGGERED REVEAL) */}
      <ScrollReveal direction="bottom-right" delay={0.15}>
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-4">
          {/* Left: Top 5 Suppliers by On-Time Delivery (Grouped Bar Chart) (7 cols) */}
          <div className="lg:col-span-7 bg-white dark:bg-[#202020] border border-slate-200 dark:border-[#303030] rounded-xl p-5 flex flex-col justify-between card-lift transition-colors">
            <div className="flex items-center justify-between mb-4">
              <div>
                <h3 className="text-base font-semibold text-slate-900 dark:text-[#F5F5F5]">
                  Top 5 Suppliers by On-Time Delivery
                </h3>
                <span className="text-[11px] text-slate-500 dark:text-[#737373]">
                  Historical fulfillment benchmarks 2020 – 2025
                </span>
              </div>
              <span className="px-2.5 py-1 rounded bg-slate-100 dark:bg-[#151515] border border-slate-200 dark:border-[#303030] text-xs font-mono font-medium text-slate-700 dark:text-[#A0A0A0]">
                Annual
              </span>
            </div>

            <div className="relative w-full h-56">
              <svg viewBox="0 0 540 210" className="w-full h-full overflow-visible">
                {/* Y Axis Grid lines */}
                <line x1="50" y1="20" x2="520" y2="20" stroke={gridStroke} strokeDasharray="3 3" />
                <line x1="50" y1="60" x2="520" y2="60" stroke={gridStroke} strokeDasharray="3 3" />
                <line x1="50" y1="100" x2="520" y2="100" stroke={gridStroke} strokeDasharray="3 3" />
                <line x1="50" y1="140" x2="520" y2="140" stroke={gridStroke} strokeDasharray="3 3" />
                <line x1="50" y1="180" x2="520" y2="180" stroke={isDark ? '#3D3D3D' : '#CBD5E1'} />

                {/* Y Labels */}
                <text x="40" y="24" fill={axisColor} fontSize="10" textAnchor="end" fontFamily="monospace">100%</text>
                <text x="40" y="64" fill={axisColor} fontSize="10" textAnchor="end" fontFamily="monospace">75%</text>
                <text x="40" y="104" fill={axisColor} fontSize="10" textAnchor="end" fontFamily="monospace">50%</text>
                <text x="40" y="144" fill={axisColor} fontSize="10" textAnchor="end" fontFamily="monospace">25%</text>
                <text x="40" y="184" fill={axisColor} fontSize="10" textAnchor="end" fontFamily="monospace">0</text>

                {/* Grouped Bars for 2025, 2024, 2023, 2022, 2021, 2020 */}
                {[
                  { year: '2025', x: 80, bars: [100, 150, 65, 30, 20] },
                  { year: '2024', x: 160, bars: [85, 140, 110, 25, 18] },
                  { year: '2023', x: 240, bars: [60, 150, 130, 75, 70] },
                  { year: '2022', x: 320, bars: [95, 120, 125, 70, 85] },
                  { year: '2021', x: 400, bars: [65, 80, 115, 45, 90] },
                  { year: '2020', x: 480, bars: [40, 105, 50, 15, 60] },
                ].map((group) => {
                  const colors = ['#94A3B8', '#FF5938', '#475569', '#CBD5E1', '#64748B'];
                  return (
                    <g key={group.year}>
                      {group.bars.map((height, bIdx) => (
                        <rect
                          key={bIdx}
                          x={group.x + bIdx * 9 - 22}
                          y={180 - height}
                          width="7"
                          height={height}
                          rx="1.5"
                          fill={colors[bIdx]}
                        />
                      ))}
                      <text x={group.x} y="196" fill={axisColor} fontSize="10" textAnchor="middle" fontFamily="monospace">
                        {group.year}
                      </text>
                    </g>
                  );
                })}
              </svg>
            </div>

            {/* Supplier Legend */}
            <div className="flex flex-wrap items-center justify-center gap-6 mt-3 text-xs text-slate-600 dark:text-[#A0A0A0]">
              <div className="flex items-center gap-1.5">
                <span className="w-2.5 h-2.5 rounded-full bg-[#94A3B8]" /> ABC Supplies
              </div>
              <div className="flex items-center gap-1.5 font-medium text-[#FF5938]">
                <span className="w-2.5 h-2.5 rounded-full bg-[#FF5938]" /> Apex Precision
              </div>
              <div className="flex items-center gap-1.5">
                <span className="w-2.5 h-2.5 rounded-full bg-[#475569]" /> Pacific Freight
              </div>
              <div className="flex items-center gap-1.5">
                <span className="w-2.5 h-2.5 rounded-full bg-[#CBD5E1] dark:bg-slate-300" /> Global Dynamics
              </div>
              <div className="flex items-center gap-1.5">
                <span className="w-2.5 h-2.5 rounded-full bg-[#64748B]" /> Synapse Systems
              </div>
            </div>
          </div>

          {/* Right: Inventory Distribution by Product Category (Donut Chart) (5 cols) */}
          <div className="lg:col-span-5 bg-white dark:bg-[#202020] border border-slate-200 dark:border-[#303030] rounded-xl p-5 flex flex-col justify-between card-lift transition-colors">
            <div className="flex items-center justify-between mb-2">
              <div>
                <h3 className="text-base font-semibold text-slate-900 dark:text-[#F5F5F5]">
                  Inventory Distribution
                </h3>
                <span className="text-[11px] text-slate-500 dark:text-[#737373]">
                  Product category unit breakdown
                </span>
              </div>
              {selectedCategory !== 'All Products' && (
                <span className="px-2 py-0.5 rounded bg-[#FF5938]/10 text-[#FF5938] border border-[#FF5938]/30 text-xs font-medium">
                  {selectedCategory}
                </span>
              )}
            </div>

            <div className="flex flex-col sm:flex-row items-center gap-6 my-2">
              {/* Donut Chart SVG */}
              <div className="relative w-44 h-44 shrink-0">
                <svg viewBox="0 0 100 100" className="w-full h-full -rotate-90">
                  {/* 1. Raw Materials: 35% */}
                  <circle cx="50" cy="50" r="38" fill="transparent" stroke="#FF5938" strokeWidth="18" strokeDasharray="35 65" strokeDashoffset="0" />
                  {/* 2. Finished Goods: 30% */}
                  <circle cx="50" cy="50" r="38" fill="transparent" stroke={isDark ? '#F5F5F5' : '#334155'} strokeWidth="18" strokeDasharray="30 70" strokeDashoffset="-35" />
                  {/* 3. WIP: 20% */}
                  <circle cx="50" cy="50" r="38" fill="transparent" stroke="#94A3B8" strokeWidth="18" strokeDasharray="20 80" strokeDashoffset="-65" />
                  {/* 4. Spare Parts: 10% */}
                  <circle cx="50" cy="50" r="38" fill="transparent" stroke="#D97706" strokeWidth="18" strokeDasharray="10 90" strokeDashoffset="-85" />
                  {/* 5. Returns: 5% */}
                  <circle cx="50" cy="50" r="38" fill="transparent" stroke="#64748B" strokeWidth="18" strokeDasharray="5 95" strokeDashoffset="-95" />
                </svg>

                {/* Donut Hole Text */}
                <div className="absolute inset-0 flex flex-col items-center justify-center text-center pointer-events-none">
                  <span className="text-xl font-bold text-slate-900 dark:text-white font-mono leading-none tabular-nums">
                    {inventoryDist.totalUnits.toLocaleString()}
                  </span>
                  <span className="text-[10px] text-slate-500 dark:text-[#A0A0A0] mt-1 leading-tight font-medium">
                    Total Inventory<br />Units
                  </span>
                </div>
              </div>

              {/* Category Breakdown Table */}
              <div className="w-full space-y-2 text-xs">
                <div className="flex items-center justify-between pb-1.5 border-b border-slate-200 dark:border-[#303030] text-slate-500 dark:text-[#737373] text-[11px] font-semibold uppercase tracking-wider">
                  <span>Product Category</span>
                  <span>Units</span>
                </div>

                {inventoryDist.categories.map((cat: any, i: number) => {
                  const colors = ['#FF5938', isDark ? '#F5F5F5' : '#334155', '#94A3B8', '#D97706', '#64748B'];
                  return (
                    <div
                      key={cat.category}
                      className={`flex items-center justify-between py-0.5 rounded px-1 transition-colors ${
                        cat.isHighlighted ? 'bg-[#FF5938]/10 font-semibold' : ''
                      }`}
                    >
                      <div className="flex items-center gap-2">
                        <span className="w-2.5 h-2.5 rounded-full shrink-0" style={{ backgroundColor: colors[i % colors.length] }} />
                        <span className="text-slate-800 dark:text-[#F5F5F5]">{cat.category}</span>
                        <span className="text-[11px] text-slate-400 dark:text-[#737373]">({cat.percentage}%)</span>
                      </div>
                      <span className="font-mono text-slate-900 dark:text-white font-medium tabular-nums">
                        {cat.units.toLocaleString()}
                      </span>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        </div>
      </ScrollReveal>

      {/* 4. SIGNATURE VISUALIZATIONS: LIVE SUPPLY NETWORK MAP (SCROLL-TRIGGERED REVEAL) */}
      <ScrollReveal direction="bottom-right" delay={0.2}>
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2.5">
              <div className="w-7 h-7 rounded-lg bg-[#FF5938]/10 flex items-center justify-center text-[#FF5938]">
                <Network className="w-4 h-4" />
              </div>
              <div>
                <h3 className="text-base font-semibold text-slate-900 dark:text-[#F5F5F5]">
                  Live Supply Network Topology
                </h3>
                <span className="text-xs text-slate-500 dark:text-[#A0A0A0]">
                  Multi-tier node graph, carrier transit corridors & dwell warnings
                </span>
              </div>
            </div>
            <button
              onClick={() => onNavigate('/shipments')}
              className="text-xs font-semibold text-[#FF5938] hover:underline cursor-pointer"
            >
              View Freight Shipments →
            </button>
          </div>
          <SupplyNetworkMap />
        </div>
      </ScrollReveal>

      {/* 5. SIGNATURE VISUALIZATIONS: OPERATIONAL RECOVERY LIFECYCLE (SCROLL-TRIGGERED REVEAL) */}
      <ScrollReveal direction="bottom-right" delay={0.25}>
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2.5">
              <div className="w-7 h-7 rounded-lg bg-[#FF5938]/10 flex items-center justify-center text-[#FF5938]">
                <Activity className="w-4 h-4" />
              </div>
              <div>
                <h3 className="text-base font-semibold text-slate-900 dark:text-[#F5F5F5]">
                  Operational Recovery Lifecycle & Separation of Duties
                </h3>
                <span className="text-xs text-slate-500 dark:text-[#A0A0A0]">
                  Import → Detection → Risk Scoring → Approval → Simulation → Immutable Audit
                </span>
              </div>
            </div>
            <button
              onClick={() => onNavigate('/recovery-plans')}
              className="text-xs font-semibold text-[#FF5938] hover:underline cursor-pointer"
            >
              View Active Plans →
            </button>
          </div>
          <RecoveryTimeline />
        </div>
      </ScrollReveal>

      {/* Reorder Proposal Modal */}
      <ReorderModal
        isOpen={isReorderModalOpen}
        onClose={() => setIsReorderModalOpen(false)}
        skuData={skuInfo}
      />
    </div>
  );
};
