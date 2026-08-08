const warnedSources = new Set<string>();

function getProjectRefFromSupabaseUrl(supabaseUrl: string): string | null {
  try {
    const hostname = new URL(supabaseUrl).hostname;
    const firstLabel = hostname.split(".")[0];
    return firstLabel || null;
  } catch {
    return null;
  }
}

export function warnIfSupabaseProjectMismatch({
  source,
  supabaseUrl,
  expectedProjectRef,
}: {
  source: string;
  supabaseUrl: string;
  expectedProjectRef?: string;
}) {
  if (!expectedProjectRef || warnedSources.has(source)) return;

  const actualProjectRef = getProjectRefFromSupabaseUrl(supabaseUrl);
  if (!actualProjectRef) return;

  if (actualProjectRef !== expectedProjectRef) {
    warnedSources.add(source);
    console.warn(
      `[Supabase] Project mismatch in ${source}: URL points to "${actualProjectRef}" but EXPECTED_SUPABASE_PROJECT_ID is "${expectedProjectRef}". Auth emails may be sent from the wrong SMTP sender.`,
    );
  }
}
