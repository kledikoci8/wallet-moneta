import { View, Text, TouchableOpacity, ScrollView, Dimensions, StyleSheet } from "react-native";
import { useState } from "react";
import { useRouter } from "expo-router";
import AsyncStorage from "@react-native-async-storage/async-storage";
import Svg, { Circle, Rect } from "react-native-svg";
import { useTheme } from "../../hooks/useTheme";

const { width, height } = Dimensions.get("window");

const SLIDES = [
  {
    key: "1",
    title: "Track your money",
    subtitle: "Log income and expenses in seconds so you always know where your money goes.",
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
  const [index, setIndex] = useState(0);

  const finish = async () => {
    try {
      await AsyncStorage.setItem("@wallet_onboarded", "true");
      router.push("/");
    } catch (error) {
      console.error("[Onboarding] Error setting onboarding flag:", error);
    }
  };

  const next = () => {
    if (index < SLIDES.length - 1) {
      setIndex(index + 1);
    } else {
      finish();
    }
  };

  const skip = () => {
    finish();
  };

  const currentSlide = SLIDES[index];

  return (
    <View style={[styles.container, { backgroundColor: COLORS.background }]}>
      {/* Content */}
      <View style={styles.content}>
        {/* Icon */}
        <View style={styles.iconContainer}>
          <Svg width={140} height={140}>
            <Circle cx={70} cy={70} r={65} fill={COLORS.primary} opacity={0.15} />
            <Rect x={45} y={45} width={50} height={50} rx={10} fill={COLORS.primary} opacity={0.5} />
          </Svg>
        </View>

        {/* Title */}
        <Text style={[styles.title, { color: COLORS.text }]}>
          {currentSlide.title}
        </Text>

        {/* Subtitle */}
        <Text style={[styles.subtitle, { color: COLORS.textLight }]}>
          {currentSlide.subtitle}
        </Text>

        {/* Dots */}
        <View style={styles.dotsContainer}>
          {SLIDES.map((_, i) => (
            <View
              key={i}
              style={[
                styles.dot,
                {
                  backgroundColor: i === index ? COLORS.primary : COLORS.border,
                  width: i === index ? 24 : 8,
                },
              ]}
            />
          ))}
        </View>
      </View>

      {/* Buttons */}
      <View style={[styles.footer, { backgroundColor: COLORS.background }]}>
        {index < SLIDES.length - 1 && (
          <TouchableOpacity onPress={skip} style={styles.skipButton}>
            <Text style={[styles.skipText, { color: COLORS.textLight }]}>Skip</Text>
          </TouchableOpacity>
        )}
        
        <TouchableOpacity
          style={[styles.nextButton, { backgroundColor: COLORS.primary }]}
          onPress={next}
        >
          <Text style={styles.nextButtonText}>
            {index === SLIDES.length - 1 ? "Get Started" : "Next"}
          </Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  content: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    paddingHorizontal: 32,
  },
  iconContainer: {
    marginBottom: 40,
  },
  title: {
    fontSize: 28,
    fontWeight: "800",
    textAlign: "center",
    marginBottom: 16,
  },
  subtitle: {
    fontSize: 16,
    textAlign: "center",
    lineHeight: 24,
    marginBottom: 40,
  },
  dotsContainer: {
    flexDirection: "row",
    justifyContent: "center",
    alignItems: "center",
    gap: 8,
  },
  dot: {
    height: 8,
    borderRadius: 4,
  },
  footer: {
    padding: 24,
    paddingBottom: 40,
  },
  skipButton: {
    alignItems: "center",
    marginBottom: 16,
    padding: 8,
  },
  skipText: {
    fontSize: 16,
    fontWeight: "600",
  },
  nextButton: {
    padding: 18,
    borderRadius: 14,
    alignItems: "center",
  },
  nextButtonText: {
    color: "#FFFFFF",
    fontSize: 17,
    fontWeight: "700",
  },
});
