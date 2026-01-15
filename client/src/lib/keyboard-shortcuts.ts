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

export function normalizeShortcutKey(
  rawKey: string,
  modifiers?: { shiftKey?: boolean; ctrlKey?: boolean; altKey?: boolean; metaKey?: boolean }
): string | null {
  if (!rawKey) return null;

  let baseKey = rawKey;
  if (rawKey === ' ' || rawKey === 'Spacebar') baseKey = 'Space';
  else if (rawKey.startsWith('Arrow')) baseKey = rawKey;
  else if (rawKey.length === 1) baseKey = rawKey.toUpperCase();
  else return null;

  const parts: string[] = [];
  if (modifiers?.shiftKey) parts.push('Shift');
  if (modifiers?.ctrlKey) parts.push('Ctrl');
  if (modifiers?.altKey) parts.push('Alt');
  if (modifiers?.metaKey) parts.push('Meta');
  parts.push(baseKey);

  return parts.join('+');
}

export function getShortcutBaseKey(key: string): string {
  const parts = key.split('+');
  return parts[parts.length - 1] || key;
}

export function hasShortcutModifiers(key: string): boolean {
  return key.includes('+');
}

export function isReservedShortcutKey(key: string): key is ReservedShortcutKey {
  const baseKey = getShortcutBaseKey(key);
  return RESERVED_SET.has(baseKey as ReservedShortcutKey);
}

export function isReservedShortcutCombo(key: string): boolean {
  return isReservedShortcutKey(key) && !hasShortcutModifiers(key);
}
