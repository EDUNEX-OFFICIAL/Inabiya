/** Public journal URL + public REST prefix (`/api/v1/blog`). */

export function articleCanonicalPath(slug: string): string {
  return `/blog/${slug}`;
}
