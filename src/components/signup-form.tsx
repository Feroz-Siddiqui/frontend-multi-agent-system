import { useState } from "react"
import { useNavigate } from "react-router-dom"
import { useAuth } from "@/contexts/AuthContext"
import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Checkbox } from "@/components/ui/checkbox"
import { PasswordStrengthIndicator } from "@/components/ui/password-strength-indicator"
import { validatePasswordStrength } from "@/lib/password-validation"


export function SignupForm({
  className,
  ...props
}: React.ComponentProps<"form">) {
  const [formData, setFormData] = useState({
    full_name: "",
    email: "",
    password: "",
    confirmPassword: ""
  })
  const [acceptTerms, setAcceptTerms] = useState(false)
  const [validationErrors, setValidationErrors] = useState<string[]>([])
  
  const { register, loading, error, clearError } = useAuth()
  const navigate = useNavigate()

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target
    setFormData(prev => ({
      ...prev,
      [name]: value
    }))
    // Clear validation errors when user starts typing
    if (validationErrors.length > 0) {
      setValidationErrors([])
    }
  }

  const validateForm = (): boolean => {
    const errors: string[] = []

    // Full name validation
    if (!formData.full_name.trim()) {
      errors.push("Full name is required")
    }

    // Email validation
    if (!formData.email.trim()) {
      errors.push("Email is required")
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
      errors.push("Please enter a valid email address")
    }

    // Password validation using backend policy
    if (!formData.password) {
      errors.push("Password is required")
    } else {
      const passwordValidation = validatePasswordStrength(formData.password)
      if (!passwordValidation.isValid) {
        errors.push(...passwordValidation.errors)
      }
    }

    // Confirm password validation
    if (!formData.confirmPassword) {
      errors.push("Please confirm your password")
    } else if (formData.password !== formData.confirmPassword) {
      errors.push("Passwords do not match")
    }

    // Terms acceptance validation
    if (!acceptTerms) {
      errors.push("You must accept the Terms of Service")
    }

    setValidationErrors(errors)
    return errors.length === 0
  }

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault()
    clearError()

    // Validate form
    if (!validateForm()) {
      return
    }

    try {
      // Register user (this will also auto-login)
      await register(formData.email, formData.password, formData.full_name)
      
      // Redirect to dashboard on success
      navigate("/dashboard", { replace: true })
    } catch (error) {
      // Error is handled by the auth context
      console.error("Registration failed:", error)
    }
  }

  const allErrors = [...validationErrors, ...(error ? [error] : [])]

  return (
    <form className={cn("flex flex-col gap-6", className)} onSubmit={handleSubmit} {...props}>
      <div className="flex flex-col items-center gap-2 text-center">
        <h1 className="text-2xl font-bold">Create your account</h1>
        <p className="text-muted-foreground text-sm text-balance">
          Enter your information below to create your account
        </p>
      </div>

      {allErrors.length > 0 && (
        <div className="p-3 text-sm text-red-600 bg-red-50 border border-red-200 rounded-md">
          <ul className="space-y-1">
            {allErrors.map((error, index) => (
              <li key={index}>• {error}</li>
            ))}
          </ul>
        </div>
      )}

      <div className="grid gap-6">
        <div className="grid gap-3">
          <Label htmlFor="full_name">Full Name</Label>
          <Input 
            id="full_name" 
            name="full_name"
            type="text" 
            placeholder="John Doe" 
            value={formData.full_name}
            onChange={handleInputChange}
            required 
            disabled={loading}
          />
        </div>
        <div className="grid gap-3">
          <Label htmlFor="email">Email</Label>
          <Input 
            id="email" 
            name="email"
            type="email" 
            placeholder="m@example.com" 
            value={formData.email}
            onChange={handleInputChange}
            required 
            disabled={loading}
          />
        </div>
        <div className="grid gap-3">
          <Label htmlFor="password">Password</Label>
          <Input 
            id="password" 
            name="password"
            type="password" 
            placeholder="At least 8 characters"
            value={formData.password}
            onChange={handleInputChange}
            required 
            disabled={loading}
          />
          {/* Password Strength Indicator - shows real-time validation */}
          {formData.password && (
            <PasswordStrengthIndicator 
              password={formData.password}
              className="mt-2"
            />
          )}
        </div>
        <div className="grid gap-3">
          <Label htmlFor="confirmPassword">Confirm Password</Label>
          <Input 
            id="confirmPassword" 
            name="confirmPassword"
            type="password" 
            placeholder="Confirm your password"
            value={formData.confirmPassword}
            onChange={handleInputChange}
            required 
            disabled={loading}
          />
        </div>
        <div className="flex items-center space-x-2">
          <Checkbox 
            id="terms" 
            checked={acceptTerms}
            onCheckedChange={(checked) => setAcceptTerms(checked as boolean)}
            required 
            disabled={loading}
          />
          <label
            htmlFor="terms"
            className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
          >
            I agree to <a href="#" className="underline underline-offset-4 hover:text-primary">Terms of Service</a>
          </label>
        </div>
        <Button type="submit" className="w-full" disabled={loading}>
          {loading ? "Creating Account..." : "Create Account"}
        </Button>
      </div>
      <div className="text-center text-sm">
        Already have an account?{" "}
        <a href="/login" className="underline underline-offset-4">
          Login
        </a>
      </div>
    </form>
  )
}
