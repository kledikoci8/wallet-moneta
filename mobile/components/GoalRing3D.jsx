import { View, Text } from "react-native";
import Svg, { Circle } from "react-native-svg";

/**
 * 2D goal progress ring using SVG (replaces 3D version for better performance).
 * @param {number} progress 0–1
 * @param {string} color hex color
 * @param {number} [size=80]
 */
export function GoalRing3D({ progress, color, size = 80 }) {
  const strokeWidth = size * 0.12;
  const radius = (size - strokeWidth) / 2;
  const circumference = 2 * Math.PI * radius;
  const progressValue = Math.min(1, Math.max(0, progress));
  const strokeDashoffset = circumference * (1 - progressValue);
  const percentage = Math.round(progressValue * 100);

  return (
    <View style={{ width: size, height: size, alignItems: "center", justifyContent: "center" }}>
      <Svg width={size} height={size} style={{ transform: [{ rotate: "-90deg" }] }}>
        {/* Background circle */}
        <Circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          stroke="#E0E0E0"
          strokeWidth={strokeWidth}
          fill="none"
        />
        {/* Progress circle */}
        <Circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          stroke={color}
          strokeWidth={strokeWidth}
          fill="none"
          strokeDasharray={circumference}
          strokeDashoffset={strokeDashoffset}
          strokeLinecap="round"
        />
      </Svg>
      {/* Percentage text in center */}
      <View
        style={{
          position: "absolute",
          alignItems: "center",
          justifyContent: "center",
        }}
      >
        <Text style={{ fontSize: size * 0.25, fontWeight: "700", color: color }}>
          {percentage}%
        </Text>
      </View>
    </View>
  );
}
