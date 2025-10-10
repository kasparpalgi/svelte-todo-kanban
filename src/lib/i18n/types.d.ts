import 'sveltekit-i18n';

declare module 'sveltekit-i18n' {
  interface CustomPayload {
    [key: string]: any;
  }
}
