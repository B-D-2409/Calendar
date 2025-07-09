/// <reference types="vite/client" />

interface ImportMetaEnv {
    readonly VITE_BACK_END_URL: string;
    // add other env vars here as needed
  }
  
  interface ImportMeta {
    readonly env: ImportMetaEnv;
  }
  