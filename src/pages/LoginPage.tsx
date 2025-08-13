import { Brain, Users, Search, FileText } from 'lucide-react';
import { LoginForm } from '@/components/login-form';
import { ModeToggle } from '@/components/mode-toggle';

export default function LoginPage() {
  return (
    <div className="grid min-h-svh lg:grid-cols-2">
      <div className="flex flex-col gap-4 p-6 md:p-10">
        <div className="flex justify-between items-center">
          <div className="flex justify-center gap-2 md:justify-start">
            <a href="#" className="flex items-center gap-2 font-medium">
              <div className="bg-primary text-primary-foreground flex size-8 items-center justify-center rounded-lg">
                <Brain className="size-5" />
              </div>
              <span className="text-lg font-semibold">Multi-Agent Research</span>
            </a>
          </div>
          <ModeToggle />
        </div>
        <div className="flex flex-1 items-center justify-center">
          <div className="w-full max-w-xs">
            <LoginForm />
          </div>
        </div>
      </div>
      <div className="bg-gradient-to-br from-blue-50 to-indigo-100 dark:from-blue-950 dark:to-indigo-950 relative hidden lg:block">
        <div className="absolute inset-0 flex items-center justify-center">
          <div className="text-center space-y-8 p-8">
            <div className="space-y-4">
              <h2 className="text-3xl font-bold text-gray-900 dark:text-white">
                Intelligent Research Platform
              </h2>
              <p className="text-lg text-gray-600 dark:text-gray-300 max-w-md">
                Powered by multi-agent collaboration, LangGraph workflows, and real-time web intelligence
              </p>
            </div>
            
            <div className="grid grid-cols-2 gap-6 max-w-sm mx-auto">
              <div className="flex flex-col items-center space-y-2 p-4 bg-white/20 dark:bg-black/20 rounded-lg backdrop-blur-sm">
                <Search className="h-8 w-8 text-blue-600 dark:text-blue-400" />
                <span className="text-sm font-medium text-gray-700 dark:text-gray-300">Research</span>
              </div>
              <div className="flex flex-col items-center space-y-2 p-4 bg-white/20 dark:bg-black/20 rounded-lg backdrop-blur-sm">
                <Brain className="h-8 w-8 text-purple-600 dark:text-purple-400" />
                <span className="text-sm font-medium text-gray-700 dark:text-gray-300">Analysis</span>
              </div>
              <div className="flex flex-col items-center space-y-2 p-4 bg-white/20 dark:bg-black/20 rounded-lg backdrop-blur-sm">
                <FileText className="h-8 w-8 text-green-600 dark:text-green-400" />
                <span className="text-sm font-medium text-gray-700 dark:text-gray-300">Reports</span>
              </div>
              <div className="flex flex-col items-center space-y-2 p-4 bg-white/20 dark:bg-black/20 rounded-lg backdrop-blur-sm">
                <Users className="h-8 w-8 text-orange-600 dark:text-orange-400" />
                <span className="text-sm font-medium text-gray-700 dark:text-gray-300">Collaboration</span>
              </div>
            </div>
            
            <div className="text-sm text-gray-500 dark:text-gray-400">
              Tavily API • LangGraph • OpenAI • MongoDB
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
