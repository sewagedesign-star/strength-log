import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { registerSW } from 'virtual:pwa-register';
// 共通のスタイルは先に読み込む（各画面のスタイルで上書きできるように）
import './styles/global.css';
import App from './App';

registerSW({ immediate: true });

// ホーム画面アプリでデータが消されにくくする（対応ブラウザのみ）
navigator.storage?.persist?.().catch(() => {});

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App />
  </StrictMode>,
);
