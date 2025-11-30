"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { clearSupabaseStorage } from "@/lib/auth-utils";

/**
 * Client-side session validator
 * Checks if the current session is valid and clears stale data
 */
export default function SessionValidator({ userId }: { userId: string }) {
  const router = useRouter();

  useEffect(() => {
    const validateSession = async () => {
      const supabase = createClient();
      
      try {
        const { data: { user }, error } = await supabase.auth.getUser();
        
        // If no user or error, or user ID doesn't match, clear and logout
        if (error || !user || user.id !== userId) {
          console.warn("Session mismatch detected, clearing...");
          clearSupabaseStorage();
          router.push("/login");
        }
      } catch (error) {
        console.error("Session validation error:", error);
        clearSupabaseStorage();
        router.push("/login");
      }
    };

    validateSession();

    // Set up auth state change listener
    const supabase = createClient();
    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      if (event === "SIGNED_OUT" || !session) {
        clearSupabaseStorage();
        router.push("/login");
      } else if (session?.user?.id !== userId) {
        // User changed, clear and redirect
        console.warn("User changed, clearing session...");
        clearSupabaseStorage();
        router.push("/login");
      }
    });

    return () => {
      subscription.unsubscribe();
    };
  }, [userId, router]);

  return null;
}

