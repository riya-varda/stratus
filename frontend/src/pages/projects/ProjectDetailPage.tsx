import { useState } from 'react'
import { useParams, Link, useNavigate } from 'react-router-dom'
import { motion } from 'framer-motion'
import { ArrowLeft, Plus, GitBranch, Rocket, ExternalLink, RefreshCw } from 'lucide-react'
import {
  Button, Card, Skeleton, EmptyState, StatusBadge, EnvBadge, Dialog, Input, Select
} from '@/components/ui/index'
import {
  useProject, useDeployments, useCreateDeployment, useCancelDeployment, useDeploymentStats
} from '@/hooks/useApi'
import { formatRelative, formatDuration } from '@/lib/utils'
import { toast } from '@/hooks/useToast'
import type { Deployment } from '@/types'

export default function ProjectDetailPage() {
  const { id = '' } = useParams<{ id: string }>()
  const navigate = useNavigate()
  const [envFilter, setEnvFilter] = useState('')
  const [showDeploy, setShowDeploy] = useState(false)
  const [deployForm, setDeployForm] = useState({ environment: 'production', branch: 'main', commit_message: '' })

  const { data: project, isLoading: projectLoading } = useProject(id)
  const { data: deployments, isLoading: deplLoading } = useDeployments(id, { environment: envFilter || undefined })
  const { data: stats } = useDeploymentStats(id)
  const createDeplMutation = useCreateDeployment()
  const cancelMutation = useCancelDeployment()

  const handleDeploy = async (e: React.FormEvent) => {
    e.preventDefault()
    try {
      await createDeplMutation.mutateAsync({ projectId: id, data: deployForm })
      setShowDeploy(false)
      toast({ title: 'Deployment triggered', variant: 'success' })
    } catch {
      toast({ title: 'Failed to trigger deployment', variant: 'destructive' })
    }
  }

  if (projectLoading) {
    return (
      <div className="p-6 max-w-5xl mx-auto space-y-4">
        <Skeleton className="h-5 w-32" />
        <Skeleton className="h-8 w-64" />
        <div className="grid grid-cols-4 gap-4">
          {Array.from({ length: 4 }).map((_, i) => <Skeleton key={i} className="h-20 rounded-lg" />)}
        </div>
      </div>
    )
  }

  if (!project) {
    return (
      <div className="p-6">
        <EmptyState icon={<Rocket size={20} />} title="Project not found"
          action={<Button onClick={() => navigate('/projects')} variant="outline"><ArrowLeft size={14} /> Back to projects</Button>} />
      </div>
    )
  }

  return (
    <div className="p-6 max-w-5xl mx-auto">
      {/* Header */}
      <div className="flex items-center gap-3 mb-6">
        <Link to="/projects" className="text-muted-foreground hover:text-foreground transition-colors">
          <ArrowLeft size={16} />
        </Link>
        <div className="flex-1">
          <div className="flex items-center gap-3">
            <h2 className="text-lg font-semibold text-foreground">{project.name}</h2>
            <StatusBadge status={project.status as any} />
          </div>
          {project.description && <p className="text-sm text-muted-foreground mt-0.5">{project.description}</p>}
        </div>
        <Button onClick={() => setShowDeploy(true)}>
          <Rocket size={14} /> Deploy
        </Button>
      </div>

      {/* Stats */}
      {stats && (
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-6">
          {[
            { label: 'Total', value: stats.total },
            { label: 'Success', value: stats.success },
            { label: 'Failed', value: stats.failed },
            { label: 'Avg Build', value: formatDuration(Math.round(stats.avg_duration_seconds)) },
          ].map(({ label, value }) => (
            <Card key={label} className="p-4 text-center">
              <p className="text-xl font-bold text-foreground">{value}</p>
              <p className="text-xs text-muted-foreground">{label}</p>
            </Card>
          ))}
        </div>
      )}

      {/* Filters */}
      <div className="flex items-center gap-3 mb-4">
        <p className="text-sm font-medium text-foreground flex-1">Deployments</p>
        <Select
          options={[
            { value: 'development', label: 'Development' },
            { value: 'staging', label: 'Staging' },
            { value: 'production', label: 'Production' },
          ]}
          value={envFilter}
          onChange={setEnvFilter}
          placeholder="All environments"
          className="w-40"
        />
      </div>

      {/* Deployments list */}
      {deplLoading ? (
        <div className="space-y-2">
          {Array.from({ length: 5 }).map((_, i) => <Skeleton key={i} className="h-16 rounded-lg" />)}
        </div>
      ) : deployments?.items.length === 0 ? (
        <EmptyState
          icon={<Rocket size={20} />}
          title="No deployments yet"
          description="Trigger your first deployment to get started."
          action={<Button onClick={() => setShowDeploy(true)}><Plus size={14} /> New Deployment</Button>}
        />
      ) : (
        <div className="space-y-2">
          {deployments?.items.map((d) => <DeploymentRow key={d.id} deployment={d} projectId={id} onCancel={() => cancelMutation.mutate({ projectId: id, deploymentId: d.id })} />)}
        </div>
      )}

      {/* Deploy dialog */}
      <Dialog open={showDeploy} onClose={() => setShowDeploy(false)} title="Trigger Deployment">
        <form onSubmit={handleDeploy} className="space-y-4">
          <Select
            label="Environment"
            options={[
              { value: 'development', label: 'Development' },
              { value: 'staging', label: 'Staging' },
              { value: 'production', label: 'Production' },
            ]}
            value={deployForm.environment}
            onChange={(v) => setDeployForm(f => ({ ...f, environment: v }))}
          />
          <Input label="Branch" placeholder="main" value={deployForm.branch}
            onChange={(e) => setDeployForm(f => ({ ...f, branch: e.target.value }))} />
          <Input label="Commit message (optional)" placeholder="feat: add new feature"
            value={deployForm.commit_message}
            onChange={(e) => setDeployForm(f => ({ ...f, commit_message: e.target.value }))} />
          <div className="flex gap-3 pt-2">
            <Button variant="outline" type="button" className="flex-1" onClick={() => setShowDeploy(false)}>Cancel</Button>
            <Button type="submit" className="flex-1" loading={createDeplMutation.isPending}>
              <Rocket size={14} /> Deploy
            </Button>
          </div>
        </form>
      </Dialog>
    </div>
  )
}

function DeploymentRow({ deployment: d, projectId, onCancel }: {
  deployment: Deployment; projectId: string; onCancel: () => void
}) {
  const canCancel = d.status === 'pending' || d.status === 'building'

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
      <Card className="px-4 py-3 flex items-center gap-4 hover:border-border/80 transition-colors">
        <StatusBadge status={d.status} />
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 text-sm">
            <GitBranch size={12} className="text-muted-foreground shrink-0" />
            <span className="font-mono text-xs text-muted-foreground">{d.branch}</span>
            {d.commit_message && (
              <span className="text-foreground text-xs truncate">{d.commit_message}</span>
            )}
          </div>
          <div className="flex items-center gap-3 mt-0.5">
            <EnvBadge env={d.environment} />
            {d.build_duration_seconds && (
              <span className="text-xs text-muted-foreground">{formatDuration(d.build_duration_seconds)}</span>
            )}
          </div>
        </div>
        <div className="flex items-center gap-2 shrink-0">
          {d.deployment_url && (
            <a href={d.deployment_url} target="_blank" rel="noopener noreferrer"
              className="text-muted-foreground hover:text-foreground transition-colors">
              <ExternalLink size={14} />
            </a>
          )}
          {canCancel && (
            <button onClick={onCancel} className="text-xs text-muted-foreground hover:text-destructive transition-colors flex items-center gap-1">
              <RefreshCw size={12} /> Cancel
            </button>
          )}
          <span className="text-xs text-muted-foreground">{formatRelative(d.created_at)}</span>
        </div>
      </Card>
    </motion.div>
  )
}
