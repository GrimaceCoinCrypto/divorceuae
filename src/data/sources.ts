// Registry of official and reputable sources cited across the site.
// Every URL here was checked by hand (status code AND page title/content) before
// being added. Never paste a source URL into a page: add it here first, then let
// the trigger rules below attach it to the guides that name the law or topic.

export interface Source {
  title: string;
  titleAr?: string;
  publisher: string;
  publisherAr?: string;
  url: string;
  urlAr?: string;
}

export const SOURCES: Record<string, Source> = {
  // Filled from the verified registry (see scripts/README or session notes).
};

// Trigger rules: a source is attached to a page when the page's visible text
// matches one of its patterns. Text is lower-cased with punctuation stripped
// before matching. Order = priority when a page matches more than MAX_SOURCES.
export const TRIGGERS: Array<[string, RegExp[]]> = [];

export const MAX_SOURCES = 5;

export function pickSources(normalizedText: string, max = MAX_SOURCES): string[] {
  const keys: string[] = [];
  for (const [key, patterns] of TRIGGERS) {
    if (!SOURCES[key]) throw new Error(`Source trigger references unknown key: ${key}`);
    if (patterns.some((re) => re.test(normalizedText))) keys.push(key);
    if (keys.length >= max) break;
  }
  return keys;
}
