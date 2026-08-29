import { createClient } from "@supabase/supabase-js";

// This client is safe to use in the browser (LIFF page, forms, etc).
// It only has the permissions granted to the "anon" role in Supabase.
export const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);
