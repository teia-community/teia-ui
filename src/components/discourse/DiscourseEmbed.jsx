import { useEffect, useRef } from 'react'

const DISCOURSE_URL = 'https://discourse.teia.art/'
const TEIA_BASE_URL = 'https://teia.art'

/**
 * @param {string} topicUrl - The full Discourse topic URL or page URL to embed // Need to be tested
 */
export default function DiscourseEmbed({ topicUrl }) {
  const containerRef = useRef(null)

  useEffect(() => {
    if (!topicUrl) return

    // Configure Discourse embed
    window.DiscourseEmbed = {
      discourseUrl: DISCOURSE_URL,
      discourseEmbedUrl: topicUrl,
      discourseReferrerPolicy: 'no-referrer-when-downgrade',
    }

    // Load embed.js script
    const script = document.createElement('script')
    script.type = 'text/javascript'
    script.async = true
    script.src = DISCOURSE_URL + 'javascripts/embed.js'

    const target =
      document.getElementsByTagName('head')[0] ||
      document.getElementsByTagName('body')[0]
    target.appendChild(script)

    // Cleanup on unmount
    return () => {
      if (script.parentNode) {
        script.parentNode.removeChild(script)
      }
      delete window.DiscourseEmbed
      // Clear the container
      if (containerRef.current) {
        containerRef.current.innerHTML = ''
      }
    }
  }, [topicUrl])

  if (!topicUrl) return null

  return <div ref={containerRef} id="discourse-comments"></div>
}

/**
 * Extracts the Discourse URL from a poll description string
 * Looks for discourse.teia.art URLs in the description (should be the naming convention - need to sort it out wiht Ryan/teia team?)
 * @param {string} description - The poll description
 * @returns {string|null} - The Discourse URL or null if not found
 */
export function extractDiscourseUrl(description) {
  if (!description) return null

  // Match discourse.teia.art URLs
  const discoursePattern = /https?:\/\/discourse\.teia\.art\/t\/[^\s)]+/i
  const match = description.match(discoursePattern)

  return match ? match[0] : null
}

/**
 * Generates the teia.art poll URL for a given poll ID
 * This URL is used as the embed URL for Discourse to find/create associated topics
 * @param {string|number} pollId - The poll ID
 * @returns {string} - The teia.art poll URL
 */
export function getPollEmbedUrl(pollId) {
  return `${TEIA_BASE_URL}/poll/${pollId}`
}
