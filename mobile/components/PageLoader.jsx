import { ActivityIndicator, View } from "react-native";
import { useMemo } from "react";
import { createHomeStyles } from "../assets/styles/home.styles";
import { useTheme } from "../hooks/useTheme";

const PageLoader = () => {
  const { COLORS } = useTheme();
  const styles = useMemo(() => createHomeStyles(COLORS), [COLORS]);
  return (
    <View style={styles.loadingContainer}>
      <ActivityIndicator size="large" color={COLORS.primary} />
    </View>
  );
};
export default PageLoader;
