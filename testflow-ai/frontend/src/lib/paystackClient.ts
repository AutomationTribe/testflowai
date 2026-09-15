export interface PaystackPaymentResult {
  success: boolean;
  message?: string;
}

interface PaystackPopInstance {
  resumeTransaction: (accessCode: string, options: {
    onSuccess: () => void;
    onCancel: () => void;
    onError?: (error: { message: string }) => void;
  }) => void;
}

declare global {
  interface Window {
    PaystackPop?: new () => PaystackPopInstance;
  }
}

const SCRIPT_SRC = 'https://js.paystack.co/v2/inline.js';
let scriptPromise: Promise<void> | null = null;

/** Loaded once, lazily — avoids re-injecting the Paystack Inline script on every checkout page visit. */
function loadPaystackScript(): Promise<void> {
  if (typeof window === 'undefined') return Promise.resolve();
  if (window.PaystackPop) return Promise.resolve();
  if (!scriptPromise) {
    scriptPromise = new Promise((resolve, reject) => {
      const script = document.createElement('script');
      script.src = SCRIPT_SRC;
      script.onload = () => resolve();
      script.onerror = () => reject(new Error('Could not load the payment provider. Please try again.'));
      document.body.appendChild(script);
    });
  }
  return scriptPromise;
}

/**
 * Resumes the transaction created server-side (AD-028) via Paystack's Inline
 * popup — card details go directly to Paystack, never through TestFlow's servers
 * (NFR-SEC-012). Resolves once the popup reports an outcome; actual subscription
 * activation only happens once the backend's webhook reconciles the charge (see
 * subscription/success/page.tsx) — this is never treated as activation itself.
 */
export async function payWithPaystack(accessCode: string): Promise<PaystackPaymentResult> {
  await loadPaystackScript();
  if (!window.PaystackPop) {
    return { success: false, message: 'Could not load the payment provider. Please try again.' };
  }

  return new Promise((resolve) => {
    const popup = new window.PaystackPop!();
    popup.resumeTransaction(accessCode, {
      onSuccess: () => resolve({ success: true }),
      onCancel: () => resolve({ success: false, message: 'Payment was cancelled.' }),
      onError: (error) => resolve({ success: false, message: error.message || 'Your payment could not be processed. Please try again.' }),
    });
  });
}
