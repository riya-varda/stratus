import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { motion } from 'framer-motion'
import { Cloud } from 'lucide-react'
import { Button, Input } from '@/components/ui/index'
import { authApi } from '@/lib/api'
import { useAuthStore } from '@/store/authStore'

export default function RegisterPage() {
  const navigate = useNavigate()
  const { setTokens, setUser } = useAuthStore()
  const [form, setForm] = useState({ email: '', username: '', full_name: '', password: '' })
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  const set = (k: string) => (e: React.ChangeEvent<HTMLInputElement>) =>
    setForm((f) => ({ ...f, [k]: e.target.value }))

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    setLoading(true)
    try {
      await authApi.register(form)
      const res = await authApi.login(form.email, form.password)
      const { access_token, refresh_token } = res.data
      setTokens(access_token, refresh_token)
      const meRes = await authApi.me()
      setUser(meRes.data)
      navigate('/dashboard')
    } catch (err: any) {
      setError(err?.response?.data?.detail || 'Registration failed')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-8">
      <motion.div
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4 }}
        className="w-full max-w-sm"
      >
        <div className="flex items-center gap-2 mb-8">
          <div className="w-8 h-8 rounded-lg bg-primary text-primary-foreground flex items-center justify-center">
            <Cloud size={16} />
          </div>
          <span className="font-semibold text-foreground">Stratus</span>
        </div>

        <div className="mb-8">
          <h1 className="text-2xl font-bold text-foreground mb-2">Create your account</h1>
          <p className="text-sm text-muted-foreground">Deploy faster. Scale smarter.</p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <Input label="Full name" placeholder="Alex Johnson" value={form.full_name} onChange={set('full_name')} />
          <Input label="Username" placeholder="alexj" value={form.username} onChange={set('username')} required pattern="[a-zA-Z0-9_-]+" minLength={3} />
          <Input label="Email" type="email" placeholder="alex@company.com" value={form.email} onChange={set('email')} required />
          <Input label="Password" type="password" placeholder="Min. 8 chars, 1 uppercase, 1 number" value={form.password} onChange={set('password')} required minLength={8} />

          {error && <p className="text-sm text-destructive bg-destructive/10 px-3 py-2 rounded-md">{error}</p>}

          <Button type="submit" className="w-full" loading={loading}>
            Create account
          </Button>
        </form>

        <p className="mt-6 text-sm text-center text-muted-foreground">
          Already have an account?{' '}
          <Link to="/login" className="text-foreground font-medium hover:underline">Sign in</Link>
        </p>
      </motion.div>
    </div>
  )
}
