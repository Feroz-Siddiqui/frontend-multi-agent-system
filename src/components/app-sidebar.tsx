import * as React from "react"
import {
  Brain,
  SquareTerminal,
  User,
  FileText,
  History,
} from "lucide-react"

import { NavMain } from "@/components/nav-main"
import { NavUser } from "@/components/nav-user"
import { useAuth } from "@/contexts/AuthContext"
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarHeader,
  SidebarRail,
} from "@/components/ui/sidebar"

// Navigation items
const navMain = [
  {
    title: "Dashboard",
    url: "/dashboard",
    icon: SquareTerminal,
    isActive: true,
  },
  {
    title: "Templates",
    url: "/templates",
    icon: FileText,
  },
  {
    title: "Execution History",
    url: "/execution-history",
    icon: History,
  },
  {
    title: "Profile",
    url: "/profile",
    icon: User,
  },
]

export function AppSidebar({ ...props }: React.ComponentProps<typeof Sidebar>) {
  const { user, isAuthenticated, isLoading } = useAuth()

  // Generate user data from auth context
  const userData = React.useMemo(() => {
    if (!user) {
      return {
        name: "Guest User",
        email: "guest@example.com",
        avatar: "/placeholder.svg",
      }
    }

    return {
      name: user.full_name || user.email || "User",
      email: user.email || "",
      avatar: "/placeholder.svg", // Could generate from initials later
    }
  }, [user])

  return (
    <Sidebar collapsible="icon" {...props}>
      <SidebarHeader>
        <div className="flex items-center gap-2  py-2">
          <div className="bg-primary text-primary-foreground flex aspect-square size-8 items-center justify-center rounded-lg">
            <Brain className="size-4" />
          </div>
          <div className="grid flex-1 text-left text-sm leading-tight">
            <span className="truncate font-medium">Multi-Agent Research</span>
            <span className="truncate text-xs text-muted-foreground">Enterprise</span>
          </div>
        </div>
      </SidebarHeader>
      <SidebarContent>
        <NavMain items={navMain} />
      </SidebarContent>
      <SidebarFooter>
        {isLoading ? (
          <div className="px-2 py-2 text-sm text-muted-foreground">
            Loading user...
          </div>
        ) : isAuthenticated && user ? (
          <NavUser user={userData} />
        ) : (
          <div className="px-2 py-2 text-sm text-muted-foreground">
            Not logged in
          </div>
        )}
      </SidebarFooter>
      <SidebarRail />
    </Sidebar>
  )
}
