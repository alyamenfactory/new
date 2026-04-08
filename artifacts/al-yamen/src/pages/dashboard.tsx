import React from "react";
import { useLocation } from "wouter";
import {
  useGetDashboardSummary, getGetDashboardSummaryQueryKey,
  useGetRecentActivity, getGetRecentActivityQueryKey,
  useGetMonthlySales, getGetMonthlySalesQueryKey,
  useListTransactions, getListTransactionsQueryKey,
  useGetAccountingBalance, getGetAccountingBalanceQueryKey,
  useListProducts, getListProductsQueryKey,
  useListSalesOrders, getListSalesOrdersQueryKey,
} from "@workspace/api-client-react";
import { useLanguage } from "@/hooks/use-language";
import { Skeleton } from "@/components/ui/skeleton";
import {
  DollarSign, TrendingUp, TrendingDown, Users, Package,
  Plus, ShoppingCart, Truck, BarChart2, ArrowUpRight,
  ArrowDownRight, AlertTriangle, Banknote, Building2,
  CreditCard, CircleDollarSign, Activity, Target
} from "lucide-react";
import {
  AreaChart, Area, BarChart, Bar, XAxis, YAxis, CartesianGrid,
  Tooltip, ResponsiveContainer, Legend, PieChart, Pie, Cell
} from "recharts";

const BANK_ACCOUNTS = [
  { name: "Dutch-Bangla Bank", branch: "Dhanmondi", type: "current", balance: 285000, icon: Building2 },
  { name: "BRAC Bank", branch: "Gulshan", type: "savings", balance: 145000, icon: Building2 },
  { name: "Islami Bank", branch: "Motijheel", type: "current", balance: 98000, icon: Building2 },
  { name: "Cash in Hand", branch: "Cash in Hand", type: "cash", balance: 42500, icon: CircleDollarSign },
];

const EXPENSE_COLORS = ['#06B6D4', '#10B981', '#F59E0B', '#8B5CF6', '#EF4444'];

function Card({ children, className = '' }: { children: React.ReactNode; className?: string }) {
  return (
    <div className={`rounded-2xl border ${className}`}
      style={{ background: 'hsl(220 18% 11%)', borderColor: 'rgba(255,255,255,0.07)' }}>
      {children}
    </div>
  );
}

function formatK(n: number) {
  if (n >= 1000000) return `৳${(n / 1000000).toFixed(1)}M`;
  if (n >= 1000) return `৳${Math.round(n / 1000)}K`;
  return `৳${n.toLocaleString()}`;
}

export default function Dashboard() {
  const { t } = useLanguage();
  const [, setLocation] = useLocation();

  const { data: summary, isLoading: isSummaryLoading } = useGetDashboardSummary({
    query: { queryKey: getGetDashboardSummaryQueryKey() }
  });
  const { data: activity, isLoading: isActivityLoading } = useGetRecentActivity({
    query: { queryKey: getGetRecentActivityQueryKey() }
  });
  const { data: monthlySales, isLoading: isMonthlyLoading } = useGetMonthlySales({
    query: { queryKey: getGetMonthlySalesQueryKey() }
  });
  const { data: balance } = useGetAccountingBalance({
    query: { queryKey: getGetAccountingBalanceQueryKey() }
  });
  const { data: products } = useListProducts({}, {
    query: { queryKey: getListProductsQueryKey({}) }
  });
  const { data: salesOrders } = useListSalesOrders({}, {
    query: { queryKey: getListSalesOrdersQueryKey({}) }
  });
  const { data: transactions } = useListTransactions({}, {
    query: { queryKey: getListTransactionsQueryKey({}) }
  });

  const today = new Date();
  const dateStr = today.toLocaleDateString('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' });

  // Monthly chart data with profit
  const chartData = (monthlySales || []).map((m: any) => ({
    month: m.month?.slice(5) || m.month,
    Revenue: Number(m.revenue || 0),
    Expense: Number(m.expenses || 0),
    Profit: Math.max(0, Number(m.revenue || 0) - Number(m.expenses || 0)),
  }));

  // Top products by sales
  const topProducts = (products || [])
    .sort((a: any, b: any) => (b.stockQuantity ?? 0) - (a.stockQuantity ?? 0))
    .slice(0, 5);

  // Expense breakdown by category (from transactions)
  const expenseMap: Record<string, number> = {};
  (transactions || []).filter((t: any) => t.type === 'expense').forEach((t: any) => {
    const cat = t.category || 'Other';
    expenseMap[cat] = (expenseMap[cat] || 0) + Number(t.amount || 0);
  });
  const expenseBreakdown = Object.entries(expenseMap).map(([name, value]) => ({ name, value })).slice(0, 5);

  // Pending orders
  const pendingOrders = (salesOrders || []).filter((o: any) => o.status === 'pending');

  const totalBankBalance = BANK_ACCOUNTS.reduce((s, a) => s + a.balance, 0);

  return (
    <div className="space-y-5">
      {/* Welcome Card */}
      <Card className="p-5">
        <div className="text-xs font-bold tracking-widest text-cyan-400 mb-1 uppercase">AL-YAMEN</div>
        <h1 className="text-2xl font-bold text-white mb-0.5">Welcome, Al-Yamen Business 👋</h1>
        <p className="text-sm mb-4" style={{ color: 'rgba(255,255,255,0.45)' }}>{dateStr}</p>
        <div className="flex flex-wrap gap-2">
          {isSummaryLoading ? (
            <Skeleton className="h-7 w-32 rounded-full" />
          ) : (
            <span className="flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-semibold"
              style={{ background: 'rgba(245,158,11,0.15)', border: '1px solid rgba(245,158,11,0.25)', color: '#F59E0B' }}>
              <AlertTriangle className="h-3 w-3" />
              {summary?.lowStockCount || 0} Low Stock
            </span>
          )}
          <span className="flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-semibold"
            style={{ background: 'rgba(16,185,129,0.15)', border: '1px solid rgba(16,185,129,0.25)', color: '#10B981' }}>
            <span className="h-1.5 w-1.5 rounded-full bg-emerald-400 animate-pulse" />
            System Online
          </span>
        </div>
      </Card>

      {/* Quick Actions */}
      <div>
        <p className="text-[10px] font-bold tracking-widest uppercase mb-3" style={{ color: 'rgba(255,255,255,0.3)' }}>QUICK ACTIONS</p>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          {[
            { label: "Add Transaction", icon: <Plus className="h-6 w-6" />, color: '#06B6D4', bg: 'rgba(6,182,212,0.15)', path: '/accounting' },
            { label: "New Order", icon: <ShoppingCart className="h-6 w-6" />, color: '#10B981', bg: 'rgba(16,185,129,0.15)', path: '/sales' },
            { label: "New Purchase", icon: <Truck className="h-6 w-6" />, color: '#8B5CF6', bg: 'rgba(139,92,246,0.15)', path: '/purchases' },
            { label: "Profit & Loss", icon: <BarChart2 className="h-6 w-6" />, color: '#F59E0B', bg: 'rgba(245,158,11,0.15)', path: '/reports' },
          ].map((action) => (
            <button
              key={action.label}
              onClick={() => setLocation(action.path)}
              className="quick-action flex flex-col items-center justify-center gap-3 p-5 rounded-2xl text-center"
            >
              <div className="h-12 w-12 rounded-2xl flex items-center justify-center" style={{ background: action.bg, color: action.color }}>
                {action.icon}
              </div>
              <span className="text-sm font-medium" style={{ color: 'rgba(255,255,255,0.75)' }}>{action.label}</span>
            </button>
          ))}
        </div>
      </div>

      {/* Revenue & Expense KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <KpiCard
          label="Total Revenue"
          sublabel="This Month"
          value={formatK(summary?.totalSales || 0)}
          trend="+12.5%"
          trendUp={true}
          icon={<DollarSign className="h-5 w-5" />}
          isLoading={isSummaryLoading}
          color="#06B6D4"
          gradient="rgba(6,182,212,0.15)"
        />
        <KpiCard
          label="Total Expenses"
          sublabel="This Month"
          value={formatK(balance?.totalExpenses || 0)}
          trend="-3.2%"
          trendUp={false}
          icon={<TrendingDown className="h-5 w-5" />}
          isLoading={isSummaryLoading}
          color="#EF4444"
          gradient="rgba(239,68,68,0.15)"
        />
        <KpiCard
          label="Net Balance"
          sublabel="All Time"
          value={formatK(balance?.netBalance || 0)}
          trend="+18.7%"
          trendUp={true}
          icon={<Activity className="h-5 w-5" />}
          isLoading={isSummaryLoading}
          color="#10B981"
          gradient="rgba(16,185,129,0.15)"
        />
        <KpiCard
          label="Total Customers"
          sublabel="Active"
          value={String(summary?.totalCustomers || 0)}
          trend="+5.8%"
          trendUp={true}
          icon={<Users className="h-5 w-5" />}
          isLoading={isSummaryLoading}
          color="#8B5CF6"
          gradient="rgba(139,92,246,0.15)"
        />
      </div>

      {/* Monthly Overview Chart */}
      <Card className="p-5">
        <div className="mb-4">
          <h3 className="text-base font-bold text-white">Monthly Overview</h3>
          <p className="text-xs mt-0.5" style={{ color: 'rgba(255,255,255,0.4)' }}>Revenue, expense & profit</p>
        </div>
        {isMonthlyLoading ? (
          <Skeleton className="h-56 w-full rounded-xl" />
        ) : chartData.length > 0 ? (
          <div className="h-56">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={chartData} margin={{ top: 5, right: 5, left: -20, bottom: 0 }}>
                <defs>
                  <linearGradient id="gRevenue" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#06B6D4" stopOpacity={0.3} />
                    <stop offset="95%" stopColor="#06B6D4" stopOpacity={0} />
                  </linearGradient>
                  <linearGradient id="gExpense" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#EF4444" stopOpacity={0.3} />
                    <stop offset="95%" stopColor="#EF4444" stopOpacity={0} />
                  </linearGradient>
                  <linearGradient id="gProfit" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#10B981" stopOpacity={0.3} />
                    <stop offset="95%" stopColor="#10B981" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" />
                <XAxis dataKey="month" tick={{ fill: 'rgba(255,255,255,0.35)', fontSize: 11 }} axisLine={false} tickLine={false} />
                <YAxis tick={{ fill: 'rgba(255,255,255,0.35)', fontSize: 11 }} axisLine={false} tickLine={false} tickFormatter={v => `৳${(v/1000).toFixed(0)}K`} />
                <Tooltip
                  contentStyle={{ background: 'hsl(220 18% 12%)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '12px', color: 'white' }}
                  formatter={(v: any) => formatK(Number(v))}
                />
                <Legend wrapperStyle={{ color: 'rgba(255,255,255,0.6)', fontSize: 12 }} />
                <Area type="monotone" dataKey="Revenue" stroke="#06B6D4" strokeWidth={2} fill="url(#gRevenue)" />
                <Area type="monotone" dataKey="Expense" stroke="#EF4444" strokeWidth={2} fill="url(#gExpense)" />
                <Area type="monotone" dataKey="Profit" stroke="#10B981" strokeWidth={2} fill="url(#gProfit)" />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        ) : (
          <div className="h-56 flex items-center justify-center text-sm" style={{ color: 'rgba(255,255,255,0.3)' }}>
            No monthly data yet
          </div>
        )}
      </Card>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
        {/* Expense Breakdown */}
        <Card className="p-5">
          <div className="mb-4">
            <h3 className="text-base font-bold text-white">Expense Breakdown</h3>
            <p className="text-xs mt-0.5" style={{ color: 'rgba(255,255,255,0.4)' }}>This month</p>
          </div>
          {expenseBreakdown.length > 0 ? (
            <>
              <div className="h-48 flex items-center justify-center">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie data={expenseBreakdown} dataKey="value" nameKey="name" cx="50%" cy="50%" innerRadius={55} outerRadius={85}>
                      {expenseBreakdown.map((_, i) => (
                        <Cell key={i} fill={EXPENSE_COLORS[i % EXPENSE_COLORS.length]} />
                      ))}
                    </Pie>
                    <Tooltip
                      contentStyle={{ background: 'hsl(220 18% 12%)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '12px', color: 'white' }}
                      formatter={(v: any) => formatK(Number(v))}
                    />
                  </PieChart>
                </ResponsiveContainer>
              </div>
              <div className="space-y-2 mt-2">
                {expenseBreakdown.map((item, i) => (
                  <div key={item.name} className="flex items-center justify-between text-sm">
                    <div className="flex items-center gap-2">
                      <span className="h-2.5 w-2.5 rounded-full flex-shrink-0" style={{ background: EXPENSE_COLORS[i % EXPENSE_COLORS.length] }} />
                      <span style={{ color: 'rgba(255,255,255,0.65)' }}>{item.name}</span>
                    </div>
                    <span className="font-semibold text-white">{formatK(item.value)}</span>
                  </div>
                ))}
              </div>
            </>
          ) : (
            <div className="h-48 flex items-center justify-center text-sm" style={{ color: 'rgba(255,255,255,0.3)' }}>
              No expense data yet
            </div>
          )}
        </Card>

        {/* Recent Activity */}
        <Card className="p-5">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h3 className="text-base font-bold text-white">Recent Activity</h3>
              <p className="text-xs mt-0.5" style={{ color: 'rgba(255,255,255,0.4)' }}>Latest transactions</p>
            </div>
            <button onClick={() => setLocation('/accounting')} className="text-xs text-cyan-400 hover:text-cyan-300 font-medium">
              View All →
            </button>
          </div>
          {isActivityLoading ? (
            <div className="space-y-3">
              {Array.from({ length: 5 }).map((_, i) => <Skeleton key={i} className="h-12 w-full rounded-xl" />)}
            </div>
          ) : (activity || []).length > 0 ? (
            <div className="space-y-2">
              {(activity || []).slice(0, 6).map((item: any, i: number) => {
                const isIncome = item.type === 'sale' || item.type === 'income';
                return (
                  <div key={i} className="flex items-center gap-3 p-3 rounded-xl" style={{ background: 'rgba(255,255,255,0.03)' }}>
                    <div className={`h-8 w-8 rounded-lg flex items-center justify-center flex-shrink-0`}
                      style={{ background: isIncome ? 'rgba(16,185,129,0.2)' : 'rgba(239,68,68,0.2)' }}>
                      {isIncome
                        ? <ArrowUpRight className="h-4 w-4 text-emerald-400" />
                        : <ArrowDownRight className="h-4 w-4 text-red-400" />}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-white truncate">{item.description}</p>
                      <p className="text-xs" style={{ color: 'rgba(255,255,255,0.35)' }}>
                        {new Date(item.createdAt).toLocaleDateString()}
                      </p>
                    </div>
                    {item.amount && (
                      <span className={`text-sm font-bold flex-shrink-0 ${isIncome ? 'text-emerald-400' : 'text-red-400'}`}>
                        {isIncome ? '+' : '-'}{formatK(Number(item.amount))}
                      </span>
                    )}
                  </div>
                );
              })}
            </div>
          ) : (
            <p className="text-sm text-center py-8" style={{ color: 'rgba(255,255,255,0.3)' }}>{t('common.no_data')}</p>
          )}
        </Card>
      </div>

      {/* Bank Accounts */}
      <Card className="p-5">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h3 className="text-base font-bold text-white">Bank Accounts</h3>
            <p className="text-xs mt-0.5" style={{ color: 'rgba(255,255,255,0.4)' }}>Total: {formatK(totalBankBalance)}</p>
          </div>
          <button className="text-xs text-cyan-400 hover:text-cyan-300 font-medium">View All →</button>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          {BANK_ACCOUNTS.map((account) => {
            const pct = Math.round((account.balance / totalBankBalance) * 100);
            const badgeColors: Record<string, string> = {
              current: 'rgba(6,182,212,0.2)',
              savings: 'rgba(16,185,129,0.2)',
              cash: 'rgba(245,158,11,0.2)',
            };
            const badgeText: Record<string, string> = {
              current: '#06B6D4',
              savings: '#10B981',
              cash: '#F59E0B',
            };
            return (
              <div key={account.name} className="p-4 rounded-xl transition-all duration-200 cursor-pointer hover:brightness-110"
                style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.06)' }}>
                <div className="flex items-start justify-between mb-3">
                  <div>
                    <p className="text-sm font-semibold text-white">{account.name}</p>
                    <p className="text-xs mt-0.5" style={{ color: 'rgba(255,255,255,0.35)' }}>{account.branch}</p>
                  </div>
                  <span className="px-2 py-0.5 rounded-full text-[10px] font-bold capitalize"
                    style={{ background: badgeColors[account.type] || 'rgba(255,255,255,0.1)', color: badgeText[account.type] || 'white' }}>
                    {account.type}
                  </span>
                </div>
                <p className="text-xl font-bold text-cyan-400 mb-2">{formatK(account.balance)}</p>
                <div className="h-1.5 w-full rounded-full" style={{ background: 'rgba(255,255,255,0.08)' }}>
                  <div className="h-full rounded-full bg-gradient-to-r from-cyan-400 to-blue-500 transition-all duration-500"
                    style={{ width: `${pct}%` }} />
                </div>
              </div>
            );
          })}
        </div>
      </Card>

      {/* Top Products + KPI Row */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
        {/* Top Products */}
        <Card className="p-5">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-base font-bold text-white">Top Products</h3>
            <button onClick={() => setLocation('/products')} className="text-xs text-cyan-400 hover:text-cyan-300 font-medium">View All →</button>
          </div>
          <div className="space-y-3">
            {topProducts.length > 0 ? topProducts.map((p: any, i: number) => {
              const maxStock = topProducts[0]?.stockQuantity ?? 1;
              const pct = Math.max(5, Math.round((p.stockQuantity / maxStock) * 100));
              const colors = ['#06B6D4', '#10B981', '#F59E0B', '#8B5CF6', '#EF4444'];
              return (
                <div key={p.id} className="flex items-center gap-3">
                  <span className="text-sm font-bold w-4 flex-shrink-0" style={{ color: 'rgba(255,255,255,0.3)' }}>{i + 1}</span>
                  <div className="flex-1 min-w-0">
                    <div className="flex justify-between items-center mb-1">
                      <span className="text-sm font-medium text-white truncate">{p.name}</span>
                      <span className="text-sm font-bold flex-shrink-0 ml-2" style={{ color: colors[i] }}>৳{Number(p.unitPrice || 0).toLocaleString()}</span>
                    </div>
                    <div className="h-1 w-full rounded-full" style={{ background: 'rgba(255,255,255,0.08)' }}>
                      <div className="h-full rounded-full transition-all duration-500" style={{ width: `${pct}%`, background: colors[i] }} />
                    </div>
                  </div>
                </div>
              );
            }) : (
              <p className="text-sm text-center py-6" style={{ color: 'rgba(255,255,255,0.3)' }}>{t('common.no_data')}</p>
            )}
          </div>
        </Card>

        {/* KPI Overview */}
        <Card className="p-5">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h3 className="text-base font-bold text-white">KPI Overview</h3>
              <p className="text-xs mt-0.5" style={{ color: 'rgba(255,255,255,0.4)' }}>Key performance indicators</p>
            </div>
            <Target className="h-5 w-5 text-cyan-400" />
          </div>
          <div className="grid grid-cols-2 gap-3">
            {[
              { label: 'Gross Margin', value: `${((balance?.netBalance || 0) / Math.max(1, (balance?.totalIncome || 1)) * 100).toFixed(1)}%`, sub: '+2.1%', icon: TrendingUp, color: '#10B981' },
              { label: 'Avg Order Value', value: formatK(summary?.totalSales ? summary.totalSales / Math.max(1, summary.totalCustomers) : 0), sub: '+5.8%', icon: ShoppingCart, color: '#8B5CF6' },
              { label: 'Active Customers', value: String(summary?.totalCustomers || 0), sub: 'this month', icon: Users, color: '#06B6D4' },
              { label: 'Pending Orders', value: String(pendingOrders.length), sub: 'awaiting', icon: Package, color: '#F59E0B' },
            ].map((kpi) => (
              <div key={kpi.label} className="p-3.5 rounded-xl" style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.06)' }}>
                <div className="flex items-start gap-2 mb-2">
                  <div className="h-7 w-7 rounded-lg flex items-center justify-center flex-shrink-0"
                    style={{ background: `${kpi.color}20`, color: kpi.color }}>
                    <kpi.icon className="h-3.5 w-3.5" />
                  </div>
                </div>
                <p className="text-lg font-bold text-white leading-tight">{kpi.value}</p>
                <p className="text-xs mt-0.5" style={{ color: 'rgba(255,255,255,0.45)' }}>{kpi.label}</p>
                <p className="text-[10px] mt-1 font-medium" style={{ color: kpi.color }}>{kpi.sub}</p>
              </div>
            ))}
          </div>
        </Card>
      </div>
    </div>
  );
}

function KpiCard({ label, sublabel, value, trend, trendUp, icon, isLoading, color, gradient }: {
  label: string; sublabel: string; value: string; trend: string; trendUp: boolean;
  icon: React.ReactNode; isLoading: boolean; color: string; gradient: string;
}) {
  return (
    <div className="rounded-2xl p-5 border transition-all duration-200 hover:brightness-110"
      style={{ background: gradient, borderColor: `${color}25` }}>
      <div className="flex items-center justify-between mb-4">
        <div className="h-10 w-10 rounded-xl flex items-center justify-center"
          style={{ background: `${color}20`, color }}>
          {icon}
        </div>
        <span className={`flex items-center gap-1 text-xs font-bold px-2 py-1 rounded-full ${trendUp ? 'text-emerald-400' : 'text-red-400'}`}
          style={{ background: trendUp ? 'rgba(16,185,129,0.15)' : 'rgba(239,68,68,0.15)' }}>
          {trendUp ? <TrendingUp className="h-3 w-3" /> : <TrendingDown className="h-3 w-3" />}
          {trend}
        </span>
      </div>
      {isLoading ? (
        <Skeleton className="h-8 w-24 mb-1" />
      ) : (
        <p className="text-2xl font-bold text-white">{value}</p>
      )}
      <p className="text-sm font-medium mt-1" style={{ color: 'rgba(255,255,255,0.65)' }}>{label}</p>
      <p className="text-xs mt-0.5" style={{ color: 'rgba(255,255,255,0.35)' }}>{sublabel}</p>
      <div className="h-1 w-full rounded-full mt-3" style={{ background: 'rgba(255,255,255,0.1)' }}>
        <div className="h-full rounded-full w-3/4" style={{ background: `linear-gradient(90deg, ${color}, ${color}80)` }} />
      </div>
    </div>
  );
}
