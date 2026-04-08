import React from "react";
import {
  useGetSalesReport, getGetSalesReportQueryKey,
  useGetInventoryReport, getGetInventoryReportQueryKey,
  useGetHrReport, getGetHrReportQueryKey
} from "@workspace/api-client-react";
import { useLanguage } from "@/hooks/use-language";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip,
  ResponsiveContainer, Legend, PieChart, Pie, Cell
} from "recharts";
import { Skeleton } from "@/components/ui/skeleton";
import { TrendingUp, Package, Users } from "lucide-react";

const COLORS = ['#06B6D4', '#10B981', '#F59E0B', '#8B5CF6', '#EF4444'];

export default function Reports() {
  const { t } = useLanguage();
  const [salesPeriod, setSalesPeriod] = React.useState<"week" | "month" | "quarter" | "year">("month");
  const [hrMonth, setHrMonth] = React.useState(new Date().toISOString().slice(0, 7));

  const { data: salesReport, isLoading: isSalesLoading } = useGetSalesReport(
    { period: salesPeriod },
    { query: { queryKey: getGetSalesReportQueryKey({ period: salesPeriod }) } }
  );
  const { data: invReport, isLoading: isInvLoading } = useGetInventoryReport({
    query: { queryKey: getGetInventoryReportQueryKey() }
  });
  const { data: hrReport, isLoading: isHrLoading } = useGetHrReport(
    { month: hrMonth },
    { query: { queryKey: getGetHrReportQueryKey({ month: hrMonth }) } }
  );

  return (
    <div className="space-y-6">
      <h2 className="text-3xl font-bold tracking-tight text-primary">{t('reports.title')}</h2>

      <Tabs defaultValue="sales" className="w-full">
        <TabsList className="grid w-full grid-cols-3 max-w-md bg-muted/50 p-1 rounded-xl">
          <TabsTrigger value="sales" className="rounded-lg data-[state=active]:bg-primary data-[state=active]:text-primary-foreground">
            <TrendingUp className="h-4 w-4 mr-1.5" /> {t('reports.sales')}
          </TabsTrigger>
          <TabsTrigger value="inventory" className="rounded-lg data-[state=active]:bg-primary data-[state=active]:text-primary-foreground">
            <Package className="h-4 w-4 mr-1.5" /> {t('reports.inventory')}
          </TabsTrigger>
          <TabsTrigger value="hr" className="rounded-lg data-[state=active]:bg-primary data-[state=active]:text-primary-foreground">
            <Users className="h-4 w-4 mr-1.5" /> {t('reports.hr')}
          </TabsTrigger>
        </TabsList>

        {/* Sales Report */}
        <TabsContent value="sales" className="space-y-4 pt-4">
          <div className="flex justify-between items-center">
            <h3 className="text-lg font-semibold text-foreground">{t('reports.sales_performance')}</h3>
            <Select value={salesPeriod} onValueChange={(v: any) => setSalesPeriod(v)}>
              <SelectTrigger className="w-[160px]"><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="week">{t('reports.period.week')}</SelectItem>
                <SelectItem value="month">{t('reports.period.month')}</SelectItem>
                <SelectItem value="quarter">{t('reports.period.quarter')}</SelectItem>
                <SelectItem value="year">{t('reports.period.year')}</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div className="grid gap-4 md:grid-cols-3">
            <ReportStatCard title={t('reports.total_revenue')} value={`$${(salesReport?.totalRevenue || 0).toLocaleString()}`} isLoading={isSalesLoading} color="#06B6D4" />
            <ReportStatCard title={t('reports.total_orders')} value={String(salesReport?.totalOrders || 0)} isLoading={isSalesLoading} color="#10B981" />
            <ReportStatCard title={t('reports.avg_order_value')} value={`$${(salesReport?.averageOrderValue || 0).toLocaleString()}`} isLoading={isSalesLoading} color="#8B5CF6" />
          </div>
          <div className="grid gap-4 md:grid-cols-2">
            <Card className="border-border/50">
              <CardHeader><CardTitle className="text-sm">{t('reports.top_products')}</CardTitle></CardHeader>
              <CardContent className="h-[280px]">
                {isSalesLoading ? <Skeleton className="h-full w-full rounded-xl" /> : (
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={salesReport?.topProducts} layout="vertical" margin={{ left: 20 }}>
                      <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" />
                      <XAxis type="number" tick={{ fill: 'rgba(255,255,255,0.4)', fontSize: 11 }} />
                      <YAxis dataKey="productName" type="category" width={100} tick={{ fill: 'rgba(255,255,255,0.4)', fontSize: 11 }} />
                      <Tooltip contentStyle={{ background: 'hsl(220 18% 12%)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '12px', color: 'white' }} />
                      <Bar dataKey="revenue" fill="#06B6D4" radius={[0, 6, 6, 0]} />
                    </BarChart>
                  </ResponsiveContainer>
                )}
              </CardContent>
            </Card>
            <Card className="border-border/50">
              <CardHeader><CardTitle className="text-sm">{t('reports.order_distribution')}</CardTitle></CardHeader>
              <CardContent className="h-[280px]">
                {isSalesLoading ? <Skeleton className="h-full w-full rounded-xl" /> : (
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie data={salesReport?.salesByStatus} dataKey="count" nameKey="status" cx="50%" cy="50%" outerRadius={90} innerRadius={50} label>
                        {salesReport?.salesByStatus.map((_, i) => <Cell key={i} fill={COLORS[i % COLORS.length]} />)}
                      </Pie>
                      <Tooltip contentStyle={{ background: 'hsl(220 18% 12%)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '12px', color: 'white' }} />
                      <Legend wrapperStyle={{ color: 'rgba(255,255,255,0.6)', fontSize: 12 }} />
                    </PieChart>
                  </ResponsiveContainer>
                )}
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        {/* Inventory Report */}
        <TabsContent value="inventory" className="space-y-4 pt-4">
          <h3 className="text-lg font-semibold text-foreground">{t('reports.inventory_valuation')}</h3>
          <div className="grid gap-4 md:grid-cols-4">
            <ReportStatCard title={t('reports.total_items')} value={String(invReport?.totalProducts || 0)} isLoading={isInvLoading} color="#06B6D4" />
            <ReportStatCard title={t('reports.stock_value')} value={`$${(invReport?.totalStockValue || 0).toLocaleString()}`} isLoading={isInvLoading} color="#10B981" />
            <ReportStatCard title={t('reports.low_stock')} value={String(invReport?.lowStockItems || 0)} isLoading={isInvLoading} color="#F59E0B" />
            <ReportStatCard title={t('reports.out_of_stock')} value={String(invReport?.outOfStockItems || 0)} isLoading={isInvLoading} color="#EF4444" />
          </div>
          <Card className="border-border/50">
            <CardHeader><CardTitle className="text-sm">{t('reports.stock_by_category')}</CardTitle></CardHeader>
            <CardContent className="h-[360px]">
              {isInvLoading ? <Skeleton className="h-full w-full rounded-xl" /> : (
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={invReport?.categoryBreakdown} margin={{ top: 20, right: 30, left: 20, bottom: 5 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" />
                    <XAxis dataKey="category" tick={{ fill: 'rgba(255,255,255,0.4)', fontSize: 11 }} />
                    <YAxis tick={{ fill: 'rgba(255,255,255,0.4)', fontSize: 11 }} />
                    <Tooltip contentStyle={{ background: 'hsl(220 18% 12%)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '12px', color: 'white' }} />
                    <Legend wrapperStyle={{ color: 'rgba(255,255,255,0.6)', fontSize: 12 }} />
                    <Bar dataKey="totalValue" name="Value ($)" fill="#F59E0B" radius={[6, 6, 0, 0]} />
                    <Bar dataKey="productCount" name="Items" fill="#06B6D4" radius={[6, 6, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* HR Report */}
        <TabsContent value="hr" className="space-y-4 pt-4">
          <div className="flex justify-between items-center">
            <h3 className="text-lg font-semibold text-foreground">{t('reports.hr_summary')}</h3>
            <Input type="month" value={hrMonth} onChange={(e) => setHrMonth(e.target.value)} className="w-auto" />
          </div>
          <div className="grid gap-4 md:grid-cols-4">
            <ReportStatCard title={t('reports.total_employees')} value={String(hrReport?.totalEmployees || 0)} isLoading={isHrLoading} color="#06B6D4" />
            <ReportStatCard title={t('reports.active_staff')} value={String(hrReport?.activeEmployees || 0)} isLoading={isHrLoading} color="#10B981" />
            <ReportStatCard title={t('reports.monthly_payroll')} value={`$${(hrReport?.totalPayroll || 0).toLocaleString()}`} isLoading={isHrLoading} color="#8B5CF6" />
            <ReportStatCard
              title={t('reports.overall_attendance')}
              value={`${Math.round((hrReport?.attendanceSummary?.present || 0) / Math.max(1, (hrReport?.attendanceSummary?.present || 0) + (hrReport?.attendanceSummary?.absent || 0)) * 100)}%`}
              isLoading={isHrLoading}
              color="#F59E0B"
            />
          </div>
          <div className="grid gap-4 md:grid-cols-2">
            <Card className="border-border/50">
              <CardHeader><CardTitle className="text-sm">{t('reports.attendance_breakdown')}</CardTitle></CardHeader>
              <CardContent className="h-[260px] flex items-center justify-center">
                {isHrLoading ? <Skeleton className="h-full w-full rounded-xl" /> : (
                  <div className="grid grid-cols-2 gap-3 w-full px-4">
                    {[
                      { key: 'present', label: t('reports.attendance.present'), color: '#10B981', bg: 'rgba(16,185,129,0.12)' },
                      { key: 'absent', label: t('reports.attendance.absent'), color: '#EF4444', bg: 'rgba(239,68,68,0.12)' },
                      { key: 'late', label: t('reports.attendance.late'), color: '#F59E0B', bg: 'rgba(245,158,11,0.12)' },
                      { key: 'halfDay', label: t('reports.attendance.half_day'), color: '#06B6D4', bg: 'rgba(6,182,212,0.12)' },
                    ].map(({ key, label, color, bg }) => (
                      <div key={key} className="p-4 rounded-xl text-center border" style={{ background: bg, borderColor: `${color}25` }}>
                        <div className="text-xs font-semibold mb-1" style={{ color }}>{label}</div>
                        <div className="text-2xl font-bold text-white">{hrReport?.attendanceSummary?.[key as 'present' | 'absent' | 'late' | 'halfDay'] || 0}</div>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
            <Card className="border-border/50">
              <CardHeader><CardTitle className="text-sm">{t('reports.staff_by_dept')}</CardTitle></CardHeader>
              <CardContent className="h-[260px]">
                {isHrLoading ? <Skeleton className="h-full w-full rounded-xl" /> : (
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie data={hrReport?.departmentBreakdown} dataKey="count" nameKey="department" cx="50%" cy="50%" innerRadius={55} outerRadius={85} label>
                        {hrReport?.departmentBreakdown.map((_, i) => <Cell key={i} fill={COLORS[i % COLORS.length]} />)}
                      </Pie>
                      <Tooltip contentStyle={{ background: 'hsl(220 18% 12%)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '12px', color: 'white' }} />
                      <Legend wrapperStyle={{ color: 'rgba(255,255,255,0.6)', fontSize: 12 }} />
                    </PieChart>
                  </ResponsiveContainer>
                )}
              </CardContent>
            </Card>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}

function ReportStatCard({ title, value, isLoading, color }: { title: string; value: string; isLoading: boolean; color: string }) {
  return (
    <div className="rounded-2xl p-4 border" style={{ background: `${color}0D`, borderColor: `${color}25` }}>
      <p className="text-xs font-medium mb-2" style={{ color: 'rgba(255,255,255,0.5)' }}>{title}</p>
      {isLoading ? <Skeleton className="h-7 w-20" /> : (
        <p className="text-2xl font-bold" style={{ color }}>{value || '0'}</p>
      )}
    </div>
  );
}
