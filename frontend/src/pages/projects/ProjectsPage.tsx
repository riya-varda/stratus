import { useState } from 'react'
import { Link } from 'react-router-dom'
import { motion } from 'framer-motion'
import { Plus, Search, FolderOpen, Rocket, GitBranch, MoreHorizontal, Trash2, Edit } from 'lucide-react'
import {
  Button, Card, Skeleton, EmptyState, StatusBadge, Dialog, Input, Select, Textarea
} from '@/components/ui/index'
import { useProjects, useCreateProject, useDeleteProject } from '@/hooks/useApi'
import { formatRelative, FRAMEWORKS } from '@/lib/utils'
import { toast } from '@/hooks/useToast'
import type { Project } from '@/types'

function ProjectCard({ project, onDelete }: { project: Project; onDelete: (id: string) => void }) {
  const [menuOpen, setMenuOpen] = useState(false)

  return (
    <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }}>
      <Card className="group p-5 hover:border-primary/30 transition-colors">
        <div className="flex items-start justify-between mb-3">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-lg bg-primary/10 flex items-center justify-center text-primary">
              <FolderOpen size={18} />
            </div>
            <div>
              <Link to={`/projects/${project.id}`} className="text-sm font-semibold text-foreground hover:underline">
                {project.name}
              </Link>
              {project.framework && (
                <p className="text-xs text-muted-foreground">{project.framework}</p>
              )}
            </div>
          </div>
          <div className="flex items-center gap-2">
            <StatusBadge status={project.status as any} />
            <div className="relative">
              <button
                onClick={() => setMenuOpen(!menuOpen)}
                className="w-7 h-7 rounded-md flex items-center justify-center text-muted-foreground hover:text-foreground hover:bg-accent opacity-0 group-hover:opacity-100 transition-all"
              >
                <MoreHorizontal size={15} />
              </button>
              {menuOpen && (
                <div className="absolute right-0 top-8 bg-card border border-border rounded-lg shadow-xl z-10 py-1 w-40">
                  <Link
                    to={`/projects/${project.id}`}
                    className="flex items-center gap-2 px-3 py-2 text-sm hover:bg-accent text-foreground"
                    onClick={() => setMenuOpen(false)}
                  >
                    <Edit size={13} /> Edit project
                  </Link>
                  <button
                    onClick={() => { onDelete(project.id); setMenuOpen(false) }}
                    className="flex items-center gap-2 px-3 py-2 text-sm w-full text-left text-destructive hover:bg-destructive/10"
                  >
                    <Trash2 size={13} /> Delete
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>

        {project.description && (
          <p className="text-xs text-muted-foreground mb-3 line-clamp-2">{project.description}</p>
        )}

        <div className="flex items-center gap-4 text-xs text-muted-foreground pt-3 border-t border-border">
          <div className="flex items-center gap-1">
            <Rocket size={11} />
            {project.deployment_count} deployments
          </div>
          {project.last_deployed_at && (
            <div className="flex items-center gap-1">
              <GitBranch size={11} />
              {formatRelative(project.last_deployed_at)}
            </div>
          )}
          <span className="ml-auto">{formatRelative(project.created_at)}</span>
        </div>
      </Card>
    </motion.div>
  )
}

function ProjectCardSkeleton() {
  return (
    <Card className="p-5">
      <div className="flex items-start gap-3 mb-3">
        <Skeleton className="w-9 h-9 rounded-lg" />
        <div className="flex-1">
          <Skeleton className="h-4 w-32 mb-1" />
          <Skeleton className="h-3 w-20" />
        </div>
      </div>
      <Skeleton className="h-3 w-full mb-1" />
      <Skeleton className="h-3 w-3/4 mb-3" />
      <div className="flex gap-4 pt-3 border-t border-border">
        <Skeleton className="h-3 w-20" />
        <Skeleton className="h-3 w-24" />
      </div>
    </Card>
  )
}

export default function ProjectsPage() {
  const [search, setSearch] = useState('')
  const [page, setPage] = useState(1)
  const [showCreate, setShowCreate] = useState(false)
  const [newProject, setNewProject] = useState({ name: '', description: '', framework: '', repository_url: '' })

  const { data, isLoading } = useProjects({ page, page_size: 12, search: search || undefined })
  const createMutation = useCreateProject()
  const deleteMutation = useDeleteProject()

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault()
    try {
      await createMutation.mutateAsync(newProject)
      setShowCreate(false)
      setNewProject({ name: '', description: '', framework: '', repository_url: '' })
      toast({ title: 'Project created', variant: 'success' })
    } catch {
      toast({ title: 'Failed to create project', variant: 'destructive' })
    }
  }

  const handleDelete = async (id: string) => {
    if (!confirm('Delete this project? This cannot be undone.')) return
    try {
      await deleteMutation.mutateAsync(id)
      toast({ title: 'Project deleted' })
    } catch {
      toast({ title: 'Failed to delete project', variant: 'destructive' })
    }
  }

  return (
    <div className="p-6 max-w-7xl mx-auto">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h2 className="text-lg font-semibold text-foreground">Projects</h2>
          <p className="text-sm text-muted-foreground">{data?.total ?? 0} projects</p>
        </div>
        <Button onClick={() => setShowCreate(true)}>
          <Plus size={15} /> New Project
        </Button>
      </div>

      {/* Search */}
      <div className="relative mb-6 max-w-sm">
        <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
        <input
          type="text"
          placeholder="Search projects..."
          value={search}
          onChange={(e) => { setSearch(e.target.value); setPage(1) }}
          className="w-full h-9 pl-9 pr-3 rounded-md border border-input bg-background text-sm placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring"
        />
      </div>

      {/* Grid */}
      {isLoading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
          {Array.from({ length: 6 }).map((_, i) => <ProjectCardSkeleton key={i} />)}
        </div>
      ) : data?.items.length === 0 ? (
        <EmptyState
          icon={<FolderOpen size={20} />}
          title="No projects yet"
          description="Create your first project to start deploying your applications."
          action={<Button onClick={() => setShowCreate(true)}><Plus size={15} /> New Project</Button>}
        />
      ) : (
        <>
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
            {data?.items.map((p) => (
              <ProjectCard key={p.id} project={p} onDelete={handleDelete} />
            ))}
          </div>
          {(data?.pages ?? 0) > 1 && (
            <div className="flex items-center justify-center gap-2 mt-8">
              <Button variant="outline" size="sm" disabled={page <= 1} onClick={() => setPage(p => p - 1)}>Previous</Button>
              <span className="text-sm text-muted-foreground">Page {page} of {data?.pages}</span>
              <Button variant="outline" size="sm" disabled={page >= (data?.pages ?? 1)} onClick={() => setPage(p => p + 1)}>Next</Button>
            </div>
          )}
        </>
      )}

      {/* Create dialog */}
      <Dialog open={showCreate} onClose={() => setShowCreate(false)} title="New Project">
        <form onSubmit={handleCreate} className="space-y-4">
          <Input label="Project name" placeholder="my-awesome-app" value={newProject.name}
            onChange={(e) => setNewProject(p => ({ ...p, name: e.target.value }))} required />
          <Textarea label="Description" placeholder="What does this project do?" value={newProject.description}
            onChange={(e) => setNewProject(p => ({ ...p, description: e.target.value }))} rows={3} />
          <Select
            label="Framework"
            options={FRAMEWORKS.map(f => ({ value: f, label: f }))}
            value={newProject.framework}
            onChange={(v) => setNewProject(p => ({ ...p, framework: v }))}
            placeholder="Select framework (optional)"
          />
          <Input label="Repository URL" placeholder="https://github.com/org/repo" value={newProject.repository_url}
            onChange={(e) => setNewProject(p => ({ ...p, repository_url: e.target.value }))} />
          <div className="flex gap-3 pt-2">
            <Button variant="outline" type="button" className="flex-1" onClick={() => setShowCreate(false)}>Cancel</Button>
            <Button type="submit" className="flex-1" loading={createMutation.isPending}>Create Project</Button>
          </div>
        </form>
      </Dialog>
    </div>
  )
}
