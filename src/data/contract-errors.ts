// A new function to unifiy wallet error messages

export function friendlyError(
  e: unknown,
  codes: Record<string, string>
): unknown {
  let raw = e instanceof Error ? e.message : ''
  try {
    raw += JSON.stringify(e ?? '')
  } catch {
    // Circular error object — the message alone carries the code.
  }

  for (const [code, message] of Object.entries(codes)) {
    if (raw.includes(code)) return new Error(message)
  }
  return e
}
