import { View, Text, TouchableOpacity } from "react-native";
import Svg, { Path, Circle } from "react-native-svg";
import { useTheme } from "../hooks/useTheme";

export default function EmptyGoals({ onCreate }) {
  const { COLORS } = useTheme();
  return (
    <View style={{ alignItems: "center", padding: 32 }}>
      <Svg width={100} height={100}>
        <Circle cx={50} cy={50} r={40} fill={COLORS.primary} opacity={0.15} />
        <Path
          d="M50 20 L55 45 L80 45 L60 60 L68 85 L50 70 L32 85 L40 60 L20 45 L45 45 Z"
          fill={COLORS.primary}
        />
      </Svg>
      <Text style={{ fontSize: 18, fontWeight: "700", color: COLORS.text, marginTop: 16 }}>
        No goals yet
      </Text>
      <Text style={{ color: COLORS.textLight, textAlign: "center", marginTop: 8 }}>
        Set a savings goal to start tracking your progress
      </Text>
      <TouchableOpacity
        style={{
          marginTop: 20,
          backgroundColor: COLORS.primary,
          paddingHorizontal: 24,
          paddingVertical: 12,
          borderRadius: 24,
        }}
        onPress={onCreate}
      >
        <Text style={{ color: COLORS.white, fontWeight: "700" }}>Create a Goal</Text>
      </TouchableOpacity>
    </View>
  );
}
