import { useCallback, useState, useRef } from "react";
import { Alert } from "react-native";
import { API_URL } from "../constants/api";

export const useTransactions = (userId) => {
  const [transactions, setTransactions] = useState([]);
  const [summary, setSummary] = useState({
    balance: 0,
    income: 0,
    expenses: 0,
  });
  const [IsLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);
  
  // Use ref to track if initial load has been attempted
  const hasLoadedRef = useRef(false);

  const fetchTransactions = useCallback(async () => {
    if (!userId) {
      return;
    }
    
    try {
      const response = await fetch(`${API_URL}/transactions/${userId}`, {
        method: "GET",
        headers: {
          "Content-Type": "application/json",
        },
      });
      
      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }
      
      const data = await response.json();
      setTransactions(data);
      setError(null);
    } catch (error) {
      console.error("[useTransactions] Error fetching transactions:", error.message);
      setError(error.message);
      // Don't throw - allow app to continue with empty data
      setTransactions([]);
    }
  }, [userId]);

  const fetchSummary = useCallback(async () => {
    if (!userId) {
      return;
    }
    
    try {
      const response = await fetch(`${API_URL}/transactions/summary/${userId}`, {
        method: "GET",
        headers: {
          "Content-Type": "application/json",
        },
      });
      
      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }
      
      const data = await response.json();
      setSummary(data);
      setError(null);
    } catch (error) {
      console.error("[useTransactions] Error fetching summary:", error.message);
      setError(error.message);
      // Don't throw - allow app to continue with default summary
      setSummary({ balance: 0, income: 0, expenses: 0 });
    }
  }, [userId]);

  const loadData = useCallback(async () => {
    if (!userId) {
      setIsLoading(false);
      return;
    }
    
    setIsLoading(true);
    setError(null);
    
    try {
      await Promise.all([fetchTransactions(), fetchSummary()]);
      hasLoadedRef.current = true;
    } catch (error) {
      console.error("[useTransactions] Error loading data:", error);
      setError(error.message);
      // Show user-friendly error
      Alert.alert(
        "Connection Error",
        "Unable to connect to the server. Please check:\n\n1. Backend is running on port 5001\n2. API_URL is correct in constants/api.js\n3. Your device is on the same network\n\nCurrent API_URL: " + API_URL,
        [{ text: "OK" }]
      );
    } finally {
      setIsLoading(false);
    }
  }, [userId, fetchTransactions, fetchSummary]);

  const deleteTransaction = async (id, opts = {}) => {
    const backup = [...transactions];
    setTransactions((prev) =>
      prev.filter((x) => Number(x.id) !== Number(id))
    );
    try {
      const response = await fetch(`${API_URL}/transactions/${id}`, {
        method: "DELETE",
      });
      if (!response.ok) throw new Error("Failed to delete transaction");
      await Promise.all([fetchTransactions(), fetchSummary()]);
      Alert.alert("Success", "Transaction deleted successfully");
    } catch (error) {
      console.error("[useTransactions] Error deleting transaction:", error);
      setTransactions(backup);
      opts.onRollback?.();
      Alert.alert("Error", error.message || "Delete failed");
    }
  };

  const updateTransaction = async (id, body) => {
    const response = await fetch(`${API_URL}/transactions/${id}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    });
    if (!response.ok) {
      const err = await response.json().catch(() => ({}));
      throw new Error(err.message || "Update failed");
    }
    await loadData();
  };

  return {
    transactions,
    setTransactions,
    summary,
    loadData,
    deleteTransaction,
    updateTransaction,
    IsLoading,
    error,
  };
};
