"use client";

import Link from "next/link";
import { motion } from "framer-motion";
import { cn } from "@/lib/utils";
import { SpotlightCard } from "@/components/motion/SpotlightCard";

export interface CategoryNavItem {
  id: string;
  name: string;
  count: number;
}

/**
 * Bento-style quick-nav: one tile per category, jump-linking to that
 * category's section further down the page. Tile size communicates
 * importance — whichever category has the most dishes spans two columns —
 * without reordering categories away from their `sort_order`.
 */
export function CategoryNav({ categories }: { categories: CategoryNavItem[] }) {
  if (categories.length === 0) return null;

  const maxCount = Math.max(...categories.map((c) => c.count));

  return (
    <nav aria-label="Menu categories" className="mb-8 grid grid-cols-2 gap-3 sm:grid-cols-4">
      {categories.map((category, i) => {
        const isFeatured = maxCount > 0 && category.count === maxCount;
        return (
          <motion.div
            key={category.id}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4, delay: Math.min(i * 0.06, 0.4), ease: [0.16, 1, 0.3, 1] }}
            className={cn(isFeatured && "col-span-2")}
          >
            <Link href={`#category-${category.id}`} className="block no-underline">
              <SpotlightCard className="text-center transition-colors hover:border-accent">
                <p className="text-sm font-semibold text-fg">{category.name}</p>
                <p className="text-caption text-muted">
                  {category.count} item{category.count === 1 ? "" : "s"}
                </p>
              </SpotlightCard>
            </Link>
          </motion.div>
        );
      })}
    </nav>
  );
}
