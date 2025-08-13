import { GalleryVerticalEnd } from "lucide-react"
import { SignupForm } from "@/components/signup-form"

export default function SignupPage() {
  return (
    <div className="grid min-h-svh lg:grid-cols-2">
      <div className="flex flex-col gap-4 p-6 md:p-10">
        <div className="flex justify-center gap-2 md:justify-start">
          <a href="#" className="flex items-center gap-2 font-medium">
            <div className="bg-primary text-primary-foreground flex size-6 items-center justify-center rounded-md">
              <GalleryVerticalEnd className="size-4" />
            </div>
            Multi-Agent System
          </a>
        </div>
        <div className="flex flex-1 items-center justify-center">
          <div className="w-full max-w-xs">
            <SignupForm />
          </div>
        </div>
      </div>
      <div className="bg-muted relative block">
        <img
          src="/placeholder.svg"
          alt="Multi-Agent System - LangGraph with Tavily Integration"
          className="absolute inset-0 h-full w-full object-contain p-4 dark:brightness-[0.8] dark:grayscale"
          onError={(e) => {
            console.error('SVG failed to load:', e);
            e.currentTarget.style.display = 'none';
          }}
        />
        {/* Fallback content */}
        <div className="absolute inset-0 flex items-center justify-center p-8">
          <div className="text-center space-y-4 opacity-20">
            <div className="text-6xl">🤖</div>
            <h3 className="text-lg font-semibold text-muted-foreground">
              Multi-Agent Workflow System
            </h3>
            <p className="text-sm text-muted-foreground">
              Powered by LangGraph & Tavily
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}
