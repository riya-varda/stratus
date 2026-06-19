export interface User {
  id: string
  email: string
  username: string
  full_name: string | null
  role: 'admin' | 'developer' | 'viewer'
  is_active: boolean
  is_verified: boolean
  avatar_url: string | null
  bio: string | null
  last_login_at: string | null
  created_at: string
  updated_at: string
}

export interface Project {
  id: string
  owner_id: string
  name: string
  slug: string
  description: string | null
  status: 'active' | 'archived' | 'deleted'
  repository_url: string | null
  framework: string | null
  settings: Record<string, unknown> | null
  deployment_count: number
  last_deployed_at: string | null
  created_at: string
  updated_at: string
}

export interface Deployment {
  id: string
  project_id: string
  created_by_id: string | null
  environment: 'development' | 'staging' | 'production'
  status: 'pending' | 'building' | 'deploying' | 'success' | 'failed' | 'cancelled'
  commit_sha: string | null
  commit_message: string | null
  branch: string | null
  deployment_url: string | null
  build_logs: string | null
  error_message: string | null
  metadata: Record<string, unknown> | null
  build_duration_seconds: number | null
  started_at: string | null
  finished_at: string | null
  created_at: string
  updated_at: string
}

export interface PaginatedResponse<T> {
  items: T[]
  total: number
  page: number
  page_size: number
  pages: number
}

export interface TokenResponse {
  access_token: string
  refresh_token: string
  token_type: string
}

export interface APIKey {
  id: string
  name: string
  key_prefix: string
  is_active: boolean
  last_used_at: string | null
  expires_at: string | null
  created_at: string
}

export interface AnalyticsOverview {
  projects: { total: number }
  deployments: {
    total: number
    success: number
    failed: number
    recent_30d: number
    success_rate: number
  }
  trend: Array<{ date: string; deployments: number }>
  recent_activity: Array<{
    id: string
    project_name: string
    status: Deployment['status']
    environment: Deployment['environment']
    branch: string | null
    commit_message: string | null
    created_at: string | null
  }>
}
