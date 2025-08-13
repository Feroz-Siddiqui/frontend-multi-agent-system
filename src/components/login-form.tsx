import { useState } from "react"
import { useNavigate, useLocation } from "react-router-dom"
import { useAuth } from "@/contexts/AuthContext"
import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"

export function LoginForm({
  className,
  ...props
}: React.ComponentProps<"form">) {
  const [username, setUsername] = useState("")
  const [password, setPassword] = useState("")
  const { login, loading, error, clearError } = useAuth()
  const navigate = useNavigate()
  const location = useLocation()

  // Get the intended destination or default to dashboard
  const from = (location.state as { from?: { pathname: string } })?.from?.pathname || "/dashboard"

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault()
    clearError()

    try {
      await login(username, password)
      // Redirect to intended destination
      navigate(from, { replace: true })
    } catch (error) {
      // Error is handled by the auth context
      console.error("Login failed:", error)
    }
  }

  return (
    <form className={cn("flex flex-col gap-6", className)} onSubmit={handleSubmit} {...props}>
      <div className="flex flex-col items-center gap-2 text-center">
        <h1 className="text-2xl font-bold">Login to your account</h1>
        <p className="text-muted-foreground text-sm text-balance">
          Enter your credentials below to access the Multi-Agent System
        </p>
      </div>

      {error && (
        <div className="p-3 text-sm text-red-600 bg-red-50 border border-red-200 rounded-md">
          {error}
        </div>
      )}

      <div className="grid gap-6">
        <div className="grid gap-3">
          <Label htmlFor="username">Username</Label>
          <Input 
            id="username" 
            type="text" 
            placeholder="Enter your username"
            value={username}
            onChange={(e) => setUsername(e.target.value)}
            required 
            disabled={loading}
          />
        </div>
        <div className="grid gap-3">
          <div className="flex items-center">
            <Label htmlFor="password">Password</Label>
          </div>
          <Input 
            id="password" 
            type="password" 
            placeholder="Enter your password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required 
            disabled={loading}
          />
        </div>
        <Button type="submit" className="w-full" disabled={loading}>
          {loading ? "Signing in..." : "Login"}
        </Button>
      </div>
      <div className="text-center text-sm">
        Don&apos;t have an account?{" "}
        <a href="/signup" className="underline underline-offset-4">
          Sign up
        </a>
      </div>
    </form>
  )
}
