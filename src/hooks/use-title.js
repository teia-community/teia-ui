import { useEffect } from 'react'
import {
  DEFAULT_DESCRIPTION,
  canonicalUrl,
  pageTitle,
} from '@utils/page-meta.mjs'

export function useTitle(title) {
  useEffect(() => {
    document.title = pageTitle(title)
  }, [title])
}

// The path the app was loaded on. OBJKT and profile pages arrive with share
// tags already injected by the server (docker/lua/previews.lua); those are
// left alone until the visitor navigates somewhere else.
const INITIAL_PATH =
  typeof window !== 'undefined' ? window.location.pathname : '/'

function setTag(selector, create, attr, value) {
  let el = document.head.querySelector(selector)
  if (value == null) {
    if (el) el.remove()
    return
  }
  if (!el) {
    el = create()
    document.head.appendChild(el)
  }
  el.setAttribute(attr, value)
}

const tag = (name, key, value) => () => {
  const el = document.createElement(name)
  el.setAttribute(key, value)
  return el
}

const setMeta = (name, value) =>
  setTag(`meta[name="${name}"]`, tag('meta', 'name', name), 'content', value)

const setProperty = (name, value) =>
  setTag(
    `meta[property="${name}"]`,
    tag('meta', 'property', name),
    'content',
    value
  )

/**
 * Keeps the document's title, description, share tags and canonical link in
 * step with the page being shown, so search engines that render the app see
 * each page under its own name rather than the generic site description.
 *
 * `noindex` marks pages that should stay out of search results (errors,
 * editors, admin screens).
 */
export function usePageMeta({ title, description, noindex = false } = {}) {
  const pathname =
    typeof window !== 'undefined' ? window.location.pathname : '/'

  useEffect(() => {
    document.title = pageTitle(title)

    const name = title || 'teia'
    setProperty('og:title', name)
    setMeta('twitter:title', name)

    // Without a description of its own, a page keeps the server's tags on the
    // path the app was loaded on and falls back to the site default elsewhere.
    const text =
      description || (pathname === INITIAL_PATH ? null : DEFAULT_DESCRIPTION)
    if (text) {
      setMeta('description', text)
      setProperty('og:description', text)
      setMeta('twitter:description', text)
    }

    const url = canonicalUrl(pathname)
    setProperty('og:url', url)
    setTag(
      'link[rel="canonical"]',
      tag('link', 'rel', 'canonical'),
      'href',
      noindex ? null : url
    )
    setMeta('robots', noindex ? 'noindex' : null)
  }, [title, description, noindex, pathname])
}
