import { View, Text, TouchableOpacity } from "react-native";
import Svg, { Rect, Line } from "react-native-svg";
import { useTheme } from "../hooks/useTheme";

export default function EmptyBudgets({ onAdd }) {
  const { COLORS } = useTheme();
  return (
    <View style={{ alignItems: "center", padding: 24 }}>
      <Svg width={120} height={80}>
        <Rect x={10} y={40} width={20} height={30} fill={COLORS.primary} opacity={0.4} />
        <Rect x={40} y={25} width={20} height={45} fill={COLORS.primary} opacity={0.6} />
        <Rect x={70} y={15} width={20} height={55} fill={COLORS.primary} />
        <Line x1={0} y1={70} x2={120} y2={70} stroke={COLORS.border} strokeWidth={2} />
      </Svg>
      <Text style={{ fontSize: 18, fontWeight: "700", color: COLORS.text, marginTop: 16 }}>
        No budgets yet
      </Text>
      <Text style={{ color: COLORS.textLight, textAlign: "center", marginTop: 8 }}>
        Set a monthly limit per category to stay on track
      </Text>
      <TouchableOpacity
        style={{
          marginTop: 20,
          backgroundColor: COLORS.primary,
          paddingHorizontal: 24,
          paddingVertical: 12,
          borderRadius: 24,
        }}
        onPress={onAdd}
      >
        <Text style={{ color: COLORS.white, fontWeight: "700" }}>Add budget</Text>
      </TouchableOpacity>
    </View>
  );
}
