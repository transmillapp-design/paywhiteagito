// Configuração centralizada dos serviços parceiros
export const SERVICES_CONFIG = {
  // URLs de produção (exemplo)
  PRODUCTION: {
    mobility: 'https://mobilidade.transmill.com',
    vehicleProtection: 'https://protecao.transmill.com', 
    mobileInternet: 'https://internet.transmill.com',
    telemedicine: 'https://saude.transmill.com',
    stores: '/client-dashboard', // Interno
    services: '/service-provider-dashboard', // Interno  
    crypto: '/client-dashboard' // Interno
  },
  
  // URLs de desenvolvimento/teste  
  DEVELOPMENT: {
    mobility: 'https://demo-mobilidade.transmill.com',
    vehicleProtection: 'https://demo-protecao.transmill.com',
    mobileInternet: 'https://demo-internet.transmill.com', 
    telemedicine: 'https://demo-saude.transmill.com',
    stores: '/client-dashboard',
    services: '/service-provider-dashboard',
    crypto: '/client-dashboard'
  }
};

// Função para obter URLs baseada no ambiente
export const getServiceUrl = (serviceName) => {
  const environment = process.env.NODE_ENV === 'production' ? 'PRODUCTION' : 'DEVELOPMENT';
  return SERVICES_CONFIG[environment][serviceName];
};

// Configuração de tracking para analytics
export const trackServiceClick = (serviceName, userId) => {
  // Integração futura com Google Analytics ou similar
  console.log(`Service clicked: ${serviceName} by user: ${userId}`);
  
  // Exemplo de implementação futura:
  // gtag('event', 'service_click', {
  //   service_name: serviceName,
  //   user_id: userId,
  //   timestamp: new Date().toISOString()
  // });
};