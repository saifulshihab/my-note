import { SidebarTrigger } from "@/components/ui/sidebar";
import { Separator } from "@/components/ui/separator";
import { ScrollArea } from "@/components/ui/scroll-area";

const notes = [
  {
    id: "1",
    title: "Postgres connection pooling notes",
    preview: "PgBouncer in transaction mode; watch prepared statements…",
    updated: "2h ago",
    tags: ["postgres"]
  },
  {
    id: "2",
    title: "Kubernetes debugging cheatsheet",
    preview: "kubectl debug, ephemeral containers, crashloop triage…",
    updated: "Yesterday",
    tags: ["kubernetes", "debugging"]
  },
  {
    id: "3",
    title: "TypeScript generics — variance",
    preview: "Covariance vs contravariance in function params…",
    updated: "3d ago",
    tags: ["typescript"]
  }
];

export default function NotesPage() {
  return (
    <div className="flex h-svh">
      {/* Pane 2 — note list */}
      <div className="flex w-80 shrink-0 flex-col border-r">
        <header className="flex h-12 items-center gap-2 border-b px-3">
          <SidebarTrigger />
          <Separator orientation="vertical" className="h-4" />
          <span className="text-sm font-medium">All notes</span>
          <span className="text-muted-foreground ml-auto text-xs">
            {notes.length}
          </span>
        </header>
        <ScrollArea className="flex-1">
          <ul className="p-2">
            {notes.map((note) => (
              <li key={note.id}>
                <button className="hover:bg-accent w-full rounded-md p-3 text-left transition-colors">
                  <div className="truncate text-sm font-medium">
                    {note.title}
                  </div>
                  <div className="text-muted-foreground mt-1 line-clamp-2 text-xs">
                    {note.preview}
                  </div>
                  <div className="text-muted-foreground mt-2 flex items-center gap-2 text-[11px]">
                    <span>{note.updated}</span>
                    {note.tags.map((t) => (
                      <span key={t} className="bg-muted rounded px-1.5 py-0.5">
                        #{t}
                      </span>
                    ))}
                  </div>
                </button>
              </li>
            ))}
          </ul>
        </ScrollArea>
      </div>

      {/* Pane 3 — editor / preview */}
      <div className="flex flex-1 flex-col">
        <header className="flex h-12 items-center gap-2 border-b px-4">
          <span className="text-sm font-medium">
            Postgres connection pooling notes
          </span>
          <span className="text-muted-foreground ml-auto text-xs">
            ✓ saved · v23
          </span>
        </header>
        <div className="mx-auto w-full max-w-3xl flex-1 p-8">
          <h1 className="text-2xl font-bold">Postgres connection pooling</h1>
          <p className="text-muted-foreground mt-4 text-sm leading-relaxed">
            Editor placeholder. The TipTap + CodeMirror 6 + Yjs editor lands in
            the Core Notes / Realtime tracks (see docs/SYSTEM_DESIGN.md §7.1).
          </p>
          <pre className="bg-muted mt-6 overflow-x-auto rounded-lg p-4 text-sm">
            <code>{`-- transaction pooling
pgbouncer:
  pool_mode: transaction
  max_client_conn: 1000
  default_pool_size: 20`}</code>
          </pre>
        </div>
      </div>
    </div>
  );
}
