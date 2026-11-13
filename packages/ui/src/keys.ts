/** `"Ctrl+K"` -> `["Ctrl", "K"]`. Un `+` suelto al final es la tecla `+` (`"Ctrl++"`). */
export function keyCaps(keys: string): string[] {
  const out: string[] = []
  let cur = ''
  for (const ch of keys) {
    if (ch === '+' && cur) {
      out.push(cur.trim())
      cur = ''
    } else cur += ch
  }
  if (cur.trim()) out.push(cur.trim())
  return out
}
