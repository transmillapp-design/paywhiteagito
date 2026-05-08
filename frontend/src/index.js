import React from "react";
import ReactDOM from "react-dom/client";
import "./index.css";
import App from "./App";

const root = ReactDOM.createRoot(document.getElementById("root"));
root.render(
  <React.StrictMode>
    <App />
  </React.StrictMode>,
);

// ⚠️ SERVICE WORKER DESABILITADO - Causando problemas de cache
// Remover todos os service workers antigos
if ('serviceWorker' in navigator) {
  navigator.serviceWorker.getRegistrations().then(function(registrations) {
    for(let registration of registrations) {
      registration.unregister();
      console.log('🗑️ Service Worker removido:', registration.scope);
    }
  });
  console.log('✅ Service Workers desabilitados - Sistema rodando sem cache');
}
