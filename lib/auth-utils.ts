/**
 * Clear all Supabase-related data from browser storage
 * This ensures no session data persists after logout
 */
export function clearSupabaseStorage() {
  if (typeof window === 'undefined') return;
  
  // Clear localStorage
  const localStorageKeys = Object.keys(localStorage);
  localStorageKeys.forEach((key) => {
    if (key.startsWith('sb-') || key.includes('supabase')) {
      localStorage.removeItem(key);
    }
  });
  
  // Clear sessionStorage
  const sessionStorageKeys = Object.keys(sessionStorage);
  sessionStorageKeys.forEach((key) => {
    if (key.startsWith('sb-') || key.includes('supabase')) {
      sessionStorage.removeItem(key);
    }
  });
}

/**
 * Force logout and clear all session data
 */
export async function forceLogout() {
  clearSupabaseStorage();
  
  // Redirect to logout route which clears server-side cookies
  window.location.href = '/auth/logout';
}

