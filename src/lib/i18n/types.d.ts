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

  export interface I18nInstance {
    t: Readable<TranslationFunction> & { get: TranslationFunction };
    locale: Readable<string> & { set: (locale: string) => void; subscribe: any };
    locales: Readable<string[]>;
    loading: Readable<boolean>;
    loadTranslations: (locale: string, route?: string) => Promise<void>;
  }

  export interface I18nConfig {
    fallbackLocale?: string;
    initialLocale?: string;
    loaders?: Array<{
      locale: string;
      key: string;
      loader: () => Promise<any>;
    }>;
  }

  export default class i18n {
    constructor(config: I18nConfig);
    t: Readable<TranslationFunction> & { get: TranslationFunction };
    locale: Readable<string> & { set: (locale: string) => void; subscribe: any };
    locales: Readable<string[]>;
    loading: Readable<boolean>;
    loadTranslations: (locale: string, route?: string) => Promise<void>;
  }
}
