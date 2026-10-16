/**
 * A rough token count. Claude's tokenizer is not published, so an exact count
 * needs a round-trip to the count_tokens API — which this app deliberately
 * never makes. Four characters per token is the common rule of thumb for
 * English prose; it runs low for code and non-Latin scripts, which is why the
 * UI always labels it as an estimate.
 */
export function estimateTokens(text: string): number {
  return text.length === 0 ? 0 : Math.ceil(text.length / 4);
}

export function countWords(text: string): number {
  const trimmed = text.trim();
  return trimmed === '' ? 0 : trimmed.split(/\s+/).length;
}
