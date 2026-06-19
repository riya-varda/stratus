import { useState } from 'react'
import { Link } from 'react-router-dom'
import { motion } from 'framer-motion'
import { Rocket, GitBranch, Search, Filter } from 'lucide-react'
import { Card, Skeleton, EmptyState, StatusBadge, EnvBadge, Select } from '@/components/ui/index'
import { useProjects, useDeployments } from '@/hooks/useApi'
import { formatRelative, formatDuration } from '@/lib/utils'
import type { Deployment } from '@/types'

function AllDeploymentsList() {
  const [envFilter, setEnvFilter] = useState('')
  const [statusFilter, setStatusFilter] = useState('')
  const [selectedProject, setSelectedProject] = useState('')

  const { data: projects } = useProjects({ page_size: 100 })
  const projectId = selectedProject || projects?.items[0]?.id || ''

  const { data: deployments, isLoading } = useDeployments(projectId, {
    environment: envFilter || undefined,
    status: statusFilter || undefined,
    page_size: 20,
  })

  return (
    <div>
      {/* Filters */}
      <div className="flex flex-wrap items-center gap-3 mb-6">
        <div className="relative flex-1 min-w-[200px] max-w-xs">
          <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
          <input
            className="w-full h-9 pl-9 pr-3 rounded-md border border-input bg-background text-sm placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring"
            placeholder="Search by commit..."
          />
        </div>
        <Select
          options={(projects?.items || []).map(p => ({ value: p.id, label: p.name }))}
          value={selectedProject}
          onChange={setSelectedProject}
          placeholder="All projects"
          className="w-44"
        />
        <Select
          options={[
            { value: 'development', label: 'Development' },
            { value: 'staging', label: 'Staging' },
            { value: 'production', label: 'Production' },
          ]}
          value={envFilter}
          onChange={setEnvFilter}
          placeholder="All environments"
          className="w-44"
        />
        <Select
          options={[
            { value: 'success', label: 'Success' },
            { value: 'failed', label: 'Failed' },
            { value: 'pending', label: 'Pending' },
            { value: 'building', label: 'Building' },
            { value: 'cancelled', label: 'Cancelled' },
          ]}
          value={statusFilter}
          onChange={setStatusFilter}
          placeholder="All statuses"
          className="w-36"
        />
      </div>

      {!projectId ? (
        <EmptyState
          icon={<Rocket size={20} />}
          title="No projects found"
          description="Create a project first to see deployments."
          action={<Link to="/projects" className="text-sm text-foreground underline">Go to Projects</Link>}
        />
      ) : isLoading ? (
        <div className="space-y-2">
          {Array.from({ length: 8 }).map((_, i) => <Skeleton key={i} className="h-[72px] rounded-lg" />)}
        </div>
      ) : deployments?.items.length === 0 ? (
        <EmptyState
          icon={<Rocket size={20} />}
          title="No deployments found"
          description="Trigger a deployment from any project to see it here."
        />
      ) : (
        <div className="space-y-2">
          {deployments?.items.map(d => <DeploymentRow key={d.id} deployment={d} projectId={projectId} projects={projects?.items || []} />)}
        </div>
      )}
    </div>
  )
}

function DeploymentRow({
  deployment: d,
  projectId,
  projects,
}: {
  deployment: Deployment
  projectId: string
  projects: Array<{ id: string; name: string }>
}) {
  const projectName = projects.find(p => p.id === projectId)?.name || 'Unknown'

  return (
    <motion.div initial={{ opacity: 0, y: 4 }} animate={{ opacity: 1, y: 0 }}>
      <Card className="px-5 py-4 flex items-center gap-4 hover:border-primary/20 transition-colors">
        <StatusBadge status={d.status} />
        <div className="flex-1 min-w-0 grid grid-cols-1 sm:grid-cols-3 gap-1">
          <div className="min-w-0">
            <Link to={`/projects/${projectId}`} className="text-sm font-medium text-foreground hover:underline truncate block">
              {projectName}
            </Link>
            <div className="flex items-center gap-1.5 mt-0.5">
              <GitBranch size={11} className="text-muted-foreground" />
              <span className="text-xs font-mono text-muted-foreground">{d.branch || 'main'}</span>
            </div>
          </div>
          <div className="min-w-0">
            <p className="text-xs text-foreground truncate">{d.commit_message || '—'}</p>
            {d.commit_sha && (
              <p className="text-xs font-mono text-muted-foreground">{d.commit_sha.slice(0, 7)}</p>
            )}
          </div>
          <div className="flex items-center gap-3 sm:justify-end">
            <EnvBadge env={d.environment} />
            {d.build_duration_seconds && (
              <span className="text-xs text-muted-foreground">{formatDuration(d.build_duration_seconds)}</span>
            )}
            <span className="text-xs text-muted-foreground">{formatRelative(d.created_at)}</span>
          </div>
        </div>
      </Card>
    </motion.div>
  )
}

export default function DeploymentsPage() {
  return (
    <div className="p-6 max-w-7xl mx-auto">
      <div className="mb-6">
        <h2 className="text-lg font-semibold text-foreground">Deployments</h2>
        <p className="text-sm text-muted-foreground">All deployments across your projects</p>
      </div>
      <AllDeploymentsList />
    </div>
  )
}
