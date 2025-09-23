"use client";

import React from "react";
import { useUIStore } from "@/store/ui";
import { Sheet, SheetContent, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { Button } from "@/components/ui/button";

export default function SearchDrawer() {
  const isOpen = useUIStore((s) => s.isSearchOpen);
  const close = useUIStore((s) => s.closeSearch);
  const [q, setQ] = React.useState("");

  function submit() {
    const url = new URL(window.location.origin + "/catalog");
    if (q.trim()) url.searchParams.set("q", q.trim());
    window.location.href = url.toString();
    close();
  }

  return (
    <Sheet open={isOpen} onOpenChange={(v) => (v ? null : close())}>
      <SheetContent side="top" className="h-auto bg-white text-foreground border-b border-border">
        <SheetHeader>
          <SheetTitle>Search</SheetTitle>
        </SheetHeader>
        <div className="py-4 px-2 sm:px-4 flex items-center gap-2">
          <input
            autoFocus
            value={q}
            onChange={(e) => setQ(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter") submit();
            }}
            placeholder="Search products"
            aria-label="Search products"
            className="flex-1 border border-border rounded-md px-3 py-2"
          />
          <Button onClick={submit}>Go</Button>
        </div>
      </SheetContent>
    </Sheet>
  );
}
