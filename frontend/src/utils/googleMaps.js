/**
 * Carregamento dinâmico do Google Maps por franquia.
 * A chave NÃO fica hardcoded: é buscada do backend (credenciais da franquia)
 * com fallback para a variável de ambiente do app padrão.
 */

const API_URL = process.env.REACT_APP_BACKEND_URL || '';
let mapsBootstrapped = false;

// Loader oficial assíncrono do Google Maps (inline bootstrap)
function injectGoogleMapsLoader(apiKey) {
  if (window.google?.maps?.importLibrary) return;
  /* eslint-disable */
  (g => { var h, a, k, p = "The Google Maps JavaScript API", c = "google", l = "importLibrary", q = "__ib__", m = document, b = window; b = b[c] || (b[c] = {}); var d = b.maps || (b.maps = {}), r = new Set, e = new URLSearchParams, u = () => h || (h = new Promise(async (f, n) => { await (a = m.createElement("script")); e.set("libraries", [...r]); for (k in g) e.set(k.replace(/[A-Z]/g, t => "_" + t[0].toLowerCase()), g[k]); e.set("callback", c + ".maps." + q); a.src = `https://maps.googleapis.com/maps/api/js?` + e; d[q] = f; a.onerror = () => h = n(Error(p + " could not load.")); a.nonce = m.querySelector("script[nonce]")?.nonce || ""; m.head.append(a) })); d[l] ? console.warn(p + " only loads once. Ignoring:", g) : d[l] = (f, ...n) => r.add(f) && u().then(() => d[l](f, ...n)) })({
    key: apiKey,
    v: "weekly",
  });
  /* eslint-enable */
}

// Detecta o slug da franquia a partir da URL (/franquia/:slug/...)
export function getFranquiaSlugFromPath() {
  const match = window.location.pathname.match(/\/franquia\/([^/]+)/);
  return match ? match[1] : null;
}

async function resolveMapsKey() {
  const slug = getFranquiaSlugFromPath();
  if (slug) {
    try {
      const res = await fetch(`${API_URL}/api/public/franquias/${slug}/maps-config`);
      const data = await res.json();
      if (data?.google_maps_key) return data.google_maps_key;
    } catch (e) {
      console.warn('Falha ao buscar chave de Maps da franquia:', e);
    }
  }
  // Fallback: chave do app padrão (variável de ambiente, não hardcoded no código)
  return process.env.REACT_APP_GOOGLE_MAPS_API_KEY || '';
}

// Inicializa o Google Maps com a chave correta (franquia ou padrão)
export async function initGoogleMaps() {
  if (mapsBootstrapped) return;
  const apiKey = await resolveMapsKey();
  if (!apiKey) {
    console.warn('Nenhuma chave do Google Maps configurada para esta franquia.');
    return;
  }
  mapsBootstrapped = true;
  injectGoogleMapsLoader(apiKey);
}
