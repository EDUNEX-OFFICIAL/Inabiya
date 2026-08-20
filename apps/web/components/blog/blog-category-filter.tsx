'use client';

import { useRouter } from 'next/navigation';
import { blogIndexPath } from '@/lib/blog-paths';

type Category = { slug: string; name: string };

type Props = {
  categories: Category[];
  currentCategory?: string;
  currentQuery?: string;
  currentTag?: string;
};

export function BlogCategoryFilter({
  categories,
  currentCategory,
  currentQuery,
  currentTag,
}: Props) {
  const router = useRouter();

  return (
    <label className="blog-category-filter">
      <span className="sr-only">Filter by category</span>
      <select
        className="blog-category-filter__select"
        value={currentCategory ?? ''}
        onChange={(e) => {
          const next = e.target.value || undefined;
          router.push(
            blogIndexPath({
              category: next,
              q: currentQuery || undefined,
              tag: currentTag || undefined,
            }),
          );
        }}
      >
        <option value="">All categories</option>
        {categories.map((c) => (
          <option key={c.slug} value={c.slug}>
            {c.name}
          </option>
        ))}
      </select>
    </label>
  );
}
