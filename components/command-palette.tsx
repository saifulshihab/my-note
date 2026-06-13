"use client";

import { useEffect, useState } from "react";
import { FileText, Plus, Search, Settings } from "lucide-react";
import {
  CommandDialog,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
  CommandSeparator
} from "@/components/ui/command";

// Mock data until the notes service is wired to the DB.
const recentNotes = [
  "Postgres connection pooling notes",
  "Kubernetes debugging cheatsheet",
  "TypeScript generics — variance",
  "Standup 2026-06-12"
];

export function CommandPalette({
  open,
  onOpenChange
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}) {
  return (
    <CommandDialog open={open} onOpenChange={onOpenChange}>
      <CommandInput placeholder="Search notes or run a command…" />
      <CommandList>
        <CommandEmpty>No results found.</CommandEmpty>
        <CommandGroup heading="Actions">
          <CommandItem>
            <Plus className="size-4" /> New note
          </CommandItem>
          <CommandItem>
            <Search className="size-4" /> Search everything
          </CommandItem>
          <CommandItem>
            <Settings className="size-4" /> Settings
          </CommandItem>
        </CommandGroup>
        <CommandSeparator />
        <CommandGroup heading="Recent">
          {recentNotes.map((note) => (
            <CommandItem key={note}>
              <FileText className="size-4" /> {note}
            </CommandItem>
          ))}
        </CommandGroup>
      </CommandList>
    </CommandDialog>
  );
}

export function useCommandPalette() {
  const [open, setOpen] = useState(false);

  useEffect(() => {
    const down = (e: KeyboardEvent) => {
      if (e.key === "k" && (e.metaKey || e.ctrlKey)) {
        e.preventDefault();
        setOpen((o) => !o);
      }
    };
    document.addEventListener("keydown", down);
    return () => document.removeEventListener("keydown", down);
  }, []);

  return { open, setOpen };
}
