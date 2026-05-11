import React, { createContext, useCallback, useContext, useEffect, useMemo, useState } from "react";
import { useColorScheme } from "react-native";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { THEMES } from "../constants/colors";

const STORAGE_KEY = "@wallet_theme";

const ThemeContext = createContext({
  COLORS: THEMES.forest,
  isDark: false,
  themeMode: "light",
  setThemeMode: () => {},
});

export function ThemeProvider({ children }) {
  const systemScheme = useColorScheme();
  const [themeMode, setThemeModeState] = useState("light");

  useEffect(() => {
    AsyncStorage.getItem(STORAGE_KEY).then((v) => {
      if (v === "dark" || v === "light" || v === "system") setThemeModeState(v);
    });
  }, []);

  const setThemeMode = useCallback(async (mode) => {
    setThemeModeState(mode);
    await AsyncStorage.setItem(STORAGE_KEY, mode);
  }, []);

  const isDark = useMemo(() => {
    if (themeMode === "dark") return true;
    if (themeMode === "light") return false;
    return systemScheme === "dark";
  }, [themeMode, systemScheme]);

  const COLORS = useMemo(
    () => (isDark ? THEMES.dark : THEMES.forest),
    [isDark]
  );

  const value = useMemo(
    () => ({
      COLORS,
      isDark,
      themeMode,
      setThemeMode,
    }),
    [COLORS, isDark, themeMode, setThemeMode]
  );

  return (
    <ThemeContext.Provider value={value}>{children}</ThemeContext.Provider>
  );
}

export function useTheme() {
  return useContext(ThemeContext);
}
