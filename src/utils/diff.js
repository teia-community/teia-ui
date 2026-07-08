// Lightweight word-level text diff (no external dependency).
//
// Tokenizes both strings into words + whitespace runs, then walks the longest
// common subsequence to classify each token as equal / added / removed.
// Adjacent tokens of the same type are merged so the output stays compact.
//
// LCS is O(n*m) in time and memory, so very large inputs fall back to a coarse
// "everything removed + everything added" result to avoid blowing up the page.

const MAX_TOKENS = 4000

function tokenize(str) {
  return str.match(/\s+|\S+/g) || []
}

/**
 * @param {string} oldStr previous text
 * @param {string} newStr proposed text
 * @returns {{ type: 'equal' | 'added' | 'removed', value: string }[]}
 */
export function diffSegments(oldStr = '', newStr = '') {
  if (oldStr === newStr) {
    return oldStr ? [{ type: 'equal', value: oldStr }] : []
  }

  const a = tokenize(oldStr)
  const b = tokenize(newStr)

  if (a.length > MAX_TOKENS || b.length > MAX_TOKENS) {
    return [
      ...(oldStr ? [{ type: 'removed', value: oldStr }] : []),
      ...(newStr ? [{ type: 'added', value: newStr }] : []),
    ]
  }

  const n = a.length
  const m = b.length
  // dp[i][j] = LCS length of a[i:] and b[j:]
  const dp = Array.from({ length: n + 1 }, () => new Uint32Array(m + 1))
  for (let i = n - 1; i >= 0; i--) {
    for (let j = m - 1; j >= 0; j--) {
      dp[i][j] =
        a[i] === b[j]
          ? dp[i + 1][j + 1] + 1
          : Math.max(dp[i + 1][j], dp[i][j + 1])
    }
  }

  const out = []
  const push = (type, value) => {
    const last = out[out.length - 1]
    if (last && last.type === type) last.value += value
    else out.push({ type, value })
  }

  let i = 0
  let j = 0
  while (i < n && j < m) {
    if (a[i] === b[j]) {
      push('equal', a[i])
      i++
      j++
    } else if (dp[i + 1][j] >= dp[i][j + 1]) {
      push('removed', a[i])
      i++
    } else {
      push('added', b[j])
      j++
    }
  }
  while (i < n) push('removed', a[i++])
  while (j < m) push('added', b[j++])

  return out
}
