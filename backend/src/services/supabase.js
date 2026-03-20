const { createClient } = require("@supabase/supabase-js");
const { supabaseUrl, supabaseAnonKey, supabaseServiceRoleKey } = require("../config");

// Admin client uses the service_role key — bypasses RLS.
// Use ONLY for privileged server-side operations (bets, wallet, moderation).
// NEVER expose this key to the frontend.
const adminClient = createClient(supabaseUrl, supabaseServiceRoleKey, {
  auth: { persistSession: false, autoRefreshToken: false },
});

// Auth client uses the anon key — used ONLY to verify incoming user JWTs.
const authClient = createClient(supabaseUrl, supabaseAnonKey, {
  auth: { persistSession: false, autoRefreshToken: false },
});

module.exports = { adminClient, authClient };
