import { useEffect, useRef, useCallback, useState } from 'react';

declare global {
  interface Window {
    fbAsyncInit: () => void;
    FB: {
      init: (params: {
        appId: string;
        cookie?: boolean;
        xfbml?: boolean;
        version: string;
      }) => void;
      login: (
        callback: (response: FacebookLoginResponse) => void,
        options: FacebookLoginOptions
      ) => void;
      getLoginStatus: (callback: (response: FacebookLoginResponse) => void) => void;
    };
  }
}

interface FacebookLoginResponse {
  status: 'connected' | 'not_authorized' | 'unknown';
  authResponse?: {
    accessToken: string;
    code?: string;
    expiresIn: number;
    signedRequest: string;
    userID: string;
  };
}

interface FacebookLoginOptions {
  config_id: string;
  response_type: string;
  override_default_response_type: boolean;
  extras: {
    featureType: string;
    sessionInfoVersion: string;
    version: string;
    features: Array<{ name: string }>;
  };
}

interface EmbeddedSignupResponse {
  code?: string;
  accessToken?: string;
  phone_number_id?: string;
  waba_id?: string;
}

interface UseFacebookEmbeddedSignupOptions {
  appId: string;
  configId: string;
  onSuccess?: (response: EmbeddedSignupResponse) => void;
  onCancel?: () => void;
  onError?: (error: Error) => void;
}

export function useFacebookEmbeddedSignup({
  appId,
  configId,
  onSuccess,
  onCancel,
  onError,
}: UseFacebookEmbeddedSignupOptions) {
  const [isSDKLoaded, setIsSDKLoaded] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const initRef = useRef(false);

  // Listener para mensagens do popup do Embedded Signup
  useEffect(() => {
    const sessionInfoListener = (event: MessageEvent) => {
      if (event.origin !== 'https://www.facebook.com') return;

      try {
        const data = JSON.parse(event.data);
        if (data.type === 'WA_EMBEDDED_SIGNUP') {
          // data contém phone_number_id e waba_id após setup
          if (data.event === 'FINISH') {
            onSuccess?.({
              phone_number_id: data.data?.phone_number_id,
              waba_id: data.data?.waba_id,
            });
          } else if (data.event === 'CANCEL') {
            onCancel?.();
          }
        }
      } catch {
        // Ignora mensagens que não são JSON válido
      }
    };

    window.addEventListener('message', sessionInfoListener);
    return () => window.removeEventListener('message', sessionInfoListener);
  }, [onSuccess, onCancel]);

  // Carrega o SDK do Facebook
  useEffect(() => {
    if (initRef.current || !appId) return;
    initRef.current = true;

    window.fbAsyncInit = function () {
      window.FB.init({
        appId,
        cookie: true,
        xfbml: true,
        version: 'v25.0',
      });
      setIsSDKLoaded(true);
    };

    // Carrega o SDK se ainda não foi carregado
    if (!document.getElementById('facebook-jssdk')) {
      const script = document.createElement('script');
      script.id = 'facebook-jssdk';
      script.src = 'https://connect.facebook.net/pt_BR/sdk.js';
      script.async = true;
      script.defer = true;
      document.body.appendChild(script);
    } else if (window.FB) {
      setIsSDKLoaded(true);
    }
  }, [appId]);

  const launchEmbeddedSignup = useCallback(() => {
    if (!window.FB || !isSDKLoaded) {
      onError?.(new Error('Facebook SDK não carregado'));
      return;
    }

    setIsLoading(true);

    window.FB.login(
      (response: FacebookLoginResponse) => {
        setIsLoading(false);

        console.log('FB.login response:', response);

        // Verifica se tem code no authResponse, independente do status
        // O Embedded Signup pode retornar status 'unknown' mesmo com code válido
        if (response.authResponse?.code) {
          console.log('FB.login: Code obtido com sucesso');
          onSuccess?.({
            code: response.authResponse.code,
            accessToken: response.authResponse.accessToken,
          });
        } else if (response.status === 'not_authorized') {
          console.log('FB.login: Usuário não autorizou o app');
          onCancel?.();
        } else if (!response.authResponse) {
          // Sem authResponse = popup fechado ou cancelado
          console.log('FB.login: Popup fechado ou cancelado');
          onCancel?.();
        } else {
          console.warn('FB.login: authResponse sem code');
          onError?.(new Error('Resposta incompleta do Facebook'));
        }
      },
      {
        config_id: configId,
        response_type: 'code',
        override_default_response_type: true,
        extras: {
          featureType: 'whatsapp_business_app_onboarding',
          sessionInfoVersion: '3',
          version: 'v3',
          features: [
            { name: 'marketing_messages_lite' },
            { name: 'app_only_install' },
          ],
        },
      }
    );
  }, [configId, isSDKLoaded, onSuccess, onCancel, onError]);

  return {
    isSDKLoaded,
    isLoading,
    launchEmbeddedSignup,
  };
}
