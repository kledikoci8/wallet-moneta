import { useEffect } from "react";
import { Animated, Text, StyleSheet } from "react-native";

export function Toast({ message, visible, onHide, COLORS }) {
  const opacity = new Animated.Value(0);

  useEffect(() => {
    if (visible && message) {
      Animated.sequence([
        Animated.timing(opacity, {
          toValue: 1,
          duration: 200,
          useNativeDriver: true,
        }),
        Animated.delay(2800),
        Animated.timing(opacity, {
          toValue: 0,
          duration: 200,
          useNativeDriver: true,
        }),
      ]).start(() => onHide?.());
    }
  }, [visible, message]);

  if (!visible || !message) return null;

  return (
    <Animated.View
      style={[
        styles.wrap,
        { opacity, backgroundColor: COLORS?.expense || "#C62828" },
      ]}
      pointerEvents="none"
    >
      <Text style={styles.text}>{message}</Text>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    position: "absolute",
    bottom: 100,
    left: 20,
    right: 20,
    padding: 14,
    borderRadius: 12,
    zIndex: 9999,
  },
  text: {
    color: "#fff",
    textAlign: "center",
    fontWeight: "600",
  },
});
