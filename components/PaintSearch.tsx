"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { Plus } from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { PaintSwatch } from "@/components/PaintSwatch";

type CatalogPaint = {
  id: string;
  brand: string;
  name: string;
  hex: string | null;
  range: string | null;
};

type Props = {
  /** Called when the user clicks "Add" on a search result. */
  onAdd: (paintId: string) => void;
  /** Optional set of already-owned catalog_paint_ids to mark as "In inventory". */
  ownedIds?: Set<string>;
};

/** Trim whitespace from a query string. */
function sanitize(q: string): string {
  return q.trim();
}

/**
 * Debounced paint catalog search with inline add buttons.
 * Queries the public `paints` table directly from the browser (public-read RLS).
 */
export function PaintSearch({ onAdd, ownedIds }: Props) {
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<CatalogPaint[]>([]);
  const [loading, setLoading] = useState(false);
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const search = useCallback(async (q: string) => {
    const safe = sanitize(q);
    if (!safe) {
      setResults([]);
      return;
    }
    setLoading(true);
    try {
      const supabase = createClient();
      const { data } = await supabase.rpc("search_paints", {
        search_query: safe,
        result_limit: 20,
      });
      setResults((data as CatalogPaint[]) ?? []);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (timerRef.current) clearTimeout(timerRef.current);
    timerRef.current = setTimeout(() => {
      void search(query);
    }, 300);
    return () => {
      if (timerRef.current) clearTimeout(timerRef.current);
    };
  }, [query, search]);

  return (
    <div className="space-y-2">
      <Input
        placeholder="Search paints by name or brand…"
        value={query}
        onChange={(e) => setQuery(e.target.value)}
        aria-label="Search paint catalog"
      />
      {loading && <p className="text-sm text-muted-foreground px-1">Searching…</p>}
      {!loading && results.length > 0 && (
        <ul className="border border-border rounded-md divide-y divide-border">
          {results.map((paint) => {
            const alreadyOwned = ownedIds?.has(paint.id) ?? false;
            return (
              <li
                key={paint.id}
                className="flex items-center gap-3 px-3 py-2 text-sm hover:bg-muted/60"
              >
                <PaintSwatch hex={paint.hex} size="sm" />
                <span className="flex-1 min-w-0">
                  <span className="font-medium truncate block">{paint.name}</span>
                  <span className="text-muted-foreground text-xs">
                    {paint.brand}
                    {paint.range ? ` · ${paint.range}` : ""}
                  </span>
                </span>
                <Button
                  size="sm"
                  variant={alreadyOwned ? "secondary" : "default"}
                  onClick={() => onAdd(paint.id)}
                  aria-label={`Add ${paint.name} to inventory`}
                >
                  <Plus className="h-3 w-3" />
                  {alreadyOwned ? "Add another" : "Add"}
                </Button>
              </li>
            );
          })}
        </ul>
      )}
      {!loading && query.length > 0 && sanitize(query).length > 0 && results.length === 0 && (
        <p className="text-sm text-muted-foreground px-1">No paints found.</p>
      )}
    </div>
  );
}
