/**
 * Helper to prepend GitHub Pages basePath in production for static assets (images, icons, etc.)
 * @param {string} path - Relative asset path (e.g. '/images/golden_tilak.svg')
 * @returns {string} Fully resolved path with basePath
 */
export function getAssetUrl(path) {
  if (!path) return '';
  if (path.startsWith('http://') || path.startsWith('https://') || path.startsWith('data:')) {
    return path;
  }
  const basePath = process.env.NEXT_PUBLIC_BASE_PATH || '';
  const cleanPath = path.startsWith('/') ? path : `/${path}`;
  return `${basePath}${cleanPath}`;
}
