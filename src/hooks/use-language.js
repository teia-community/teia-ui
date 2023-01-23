import en from '@data/translations/en.json'

/**
 * (WIP) Hook to manage languages/i18n
 * @returns
 */
export default function useLanguage() {
  // TODO: add multi-language support
  return {
    language: en,
  }
}
