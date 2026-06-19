import { motion } from 'framer-motion'
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  PieChart, Pie, Cell, Legend, AreaChart, Area,
} from 'recharts'
import { TrendingUp, CheckCircle, XCircle, Clock } from 'lucide-react'
import { Card, Skeleton } from '@/components/ui/index'
import { useAnalyticsOverview } from '@/hooks/useApi'

const COLORS = ['#6366f1', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6']

export default function AnalyticsPage() {
  const { data, isLoading } = useAnalyticsOverview()

  const pieData = data
    ? [
        { name: 'Success', value: data.deployments.success },
        { name: 'Failed', value: data.deployments.failed },
      ].filter(d => d.value > 0)
    : []

  return (
    <div className="p-6 max-w-7xl mx-auto space-y-6">
      <div>
        <h2 className="text-lg font-semibold text-foreground">Analytics</h2>
        <p className="text-sm text-muted-foreground">Performance metrics and deployment insights</p>
      </div>

      {/* KPI row */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {[
          {
            label: 'Total Deployments',
            value: data?.deployments.total ?? 0,
            icon: TrendingUp,
            color: 'text-indigo-500 bg-indigo-500/10',
          },
          {
            label: 'Successful',
            value: data?.deployments.success ?? 0,
            icon: CheckCircle,
            color: 'text-emerald-500 bg-emerald-500/10',
          },
          {
            label: 'Failed',
            value: data?.deployments.failed ?? 0,
            icon: XCircle,
            color: 'text-red-500 bg-red-500/10',
          },
          {
            label: 'Success Rate',
            value: `${data?.deployments.success_rate ?? 0}%`,
            icon: Clock,
            color: 'text-blue-500 bg-blue-500/10',
          },
        ].map(({ label, value, icon: Icon, color }) =>
          isLoading ? (
            <Card key={label} className="p-5"><Skeleton className="h-16 w-full" /></Card>
          ) : (
            <motion.div key={label} initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }}>
              <Card className="p-5">
                <div className="flex items-start justify-between mb-2">
                  <p className="text-xs text-muted-foreground">{label}</p>
                  <div className={`w-7 h-7 rounded-md flex items-center justify-center ${color}`}>
                    <Icon size={14} />
                  </div>
                </div>
                <p className="text-2xl font-bold text-foreground">{value}</p>
              </Card>
            </motion.div>
          )
        )}
      </div>

      {/* Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        {/* Area chart */}
        <Card className="lg:col-span-2 p-5">
          <h3 className="text-sm font-semibold text-foreground mb-1">Deployment Trend</h3>
          <p className="text-xs text-muted-foreground mb-4">Deployments over the last 14 days</p>
          {isLoading ? (
            <Skeleton className="h-52 w-full" />
          ) : (
            <ResponsiveContainer width="100%" height={200}>
              <AreaChart data={data?.trend ?? []} margin={{ top: 5, right: 5, left: -20, bottom: 0 }}>
                <defs>
                  <linearGradient id="grad1" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#6366f1" stopOpacity={0.3} />
                    <stop offset="95%" stopColor="#6366f1" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                <XAxis dataKey="date" tick={{ fontSize: 10, fill: 'hsl(var(--muted-foreground))' }} tickFormatter={v => v.slice(5)} />
                <YAxis tick={{ fontSize: 10, fill: 'hsl(var(--muted-foreground))' }} allowDecimals={false} />
                <Tooltip
                  contentStyle={{ background: 'hsl(var(--card))', border: '1px solid hsl(var(--border))', borderRadius: 8, fontSize: 12 }}
                />
                <Area type="monotone" dataKey="deployments" stroke="#6366f1" strokeWidth={2} fill="url(#grad1)" />
              </AreaChart>
            </ResponsiveContainer>
          )}
        </Card>

        {/* Pie chart */}
        <Card className="p-5">
          <h3 className="text-sm font-semibold text-foreground mb-1">Deployment Status</h3>
          <p className="text-xs text-muted-foreground mb-4">Overall distribution</p>
          {isLoading ? (
            <Skeleton className="h-52 w-full" />
          ) : pieData.length === 0 ? (
            <div className="h-52 flex items-center justify-center text-muted-foreground text-sm">No data yet</div>
          ) : (
            <ResponsiveContainer width="100%" height={200}>
              <PieChart>
                <Pie
                  data={pieData}
                  cx="50%"
                  cy="50%"
                  innerRadius={55}
                  outerRadius={80}
                  paddingAngle={3}
                  dataKey="value"
                >
                  {pieData.map((_, i) => (
                    <Cell key={i} fill={COLORS[i % COLORS.length]} />
                  ))}
                </Pie>
                <Legend
                  formatter={(v) => <span style={{ fontSize: 12, color: 'hsl(var(--foreground))' }}>{v}</span>}
                />
                <Tooltip
                  contentStyle={{ background: 'hsl(var(--card))', border: '1px solid hsl(var(--border))', borderRadius: 8, fontSize: 12 }}
                />
              </PieChart>
            </ResponsiveContainer>
          )}
        </Card>
      </div>

      {/* Bar chart */}
      <Card className="p-5">
        <h3 className="text-sm font-semibold text-foreground mb-1">Daily Deployments</h3>
        <p className="text-xs text-muted-foreground mb-4">Deployment volume per day (last 14 days)</p>
        {isLoading ? (
          <Skeleton className="h-48 w-full" />
        ) : (
          <ResponsiveContainer width="100%" height={180}>
            <BarChart data={data?.trend ?? []} margin={{ top: 5, right: 5, left: -20, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
              <XAxis dataKey="date" tick={{ fontSize: 10, fill: 'hsl(var(--muted-foreground))' }} tickFormatter={v => v.slice(5)} />
              <YAxis tick={{ fontSize: 10, fill: 'hsl(var(--muted-foreground))' }} allowDecimals={false} />
              <Tooltip
                contentStyle={{ background: 'hsl(var(--card))', border: '1px solid hsl(var(--border))', borderRadius: 8, fontSize: 12 }}
              />
              <Bar dataKey="deployments" fill="#6366f1" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        )}
      </Card>
    </div>
  )
}
