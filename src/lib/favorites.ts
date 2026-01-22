// Favorites/Bookmarks utility for saving churches to localStorage

const STORAGE_KEY = 'psalmlog_favorites';

// Church data needed to render a ChurchCard without database fetch
export interface FavoriteChurch {
  id: string;
  slug: string;
  name: string;
  city: string;
  stateAbbr: string;
  stateSlug: string;
  citySlug: string;
}

// Check if we're in a browser environment
function isBrowser(): boolean {
  return typeof window !== 'undefined';
}

// Get all saved favorites from localStorage
export function getFavorites(): FavoriteChurch[] {
  if (!isBrowser()) return [];

  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (!stored) return [];
    const parsed = JSON.parse(stored);
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

// Save favorites to localStorage
function saveFavorites(favorites: FavoriteChurch[]): void {
  if (!isBrowser()) return;

  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(favorites));
  } catch {
    // localStorage might be full or disabled
  }
}

// Add a church to favorites
export function addFavorite(church: FavoriteChurch): void {
  if (!isBrowser()) return;

  const favorites = getFavorites();
  // Don't add duplicates
  if (favorites.some((f) => f.id === church.id)) return;

  favorites.push(church);
  saveFavorites(favorites);
}

// Remove a church from favorites by ID
export function removeFavorite(churchId: string): void {
  if (!isBrowser()) return;

  const favorites = getFavorites();
  const filtered = favorites.filter((f) => f.id !== churchId);
  saveFavorites(filtered);
}

// Check if a church is in favorites
export function isFavorite(churchId: string): boolean {
  if (!isBrowser()) return false;

  const favorites = getFavorites();
  return favorites.some((f) => f.id === churchId);
}

// Toggle a church's favorite status
export function toggleFavorite(church: FavoriteChurch): boolean {
  if (!isBrowser()) return false;

  if (isFavorite(church.id)) {
    removeFavorite(church.id);
    return false;
  } else {
    addFavorite(church);
    return true;
  }
}

// Get the count of saved churches
export function getFavoritesCount(): number {
  if (!isBrowser()) return 0;

  return getFavorites().length;
}

// Clear all favorites
export function clearFavorites(): void {
  if (!isBrowser()) return;

  try {
    localStorage.removeItem(STORAGE_KEY);
  } catch {
    // localStorage might be disabled
  }
}
