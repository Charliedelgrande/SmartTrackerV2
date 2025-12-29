import { Toaster as Sonner, type ToasterProps } from "sonner"

export function Toaster(props: ToasterProps) {
  return (
    <Sonner
      theme="dark"
      toastOptions={{
        classNames: {
          toast:
            "bg-card text-card-foreground border border-border shadow-lg rounded-xl",
          title: "text-sm font-medium",
          description: "text-xs text-muted-foreground",
          actionButton:
            "bg-[hsl(var(--accent))] text-zinc-950 rounded-lg px-3 py-2 text-sm",
          cancelButton:
            "bg-muted text-foreground rounded-lg px-3 py-2 text-sm",
        },
      }}
      {...props}
    />
  )
}


