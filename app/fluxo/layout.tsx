import type React from "react"
import { SidebarProvider } from "@/components/ui/sidebar"
import { AppSidebar } from "@/components/app-sidebar"
import { MobileBottomNav } from "@/components/mobile-bottom-nav"

export default function FluxoLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <SidebarProvider defaultOpen={true}>
      <div className="flex min-h-screen w-full">
        <AppSidebar />
        <main className="flex-1 flex flex-col">
          <div className="flex-1">{children}</div>
        </main>
      </div>
      <MobileBottomNav />
    </SidebarProvider>
  )
}

