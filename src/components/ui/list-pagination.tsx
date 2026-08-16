"use client";

import { cn } from "@/lib/utils";
import {
  ChevronFirst,
  ChevronLast,
  ChevronLeft,
  ChevronRight,
} from "lucide-react";

type ListPaginationProps = {
  page: number;
  totalPages: number;
  onPageChange: (page: number) => void;
  className?: string;
};

function pageWindow(current: number, total: number, size = 5) {
  if (total <= size) {
    return Array.from({ length: total }, (_, i) => i + 1);
  }
  let start = Math.max(1, current - Math.floor(size / 2));
  let end = start + size - 1;
  if (end > total) {
    end = total;
    start = Math.max(1, end - size + 1);
  }
  return Array.from({ length: end - start + 1 }, (_, i) => start + i);
}

export function ListPagination({
  page,
  totalPages,
  onPageChange,
  className,
}: ListPaginationProps) {
  if (totalPages <= 1) return null;

  const pages = pageWindow(page, totalPages);
  const go = (p: number) => onPageChange(Math.min(totalPages, Math.max(1, p)));

  const btn =
    "inline-flex h-8 min-w-8 items-center justify-center rounded-lg border border-[var(--border)] bg-black/20 px-2 text-sm text-[var(--muted)] transition hover:border-[var(--accent)]/40 hover:text-[var(--foreground)] disabled:pointer-events-none disabled:opacity-35";

  return (
    <nav
      aria-label="Sayfalama"
      className={cn("mt-4 flex flex-wrap items-center justify-center gap-1.5", className)}
    >
      <button
        type="button"
        className={btn}
        aria-label="İlk sayfa"
        disabled={page <= 1}
        onClick={() => go(1)}
      >
        <ChevronFirst className="h-4 w-4" />
      </button>
      <button
        type="button"
        className={btn}
        aria-label="Önceki sayfa"
        disabled={page <= 1}
        onClick={() => go(page - 1)}
      >
        <ChevronLeft className="h-4 w-4" />
      </button>

      {pages.map((p) => (
        <button
          key={p}
          type="button"
          aria-label={`Sayfa ${p}`}
          aria-current={p === page ? "page" : undefined}
          className={cn(
            btn,
            p === page &&
              "border-[var(--accent)]/50 bg-[var(--accent)]/15 font-semibold text-[var(--foreground)]",
          )}
          onClick={() => go(p)}
        >
          {p}
        </button>
      ))}

      <button
        type="button"
        className={btn}
        aria-label="Sonraki sayfa"
        disabled={page >= totalPages}
        onClick={() => go(page + 1)}
      >
        <ChevronRight className="h-4 w-4" />
      </button>
      <button
        type="button"
        className={btn}
        aria-label="Son sayfa"
        disabled={page >= totalPages}
        onClick={() => go(totalPages)}
      >
        <ChevronLast className="h-4 w-4" />
      </button>
    </nav>
  );
}

export function usePagedSlice<T>(items: T[], page: number, pageSize: number) {
  const totalPages = Math.max(1, Math.ceil(items.length / pageSize));
  const safePage = Math.min(page, totalPages);
  const start = (safePage - 1) * pageSize;
  return {
    pageItems: items.slice(start, start + pageSize),
    totalPages,
    page: safePage,
  };
}
