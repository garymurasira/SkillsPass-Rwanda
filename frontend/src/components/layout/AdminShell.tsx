import { Link, Outlet, useNavigate, useRouterState } from "@tanstack/react-router";
import { ListChecks, Flag, LogOut } from "lucide-react";
import {
  Sidebar, SidebarContent, SidebarGroup, SidebarGroupContent, SidebarGroupLabel, SidebarHeader,
  SidebarMenu, SidebarMenuButton, SidebarMenuItem, SidebarProvider, SidebarTrigger, SidebarFooter,
} from "@/components/ui/sidebar";
import { RequireRole, useAuth } from "@/lib/auth";
import { Logo } from "../Logo";

const items = [
  { to: "/admin", label: "Verification queue", icon: ListChecks, match: (p: string) => p === "/admin" || p.startsWith("/admin/rounds") },
  { to: "/admin/flagged", label: "Flagged skills", icon: Flag, match: (p: string) => p.startsWith("/admin/flagged") },
] as const;

export function AdminShell() {
  return (
    <RequireRole role="ADMIN">
      <AdminLayout />
    </RequireRole>
  );
}

function AdminLayout() {
  const path = useRouterState({ select: (r) => r.location.pathname });
  const { signOut } = useAuth();
  const navigate = useNavigate();
  return (
    <SidebarProvider>
      <div className="flex min-h-screen w-full">
        <Sidebar collapsible="icon">
          <SidebarHeader className="p-3"><span className="font-bold text-sidebar-foreground group-data-[collapsible=icon]:hidden">SkillsPass Staff</span></SidebarHeader>
          <SidebarContent>
            <SidebarGroup>
              <SidebarGroupLabel>Review</SidebarGroupLabel>
              <SidebarGroupContent>
                <SidebarMenu>
                  {items.map((i) => (
                    <SidebarMenuItem key={i.to}>
                      <SidebarMenuButton asChild isActive={i.match(path)} tooltip={i.label} className="h-11">
                        <Link to={i.to}><i.icon className="h-5 w-5" /><span>{i.label}</span></Link>
                      </SidebarMenuButton>
                    </SidebarMenuItem>
                  ))}
                </SidebarMenu>
              </SidebarGroupContent>
            </SidebarGroup>
          </SidebarContent>
          <SidebarFooter>
            <SidebarMenu><SidebarMenuItem>
              <SidebarMenuButton
                tooltip="Sign out"
                className="h-11"
                onClick={async () => { await signOut(); navigate({ to: "/admin/login", replace: true }); }}
              ><LogOut className="h-5 w-5" /><span>Sign out</span></SidebarMenuButton>
            </SidebarMenuItem></SidebarMenu>
          </SidebarFooter>
        </Sidebar>
        <div className="flex min-w-0 flex-1 flex-col">
          <header className="flex h-14 items-center gap-3 border-b px-3">
            <SidebarTrigger className="h-10 w-10" />
            <Logo />
          </header>
          <main className="min-w-0 flex-1 p-4 md:p-6"><Outlet /></main>
        </div>
      </div>
    </SidebarProvider>
  );
}
