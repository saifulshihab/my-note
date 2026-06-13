"use client";

import { SidebarInset, SidebarProvider } from "@/components/ui/sidebar";
import { AppSidebar } from "@/components/app-sidebar";
import { CommandPalette, useCommandPalette } from "@/components/command-palette";

export function AppShell({ children }: { children: React.ReactNode }) {
  const { open, setOpen } = useCommandPalette();

  return (
    <SidebarProvider>
      <AppSidebar onSearch={() => setOpen(true)} />
      <SidebarInset>{children}</SidebarInset>
      <CommandPalette open={open} onOpenChange={setOpen} />
    </SidebarProvider>
  );
}
