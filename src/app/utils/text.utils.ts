export function getInitials(name: string): string {
  if (!name) return '?';
  return name.split(/\s+/).filter(Boolean)
    .slice(0, 2)
    .map(w => w[0])
    .join('')
    .toUpperCase();
}

/**
 * Transformă un URL Cloudinary pentru a aplica optimizări automate:
 * - f_auto: format optim (WebP/AVIF dacă browserul suportă)
 * - q_auto: compresie automată
 * - c_fill,g_auto: crop inteligent la dimensiunile exacte de randare
 * - w_/h_: dimensiunile cardului (×2 pentru ecrane Retina)
 *
 * Dacă URL-ul nu e Cloudinary, îl returnează neschimbat.
 */
export function cloudinaryCard(url: string, w = 236, h = 260): string {
  if (!url) return '';
  const match = url.match(/^(https:\/\/res\.cloudinary\.com\/[^/]+\/image\/upload\/)(.+)$/);
  if (!match) return url;
  return `${match[1]}f_auto,q_auto,c_fill,g_auto,w_${w},h_${h}/${match[2]}`;
}

export function cloudinaryLogo(url: string, size = 80): string {
  if (!url) return '';
  const match = url.match(/^(https:\/\/res\.cloudinary\.com\/[^/]+\/image\/upload\/)(.+)$/);
  if (!match) return url;
  return `${match[1]}f_auto,q_auto,c_fill,w_${size},h_${size}/${match[2]}`;
}
