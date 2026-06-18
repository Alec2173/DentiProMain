export function getInitials(name: string): string {
  if (!name) return '?';
  return name.split(/\s+/).filter(Boolean)
    .slice(0, 2)
    .map(w => w[0])
    .join('')
    .toUpperCase();
}
