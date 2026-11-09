import { useState } from 'react'
import vocabularyFile from '@data/tag-vocabulary.json'
import {
  suggestTags,
  normalizeTag,
  toVocabulary,
} from '@utils/tag-suggestions.mjs'
import { readRecentTags } from '@utils/recent-tags'
import styles from './index.module.scss'

/** Built once: the tags Teia already uses, committed in the repo. */
const VOCABULARY = toVocabulary(vocabularyFile.tags)

/** Below this there is not enough text to say anything useful. */
const MIN_TEXT = 20

/**
 * "Suggest keywords" under a tags field. Runs only when asked, reads the
 * description that is already on screen, and talks to nothing: the vocabulary
 * ships with the app and past tags come from this browser's localStorage.
 *
 * @param {object} props
 * @param {string} props.text description or post body to read
 * @param {string} props.value current comma separated tags
 * @param {(tag: string) => void} props.onAdd
 * @param {boolean} [props.disabled]
 */
export function TagSuggestions({ text, value, onAdd, disabled }) {
  const [suggestions, setSuggestions] = useState(null)

  const enoughText = String(text || '').trim().length >= MIN_TEXT
  const existing = String(value || '')
    .split(',')
    .map(normalizeTag)
    .filter(Boolean)

  const handleSuggest = () => {
    setSuggestions(
      suggestTags(text, {
        vocabulary: VOCABULARY,
        personal: new Set(readRecentTags()),
        existing,
      })
    )
  }

  const handlePick = (tag) => {
    onAdd(tag)
    setSuggestions((current) => current.filter((item) => item !== tag))
  }

  return (
    <div className={styles.container}>
      <div className={styles.row}>
        <button
          type="button"
          className={styles.trigger}
          onClick={handleSuggest}
          disabled={disabled || !enoughText}
          title={
            enoughText
              ? 'Read the description and suggest tags'
              : 'Write a description first'
          }
        >
          Suggest keywords
        </button>
        {suggestions?.length === 0 && (
          <span className={styles.hint}>
            Nothing obvious to suggest — try adding your own.
          </span>
        )}
      </div>

      {suggestions?.length > 0 && (
        <ul className={styles.chips}>
          {suggestions.map((tag) => (
            <li key={tag}>
              <button
                type="button"
                className={styles.chip}
                onClick={() => handlePick(tag)}
                aria-label={`Add the tag ${tag}`}
              >
                + {tag}
              </button>
            </li>
          ))}
        </ul>
      )}
    </div>
  )
}

export default TagSuggestions
