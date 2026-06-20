import {
  useQuery,
  useMutation,
  useQueryClient,
} from '@tanstack/react-query'
import {
  authApi,
  usersApi,
  projectsApi,
  deploymentsApi,
  analyticsApi,
} from '@/lib/api'
import { useAuthStore } from '@/store/authStore'
import type { User, Project, Deployment, PaginatedResponse, AnalyticsOverview } from '@/types'

// Auth
export function useMe() {
  return useQuery({
    queryKey: ['me'],
    queryFn: () => authApi.me().then((r) => r.data as User),
    enabled: !!useAuthStore.getState().accessToken,
    staleTime: 5 * 60 * 1000,
  })
}

// Projects
export function useProjects(params?: {
  page?: number
  page_size?: number
  search?: string
  sort_by?: string
  sort_order?: string
  status?: string
}) {
  return useQuery({
    queryKey: ['projects', params],
    queryFn: () =>
      projectsApi.list(params).then((r) => r.data as PaginatedResponse<Project>),
  })
}

export function useProject(id: string) {
  return useQuery({
    queryKey: ['project', id],
    queryFn: () => projectsApi.get(id).then((r) => r.data as Project),
    enabled: !!id,
  })
}

export function useCreateProject() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (data: { name: string; description?: string; repository_url?: string; framework?: string }) =>
      projectsApi.create(data).then((r) => r.data as Project),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['projects'] }),
  })
}

export function useUpdateProject() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: Partial<Project> }) =>
      projectsApi.update(id, data).then((r) => r.data as Project),
    onSuccess: (_, { id }) => {
      qc.invalidateQueries({ queryKey: ['projects'] })
      qc.invalidateQueries({ queryKey: ['project', id] })
    },
  })
}

export function useDeleteProject() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (id: string) => projectsApi.delete(id),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['projects'] }),
  })
}

// Deployments
export function useDeployments(
  projectId: string,
  params?: { page?: number; page_size?: number; environment?: string; status?: string }
) {
  return useQuery({
    queryKey: ['deployments', projectId, params],
    queryFn: () =>
      deploymentsApi.list(projectId, params).then((r) => r.data as PaginatedResponse<Deployment>),
    enabled: !!projectId,
  })
}

export function useDeployment(projectId: string, deploymentId: string) {
  return useQuery({
    queryKey: ['deployment', projectId, deploymentId],
    queryFn: () =>
      deploymentsApi.get(projectId, deploymentId).then((r) => r.data as Deployment),
    enabled: !!projectId && !!deploymentId,
  })
}

export function useCreateDeployment() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: ({
      projectId,
      data,
    }: {
      projectId: string
      data: {
        environment?: string
        commit_sha?: string
        commit_message?: string
        branch?: string
      }
    }) => deploymentsApi.create(projectId, data).then((r) => r.data as Deployment),
    onSuccess: (_, { projectId }) => {
      qc.invalidateQueries({ queryKey: ['deployments', projectId] })
      qc.invalidateQueries({ queryKey: ['analytics'] })
    },
  })
}

export function useCancelDeployment() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: ({ projectId, deploymentId }: { projectId: string; deploymentId: string }) =>
      deploymentsApi.cancel(projectId, deploymentId).then((r) => r.data as Deployment),
    onSuccess: (_, { projectId }) => {
      qc.invalidateQueries({ queryKey: ['deployments', projectId] })
    },
  })
}

export function useDeploymentStats(projectId: string) {
  return useQuery({
    queryKey: ['deployment-stats', projectId],
    queryFn: () => deploymentsApi.stats(projectId).then((r) => r.data),
    enabled: !!projectId,
  })
}

// Analytics
export function useAnalyticsOverview() {
  return useQuery({
    queryKey: ['analytics', 'overview'],
    queryFn: () => analyticsApi.overview().then((r) => r.data as AnalyticsOverview),
    staleTime: 2 * 60 * 1000,
  })
}

// User profile
export function useUpdateProfile() {
  const qc = useQueryClient()
  const updateUser = useAuthStore((s) => s.updateUser)
  return useMutation({
    mutationFn: (data: { full_name?: string; bio?: string; avatar_url?: string }) =>
      usersApi.updateProfile(data).then((r) => r.data as User),
    onSuccess: (user) => {
      updateUser(user)
      qc.invalidateQueries({ queryKey: ['me'] })
    },
  })
}

export function useApiKeys() {
  return useQuery({
    queryKey: ['api-keys'],
    queryFn: () => usersApi.listApiKeys().then((r) => r.data),
  })
}

export function useCreateApiKey() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (name: string) => usersApi.createApiKey(name).then((r) => r.data),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['api-keys'] }),
  })
}

export function useDeleteApiKey() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (id: string) => usersApi.deleteApiKey(id),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['api-keys'] }),
  })
}


