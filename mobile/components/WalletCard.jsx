import {
  View,
  Text,
  Pressable,
  Animated,
  StyleSheet,
  Platform,
  useWindowDimensions,
} from "react-native";
import { memo, useMemo, useRef, useState, useEffect, useCallback } from "react";
import AsyncStorage from "@react-native-async-storage/async-storage";
import Svg, { Defs, LinearGradient, Rect, Stop } from "react-native-svg";
import { Ionicons } from "@expo/vector-icons";
import { useCurrency } from "../hooks/useCurrency";
import { useTheme } from "../hooks/useTheme";

const FLIP_HINT_KEY = "@wallet_card_flipped";

/** Back-of-card figures: same totals as `/transactions/summary` (all income / all expenses). */
function useSummaryTotals(summary) {
  return useMemo(() => {
    const income = parseFloat(summary?.income ?? 0) || 0;
    const expensesRaw = parseFloat(summary?.expenses ?? 0) || 0;
    const expenses = Math.abs(expensesRaw);
    const savingsRate = income > 0 ? ((income - expenses) / income) * 100 : 0;
    return { income, expenses, savingsRate };
  }, [summary?.income, summary?.expenses]);
}

function CardGradientBg({ width, height, gradientId, variant }) {
  if (width <= 0 || height <= 0) return null;
  const stops =
    variant === "back"
      ? [
          <Stop key="b0" offset="0" stopColor="#43A047" />,
          <Stop key="b1" offset="0.5" stopColor="#2E7D32" />,
          <Stop key="b2" offset="1" stopColor="#0D2818" />,
        ]
      : [
          <Stop key="f0" offset="0" stopColor="#388E3C" />,
          <Stop key="f1" offset="0.42" stopColor="#2E7D32" />,
          <Stop key="f2" offset="1" stopColor="#1B5E20" />,
        ];
  return (
    <Svg
      width={width}
      height={height}
      style={StyleSheet.absoluteFill}
      pointerEvents="none"
    >
      <Defs>
        <LinearGradient
          id={gradientId}
          x1="0"
          y1="0"
          x2={width}
          y2={height}
          gradientUnits="userSpaceOnUse"
        >
          {stops}
        </LinearGradient>
      </Defs>
      <Rect x={0} y={0} width={width} height={height} rx={22} ry={22} fill={`url(#${gradientId})`} />
    </Svg>
  );
}

function formatAccountLabel(name) {
  if (!name || typeof name !== "string") return "ACCOUNT";
  const t = name.trim();
  if (!t) return "ACCOUNT";
  return t.length > 22 ? `${t.slice(0, 22)}…` : t;
}

export const WalletCard = memo(function WalletCard({
  summary,
  transactions: _transactions = [],
  accountName,
}) {
  const { COLORS } = useTheme();
  const { format } = useCurrency();
  const totals = useSummaryTotals(summary);
  const { width: screenW } = useWindowDimensions();

  const flipAnim = useRef(new Animated.Value(0)).current;
  const flippedRef = useRef(false);
  const [showHint, setShowHint] = useState(true);
  const [cardW, setCardW] = useState(0);

  useEffect(() => {
    let cancelled = false;
    AsyncStorage.getItem(FLIP_HINT_KEY).then((v) => {
      if (!cancelled && v === "true") setShowHint(false);
    });
    return () => {
      cancelled = true;
    };
  }, []);

  const rotateY = useMemo(
    () =>
      flipAnim.interpolate({
        inputRange: [0, 1],
        outputRange: ["0deg", "180deg"],
      }),
    [flipAnim]
  );

  // Opacity crossfade avoids Android/iOS bugs with backfaceVisibility + overflow + elevation + native rotateY.
  const frontOpacity = useMemo(
    () =>
      flipAnim.interpolate({
        inputRange: [0, 0.46, 0.54, 1],
        outputRange: [1, 1, 0, 0],
      }),
    [flipAnim]
  );
  const backOpacity = useMemo(
    () =>
      flipAnim.interpolate({
        inputRange: [0, 0.46, 0.54, 1],
        outputRange: [0, 0, 1, 1],
      }),
    [flipAnim]
  );

  const onFlip = useCallback(() => {
    flippedRef.current = !flippedRef.current;
    Animated.spring(flipAnim, {
      toValue: flippedRef.current ? 1 : 0,
      friction: 8,
      tension: 56,
      useNativeDriver: true,
    }).start();
    AsyncStorage.setItem(FLIP_HINT_KEY, "true");
    setShowHint(false);
  }, [flipAnim]);

  const balance = summary?.balance ?? 0;
  const holder = formatAccountLabel(accountName);
  const cardHeight = Math.min(228, Math.max(184, Math.round(screenW * 0.48)));
  const cardH = cardHeight;
  const gradW = cardW > 0 ? cardW : Math.max(0, Math.round(screenW - 40));

  const onClipLayout = useCallback((e) => {
    const w = Math.round(e.nativeEvent.layout.width);
    if (w <= 0) return;
    setCardW((prev) => (prev === w ? prev : w));
  }, []);

  return (
    <View style={styles.outer}>
      {/* Shadow / elevation on a wrapper that is NOT transformed (Android draw issues). */}
      <View style={[styles.shadowShell, { height: cardHeight }]}>
        <View
          style={[styles.clipInner, { height: cardHeight }]}
          onLayout={onClipLayout}
        >
          <Pressable
            onPress={onFlip}
            accessibilityRole="button"
            accessibilityLabel="Wallet card, tap to flip"
            style={styles.pressableFill}
          >
            <Animated.View
              style={[
                styles.flipStage,
                { height: cardHeight },
                { transform: [{ perspective: 1600 }, { rotateY }] },
              ]}
              needsOffscreenAlphaCompositing={Platform.OS === "ios"}
            >
              {/* Front */}
              <Animated.View
                style={[styles.faceLayer, { opacity: frontOpacity }]}
                collapsable={false}
                pointerEvents="box-none"
              >
                <View style={styles.faceInner}>
                  <CardGradientBg
                    width={gradW}
                    height={cardH}
                    gradientId="walletCardGradFront"
                    variant="front"
                  />
                  <View style={styles.faceContent}>
                    <View style={styles.frontTopRow}>
                      <View style={styles.frontTopSpacer} />
                      <Text style={styles.walletBadge}>WALLET</Text>
                    </View>
                    <View style={styles.frontCenter}>
                      <Text style={styles.labelCaps}>TOTAL BALANCE</Text>
                      <Text
                        style={styles.balanceHuge}
                        numberOfLines={1}
                        adjustsFontSizeToFit
                        minimumFontScale={0.65}
                      >
                        {format(balance)}
                      </Text>
                    </View>
                    <View style={styles.frontFooter}>
                      <Text style={styles.accountNameOnCard} numberOfLines={1}>
                        {holder.toUpperCase()}
                      </Text>
                      <View style={styles.tapFlipRow}>
                        <Text style={styles.tapFlipOnCard}>TAP TO FLIP</Text>
                        <Ionicons name="sync-outline" size={14} color="rgba(255,255,255,0.75)" />
                      </View>
                    </View>
                  </View>
                </View>
              </Animated.View>

              {/* Back — pre-rotated 180° so it reads correctly when the stage hits 180° */}
              <Animated.View
                style={[
                  styles.faceLayer,
                  { opacity: backOpacity, transform: [{ rotateY: "180deg" }] },
                ]}
                collapsable={false}
                pointerEvents="box-none"
              >
                <View style={styles.faceInner}>
                  <CardGradientBg
                    width={gradW}
                    height={cardH}
                    gradientId="walletCardGradBack"
                    variant="back"
                  />
                  <View style={[styles.faceContent, styles.faceContentBack]}>
                    <Text style={styles.labelCapsMuted}>TOTALS</Text>
                    <View style={styles.backMiddle}>
                      <View style={styles.splitRow}>
                        <View style={styles.splitCol}>
                          <Text style={styles.amountSplit} numberOfLines={1}>
                            {format(totals.income)}
                          </Text>
                          <Text style={styles.subLabel}>↑ INCOME</Text>
                        </View>
                        <View style={styles.vDivider} />
                        <View style={styles.splitCol}>
                          <Text style={styles.amountSplit} numberOfLines={1}>
                            {format(totals.expenses)}
                          </Text>
                          <Text style={styles.subLabel}>↓ EXPENSES</Text>
                        </View>
                      </View>
                    </View>
                    <Text style={styles.savingsLine}>
                      Savings rate: {totals.savingsRate.toFixed(1)}%
                    </Text>
                  </View>
                </View>
              </Animated.View>
            </Animated.View>
          </Pressable>
        </View>
      </View>
      {showHint ? (
        <Text style={[styles.hintBelow, { color: COLORS.textLight }]}>Tap to flip</Text>
      ) : null}
    </View>
  );
});

const styles = StyleSheet.create({
  outer: {
    marginBottom: 20,
  },
  shadowShell: {
    borderRadius: 22,
    ...Platform.select({
      ios: {
        shadowColor: "#000",
        shadowOffset: { width: 0, height: 12 },
        shadowOpacity: 0.32,
        shadowRadius: 22,
      },
      android: { elevation: 12 },
    }),
  },
  clipInner: {
    borderRadius: 22,
    overflow: "hidden",
    backgroundColor: "#1B5E20",
  },
  pressableFill: {
    flex: 1,
  },
  flipStage: {
    width: "100%",
  },
  faceLayer: {
    ...StyleSheet.absoluteFillObject,
  },
  faceInner: {
    flex: 1,
    borderRadius: 22,
    overflow: "hidden",
    backgroundColor: "#1B5E20",
  },
  faceContent: {
    ...StyleSheet.absoluteFillObject,
    paddingHorizontal: 22,
    paddingVertical: 18,
    zIndex: 1,
  },
  faceContentBack: {
    justifyContent: "space-between",
  },
  frontTopRow: {
    flexDirection: "row",
    justifyContent: "flex-end",
    alignItems: "center",
    marginBottom: 4,
  },
  frontTopSpacer: {
    flex: 1,
  },
  walletBadge: {
    fontSize: 10,
    fontWeight: "800",
    letterSpacing: 2,
    color: "rgba(255,255,255,0.88)",
  },
  frontCenter: {
    flexGrow: 1,
    justifyContent: "center",
    paddingVertical: 4,
  },
  backMiddle: {
    flexGrow: 1,
    justifyContent: "center",
    minHeight: 88,
  },
  labelCaps: {
    fontSize: 11,
    fontWeight: "700",
    letterSpacing: 1.6,
    color: "rgba(255,255,255,0.72)",
  },
  labelCapsMuted: {
    fontSize: 11,
    fontWeight: "700",
    letterSpacing: 1.6,
    color: "rgba(255,255,255,0.65)",
    marginBottom: 4,
  },
  balanceHuge: {
    fontSize: 38,
    fontWeight: "800",
    color: "#FFFFFF",
    letterSpacing: -0.8,
    marginTop: 8,
  },
  frontFooter: {
    flexDirection: "row",
    alignItems: "flex-end",
    justifyContent: "space-between",
    gap: 12,
    paddingTop: 8,
  },
  accountNameOnCard: {
    flex: 1,
    fontSize: 12,
    fontWeight: "700",
    letterSpacing: 1.2,
    color: "rgba(255,255,255,0.92)",
  },
  tapFlipRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
  },
  tapFlipOnCard: {
    fontSize: 10,
    fontWeight: "700",
    letterSpacing: 1.4,
    color: "rgba(255,255,255,0.78)",
  },
  splitRow: {
    flexDirection: "row",
    alignItems: "center",
    width: "100%",
    minHeight: 84,
  },
  splitCol: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    paddingVertical: 4,
  },
  vDivider: {
    width: StyleSheet.hairlineWidth,
    alignSelf: "stretch",
    backgroundColor: "rgba(255,255,255,0.38)",
    marginHorizontal: 4,
  },
  amountSplit: {
    fontSize: 22,
    fontWeight: "800",
    color: "#FFFFFF",
    letterSpacing: -0.5,
    textAlign: "center",
    width: "100%",
  },
  subLabel: {
    marginTop: 6,
    fontSize: 10,
    fontWeight: "700",
    letterSpacing: 1.2,
    color: "rgba(255,255,255,0.75)",
  },
  savingsLine: {
    fontSize: 15,
    fontWeight: "600",
    color: "rgba(255,255,255,0.98)",
    textAlign: "center",
    paddingTop: 4,
    paddingBottom: 2,
  },
  hintBelow: {
    textAlign: "center",
    fontSize: 12,
    marginTop: 10,
    opacity: 0.75,
    fontWeight: "500",
    letterSpacing: 0.3,
  },
});
