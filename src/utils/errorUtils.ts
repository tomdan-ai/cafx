// Utility to extract a user-friendly error message from various error shapes
export function getErrorMessage(error: any, fallback = 'An error occurred') {
  if (!error) return fallback;

  // If API returned a structured response body
  try {
    if (error.response?.data) {
      const d = error.response.data;
      if (typeof d === 'string' && d.trim()) return d;

      // Typical shapes:
      // { message: '...' } or { detail: '...' } or { error: '...' }
      if (typeof d === 'object' && d !== null) {
        if (typeof d.message === 'string' && d.message.trim()) return d.message;
        if (typeof d.detail === 'string' && d.detail.trim()) return d.detail;
        if (typeof d.error === 'string' && d.error.trim()) return d.error;

        // Validation error shape: { field: ["error1", "error2"] }
        const messages: string[] = [];
        for (const val of Object.values(d)) {
          if (!val) continue;
          if (typeof val === 'string') {
            if (val.trim()) messages.push(val.trim());
          } else if (Array.isArray(val)) {
            val.forEach((item) => {
              if (typeof item === 'string' && item.trim()) messages.push(item.trim());
              else if (item && typeof item === 'object' && typeof (item as any).message === 'string') messages.push((item as any).message);
            });
          } else if (typeof val === 'object') {
            // Nested object -> try to stringify useful parts
            try {
              const s = JSON.stringify(val);
              if (s && s !== '{}' && s !== '[object Object]') messages.push(s);
            } catch (e) {
              // ignore
            }
          }
        }
        if (messages.length) return messages.join('; ');
      }
    }
  } catch (e) {
    // ignore parsing errors and fall through
  }

  // Generic Error object message
  if (typeof error.message === 'string' && error.message.trim()) {
    // map long axios default text to shorter friendly text when possible
    const msg = error.message;
    if (msg.includes('Request failed with status code')) {
      const m = msg.match(/status code (\d+)/);
      return m ? `Request failed (${m[1]})` : 'Request failed';
    }
    return msg;
  }

  // Fallback to string coercion
  try {
    const s = String(error);
    if (s && s !== '[object Object]') return s;
  } catch (e) {
    // ignore
  }

  return fallback;
}
// Utility to extract a user-friendly error message from various error shapes
// (duplicate removed) keep the single implementation above
