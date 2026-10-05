/// <reference types="vite/client" />

interface ImportMetaEnv {
  readonly VITE_RECAPTCHA_SITE_KEY?: string;
  readonly VITE_BUSINESS_NAME?: string;
  readonly VITE_BRAND_NAME?: string;
  readonly VITE_BUSINESS_NIT?: string;
  readonly VITE_REPRESENTANTE_LEGAL?: string;
  readonly VITE_BUSINESS_ADDRESS?: string;
  readonly VITE_BUSINESS_CITY?: string;
  readonly VITE_BUSINESS_COUNTRY?: string;
  readonly VITE_BUSINESS_PHONE?: string;
  readonly VITE_BUSINESS_WHATSAPP?: string;
  readonly VITE_BUSINESS_EMAIL?: string;
  readonly VITE_PRIVACY_EMAIL?: string;
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}
