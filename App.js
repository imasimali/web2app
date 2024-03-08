import React, { useState, useEffect } from "react";
import { StyleSheet, ActivityIndicator, BackHandler } from "react-native";
import { WebView } from "react-native-webview";

export default function App() {
  const [canGoBack, setCanGoBack] = useState(false);

  const onBackPress = () => {
    if (canGoBack) {
      this.webview.goBack();
      return true;
    }
    return false;
  };

  useEffect(() => {
    BackHandler.addEventListener("hardwareBackPress", onBackPress);
    return () => {
      BackHandler.removeEventListener("hardwareBackPress", onBackPress);
    };
  }, [canGoBack]);

  return (
    <WebView
      style={styles.container}
      source={{ uri: "https://shades-app.qp7grp.easypanel.host" }}
      startInLoadingState={true}
      renderLoading={() => <ActivityIndicator color="#0000ff" />}
      onNavigationStateChange={(navState) => setCanGoBack(navState.canGoBack)}
      ref={(ref) => (this.webview = ref)}
    />
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#fff",
  },
});
