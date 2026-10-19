import { createClient, type SupabaseClient } from "@supabase/supabase-js";
import type { Database } from "./database.types";

let client: SupabaseClient<Database> | undefined;

export function getBrowserSupabase() {
  if (typeof window === "undefined") {
    throw new Error("The catalog client is only available in the browser.");
  }

  if (!client) {
    const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const key = process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY;

    if (!url || !key) {
      throw new Error("Supabase public environment variables are missing.");
    }

    client = createClient<Database>(url, key, {
      db: { retry: false, timeout: 15_000 },
      auth: { persistSession: false, autoRefreshToken: false, detectSessionInUrl: false },
    });
  }

  return client;
}
