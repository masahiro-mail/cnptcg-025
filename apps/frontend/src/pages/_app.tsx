import type { AppProps } from 'next/app';
import { useEffect } from 'react';
import '../styles/globals.css';

// Disable Fast Refresh completely
if (typeof window !== 'undefined' && process.env.NODE_ENV === 'development') {
  // @ts-ignore
  if (window.__REACT_REFRESH__) {
    // @ts-ignore
    window.__REACT_REFRESH__ = false;
  }
  // @ts-ignore
  if (window.__webpack_require__?.cache) {
    // @ts-ignore
    delete window.__webpack_require__.cache;
  }
}

export default function App({ Component, pageProps }: AppProps) {
  useEffect(() => {
    // Prevent zoom on mobile devices
    const viewport = document.querySelector('meta[name="viewport"]');
    if (viewport) {
      viewport.setAttribute('content', 'width=device-width, initial-scale=1, maximum-scale=1, user-scalable=no');
    }
    
    // Additional Fast Refresh disable
    if (process.env.NODE_ENV === 'development') {
      // @ts-ignore
      if (window.__REACT_REFRESH__) {
        // @ts-ignore
        window.__REACT_REFRESH__.injectIntoGlobalHook = () => {};
      }
    }
  }, []);

  return <Component {...pageProps} />;
}