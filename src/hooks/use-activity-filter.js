import { useState, useCallback } from 'react'

/**
 * Manage the activity feed's type-filter chips.
 *
 * @returns {{
 *   active: string[],
 *   toggle: (key: string) => void,
 *   matches: (filterKey: string) => boolean,
 * }} `active` is the selected filterKeys (empty = show all), `toggle` flips
 *   one chip, and `matches` is a predicate for keeping a row.
 */
export default function useActivityFilter() {
  const [active, setActive] = useState([])

  const toggle = useCallback(
    (key) =>
      setActive((prev) =>
        prev.includes(key) ? prev.filter((k) => k !== key) : [...prev, key]
      ),
    []
  )

  const matches = useCallback(
    (filterKey) => active.length === 0 || active.includes(filterKey),
    [active]
  )

  return { active, toggle, matches }
}
