import { motion } from 'framer-motion'
import {
  AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer
} from 'recharts'
import { Rocket, FolderOpen, CheckCircle, TrendingUp, ArrowUpRight, Clock } from 'lucide-react'
import { Card, Skeleton, StatusBadge } from '@/components/ui/index'
import { useAnalyticsOverview } from '@/hooks/useApi'
import { useAuthStore } from '@/store/authStore'
import { formatRelative, truncate } from '@/lib/utils'
import { Link } from 'react-router-dom'

function StatCard({
  label, value, icon: Icon, sub, color,
}: {
  label: string; value: string | number; icon: React.ElementType; sub?: string; color: string
}) {
  return (
    <Card className="p-5">
      <div className="flex items-start justify-between mb-3">
        <p className="text-sm text-muted-foreground">{label}</p>
        <div className={`w-8 h-8 rounded-md flex items-center justify-center ${color}`}>
          <Icon size={16} />
        </div>
      </div>
      <p className="text-2xl font-bold text-foreground">{value}</p>
      {sub && <p className="text-xs text-muted-foreground mt-1">{sub}</p>}
    </Card>
  )
}

function StatCardSkeleton() {
  return (
    <Card className="p-5">
      <div className="flex items-start justify-between mb-3">
        <Skeleton className="h-4 w-24" />
        <Skeleton className="h-8 w-8 rounded-md" />
      </div>
      <Skeleton className="h-8 w-16 mb-1" />
      <Skeleton className="h-3 w-20" />
    </Card>
  )
}

export default function DashboardPage() {
  const { user } = useAuthStore()
  const { data, isLoading } = useAnalyticsOverview()

  const greeting = () => {
    const h = new Date().getHours()
    if (h < 12) return 'Good morning'
    if (h < 17) return 'Good afternoon'
    return 'Good evening'
  }

  return (
    <div className="p-6 max-w-7xl mx-auto space-y-6">
      {/* Greeting */}
      <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }}>
        <h2 className="text-xl font-semibold text-foreground">
          {greeting()}, {user?.full_name || user?.username} 👋
        </h2>
        <p className="text-sm text-muted-foreground mt-1">Here's what's happening with your infrastructure.</p>
      </motion.div>

      {/* Stat cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {isLoading ? (
          Array.from({ length: 4 }).map((_, i) => <StatCardSkeleton key={i} />)
        ) : (
          <>
            <StatCard label="Total Projects" value={data?.projects.total ?? 0} icon={FolderOpen} color="bg-blue-500/10 text-blue-500" />
            <StatCard label="Total Deployments" value={data?.deployments.total ?? 0} icon={Rocket} color="bg-indigo-500/10 text-indigo-500" sub={`${data?.deployments.recent_30d ?? 0} in last 30 days`} />
            <StatCard label="Success Rate" value={`${data?.deployments.success_rate ?? 0}%`} icon={CheckCircle} color="bg-emerald-500/10 text-emerald-500" sub={`${data?.deployments.success ?? 0} successful`} />
            <StatCard label="Failed" value={data?.deployments.failed ?? 0} icon={TrendingUp} color="bg-red-500/10 text-red-500" sub="total failures" />
          </>
        )}
      </div>

      {/* Chart + Activity */}
      <div className="grid grid-cols-1 lg:grid-cols-5 gap-4">
        {/* Deployment trend */}
        <Card className="lg:col-span-3 p-5">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h3 className="text-sm font-semibold text-foreground">Deployment Activity</h3>
              <p className="text-xs text-muted-foreground">Last 14 days</p>
            </div>
          </div>
          {isLoading ? (
            <Skeleton className="h-40 w-full" />
          ) : (
            <ResponsiveContainer width="100%" height={160}>
              <AreaChart data={data?.trend ?? []} margin={{ top: 5, right: 5, left: -20, bottom: 0 }}>
                <defs>
                  <linearGradient id="deployGrad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#6366f1" stopOpacity={0.3} />
                    <stop offset="95%" stopColor="#6366f1" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                <XAxis dataKey="date" tick={{ fontSize: 10, fill: 'hsl(var(--muted-foreground))' }} tickFormatter={(v) => v.slice(5)} />
                <YAxis tick={{ fontSize: 10, fill: 'hsl(var(--muted-foreground))' }} allowDecimals={false} />
                <Tooltip
                  contentStyle={{ background: 'hsl(var(--card))', border: '1px solid hsl(var(--border))', borderRadius: 8, fontSize: 12 }}
                  labelStyle={{ color: 'hsl(var(--foreground))' }}
                />
                <Area type="monotone" dataKey="deployments" stroke="#6366f1" strokeWidth={2} fill="url(#deployGrad)" />
              </AreaChart>
            </ResponsiveContainer>
          )}
        </Card>

        {/* Recent activity */}
        <Card className="lg:col-span-2 p-5">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-sm font-semibold text-foreground">Recent Deployments</h3>
            <Link to="/deployments" className="text-xs text-muted-foreground hover:text-foreground flex items-center gap-1">
              View all <ArrowUpRight size={12} />
            </Link>
          </div>
          {isLoading ? (
            <div className="space-y-3">
              {Array.from({ length: 5 }).map((_, i) => (
                <div key={i} className="flex items-center gap-3">
                  <Skeleton className="w-2 h-2 rounded-full" />
                  <div className="flex-1 space-y-1">
                    <Skeleton className="h-3 w-24" />
                    <Skeleton className="h-3 w-16" />
                  </div>
                </div>
              ))}
            </div>
          ) : data?.recent_activity.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-8 text-center">
              <Rocket size={24} className="text-muted-foreground mb-2" />
              <p className="text-xs text-muted-foreground">No deployments yet</p>
            </div>
          ) : (
            <div className="space-y-3">
              {data?.recent_activity.slice(0, 7).map((a) => (
                <div key={a.id} className="flex items-start gap-3 text-sm">
                  <StatusBadge status={a.status} />
                  <div className="flex-1 min-w-0">
                    <p className="text-xs font-medium text-foreground truncate">{a.project_name}</p>
                    <p className="text-xs text-muted-foreground truncate">
                      {truncate(a.commit_message || a.branch || '—', 36)}
                    </p>
                  </div>
                  <div className="flex items-center gap-1 text-xs text-muted-foreground shrink-0">
                    <Clock size={10} />
                    {formatRelative(a.created_at)}
                  </div>
                </div>
              ))}
            </div>
          )}
        </Card>
      </div>
    </div>
  )
}

