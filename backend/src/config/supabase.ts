/**
 * The Supabase server key. Supabase's current dashboard calls it the "secret key" (sb_secret_...) and older
 * projects call it the "service_role key" (a long JWT). Either works here, under either variable name.
 * It is a server secret: it must never reach the frontend.
 */
export const supabaseSecretKey = () => (process.env.SUPABASE_SECRET_KEY || process.env.SUPABASE_SERVICE_ROLE_KEY || '').trim();

export const supabaseConfigured = () => !!(process.env.SUPABASE_URL?.trim() && supabaseSecretKey());
