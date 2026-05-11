import { View, Text, TouchableOpacity, FlatList, Dimensions } from "react-native";
import { useRef, useState, useMemo } from "react";
import { useRouter } from "expo-router";
import AsyncStorage from "@react-native-async-storage/async-storage";
import Svg, { Circle, Rect } from "react-native-svg";
import { useTheme } from "../../hooks/useTheme";
import { createGoalsStyles } from "../../assets/styles/goals.styles";

const { width } = Dimensions.get("window");

const SLIDES = [
  {
    key: "1",
    title: "Track your money",
    subtitle:
      "Log income and expenses in seconds so you always know where your money goes.",
  },
  {
    key: "2",
    title: "Set savings goals",
    subtitle: "Create goals with targets and deadlines and watch your progress grow.",
  },
  {
    key: "3",
    title: "Understand your spending",
    subtitle: "Charts and calendars reveal patterns so you can budget with confidence.",
  },
  {
    key: "4",
    title: "Meet FinBot",
    subtitle: "Your AI assistant answers questions about your finances using your real data.",
  },
];

export default function OnboardingScreen() {
  const router = useRouter();
  const { COLORS } = useTheme();
  const styles = useMemo(() => createGoalsStyles(COLORS), [COLORS]);
  const listRef = useRef(null);
  const [index, setIndex] = useState(0);

  const finish = async () => {
    await AsyncStorage.setItem("@wallet_onboarded", "true");
    router.replace("/");
  };

  const next = () => {
    if (index < SLIDES.length - 1) {
      listRef.current?.scrollToIndex({ index: index + 1, animated: true });
    } else {
      finish();
    }
  };

  return (
    <View style={{ flex: 1, backgroundColor: COLORS.background }}>
      <FlatList
        ref={listRef}
        data={SLIDES}
        keyExtractor={(item) => item.key}
        horizontal
        pagingEnabled
        showsHorizontalScrollIndicator={false}
        onMomentumScrollEnd={(e) => {
          const i = Math.round(e.nativeEvent.contentOffset.x / width);
          setIndex(i);
        }}
        renderItem={({ item, index: i }) => (
          <View style={{ width, padding: 24, justifyContent: "center" }}>
            <View style={{ alignItems: "center", marginBottom: 24 }}>
              <Svg width={140} height={140}>
                <Circle cx={70} cy={70} r={65} fill={COLORS.primary} opacity={0.15} />
                <Rect x={45} y={45} width={50} height={50} rx={10} fill={COLORS.primary} opacity={0.5} />
              </Svg>
            </View>
            <Text
              style={{ fontSize: 24, fontWeight: "800", color: COLORS.text, textAlign: "center" }}
            >
              {item.title}
            </Text>
            <Text
              style={{
                marginTop: 12,
                fontSize: 15,
                color: COLORS.textLight,
                textAlign: "center",
                lineHeight: 22,
              }}
            >
              {item.subtitle}
            </Text>
            <View
              style={{
                flexDirection: "row",
                justifyContent: "center",
                marginTop: 20,
                gap: 6,
              }}
            >
              {SLIDES.map((_, dot) => (
                <View
                  key={dot}
                  style={{
                    width: 8,
                    height: 8,
                    borderRadius: 4,
                    backgroundColor: dot === i ? COLORS.primary : COLORS.border,
                  }}
                />
              ))}
            </View>
          </View>
        )}
      />
      <View style={{ padding: 20, paddingBottom: 36 }}>
        {index < SLIDES.length - 1 ? (
          <TouchableOpacity onPress={finish} style={{ alignItems: "center", marginBottom: 12 }}>
            <Text style={{ color: COLORS.textLight }}>Skip</Text>
          </TouchableOpacity>
        ) : null}
        <TouchableOpacity
          style={{
            backgroundColor: COLORS.primary,
            padding: 16,
            borderRadius: 14,
            alignItems: "center",
          }}
          onPress={next}
        >
          <Text style={{ color: COLORS.white, fontWeight: "700", fontSize: 16 }}>
            {index === SLIDES.length - 1 ? "Get Started" : "Next"}
          </Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}
