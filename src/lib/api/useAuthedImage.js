// ─── Authenticated image loading ─────────────────────────────────────────────
// The API authenticates with `Authorization: Bearer`, and an <img src> cannot
// send that header. So any photo on a `members` or `private` tier would 401 and
// render broken. This hook fetches the bytes with the token and hands back an
// object URL instead.
//
// Two caching consequences, both deliberate:
//   - object URLs are per-document, so a page must reload them after a change
//     (that is what `reload` is for);
//   - the 401/404 is cached too, so a photo that becomes visible later still
//     needs a reload — which is exactly when the tier is toggled.
import { useEffect, useState, useCallback } from 'react';
import { http, apiUrl } from './transport';

export function useAuthedImage(path, reload = 0) {
  const [state, setState] = useState({ url: null, loading: false, status: null });

  const load = useCallback(async () => {
    if (!path) {
      setState({ url: null, loading: false, status: null });
      return;
    }
    setState((s) => ({ ...s, loading: true }));
    try {
      const res = await http.raw(apiUrl(path));
      if (!res.ok) {
        setState({ url: null, loading: false, status: res.status });
        return;
      }
      const blob = await res.blob();
      const url = URL.createObjectURL(blob);
      // Revoke the previous object URL so a long session does not leak blobs.
      setState((s) => {
        if (s.url) URL.revokeObjectURL(s.url);
        return { url, loading: false, status: res.status };
      });
    } catch {
      setState({ url: null, loading: false, status: 0 });
    }
  }, [path]);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      if (cancelled) return;
      await load();
    })();
    return () => { cancelled = true; };
  }, [load, reload]);

  // Release the blob when the component unmounts.
  useEffect(() => () => { if (state.url) URL.revokeObjectURL(state.url); }, [state.url]);

  return state;
}