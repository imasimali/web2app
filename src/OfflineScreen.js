import React from "react";
import { Pressable, StyleSheet, Text, View } from "react-native";

import { FALLBACK_BACKGROUND } from "./config";

export default function OfflineScreen({ isConnected, onRetry }) {
  const title = isConnected ? "Couldn't load the page" : "You're offline";
  const detail = isConnected
    ? "asimali.net didn't respond. It might be temporarily down."
    : "Reconnect and this will pick up on its own.";

  return (
    <View style={styles.container}>
      <Text style={styles.title}>{title}</Text>
      <Text style={styles.detail}>{detail}</Text>
      <Pressable
        accessibilityRole="button"
        onPress={onRetry}
        style={({ pressed }) => [styles.button, pressed && styles.buttonPressed]}
      >
        <Text style={styles.buttonLabel}>Try again</Text>
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 32,
    backgroundColor: FALLBACK_BACKGROUND,
  },
  title: {
    color: "#FFFFFF",
    fontSize: 20,
    fontWeight: "600",
    textAlign: "center",
  },
  detail: {
    color: "#9AA4B2",
    fontSize: 15,
    lineHeight: 22,
    marginTop: 10,
    textAlign: "center",
  },
  button: {
    marginTop: 28,
    paddingHorizontal: 28,
    paddingVertical: 12,
    borderRadius: 999,
    borderWidth: 1,
    borderColor: "#3C4657",
  },
  buttonPressed: {
    backgroundColor: "#2C3644",
  },
  buttonLabel: {
    color: "#FFFFFF",
    fontSize: 15,
    fontWeight: "600",
  },
});
