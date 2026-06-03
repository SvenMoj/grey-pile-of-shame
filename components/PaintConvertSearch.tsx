"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import Link from "next/link";
import { createClient } from "@/lib/supabase/client";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { PaintSwatch } from "@/components/PaintSwatch";

type CatalogPaint = {
  id: string;
  brand: string;
  name: string;
  hex: string | null;
  range: string | null;
};

function sanitize(q: string): string {
  return q.trim();
}

/**
 * Debounced paint catalog search for the /convert page.
 * Results link to /paint/[id] for per-paint conversion lookup.
 * Shows an "In inventory" badge for paints the logged-in user already owns
 * (RLS-scoped; silently empty when logged out).
 */
export function PaintConvertSearch() {
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<CatalogPaint[]>([]);
  const [loading, setLoading] = useState(false);
  const [ownedIds, setOwnedIds] = useState<Set<string>>(new Set());
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Load owned paint ids once on mount (RLS-scoped; empty when not logged in)
  useEffect(() => {
    const supabase = createClient();
    void supabase
      .from("user_paints")
      .select("catalog_paint_id")
      .then(({ data }) => {
        if (data) {
          setOwnedIds(
            new Set(
              (data as { catalog_paint_id: string | null }[])
                .map((r) => r.catalog_paint_id)
                .filter((id): id is string => id !== null),
            ),
          );
        }
      });
  }, []);

  const search = useCallback(async (q: string) => {
    const safe = sanitize(q);
    if (!safe) {
      setResults([]);
      return;
    }
    setLoading(true);
    try {
      const supabase = createClient();
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const { data, error } = await (supabase as any).rpc("search_paints", {
        search_query: safe,
        result_limit: 20,
      });
      if (error) {
        console.error("search_paints RPC error:", error);
        setResults([]);
      } else {
        setResults((data as CatalogPaint[]) ?? []);
      }
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
          {results.map((paint) => (
            <li key={paint.id}>
              <Link
                href={`/paint/${paint.id}`}
                className="flex items-center gap-3 px-3 py-2 text-sm hover:bg-muted/60 transition-colors"
              >
                <PaintSwatch hex={paint.hex} size="sm" />
                <span className="flex-1 min-w-0">
                  <span className="font-medium truncate block">{paint.name}</span>
                  <span className="text-muted-foreground text-xs">
                    {paint.brand}
                    {paint.range ? ` · ${paint.range}` : ""}
                  </span>
                </span>
                {ownedIds.has(paint.id) && (
                  <Badge variant="secondary" className="shrink-0 text-xs">
                    In inventory
                  </Badge>
                )}
              </Link>
            </li>
          ))}
        </ul>
      )}
      {!loading && query.length > 0 && sanitize(query).length > 0 && results.length === 0 && (
        <p className="text-sm text-muted-foreground px-1">No paints found.</p>
      )}
    </div>
  );
}
