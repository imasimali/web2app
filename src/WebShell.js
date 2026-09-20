import React, { forwardRef, useCallback, useEffect, useRef } from "react";
import { Linking, StyleSheet } from "react-native";
import { WebView } from "react-native-webview";
import * as WebBrowser from "expo-web-browser";

import { ALLOWED_HOSTS, EXTERNAL_SCHEMES, LOAD_TIMEOUT_MS } from "./config";

// Reports the page's real background colour so the native chrome can match it,
// including when the site's own light/dark toggle is used. Reads the computed
// style rather than a class name so a site redesign doesn't break it.
const THEME_PROBE = `
(function () {
  if (window.__shellProbe) return;
  window.__shellProbe = true;

  var last = null;
  function read() {
    return window.getComputedStyle(document.body).backgroundColor;
  }
  function report() {
    var value = read();
    if (value === last) return;
    last = value;
    window.ReactNativeWebView.postMessage(
      JSON.stringify({ type: 'background', value: value })
    );
  }

  // The class flips before the colour does: a themed site can hold the old
  // background for the length of its transition delay (asimali.net waits a
  // full second, then steps). Equality between two reads does not mean
  // settled, it usually means the change has not started, so just sample
  // across a window wide enough to catch it. report() dedupes, so this
  // emits exactly once per actual change.
  var pending = null;
  function watch(remaining) {
    clearTimeout(pending);
    if (remaining <= 0) return;
    pending = setTimeout(function () {
      report();
      watch(remaining - 1);
    }, 100);
  }

  var observer = new MutationObserver(function () { watch(25); });
  var options = { attributes: true, attributeFilter: ['class', 'style', 'data-theme'] };
  observer.observe(document.documentElement, options);
  observer.observe(document.body, options);

  // Sample on startup too, not just on mutation. A site that restores a saved
  // theme does it before this script runs, so there is no mutation to react
  // to, and the colour can still be settling when we take the first reading.
  report();
  watch(25);
})();
true;
`;

function hostOf(url) {
  const match = /^https?:\/\/([^/?#]+)/i.exec(url);
  return match ? match[1].toLowerCase().split(":")[0] : null;
}

const WebShell = forwardRef(function WebShell(
  { url, background, onBackground, onLoaded, onFailed, onNavigationStateChange },
  ref
) {
  const timer = useRef(null);
  const loadedOnce = useRef(false);

  const clearTimer = useCallback(() => {
    if (timer.current) {
      clearTimeout(timer.current);
      timer.current = null;
    }
  }, []);

  useEffect(() => {
    timer.current = setTimeout(() => {
      if (!loadedOnce.current) onFailed();
    }, LOAD_TIMEOUT_MS);
    return clearTimer;
  }, [clearTimer, onFailed]);

  const handleRequest = useCallback((request) => {
    const target = request.url;

    if (EXTERNAL_SCHEMES.some((scheme) => target.startsWith(scheme))) {
      Linking.openURL(target).catch(() => {});
      return false;
    }

    // Sub-frames (the embedded map) are the page's own business. Only skip on
    // an explicit false: Android leaves isTopFrame undefined at runtime despite
    // declaring it, and a truthiness check there sends every external link
    // straight back into the WebView. Android only fires this for the main
    // frame anyway, so undefined is safe to treat as top-frame.
    if (request.isTopFrame === false || !target.startsWith("http")) return true;
    if (ALLOWED_HOSTS.includes(hostOf(target))) return true;

    WebBrowser.openBrowserAsync(target).catch(() =>
      Linking.openURL(target).catch(() => {})
    );
    return false;
  }, []);

  const handleMessage = useCallback(
    (event) => {
      try {
        const payload = JSON.parse(event.nativeEvent.data);
        if (payload.type === "background") onBackground(payload.value);
      } catch {
        // Not ours. The page may postMessage for its own reasons.
      }
    },
    [onBackground]
  );

  const handleLoad = useCallback(() => {
    loadedOnce.current = true;
    clearTimer();
    onLoaded();
  }, [clearTimer, onLoaded]);

  const handleFailure = useCallback(() => {
    clearTimer();
    onFailed();
  }, [clearTimer, onFailed]);

  const handleHttpError = useCallback(
    (event) => {
      // Android reports sub-resource failures here too, so only a failure
      // before the document has ever rendered should take over the screen.
      if (loadedOnce.current) return;
      if (event.nativeEvent.statusCode >= 400) handleFailure();
    },
    [handleFailure]
  );

  return (
    <WebView
      ref={ref}
      source={{ uri: url }}
      style={[styles.webview, { backgroundColor: background }]}
      injectedJavaScript={THEME_PROBE}
      onMessage={handleMessage}
      onShouldStartLoadWithRequest={handleRequest}
      onNavigationStateChange={onNavigationStateChange}
      onLoad={handleLoad}
      onError={handleFailure}
      onHttpError={handleHttpError}
      // Android kills the render process under memory pressure. Unhandled,
      // that is a permanent white screen.
      onRenderProcessGone={handleFailure}
      onContentProcessDidTerminate={handleFailure}
      // target="_blank" links go nowhere on Android without this.
      setSupportMultipleWindows={false}
      allowsBackForwardNavigationGestures
      pullToRefreshEnabled
    />
  );
});

export default WebShell;

const styles = StyleSheet.create({
  webview: {
    flex: 1,
  },
});
