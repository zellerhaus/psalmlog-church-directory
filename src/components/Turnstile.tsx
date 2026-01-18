'use client';

import { Turnstile as TurnstileWidget, type TurnstileInstance } from '@marsidev/react-turnstile';
import { forwardRef, useImperativeHandle, useRef, useState } from 'react';

export interface TurnstileRef {
  reset: () => void;
  getToken: () => string | null;
}

interface TurnstileProps {
  onVerify: (token: string) => void;
  onExpire?: () => void;
  onError?: () => void;
}

const Turnstile = forwardRef<TurnstileRef, TurnstileProps>(
  ({ onVerify, onExpire, onError }, ref) => {
    const turnstileRef = useRef<TurnstileInstance>(null);
    const [token, setToken] = useState<string | null>(null);

    useImperativeHandle(ref, () => ({
      reset: () => {
        turnstileRef.current?.reset();
        setToken(null);
      },
      getToken: () => token,
    }));

    const siteKey = process.env.NEXT_PUBLIC_TURNSTILE_SITE_KEY;

    if (!siteKey) {
      console.warn('Turnstile site key not configured');
      return null;
    }

    return (
      <TurnstileWidget
        ref={turnstileRef}
        siteKey={siteKey}
        onSuccess={(token) => {
          setToken(token);
          onVerify(token);
        }}
        onExpire={() => {
          setToken(null);
          onExpire?.();
        }}
        onError={() => {
          setToken(null);
          onError?.();
        }}
        options={{
          theme: 'light',
          size: 'flexible',
        }}
      />
    );
  }
);

Turnstile.displayName = 'Turnstile';

export default Turnstile;
