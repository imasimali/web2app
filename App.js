import React, { useCallback, useEffect, useRef, useState } from "react";
import {
  ActivityIndicator,
  BackHandler,
  Linking,
  Platform,
  StyleSheet,
  ToastAndroid,
} from "react-native";
import { StatusBar } from "expo-status-bar";
import * as SplashScreen from "expo-splash-screen";
import NetInfo from "@react-native-community/netinfo";
import { SafeAreaProvider, SafeAreaView } from "react-native-safe-area-context";

import OfflineScreen from "./src/OfflineScreen";
import WebShell from "./src/WebShell";
import { FALLBACK_BACKGROUND, SITE_URL, isDarkColor } from "./src/config";

SplashScreen.preventAutoHideAsync().catch(() => {});

const EXIT_WINDOW_MS = 2000;

export default function App() {
  const [status, setStatus] = useState("loading");
  const [background, setBackground] = useState(FALLBACK_BACKGROUND);
  const [isConnected, setIsConnected] = useState(true);
  const [canGoBack, setCanGoBack] = useState(false);
  const [url, setUrl] = useState(null);
  const [attempt, setAttempt] = useState(0);

  const webview = useRef(null);
  const lastBackPress = useRef(0);
  const wasOffline = useRef(false);

  const reload = useCallback((next) => {
    if (next) setUrl(next);
    setStatus("loading");
    setAttempt((count) => count + 1);
  }, []);

  // App Links land here. Cold starts read the launch URL before the first
  // render of the WebView so we never show the home page and then jump.
  useEffect(() => {
    let cancelled = false;

    Linking.getInitialURL()
      .then((launchUrl) => {
        if (!cancelled) setUrl(launchUrl || SITE_URL);
      })
      .catch(() => {
        if (!cancelled) setUrl(SITE_URL);
      });

    const subscription = Linking.addEventListener("url", (event) => {
      if (event.url) reload(event.url);
    });

    return () => {
      cancelled = true;
      subscription.remove();
    };
  }, [reload]);

  // Only an offline-to-online transition should retry on its own. NetInfo
  // fires once on subscribe with the current state, so reacting to "online"
  // alone would retry forever whenever the site is down but the phone is not.
  useEffect(() => {
    return NetInfo.addEventListener((state) => {
      const online = Boolean(state.isConnected);
      setIsConnected(online);
      if (online && wasOffline.current && status === "failed") reload();
      wasOffline.current = !online;
    });
  }, [status, reload]);

  useEffect(() => {
    if (Platform.OS !== "android") return undefined;

    const subscription = BackHandler.addEventListener("hardwareBackPress", () => {
      if (status === "ready" && canGoBack) {
        webview.current?.goBack();
        return true;
      }

      const now = Date.now();
      if (now - lastBackPress.current < EXIT_WINDOW_MS) return false;

      lastBackPress.current = now;
      ToastAndroid.show("Press back again to exit", ToastAndroid.SHORT);
      return true;
    });

    return () => subscription.remove();
  }, [canGoBack, status]);

  // Hand the screen over only once there is something behind the splash.
  useEffect(() => {
    if (status === "loading") return;
    SplashScreen.hideAsync().catch(() => {});
  }, [status]);

  const handleNavigationStateChange = useCallback((navState) => {
    setCanGoBack(navState.canGoBack);
  }, []);

  const handleLoaded = useCallback(() => setStatus("ready"), []);
  const handleFailed = useCallback(() => setStatus("failed"), []);

  const dark = isDarkColor(background);

  return (
    <SafeAreaProvider>
      <StatusBar style={dark ? "light" : "dark"} />
      <SafeAreaView
        style={[styles.root, { backgroundColor: background }]}
        edges={["top", "bottom"]}
      >
        {status === "failed" ? (
          <OfflineScreen isConnected={isConnected} onRetry={() => reload()} />
        ) : url ? (
          <>
            <WebShell
              key={attempt}
              ref={webview}
              url={url}
              background={background}
              onBackground={setBackground}
              onLoaded={handleLoaded}
              onFailed={handleFailed}
              onNavigationStateChange={handleNavigationStateChange}
            />
            {status === "loading" ? (
              <ActivityIndicator
                style={styles.spinner}
                size="large"
                color={dark ? "#FFFFFF" : "#222A36"}
              />
            ) : null}
          </>
        ) : null}
      </SafeAreaView>
    </SafeAreaProvider>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
  },
  // Only ever seen on a retry. The splash covers the first load.
  spinner: {
    ...StyleSheet.absoluteFillObject,
  },
});
