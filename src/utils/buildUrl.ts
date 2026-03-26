export function buildUrl(path: string): string {
  const root = process.env.NEXT_PUBLIC_BASE_PATH || "";
  return `${root}${path}`;
}
