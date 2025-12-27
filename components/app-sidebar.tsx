"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarGroup,
  SidebarGroupLabel,
  SidebarGroupContent,
} from "@/components/ui/sidebar"
import {
  LayoutDashboard,
  GraduationCap,
  Users,
  FileText,
  UserSearch,
  ClipboardList,
  Archive,
  Building2,
  Briefcase,
  Database,
  Upload,
  Calendar,
  UsersRound,
} from "lucide-react"

export function AppSidebar() {
  const pathname = usePathname()

  const adminNavItems = [
    { name: "Dashboard", href: "/", icon: LayoutDashboard },
    { name: "Class Course", href: "/class-course", icon: GraduationCap },
    { name: "Client Engagements", href: "/client-engagements", icon: Briefcase },
    { name: "Student Progress", href: "/student-progress", icon: Users },
    { name: "Documents", href: "/documents", icon: FileText },
    { name: "My Clinic", href: "/my-clinic", icon: Building2 },
    { name: "Prospects", href: "/prospects", icon: UserSearch },
    { name: "Roster", href: "/roster", icon: ClipboardList },
    { name: "Archived", href: "/archived", icon: Archive },
  ]

  const adminToolsItems = [
    { name: "Schedule", href: "/admin/schedule", icon: Calendar },
    { name: "Stakeholders", href: "/admin/stakeholders", icon: UsersRound },
    { name: "Data Mapping", href: "/admin/data-mapping", icon: Database },
    { name: "Import Debriefs", href: "/admin/import-debriefs", icon: Upload },
  ]

  return (
    <Sidebar>
      <SidebarHeader className="border-b px-4 py-3">
        <Link href="/" className="flex items-center gap-2">
          <img src="/images/shin.png" alt="SHIN Logo" className="h-8 w-auto" />
          <span className="font-semibold text-sm">SHIN</span>
        </Link>
      </SidebarHeader>

      <SidebarContent>
        <SidebarGroup>
          <SidebarGroupLabel>Navigation</SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              {adminNavItems.map((item) => {
                const isActive = pathname === item.href || (item.href !== "/" && pathname.startsWith(item.href))
                return (
                  <SidebarMenuItem key={item.name}>
                    <SidebarMenuButton asChild isActive={isActive}>
                      <Link href={item.href}>
                        <item.icon className="h-4 w-4" />
                        <span>{item.name}</span>
                      </Link>
                    </SidebarMenuButton>
                  </SidebarMenuItem>
                )
              })}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>

        <SidebarGroup>
          <SidebarGroupLabel>Admin Tools</SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              {adminToolsItems.map((item) => {
                const isActive = pathname === item.href || pathname.startsWith(item.href)
                return (
                  <SidebarMenuItem key={item.name}>
                    <SidebarMenuButton asChild isActive={isActive}>
                      <Link href={item.href}>
                        <item.icon className="h-4 w-4" />
                        <span>{item.name}</span>
                      </Link>
                    </SidebarMenuButton>
                  </SidebarMenuItem>
                )
              })}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>

      <SidebarFooter className="border-t p-4">
        <div className="text-xs text-muted-foreground">SEED Hub & Information Nexus</div>
      </SidebarFooter>
    </Sidebar>
  )
}
