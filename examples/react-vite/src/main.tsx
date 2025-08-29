import React from 'react'
import ReactDOM from 'react-dom/client'
import App from './App'
import './index.css'

// Polyfill Node Buffer in browser (some libraries expect `Buffer`)
import { Buffer } from 'buffer';
if (!(globalThis as any).Buffer) {
  (globalThis as any).Buffer = Buffer;
}

const rootElement = document.getElementById('root');
if (rootElement) {
  const root = ReactDOM.createRoot(rootElement);
  root.render(
    <React.StrictMode>
      <App />
    </React.StrictMode>
  );
}
