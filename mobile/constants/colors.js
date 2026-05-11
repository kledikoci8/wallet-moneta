const forestTheme = {
  primary: "#2E7D32",
  background: "#E8F5E9",
  text: "#1B5E20",
  border: "#C8E6C9",
  white: "#FFFFFF",
  textLight: "#66BB6A",
  expense: "#C62828",
  income: "#388E3C",
  card: "#FFFFFF",
  shadow: "#000000",
};

const darkTheme = {
  primary: "#66BB6A",
  background: "#121212",
  text: "#E8F5E9",
  border: "#2E3B2E",
  white: "#1E1E1E",
  textLight: "#81C784",
  expense: "#EF5350",
  income: "#81C784",
  card: "#1E1E1E",
  shadow: "#000000",
};

export const THEMES = {
  forest: forestTheme,
  dark: darkTheme,
};

export const COLORS = THEMES.forest;

/** Distinct slice colors for category donut (forest-friendly) */
export const CATEGORY_COLORS = {
  "Food & Drinks": "#2E7D32",
  Shopping: "#1976D2",
  Transportation: "#7B1FA2",
  Entertainment: "#C62828",
  Bills: "#F57C00",
  Income: "#00897B",
  Other: "#5D4037",
};
