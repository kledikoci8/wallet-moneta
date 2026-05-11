import { useCallback, useState } from "react";
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

  const fetchTransactions = useCallback(async () => {
    try {
      const response = await fetch(`${API_URL}/transactions/${userId}`);
      const data = await response.json();
      setTransactions(data);
    } catch (error) {
      console.error("Error fetching transactions:", error);
    }
  }, [userId]);

  const fetchSummary = useCallback(async () => {
    try {
      const response = await fetch(`${API_URL}/transactions/summary/${userId}`);
      const data = await response.json();
      setSummary(data);
    } catch (error) {
      console.error("Error fetching summary:", error);
    }
  }, [userId]);

  const loadData = useCallback(async () => {
    try {
      if (!userId) return;
      setIsLoading(true);
      await Promise.all([fetchTransactions(), fetchSummary()]);
    } catch (error) {
      console.error("Error loading data:", error);
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
      Alert.alert("Transaction deleted successfully");
    } catch (error) {
      console.error("Error deleting transaction:", error);
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
  };
};
