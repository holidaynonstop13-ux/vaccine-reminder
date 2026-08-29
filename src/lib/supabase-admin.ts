import "server-only";
import { createClient } from "@supabase/supabase-js";

// This client uses the service_role / secret key and can bypass
// row-level security. NEVER import this file from a page or
// component that runs in the browser — server code only
// (API routes, cron jobs, server actions).
export const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);
