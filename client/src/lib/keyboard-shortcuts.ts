export const RESERVED_SHORTCUT_KEYS = [
  'Space',
  'M',
  'Z',
  'X',
  'B',
  'N',
  'ArrowDown',
  'ArrowUp'
] as const;

const RESERVED_SET = new Set(RESERVED_SHORTCUT_KEYS);

export type ReservedShortcutKey = (typeof RESERVED_SHORTCUT_KEYS)[number];

export function normalizeShortcutKey(rawKey: string): string | null {
  if (!rawKey) return null;
  if (rawKey === ' ' || rawKey === 'Spacebar') return 'Space';
  if (rawKey.startsWith('Arrow')) return rawKey;
  if (rawKey.length === 1) return rawKey.toUpperCase();
  return null;
}

export function isReservedShortcutKey(key: string): key is ReservedShortcutKey {
  return RESERVED_SET.has(key);
}
