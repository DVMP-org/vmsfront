/**
 * Utility functions for handling payment popup windows
 */

/**
 * Opens a payment authorization URL in a smaller popup window
 * @param url The authorization URL to open
 * @param reference The transaction reference for polling
 * @param onSuccess Callback when payment succeeds
 * @param onError Callback when payment fails or is cancelled
 * @returns The popup window instance
 */
export function openPaymentPopup(
  url: string,
  reference: string,
  onSuccess?: (reference: string) => void,
  onError?: (error: string) => void
): Window | null {
  // Calculate popup size (smaller window)
  const width = 500;
  const height = 600;
  const left = Math.max(0, (window.screen.width - width) / 2);
  const top = Math.max(0, (window.screen.height - height) / 2);

  // Store reference to parent window for focus restoration
  const parentWindow = window;

  // Open popup window with smaller size
  const popup = window.open(
    url,
    "payment",
    `width=${width},height=${height},left=${left},top=${top},toolbar=no,menubar=no,scrollbars=yes,resizable=no,location=no,status=no`
  );

  if (!popup) {
    onError?.("Popup blocked. Please allow popups for this site.");
    return null;
  }

  // Focus the popup initially
  popup.focus();

  let cleanupCalled = false;
  let checkClosed: NodeJS.Timeout | null = null;
  let timeout: NodeJS.Timeout | null = null;
  let checkUrlChange: NodeJS.Timeout | null = null;

  const refocusParent = () => {
    // Refocus the parent window
    if (parentWindow && typeof parentWindow.focus === "function") {
      try {
        parentWindow.focus();
      } catch (e) {
        // Some browsers may block focus() call, ignore error
        console.warn("Could not focus parent window:", e);
      }
    }
  };
  
  const cleanup = () => {
    if (cleanupCalled) return;
    cleanupCalled = true;
    if (checkClosed) clearInterval(checkClosed);
    if (checkUrlChange) clearInterval(checkUrlChange);
    window.removeEventListener("message", messageHandler);
    if (timeout) clearTimeout(timeout);
  };

  const handlePopupClose = () => {
    cleanup();
    refocusParent();
    // When popup closes, assume we should check the transaction status
    // The parent component will handle polling the transaction
    onSuccess?.(reference);
  };

  // Poll for window closure or check for success message
  checkClosed = setInterval(() => {
    if (popup.closed) {
      handlePopupClose();
    }
  }, 500);

  // Listen for messages from popup (if payment provider supports it)
  const messageHandler = (event: MessageEvent) => {
    // Only accept messages from same origin or trusted payment provider
    if (event.origin !== window.location.origin) {
      return;
    }

    if (event.data?.type === "PAYMENT_SUCCESS" && event.data?.reference === reference) {
      cleanup();
      refocusParent();
      onSuccess?.(reference);
    } else if (event.data?.type === "PAYMENT_ERROR") {
      cleanup();
      refocusParent();
      onError?.(event.data?.message || "Payment failed");
    }
  };

  window.addEventListener("message", messageHandler);

  // Also check if popup tries to redirect back (common payment flow)
  // Some payment providers redirect to a success/failure URL
  let lastUrl = url;
  checkUrlChange = setInterval(() => {
    try {
      if (popup.closed) {
        return;
      }
      // Try to access popup location (may fail due to cross-origin)
      const currentUrl = popup.location.href;
      if (currentUrl !== lastUrl) {
        lastUrl = currentUrl;
        // If URL changed, payment might be processing
        // Check for success indicators in URL
        if (currentUrl.includes("success") || currentUrl.includes("callback")) {
          // Don't close immediately, let the interval check handle it
        }
      }
    } catch (e) {
      // Cross-origin error is expected, ignore
    }
  }, 1000);

  // Cleanup after 30 minutes (payment timeout)
  timeout = setTimeout(() => {
    cleanup();
    if (!popup.closed) {
      popup.close();
    }
    refocusParent();
    // If timeout fires, notify error callback if available
    onError?.("Payment timeout");
  }, 30 * 60 * 1000);

  return popup;
}

