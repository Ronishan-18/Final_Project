/**
 * Resolves an image path to a full URL.
 * Handles both absolute URLs (e.g. from Google Auth or already absolute paths)
 * and relative paths (e.g. /uploads/...).
 */
export const getImageUrl = (path: string | null | undefined): string => {
  if (!path) return '';
  
  // If it's already a full URL, return as is
  if (path.startsWith('http://') || path.startsWith('https://')) {
    return path;
  }
  
  // Base URL for the backend
  const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000';
  
  // Ensure the relative path starts with a slash
  const cleanPath = path.startsWith('/') ? path : `/${path}`;
  
  return `${API_URL}${cleanPath}`;
};
