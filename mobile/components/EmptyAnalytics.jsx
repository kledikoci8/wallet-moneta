import { View, Text, TouchableOpacity } from "react-native";
import Svg, { Rect, Text as SvgText } from "react-native-svg";
import { useRouter } from "expo-router";
import { useTheme } from "../hooks/useTheme";

export default function EmptyAnalytics() {
  const { COLORS } = useTheme();
  const router = useRouter();
  return (
    <View style={{ alignItems: "center", padding: 32 }}>
      <Svg width={120} height={90}>
        <Rect x={10} y={50} width={25} height={30} fill={COLORS.textLight} opacity={0.4} />
        <Rect x={45} y={35} width={25} height={45} fill={COLORS.textLight} opacity={0.5} />
        <Rect x={80} y={20} width={25} height={60} fill={COLORS.textLight} opacity={0.35} />
        <SvgText x={52} y={28} fontSize="22" fill={COLORS.text}>
          ?
        </SvgText>
      </Svg>
      <Text style={{ fontSize: 18, fontWeight: "700", color: COLORS.text, marginTop: 16 }}>
        Not enough data
      </Text>
      <Text style={{ color: COLORS.textLight, textAlign: "center", marginTop: 8 }}>
        Add at least a few transactions to see your analytics
      </Text>
      <TouchableOpacity
        style={{
          marginTop: 20,
          backgroundColor: COLORS.primary,
          paddingHorizontal: 24,
          paddingVertical: 12,
          borderRadius: 24,
        }}
        onPress={() => router.push("/create")}
      >
        <Text style={{ color: COLORS.white, fontWeight: "700" }}>Add Transaction</Text>
      </TouchableOpacity>
    </View>
  );
}
