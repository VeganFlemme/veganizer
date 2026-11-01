// Public Supabase settings only. The secret key (SUPABASE_SECRET_KEY) is
// reserved for the Python pipeline and must never be read by Next.js.
// Direct `process.env.NEXT_PUBLIC_*` access is required so Next.js can inline
// the values in the browser bundle.
export function getSupabasePublicEnv() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const publishableKey = process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY;
  if (!url || !publishableKey) {
    throw new Error(
      "Missing NEXT_PUBLIC_SUPABASE_URL or NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY",
    );
  }
  return { url, publishableKey };
}
