/** @file src/lib/i18n/types.d.ts */
declare module 'sveltekit-i18n' {
  import type { Readable } from 'svelte/store';

  export interface TranslationParams {
    default?: string;
    locale?: string;
    [key: string]: string | number | boolean | null | undefined;
  }

  export interface TranslationFunction {
    (key: string, params?: TranslationParams): string;
  }

  export interface I18n {
    t: Readable<TranslationFunction> & { get: TranslationFunction };
    locale: Readable<string> & { set: (locale: string) => void; subscribe: any };
    locales: Readable<string[]>;
    loading: Readable<boolean>;
    loadTranslations: (locale: string) => Promise<void>;
  }

  export function i18n(config: {
    fallbackLocale?: string;
    initialLocale?: string;
    loaders?: Array<{
      locale: string;
      key: string;
      loader: () => Promise<any>;
    }>;
  }): I18n;

  export default i18n;
}
