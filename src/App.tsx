import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { ThemeProvider } from "@/components/theme-provider"
import { AuthProvider } from "@/contexts/AuthContext"
import { SidebarProvider } from "@/components/ui/sidebar"
import { AppSidebar } from "@/components/app-sidebar"
import { SidebarInset, SidebarTrigger } from "@/components/ui/sidebar"
import { Separator } from "@/components/ui/separator"
import { Breadcrumb, BreadcrumbItem, BreadcrumbLink, BreadcrumbList, BreadcrumbPage, BreadcrumbSeparator } from "@/components/ui/breadcrumb"
import { ModeToggle } from "@/components/mode-toggle"
import ProtectedRoute from "@/components/ProtectedRoute"
import LoginPage from "@/pages/LoginPage"
import SignupPage from "@/pages/SignupPage"
import { DashboardPage } from "@/features/dashboard"
import ProfilePage from "@/pages/ProfilePage"
import { TemplateCreationPage, TemplateExecutionPage, TemplateListPage, TemplateDetailPage } from "@/features/langgraph-templates"
import { ExecutionHistoryPage, ExecutionDetailPage } from "@/features/execution-history"

// Create a client
const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 1000 * 60 * 5, // 5 minutes
      retry: 0, // Disable React Query retries - let API client handle retries
    },
  },
})

// Layout component for protected routes with sidebar
function DashboardLayout({ children, title = "Dashboard" }: { children: React.ReactNode; title?: string }) {
  return (
    <SidebarProvider defaultOpen={false}>
      <AppSidebar />
      <SidebarInset>
        <header className="flex h-16 shrink-0 items-center justify-between gap-2 transition-[width,height] ease-linear group-has-[[data-collapsible=icon]]/sidebar-wrapper:h-12">
          <div className="flex items-center gap-2 px-4">
            <SidebarTrigger className="-ml-1" />
            <Separator orientation="vertical" className="mr-2 h-4" />
            <Breadcrumb>
              <BreadcrumbList>
                <BreadcrumbItem className="hidden md:block">
                  <BreadcrumbLink href="#">
                    Multi-Agent System
                  </BreadcrumbLink>
                </BreadcrumbItem>
                <BreadcrumbSeparator className="hidden md:block" />
                <BreadcrumbItem>
                  <BreadcrumbPage>{title}</BreadcrumbPage>
                </BreadcrumbItem>
              </BreadcrumbList>
            </Breadcrumb>
          </div>
          <div className="px-4">
            <ModeToggle />
          </div>
        </header>
        <div className="flex flex-1 flex-col gap-4 p-4 pt-0">
          {children}
        </div>
      </SidebarInset>
    </SidebarProvider>
  )
}

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <ThemeProvider defaultTheme="light" storageKey="vite-ui-theme">
        <AuthProvider>
          <BrowserRouter>
            <Routes>
              {/* Public routes */}
              <Route path="/login" element={<LoginPage />} />
              <Route path="/signup" element={<SignupPage />} />
              
              {/* Protected routes with sidebar layout */}
              <Route 
                path="/dashboard" 
                element={
                  <ProtectedRoute>
                    <DashboardLayout title="Dashboard">
                      <DashboardPage />
                    </DashboardLayout>
                  </ProtectedRoute>
                } 
              />
              
              {/* LangGraph Templates routes */}
              <Route
                path="/templates"
                element={
                  <ProtectedRoute>
                    <DashboardLayout title="Templates">
                      <TemplateListPage />
                    </DashboardLayout>
                  </ProtectedRoute>
                }
              />
              
              <Route
                path="/templates/create"
                element={
                  <ProtectedRoute>
                    <DashboardLayout title="Create Template">
                      <TemplateCreationPage />
                    </DashboardLayout>
                  </ProtectedRoute>
                }
              />
              
              <Route
                path="/templates/execute"
                element={
                  <ProtectedRoute>
                    <DashboardLayout title="Execute Template">
                      <TemplateExecutionPage />
                    </DashboardLayout>
                  </ProtectedRoute>
                }
              />
              
              <Route
                path="/templates/:templateId"
                element={
                  <ProtectedRoute>
                    <DashboardLayout title="Template Details">
                      <TemplateDetailPage />
                    </DashboardLayout>
                  </ProtectedRoute>
                }
              />
              
              {/* Execution History routes */}
              <Route
                path="/execution-history"
                element={
                  <ProtectedRoute>
                    <DashboardLayout title="Execution History">
                      <ExecutionHistoryPage />
                    </DashboardLayout>
                  </ProtectedRoute>
                }
              />
              
              <Route
                path="/execution-history/:executionId"
                element={
                  <ProtectedRoute>
                    <DashboardLayout title="Execution Details">
                      <ExecutionDetailPage />
                    </DashboardLayout>
                  </ProtectedRoute>
                }
              />
              
              {/* Profile route */}
              <Route
                path="/profile"
                element={
                  <ProtectedRoute>
                    <DashboardLayout title="Profile">
                      <ProfilePage />
                    </DashboardLayout>
                  </ProtectedRoute>
                }
              />
              
              {/* Default redirect to dashboard for authenticated users, login for unauthenticated */}
              <Route path="/" element={<Navigate to="/dashboard" replace />} />
              
              {/* Catch all route */}
              <Route path="*" element={<Navigate to="/dashboard" replace />} />
            </Routes>
          </BrowserRouter>
        </AuthProvider>
      </ThemeProvider>
    </QueryClientProvider>
  )
}

export default App
