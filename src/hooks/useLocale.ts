import * as Localization from 'expo-localization';

export function useLocale() {
  const locales = Localization.getLocales();

  // returns "en", "es", "fr", etc.
  return locales?.[0]?.languageCode ?? 'en';
}