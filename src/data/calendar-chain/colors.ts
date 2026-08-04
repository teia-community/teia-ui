// Accent colors for on-chain calendar events. The IPFS event document stores
// the hex code (`#rrggbb`); the named tokens exist for the form's swatch
// picker. Earlier docs stored the token name — reads accept both.

export const EVENT_COLORS: Record<string, string> = {
  red: '#e06666',
  orange: '#e8a33d',
  yellow: '#d4b106',
  green: '#81c784',
  teal: '#4db6ac',
  blue: '#68b7e0',
  purple: '#a884d0',
  pink: '#e07ba8',
}

const HEX_RE = /^#[0-9a-f]{6}$/i

/**
 * Hex for a stored color value — a `#rrggbb` code or a named token — or
 * undefined when missing/unknown. The strict hex shape is what keeps
 * untrusted IPFS values safe to inline into CSS.
 */
export function eventColorHex(value?: string): string | undefined {
  if (typeof value !== 'string') return undefined
  if (HEX_RE.test(value)) return value.toLowerCase()
  return EVENT_COLORS[value]
}

/**
 * Palette token for a stored color value (token or hex), or undefined when
 * it's not in the palette — used to re-select the form's swatch on edit.
 */
export function eventColorToken(value?: string): string | undefined {
  if (typeof value !== 'string') return undefined
  if (EVENT_COLORS[value]) return value
  const hex = value.toLowerCase()
  return Object.keys(EVENT_COLORS).find((k) => EVENT_COLORS[k] === hex)
}
