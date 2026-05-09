import { createClient } from "@supabase/supabase-js";

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;

// API route'larında kullanılan server-side client
export function createServerClient() {
  return createClient(supabaseUrl, supabaseKey);
}
