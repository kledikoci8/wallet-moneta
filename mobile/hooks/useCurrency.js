import { useCallback, useEffect, useState } from "react";
import AsyncStorage from "@react-native-async-storage/async-storage";

const STORAGE_KEY = "@wallet_currency";

const SYMBOLS = {
  USD: "$",
  EUR: "€",
  ALL: "L",
  GBP: "£",
  JPY: "¥",
  CAD: "C$",
};

export function useCurrency() {
  const [code, setCodeState] = useState("USD");

  const load = useCallback(async () => {
    const v = await AsyncStorage.getItem(STORAGE_KEY);
    if (v && SYMBOLS[v]) setCodeState(v);
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  const setCode = useCallback(async (next) => {
    setCodeState(next);
    await AsyncStorage.setItem(STORAGE_KEY, next);
  }, []);

  const symbol = SYMBOLS[code] || "$";

  const format = useCallback(
    (amount) => {
      const n = parseFloat(amount);
      if (Number.isNaN(n)) return `${symbol}0.00`;
      return `${symbol}${Math.abs(n).toFixed(2)}`;
    },
    [symbol]
  );

  const formatSigned = useCallback(
    (amount) => {
      const n = parseFloat(amount);
      if (Number.isNaN(n)) return `${symbol}0.00`;
      const sign = n >= 0 ? "+" : "-";
      return `${sign}${symbol}${Math.abs(n).toFixed(2)}`;
    },
    [symbol]
  );

  return { symbol, code, setCode, format, formatSigned, reload: load };
}
