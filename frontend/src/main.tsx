import React from 'react';
import ReactDOM from 'react-dom/client';
import { BrowserRouter } from 'react-router-dom';
import App from './App.js';
import './index.css';

async function enableMocksIfConfigured() {
  if (import.meta.env.VITE_USE_MOCKS !== 'true') return;
  const { worker } = await import('./mocks/browser.js');
  await worker.start({ onUnhandledRequest: 'bypass' });
}

const root = document.getElementById('root');
if (!root) throw new Error('#root element missing from index.html');

enableMocksIfConfigured().then(() => {
  ReactDOM.createRoot(root).render(
    <React.StrictMode>
      <BrowserRouter>
        <App />
      </BrowserRouter>
    </React.StrictMode>,
  );
});
