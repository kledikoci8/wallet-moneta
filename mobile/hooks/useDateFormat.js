import { useCallback, useEffect, useState } from "react";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { formatDateWithPreference } from "../lib/utils";

const STORAGE_KEY = "@wallet_date_format";

export function useDateFormat() {
  const [formatKey, setFormatKeyState] = useState("mmdd");

  const load = useCallback(async () => {
    const v = await AsyncStorage.getItem(STORAGE_KEY);
    if (v === "ddmm" || v === "iso" || v === "mmdd") setFormatKeyState(v);
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  const setFormatKey = useCallback(async (key) => {
    setFormatKeyState(key);
    await AsyncStorage.setItem(STORAGE_KEY, key);
  }, []);

  const formatDate = useCallback(
    (dateString) => formatDateWithPreference(dateString, formatKey),
    [formatKey]
  );

  return { formatKey, setFormatKey, formatDate, reload: load };
}
