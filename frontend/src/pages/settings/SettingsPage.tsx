import { useState } from 'react'
import { motion } from 'framer-motion'
import { User, Key, Moon, Sun, Trash2, Copy, Eye, EyeOff, Plus } from 'lucide-react'
import { Button, Card, Input, Skeleton, Badge } from '@/components/ui/index'
import { useAuthStore } from '@/store/authStore'
import { useUIStore } from '@/store/uiStore'
import { useUpdateProfile, useApiKeys, useCreateApiKey, useDeleteApiKey } from '@/hooks/useApi'
import { usersApi } from '@/lib/api'
import { toast } from '@/hooks/useToast'
import { formatDate } from '@/lib/utils'

type Tab = 'profile' | 'security' | 'api-keys' | 'appearance'

export default function SettingsPage() {
  const [tab, setTab] = useState<Tab>('profile')

  const tabs: Array<{ key: Tab; label: string; icon: React.ElementType }> = [
    { key: 'profile', label: 'Profile', icon: User },
    { key: 'security', label: 'Security', icon: Key },
    { key: 'api-keys', label: 'API Keys', icon: Key },
    { key: 'appearance', label: 'Appearance', icon: Moon },
  ]

  return (
    <div className="p-6 max-w-4xl mx-auto">
      <div className="mb-6">
        <h2 className="text-lg font-semibold text-foreground">Settings</h2>
        <p className="text-sm text-muted-foreground">Manage your account and preferences</p>
      </div>

      <div className="flex gap-6">
        {/* Sidebar nav */}
        <nav className="w-44 shrink-0">
          <div className="space-y-1">
            {tabs.map(({ key, label, icon: Icon }) => (
              <button
                key={key}
                onClick={() => setTab(key)}
                className={`w-full flex items-center gap-2.5 px-3 py-2 rounded-md text-sm transition-colors text-left ${
                  tab === key
                    ? 'bg-primary text-primary-foreground'
                    : 'text-muted-foreground hover:text-foreground hover:bg-accent'
                }`}
              >
                <Icon size={15} />
                {label}
              </button>
            ))}
          </div>
        </nav>

        {/* Content */}
        <div className="flex-1 min-w-0">
          <motion.div
            key={tab}
            initial={{ opacity: 0, x: 8 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.2 }}
          >
            {tab === 'profile' && <ProfileTab />}
            {tab === 'security' && <SecurityTab />}
            {tab === 'api-keys' && <APIKeysTab />}
            {tab === 'appearance' && <AppearanceTab />}
          </motion.div>
        </div>
      </div>
    </div>
  )
}

function ProfileTab() {
  const { user } = useAuthStore()
  const updateMutation = useUpdateProfile()
  const [form, setForm] = useState({
    full_name: user?.full_name || '',
    bio: user?.bio || '',
    avatar_url: user?.avatar_url || '',
  })

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault()
    try {
      await updateMutation.mutateAsync(form)
      toast({ title: 'Profile updated', variant: 'success' })
    } catch {
      toast({ title: 'Failed to update profile', variant: 'destructive' })
    }
  }

  return (
    <Card className="p-6">
      <h3 className="text-base font-semibold text-foreground mb-5">Profile Information</h3>
      <form onSubmit={handleSave} className="space-y-4">
        <div className="flex items-center gap-4 mb-6">
          <div className="w-16 h-16 rounded-full bg-primary text-primary-foreground flex items-center justify-center text-2xl font-semibold">
            {user?.full_name?.[0] || user?.username?.[0] || '?'}
          </div>
          <div>
            <p className="text-sm font-medium text-foreground">{user?.full_name || user?.username}</p>
            <p className="text-xs text-muted-foreground">{user?.email}</p>
            <Badge variant={user?.is_verified ? 'success' : 'warning'} className="mt-1">
              {user?.is_verified ? 'Verified' : 'Unverified'}
            </Badge>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-4">
          <Input label="Full name" value={form.full_name} onChange={e => setForm(f => ({ ...f, full_name: e.target.value }))} placeholder="Your name" />
          <Input label="Username" value={user?.username || ''} disabled className="opacity-60 cursor-not-allowed" />
        </div>
        <Input label="Email" value={user?.email || ''} disabled className="opacity-60 cursor-not-allowed" />
        <div className="space-y-1.5">
          <label className="block text-sm font-medium text-foreground">Bio</label>
          <textarea
            rows={3}
            value={form.bio}
            onChange={e => setForm(f => ({ ...f, bio: e.target.value }))}
            placeholder="Tell us a bit about yourself"
            className="w-full px-3 py-2 rounded-md border border-input bg-background text-sm placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring resize-none"
          />
        </div>
        <Input label="Avatar URL" value={form.avatar_url} onChange={e => setForm(f => ({ ...f, avatar_url: e.target.value }))} placeholder="https://..." />
        <div className="pt-2">
          <Button type="submit" loading={updateMutation.isPending}>Save changes</Button>
        </div>
      </form>
    </Card>
  )
}

function SecurityTab() {
  const [form, setForm] = useState({ current_password: '', new_password: '', confirm: '' })
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (form.new_password !== form.confirm) {
      setError('Passwords do not match')
      return
    }
    setLoading(true)
    setError('')
    try {
      await usersApi.changePassword(form.current_password, form.new_password)
      toast({ title: 'Password changed', variant: 'success' })
      setForm({ current_password: '', new_password: '', confirm: '' })
    } catch (err: any) {
      setError(err?.response?.data?.detail || 'Failed to change password')
    } finally {
      setLoading(false)
    }
  }

  return (
    <Card className="p-6">
      <h3 className="text-base font-semibold text-foreground mb-5">Change Password</h3>
      <form onSubmit={handleSubmit} className="space-y-4 max-w-sm">
        <Input label="Current password" type="password" value={form.current_password}
          onChange={e => setForm(f => ({ ...f, current_password: e.target.value }))} required />
        <Input label="New password" type="password" value={form.new_password}
          onChange={e => setForm(f => ({ ...f, new_password: e.target.value }))} required minLength={8} />
        <Input label="Confirm new password" type="password" value={form.confirm}
          onChange={e => setForm(f => ({ ...f, confirm: e.target.value }))} required />
        {error && <p className="text-sm text-destructive bg-destructive/10 px-3 py-2 rounded-md">{error}</p>}
        <Button type="submit" loading={loading}>Update password</Button>
      </form>
    </Card>
  )
}

function APIKeysTab() {
  const { data: keys, isLoading } = useApiKeys()
  const createMutation = useCreateApiKey()
  const deleteMutation = useDeleteApiKey()
  const [newKeyName, setNewKeyName] = useState('')
  const [createdKey, setCreatedKey] = useState<string | null>(null)
  const [showKey, setShowKey] = useState(false)

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!newKeyName.trim()) return
    try {
      const result = await createMutation.mutateAsync(newKeyName.trim())
      setCreatedKey(result.key)
      setNewKeyName('')
      toast({ title: 'API key created', variant: 'success' })
    } catch {
      toast({ title: 'Failed to create API key', variant: 'destructive' })
    }
  }

  const handleDelete = async (id: string) => {
    if (!confirm('Delete this API key? Applications using it will lose access.')) return
    try {
      await deleteMutation.mutateAsync(id)
      toast({ title: 'API key deleted' })
    } catch {
      toast({ title: 'Failed to delete key', variant: 'destructive' })
    }
  }

  return (
    <div className="space-y-4">
      {/* New key created banner */}
      {createdKey && (
        <div className="bg-emerald-500/10 border border-emerald-500/20 rounded-lg p-4">
          <p className="text-sm font-medium text-emerald-600 dark:text-emerald-400 mb-2">
            ✅ API key created — copy it now, it won't be shown again
          </p>
          <div className="flex items-center gap-2">
            <code className="flex-1 text-xs font-mono bg-card border border-border px-3 py-2 rounded-md">
              {showKey ? createdKey : '••••••••••••••••••••••••••••••••••••••••'}
            </code>
            <button onClick={() => setShowKey(s => !s)} className="text-muted-foreground hover:text-foreground">
              {showKey ? <EyeOff size={14} /> : <Eye size={14} />}
            </button>
            <button
              onClick={() => { navigator.clipboard.writeText(createdKey); toast({ title: 'Copied!' }) }}
              className="text-muted-foreground hover:text-foreground"
            >
              <Copy size={14} />
            </button>
          </div>
          <button onClick={() => setCreatedKey(null)} className="text-xs text-muted-foreground mt-2 hover:underline">Dismiss</button>
        </div>
      )}

      {/* Create form */}
      <Card className="p-5">
        <h3 className="text-sm font-semibold text-foreground mb-4">Create API Key</h3>
        <form onSubmit={handleCreate} className="flex gap-3">
          <Input placeholder="Key name (e.g. CI/CD pipeline)" value={newKeyName}
            onChange={e => setNewKeyName(e.target.value)} className="flex-1" />
          <Button type="submit" loading={createMutation.isPending} className="shrink-0">
            <Plus size={14} /> Create
          </Button>
        </form>
      </Card>

      {/* Keys list */}
      <Card className="p-5">
        <h3 className="text-sm font-semibold text-foreground mb-4">Active Keys</h3>
        {isLoading ? (
          <div className="space-y-3">
            {Array.from({ length: 3 }).map((_, i) => <Skeleton key={i} className="h-12" />)}
          </div>
        ) : !keys || keys.length === 0 ? (
          <p className="text-sm text-muted-foreground">No API keys yet.</p>
        ) : (
          <div className="space-y-2">
            {keys.map((key: any) => (
              <div key={key.id} className="flex items-center gap-3 px-3 py-3 rounded-lg bg-muted/40 border border-border">
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-foreground">{key.name}</p>
                  <p className="text-xs font-mono text-muted-foreground">{key.key_prefix}••••••••</p>
                </div>
                <div className="text-right shrink-0">
                  <p className="text-xs text-muted-foreground">Created {formatDate(key.created_at)}</p>
                  {key.last_used_at && <p className="text-xs text-muted-foreground">Last used {formatDate(key.last_used_at)}</p>}
                </div>
                <button onClick={() => handleDelete(key.id)} className="text-muted-foreground hover:text-destructive transition-colors ml-2">
                  <Trash2 size={14} />
                </button>
              </div>
            ))}
          </div>
        )}
      </Card>
    </div>
  )
}

function AppearanceTab() {
  const { theme, setTheme } = useUIStore()

  return (
    <Card className="p-6">
      <h3 className="text-base font-semibold text-foreground mb-5">Appearance</h3>
      <div className="space-y-3">
        <p className="text-sm text-muted-foreground">Choose your preferred theme.</p>
        <div className="grid grid-cols-2 gap-3 max-w-xs">
          {(['light', 'dark'] as const).map(t => (
            <button
              key={t}
              onClick={() => setTheme(t)}
              className={`flex flex-col items-center gap-2 p-4 rounded-lg border-2 transition-colors ${
                theme === t ? 'border-primary' : 'border-border hover:border-primary/50'
              }`}
            >
              {t === 'dark' ? <Moon size={20} className="text-foreground" /> : <Sun size={20} className="text-foreground" />}
              <span className="text-sm capitalize text-foreground">{t}</span>
            </button>
          ))}
        </div>
      </div>
    </Card>
  )
}
