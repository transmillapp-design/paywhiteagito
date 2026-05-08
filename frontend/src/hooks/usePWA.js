import { useState, useEffect, useCallback } from 'react';

const API = process.env.REACT_APP_BACKEND_URL;

// Helper para converter base64 para Uint8Array (necessário para VAPID)
const urlBase64ToUint8Array = (base64String) => {
  const padding = '='.repeat((4 - base64String.length % 4) % 4);
  const base64 = (base64String + padding).replace(/-/g, '+').replace(/_/g, '/');
  const rawData = window.atob(base64);
  const outputArray = new Uint8Array(rawData.length);
  for (let i = 0; i < rawData.length; ++i) {
    outputArray[i] = rawData.charCodeAt(i);
  }
  return outputArray;
};

export const usePWA = () => {
  const [deferredPrompt, setDeferredPrompt] = useState(null);
  const [isInstallable, setIsInstallable] = useState(false);
  const [isInstalled, setIsInstalled] = useState(false);
  
  // Push Notifications
  const [pushSupported, setPushSupported] = useState(false);
  const [pushPermission, setPushPermission] = useState('default');
  const [pushSubscribed, setPushSubscribed] = useState(false);

  useEffect(() => {
    // Check if app is already installed
    const checkIfInstalled = () => {
      if (window.matchMedia('(display-mode: standalone)').matches) {
        setIsInstalled(true);
      } else if (window.navigator.standalone === true) {
        setIsInstalled(true);
      }
    };

    // Check push notification support
    const checkPushSupport = () => {
      const supported = 'serviceWorker' in navigator && 'PushManager' in window;
      setPushSupported(supported);
      
      if (supported && 'Notification' in window) {
        setPushPermission(Notification.permission);
      }
    };

    // Check if already subscribed to push
    const checkPushSubscription = async () => {
      if ('serviceWorker' in navigator) {
        try {
          const registration = await navigator.serviceWorker.ready;
          const subscription = await registration.pushManager.getSubscription();
          setPushSubscribed(!!subscription);
        } catch (error) {
          console.error('[PWA] Error checking push subscription:', error);
        }
      }
    };

    // Listen for beforeinstallprompt event
    const handleBeforeInstallPrompt = (e) => {
      e.preventDefault();
      setDeferredPrompt(e);
      setIsInstallable(true);
    };

    // Listen for app installed event
    const handleAppInstalled = () => {
      console.log('PWA was installed');
      setIsInstalled(true);
      setIsInstallable(false);
      setDeferredPrompt(null);
    };

    checkIfInstalled();
    checkPushSupport();
    checkPushSubscription();

    window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
    window.addEventListener('appinstalled', handleAppInstalled);

    return () => {
      window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
      window.removeEventListener('appinstalled', handleAppInstalled);
    };
  }, []);

  const installApp = async () => {
    if (!deferredPrompt) return false;

    deferredPrompt.prompt();
    const { outcome } = await deferredPrompt.userChoice;

    if (outcome === 'accepted') {
      console.log('User accepted the install prompt');
      setIsInstalled(true);
    }

    setDeferredPrompt(null);
    setIsInstallable(false);

    return outcome === 'accepted';
  };

  // Solicitar permissão para push notifications
  const requestPushPermission = useCallback(async () => {
    if (!pushSupported) return 'unsupported';
    
    try {
      const permission = await Notification.requestPermission();
      setPushPermission(permission);
      return permission;
    } catch (error) {
      console.error('[PWA] Error requesting push permission:', error);
      return 'denied';
    }
  }, [pushSupported]);

  // Inscrever para push notifications
  const subscribeToPush = useCallback(async (token) => {
    if (!pushSupported || !token) return null;

    try {
      // Solicitar permissão se necessário
      let permission = pushPermission;
      if (permission !== 'granted') {
        permission = await requestPushPermission();
        if (permission !== 'granted') {
          throw new Error('Permissão negada');
        }
      }

      // Buscar chave pública VAPID
      const vapidResponse = await fetch(`${API}/api/pwa/vapid-public-key`);
      const vapidData = await vapidResponse.json();
      
      if (!vapidData.success) {
        throw new Error('Não foi possível obter chave VAPID');
      }

      // Obter registration do service worker
      const registration = await navigator.serviceWorker.ready;
      
      // Verificar se já existe subscription
      let subscription = await registration.pushManager.getSubscription();
      
      if (!subscription) {
        // Criar nova subscription
        subscription = await registration.pushManager.subscribe({
          userVisibleOnly: true,
          applicationServerKey: urlBase64ToUint8Array(vapidData.public_key)
        });
      }

      // Enviar subscription para o backend
      const subscriptionJSON = subscription.toJSON();
      const response = await fetch(`${API}/api/master/push/subscribe`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          subscription: subscriptionJSON
        })
      });

      const result = await response.json();
      
      if (result.success) {
        setPushSubscribed(true);
        console.log('[PWA] Push subscription ativada');
        return subscription;
      } else {
        throw new Error(result.error || 'Erro ao registrar subscription');
      }
    } catch (error) {
      console.error('[PWA] Error subscribing to push:', error);
      throw error;
    }
  }, [pushSupported, pushPermission, requestPushPermission]);

  // Cancelar inscrição de push
  const unsubscribeFromPush = useCallback(async (token) => {
    try {
      const registration = await navigator.serviceWorker.ready;
      const subscription = await registration.pushManager.getSubscription();
      
      if (subscription) {
        await subscription.unsubscribe();
        
        if (token) {
          await fetch(`${API}/api/master/push/unsubscribe`, {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              'Authorization': `Bearer ${token}`
            },
            body: JSON.stringify({
              endpoint: subscription.endpoint
            })
          });
        }
      }
      
      setPushSubscribed(false);
      console.log('[PWA] Push subscription cancelada');
      return true;
    } catch (error) {
      console.error('[PWA] Error unsubscribing from push:', error);
      return false;
    }
  }, []);

  return {
    // Instalação
    isInstallable,
    isInstalled,
    installApp,
    
    // Push Notifications
    pushSupported,
    pushPermission,
    pushSubscribed,
    requestPushPermission,
    subscribeToPush,
    unsubscribeFromPush
  };
};
