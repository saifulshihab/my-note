"use client";

import {
  BookOpen,
  Hash,
  Star,
  Trash2,
  Plus,
  NotebookPen,
  Search
} from "lucide-react";
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarGroup,
  SidebarGroupAction,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem
} from "@/components/ui/sidebar";
import { Button } from "@/components/ui/button";
import { ThemeToggle } from "@/components/theme-toggle";

const notebooks = [
  { name: "Daily notes", count: 12 },
  { name: "Runbooks", count: 5 },
  { name: "Snippets", count: 23 }
];

const tags = ["typescript", "postgres", "kubernetes", "debugging"];

export function AppSidebar({ onSearch }: { onSearch?: () => void }) {
  return (
    <Sidebar>
      <SidebarHeader>
        <div className="flex items-center gap-2 px-2 py-1">
          <NotebookPen className="size-5" />
          <span className="text-sm font-semibold">DevNotes</span>
        </div>
        <Button
          variant="outline"
          size="sm"
          className="text-muted-foreground justify-start gap-2"
          onClick={onSearch}
        >
          <Search className="size-4" />
          Search…
          <kbd className="bg-muted ml-auto rounded px-1.5 text-xs">⌘K</kbd>
        </Button>
      </SidebarHeader>

      <SidebarContent>
        <SidebarGroup>
          <SidebarGroupContent>
            <SidebarMenu>
              <SidebarMenuItem>
                <SidebarMenuButton>
                  <Star className="size-4" /> Favorites
                </SidebarMenuButton>
              </SidebarMenuItem>
              <SidebarMenuItem>
                <SidebarMenuButton>
                  <Trash2 className="size-4" /> Trash
                </SidebarMenuButton>
              </SidebarMenuItem>
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>

        <SidebarGroup>
          <SidebarGroupLabel>Notebooks</SidebarGroupLabel>
          <SidebarGroupAction title="New notebook">
            <Plus /> <span className="sr-only">New notebook</span>
          </SidebarGroupAction>
          <SidebarGroupContent>
            <SidebarMenu>
              {notebooks.map((nb) => (
                <SidebarMenuItem key={nb.name}>
                  <SidebarMenuButton>
                    <BookOpen className="size-4" /> {nb.name}
                    <span className="text-muted-foreground ml-auto text-xs">
                      {nb.count}
                    </span>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              ))}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>

        <SidebarGroup>
          <SidebarGroupLabel>Tags</SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              {tags.map((tag) => (
                <SidebarMenuItem key={tag}>
                  <SidebarMenuButton>
                    <Hash className="size-4" /> {tag}
                  </SidebarMenuButton>
                </SidebarMenuItem>
              ))}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>

      <SidebarFooter>
        <ThemeToggle />
      </SidebarFooter>
    </Sidebar>
  );
}
