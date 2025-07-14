/// <reference types="vite/client" />
import * as React from 'react';
interface ImportMetaEnv {
    readonly VITE_BACK_END_URL: string;
    // add other env vars here as needed
  }
  
  interface ImportMeta {
    readonly env: ImportMetaEnv;
  }
  


declare global {
  namespace JSX {
    interface Element extends React.ReactElement<any, any> {}
    interface IntrinsicElements {
      [elemName: string]: any;
    }
  }
}
