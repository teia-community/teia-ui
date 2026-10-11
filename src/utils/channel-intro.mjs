// Whether a channel's description would only repeat its first message.
//
// Because a new room opened blank, creators routinely pasted the description in
// as the first message. Showing the description as the opening bubble would
// then say the same thing twice, so those rooms keep the message and drop the
// bubble.

/** Escaped newlines, real newlines and runs of spaces all compare equal. */
function normalize(value) {
  return String(value || '')
    .replace(/\\n/g, ' ')
    .replace(/\s+/g, ' ')
    .trim()
    .toLowerCase()
}

/**
 * @param {string} [description] the channel description
 * @param {string} [firstMessage] content of the oldest message in the room
 * @returns {boolean} true when the description adds nothing
 */
export function introRepeatsFirstMessage(description, firstMessage) {
  const intro = normalize(description)
  const first = normalize(firstMessage)
  if (intro === '' || first === '') return false
  // Equal, or the message opens with the description and carries on.
  return intro === first || first.startsWith(intro)
}
