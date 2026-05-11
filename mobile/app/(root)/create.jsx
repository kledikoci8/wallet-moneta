import {
  View,
  Text,
  Alert,
  TouchableOpacity,
  TextInput,
  ActivityIndicator,
  Platform,
  Modal,
  ScrollView,
} from "react-native";
import { useRouter } from "expo-router";
import { useUser } from "@clerk/clerk-expo";
import { useState, useEffect, useMemo } from "react";
import DateTimePicker from "@react-native-community/datetimepicker";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { API_URL } from "../../constants/api";
import { createCreateStyles } from "../../assets/styles/create.styles";
import { Ionicons } from "@expo/vector-icons";
import { useTheme } from "../../hooks/useTheme";
import { useCurrency } from "../../hooks/useCurrency";
import { TRANSACTION_CATEGORIES } from "../../constants/transactionCategories";

const DEFAULT_TX_KEY = "@wallet_default_tx_type";

const CreateScreen = () => {
  const router = useRouter();
  const { user } = useUser();
  const { COLORS } = useTheme();
  const styles = useMemo(() => createCreateStyles(COLORS), [COLORS]);
  const { symbol } = useCurrency();

  const [title, setTitle] = useState("");
  const [amount, setAmount] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("");
  const [isExpense, setIsExpense] = useState(true);
  const [isLoading, setIsLoading] = useState(false);
  const [selectedDate, setSelectedDate] = useState(new Date());
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [isRecurring, setIsRecurring] = useState(false);
  const [recurrenceInterval, setRecurrenceInterval] = useState("monthly");

  useEffect(() => {
    AsyncStorage.getItem(DEFAULT_TX_KEY).then((v) => {
      if (v === "income") setIsExpense(false);
      if (v === "expense") setIsExpense(true);
    });
  }, []);

  const formatDate = (date) => {
    const options = {
      weekday: "short",
      year: "numeric",
      month: "short",
      day: "numeric",
    };
    return date.toLocaleDateString("en-US", options);
  };

  const onDateChange = (event, date) => {
    if (Platform.OS === "android") {
      setShowDatePicker(false);
    }
    if (date) {
      setSelectedDate(date);
    }
  };

  const handleCreate = async () => {
    if (!title.trim()) return Alert.alert("Error", "Please enter a transaction title");
    if (!amount || isNaN(parseFloat(amount)) || parseFloat(amount) <= 0) {
      Alert.alert("Error", "Please enter a valid amount");
      return;
    }
    if (!selectedCategory) return Alert.alert("Error", "Please select a category");

    setIsLoading(true);
    try {
      const formattedAmount = isExpense ? -Math.abs(parseFloat(amount)) : Math.abs(parseFloat(amount));

      const body = {
        user_id: user.id,
        title,
        amount: formattedAmount,
        category: selectedCategory,
        date: selectedDate.toISOString(),
        is_recurring: isRecurring,
        recurrence_interval: isRecurring ? recurrenceInterval : undefined,
      };

      const response = await fetch(`${API_URL}/transactions`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(body),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || "Failed to create transaction");
      }

      Alert.alert("Success", "Transaction created successfully");
      router.back();
    } catch (error) {
      Alert.alert("Error", error.message || "An error occurred. Please try again.");
      console.error("Error creating transaction:", error);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity style={styles.backButton} onPress={() => router.back()}>
          <Ionicons name="arrow-back" size={24} color={COLORS.text} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Create Transaction</Text>
        <TouchableOpacity
          style={[styles.saveButtonContainer, isLoading && styles.saveButtonDisabled]}
          onPress={handleCreate}
          disabled={isLoading}
        >
          <Text style={styles.saveButton}>{isLoading ? "Saving..." : "Save"}</Text>
          {!isLoading && <Ionicons name="checkmark" size={20} color={COLORS.primary} />}
        </TouchableOpacity>
      </View>

      <ScrollView showsVerticalScrollIndicator={false}>
        <View style={styles.card}>
          <View style={styles.typeSelector}>
            <TouchableOpacity
              style={[styles.typeButton, isExpense && styles.typeButtonActive]}
              onPress={() => setIsExpense(true)}
            >
              <Ionicons
                name="arrow-down-circle"
                size={22}
                color={isExpense ? COLORS.white : COLORS.expense}
                style={styles.typeIcon}
              />
              <Text style={[styles.typeButtonText, isExpense && styles.typeButtonTextActive]}>
                Expense
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[styles.typeButton, !isExpense && styles.typeButtonActive]}
              onPress={() => setIsExpense(false)}
            >
              <Ionicons
                name="arrow-up-circle"
                size={22}
                color={!isExpense ? COLORS.white : COLORS.income}
                style={styles.typeIcon}
              />
              <Text
                style={[styles.typeButtonText, !isExpense && styles.typeButtonTextActive]}
              >
                Income
              </Text>
            </TouchableOpacity>
          </View>

          <View style={styles.amountContainer}>
            <Text style={styles.currencySymbol}>{symbol}</Text>
            <TextInput
              style={styles.amountInput}
              placeholder="0.00"
              placeholderTextColor={COLORS.textLight}
              keyboardType="numeric"
              value={amount}
              onChangeText={setAmount}
            />
          </View>

          <View style={styles.inputContainer}>
            <Ionicons
              name="create-outline"
              size={22}
              color={COLORS.textLight}
              style={styles.inputIcon}
            />
            <TextInput
              style={styles.input}
              placeholder=" Transaction Title"
              placeholderTextColor={COLORS.textLight}
              value={title}
              onChangeText={setTitle}
            />
          </View>

          <View style={styles.sectionHeader}>
            <Ionicons name="calendar-outline" size={14} color={COLORS.textLight} />
            <Text style={styles.sectionTitle}>Date</Text>
          </View>

          <TouchableOpacity
            style={styles.datePickerButton}
            onPress={() => setShowDatePicker(true)}
          >
            <Ionicons name="calendar" size={22} color={COLORS.primary} />
            <Text style={styles.datePickerText}>{formatDate(selectedDate)}</Text>
            <Ionicons name="chevron-down" size={20} color={COLORS.textLight} />
          </TouchableOpacity>

          {Platform.OS === "ios" ? (
            <Modal visible={showDatePicker} transparent animationType="slide">
              <View style={styles.dateModalOverlay}>
                <View style={styles.dateModalContent}>
                  <View style={styles.dateModalHeader}>
                    <TouchableOpacity onPress={() => setShowDatePicker(false)}>
                      <Text style={styles.dateModalCancel}>Cancel</Text>
                    </TouchableOpacity>
                    <Text style={styles.dateModalTitle}>Select Date</Text>
                    <TouchableOpacity onPress={() => setShowDatePicker(false)}>
                      <Text style={styles.dateModalDone}>Done</Text>
                    </TouchableOpacity>
                  </View>
                  <DateTimePicker
                    value={selectedDate}
                    mode="date"
                    display="spinner"
                    onChange={onDateChange}
                    maximumDate={new Date()}
                    style={{ height: 200 }}
                  />
                </View>
              </View>
            </Modal>
          ) : (
            showDatePicker && (
              <DateTimePicker
                value={selectedDate}
                mode="date"
                display="default"
                onChange={onDateChange}
                maximumDate={new Date()}
              />
            )
          )}

          <View style={styles.sectionHeader}>
            <Ionicons name="pricetag-outline" size={14} color={COLORS.textLight} />
            <Text style={styles.sectionTitle}>Category</Text>
          </View>

          <View style={styles.categoryGrid}>
            {TRANSACTION_CATEGORIES.map((category) => (
              <TouchableOpacity
                key={category.id}
                style={[
                  styles.categoryButton,
                  selectedCategory === category.name && styles.categoryButtonActive,
                ]}
                onPress={() => setSelectedCategory(category.name)}
              >
                <Ionicons
                  name={category.icon}
                  size={20}
                  color={selectedCategory === category.name ? COLORS.white : COLORS.text}
                  style={styles.categoryIcon}
                />
                <Text
                  style={[
                    styles.categoryButtonText,
                    selectedCategory === category.name && styles.categoryButtonTextActive,
                  ]}
                >
                  {category.name}
                </Text>
              </TouchableOpacity>
            ))}
          </View>

          <View style={styles.sectionHeader}>
            <Ionicons name="repeat-outline" size={14} color={COLORS.textLight} />
            <Text style={styles.sectionTitle}>Recurring</Text>
          </View>
          <TouchableOpacity
            style={styles.datePickerButton}
            onPress={() => setIsRecurring(!isRecurring)}
          >
            <Text style={styles.datePickerText}>
              {isRecurring ? "Recurring on" : "Recurring off"}
            </Text>
            <Ionicons
              name={isRecurring ? "checkbox" : "square-outline"}
              size={22}
              color={COLORS.primary}
            />
          </TouchableOpacity>
          {isRecurring && (
            <View style={styles.categoryGrid}>
              {["weekly", "monthly", "yearly"].map((iv) => (
                <TouchableOpacity
                  key={iv}
                  style={[
                    styles.categoryButton,
                    recurrenceInterval === iv && styles.categoryButtonActive,
                  ]}
                  onPress={() => setRecurrenceInterval(iv)}
                >
                  <Text
                    style={[
                      styles.categoryButtonText,
                      recurrenceInterval === iv && styles.categoryButtonTextActive,
                    ]}
                  >
                    {iv.charAt(0).toUpperCase() + iv.slice(1)}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
          )}

          {isLoading && (
            <View style={styles.loadingContainer}>
              <ActivityIndicator size="small" color={COLORS.primary} />
            </View>
          )}
        </View>
      </ScrollView>
    </View>
  );
};

export default CreateScreen;
