/** OPS-5 — template keys for manual stub entries (kebab/snake-ish). */
export function normalizeCommunicationTemplateKey(raw: string): string {
  return raw.trim().toLowerCase().replace(/\s+/g, '_');
}

export function isAllowedStubCommunicationStatus(status: string): status is 'LOGGED' | 'SKIPPED' {
  return status === 'LOGGED' || status === 'SKIPPED';
}
