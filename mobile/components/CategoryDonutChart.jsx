import { View, Text } from "react-native";
import { useMemo } from "react";
import Svg, { G, Path, Circle } from "react-native-svg";
import { CATEGORY_COLORS } from "../constants/colors";
import { useTheme } from "../hooks/useTheme";
import { useCurrency } from "../hooks/useCurrency";

const SIZE = 200;
const CX = SIZE / 2;
const CY = SIZE / 2;
const R_OUT = 80;
const R_IN = 48;

function polar(cx, cy, r, angle) {
  return {
    x: cx + r * Math.cos(angle),
    y: cy + r * Math.sin(angle),
  };
}

function donutSlice(cx, cy, r0, r1, a0, a1) {
  const p0 = polar(cx, cy, r0, a0);
  const p1 = polar(cx, cy, r1, a0);
  const p2 = polar(cx, cy, r1, a1);
  const p3 = polar(cx, cy, r0, a1);
  const large = a1 - a0 > Math.PI ? 1 : 0;
  return [
    `M ${p0.x} ${p0.y}`,
    `L ${p1.x} ${p1.y}`,
    `A ${r1} ${r1} 0 ${large} 1 ${p2.x} ${p2.y}`,
    `L ${p3.x} ${p3.y}`,
    `A ${r0} ${r0} 0 ${large} 0 ${p0.x} ${p0.y}`,
    "Z",
  ].join(" ");
}

export function CategoryDonutChart({ categories }) {
  const { COLORS: themeC } = useTheme();
  const { format } = useCurrency();

  const { slices, total } = useMemo(() => {
    const list = (categories || []).filter((c) => c.amount > 0);
    const t = list.reduce((s, c) => s + c.amount, 0);
    let angle = -Math.PI / 2;
    const out = list.map((c) => {
      const frac = t > 0 ? c.amount / t : 0;
      const a0 = angle;
      const a1 = angle + frac * 2 * Math.PI;
      angle = a1;
      return {
        ...c,
        a0,
        a1,
        color: c.color || CATEGORY_COLORS[c.category] || themeC.primary,
      };
    });
    return { slices: out, total: t };
  }, [categories, themeC.primary]);

  if (!categories || categories.length === 0 || total <= 0) {
    return (
      <View style={{ padding: 24, alignItems: "center" }}>
        <Text style={{ color: themeC.textLight }}>No spending this month</Text>
      </View>
    );
  }

  return (
    <View style={{ alignItems: "center", paddingVertical: 12 }}>
      <Svg width={SIZE} height={SIZE}>
        <G>
          {slices.map((s, i) => (
            <Path
              key={`${s.category}-${i}`}
              d={donutSlice(CX, CY, R_IN, R_OUT, s.a0, s.a1)}
              fill={s.color}
            />
          ))}
          <Circle cx={CX} cy={CY} r={R_IN - 2} fill={themeC.card} />
        </G>
      </Svg>
      <Text style={{ marginTop: -R_IN - 10, fontSize: 12, color: themeC.textLight }}>
        Total spend
      </Text>
      <Text style={{ fontSize: 20, fontWeight: "700", color: themeC.text }}>
        {format(total)}
      </Text>

      <View style={{ marginTop: 20, width: "100%", paddingHorizontal: 16 }}>
        {slices.map((s) => (
          <View
            key={s.category}
            style={{
              flexDirection: "row",
              alignItems: "center",
              marginBottom: 8,
            }}
          >
            <View
              style={{
                width: 10,
                height: 10,
                borderRadius: 5,
                backgroundColor: s.color,
                marginRight: 8,
              }}
            />
            <Text style={{ flex: 1, color: themeC.text }}>{s.category}</Text>
            <Text style={{ color: themeC.text, fontWeight: "600" }}>
              {format(s.amount)}
            </Text>
            <Text
              style={{
                color: themeC.textLight,
                marginLeft: 8,
                width: 48,
                textAlign: "right",
              }}
            >
              {total > 0 ? `${((s.amount / total) * 100).toFixed(0)}%` : ""}
            </Text>
          </View>
        ))}
      </View>
    </View>
  );
}
