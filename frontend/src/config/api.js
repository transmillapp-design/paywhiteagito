// API Configuration for Transmill
// This file ensures consistent API URL configuration across all environments

export const getApiUrl = () => {
  // Safety check for window
  if (typeof window === 'undefined') {
    return 'http://localhost:8001/api';
  }
  
  // Check if we're in a deployed environment
  const hostname = window.location.hostname;
  
  console.log('🔧 API Config - Hostname:', hostname);
  
  // Production/Preview environment detection
  if (hostname.includes('emergent.host') || hostname.includes('emergentagent.com') || hostname.includes('transmill.com.br') || hostname.includes('transmill.com.br')) {
    // Use the same origin for API calls in deployed environments
    const protocol = window.location.protocol;
    const host = window.location.host;
    const apiUrl = `${protocol}//${host}/api`;
    console.log('🌐 Deployed environment detected - API URL:', apiUrl);
    return apiUrl;
  }
  
  // Development environment
  if (hostname === 'localhost' || hostname === '127.0.0.1') {
    const devUrl = 'http://localhost:8001/api';
    console.log('💻 Development environment - API URL:', devUrl);
    return devUrl;
  }
  
  // Fallback to environment variable
  const envUrl = process.env.REACT_APP_BACKEND_URL;
  if (envUrl) {
    const finalUrl = envUrl.endsWith('/api') ? envUrl : `${envUrl}/api`;
    console.log('⚙️ Environment variable - API URL:', finalUrl);
    return finalUrl;
  }
  
  // Ultimate fallback
  const fallbackUrl = 'http://localhost:8001/api';
  console.log('⚠️ Using fallback - API URL:', fallbackUrl);
  return fallbackUrl;
};

// Export the API URL - Lazy loaded, not executed at module load time
let cachedApiUrl = null;

export const API_URL = () => {
  if (!cachedApiUrl) {
    cachedApiUrl = getApiUrl();
  }
  return cachedApiUrl;
};

// Debug function to verify configuration
export const debugApiConfig = () => {
  if (typeof window === 'undefined') {
    console.log('⚠️ Running in server-side context');
    return;
  }
  
  const apiUrl = typeof API_URL === 'function' ? API_URL() : API_URL;
  
  console.log('🔍 API Configuration Debug:');
  console.log('- Window Location:', window.location.href);
  console.log('- Hostname:', window.location.hostname);
  console.log('- Environment Variable:', process.env.REACT_APP_BACKEND_URL);
  console.log('- Final API URL:', apiUrl);
  
  // Test API availability
  fetch(`${apiUrl}/health`)
    .then(response => {
      console.log('✅ API Health Check:', response.status === 200 ? 'OK' : 'FAILED');
    })
    .catch(error => {
      console.log('❌ API Health Check Failed:', error.message);
    });
};