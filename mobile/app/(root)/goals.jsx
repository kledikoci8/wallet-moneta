import { View, Text, TouchableOpacity, ScrollView, Modal, TextInput, Alert, RefreshControl, FlatList } from 'react-native';
import { useRouter } from 'expo-router';
import { useFocusEffect } from '@react-navigation/native';
import { useUser } from '@clerk/clerk-expo';
import { Ionicons } from '@expo/vector-icons';
import { useState, useCallback, useMemo } from 'react';
import { createGoalsStyles } from '../../assets/styles/goals.styles';
import { useTheme } from '../../hooks/useTheme';
import { API_URL } from '../../constants/api';
import PageLoader from '../../components/PageLoader';
import * as Notifications from 'expo-notifications';
import EmptyGoals from '../../components/EmptyGoals';
import { GoalRing3D } from '../../components/GoalRing3D';

const GOAL_ICONS = ['flag', 'home', 'car', 'airplane', 'school', 'gift', 'heart', 'star', 'trophy', 'wallet'];
const GOAL_COLORS = ['#2E7D32', '#1976D2', '#7B1FA2', '#C62828', '#F57C00', '#00838F'];

export default function GoalsScreen() {
  const router = useRouter();
  const { user } = useUser();
  const { COLORS } = useTheme();
  const styles = useMemo(() => createGoalsStyles(COLORS), [COLORS]);
  const [activeTab, setActiveTab] = useState('goals');
  const [goals, setGoals] = useState([]);
  const [tips, setTips] = useState([]);
  const [tipsData, setTipsData] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  
  // Modal states
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showAddMoneyModal, setShowAddMoneyModal] = useState(false);
  const [selectedGoal, setSelectedGoal] = useState(null);
  
  // Form states
  const [title, setTitle] = useState('');
  const [targetAmount, setTargetAmount] = useState('');
  const [deadline, setDeadline] = useState('');
  const [selectedIcon, setSelectedIcon] = useState('flag');
  const [selectedColor, setSelectedColor] = useState('#2E7D32');
  const [addAmount, setAddAmount] = useState('');
  const [contributionNote, setContributionNote] = useState('');
  const [isSaving, setIsSaving] = useState(false);
  const [showHistoryModal, setShowHistoryModal] = useState(false);
  const [historyGoal, setHistoryGoal] = useState(null);
  const [contributions, setContributions] = useState([]);

  const fetchGoals = useCallback(async () => {
    if (!user?.id) {
      return;
    }
    
    try {
      const response = await fetch(`${API_URL}/goals/${user.id}`, {
        method: "GET",
        headers: { "Content-Type": "application/json" },
      });
      
      if (!response.ok) {
        throw new Error("Failed to fetch goals");
      }
      
      const data = await response.json();
      setGoals(data);
    } catch (error) {
      console.error('[Goals] Error fetching goals:', error);
      setGoals([]);
    }
  }, [user?.id]);

  const fetchTips = useCallback(async () => {
    if (!user?.id) {
      return;
    }
    
    try {
      const response = await fetch(`${API_URL}/goals/tips/${user.id}`, {
        method: "GET",
        headers: { "Content-Type": "application/json" },
      });
      
      if (!response.ok) {
        throw new Error("Failed to fetch tips");
      }
      
      const data = await response.json();
      setTips(data.tips || []);
      setTipsData(data);
    } catch (error) {
      console.error('[Goals] Error fetching tips:', error);
      setTips([]);
      setTipsData(null);
    }
  }, [user?.id]);

  const loadData = useCallback(async () => {
    setIsLoading(true);
    await Promise.all([fetchGoals(), fetchTips()]);
    setIsLoading(false);
  }, [fetchGoals, fetchTips]);

  useFocusEffect(
    useCallback(() => {
      loadData();
    }, [loadData])
  );

  const onRefresh = async () => {
    setRefreshing(true);
    await loadData();
    setRefreshing(false);
  };

  const handleCreateGoal = async () => {
    if (!title.trim() || !targetAmount) {
      Alert.alert('Error', 'Please enter a title and target amount');
      return;
    }

    setIsSaving(true);
    try {
      const response = await fetch(`${API_URL}/goals`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          user_id: user.id,
          title,
          target_amount: parseFloat(targetAmount),
          deadline: deadline || null,
          icon: selectedIcon,
          color: selectedColor,
        }),
      });

      if (response.ok) {
        setShowCreateModal(false);
        resetForm();
        fetchGoals();
        Alert.alert('Success', 'Goal created successfully!');
      }
    } catch (error) {
      Alert.alert('Error', 'Failed to create goal');
    } finally {
      setIsSaving(false);
    }
  };

  const openHistory = async (goal) => {
    setHistoryGoal(goal);
    try {
      const res = await fetch(`${API_URL}/goals/contributions/${goal.id}`);
      const data = await res.json();
      setContributions(Array.isArray(data) ? data : []);
    } catch (e) {
      setContributions([]);
    }
    setShowHistoryModal(true);
  };

  const handleAddMoney = async () => {
    if (!addAmount || parseFloat(addAmount) <= 0) {
      Alert.alert('Error', 'Please enter a valid amount');
      return;
    }

    const amt = parseFloat(addAmount);
    const prevGoals = [...goals];
    const prev = selectedGoal;
    const optimistic = goals.map((g) =>
      g.id === selectedGoal.id
        ? {
            ...g,
            current_amount: parseFloat(g.current_amount) + amt,
            completed:
              parseFloat(g.current_amount) + amt >= parseFloat(g.target_amount),
          }
        : g
    );
    setGoals(optimistic);

    setIsSaving(true);
    try {
      const response = await fetch(`${API_URL}/goals/progress/${selectedGoal.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          amount: amt,
          note: contributionNote || undefined,
          user_id: user.id,
        }),
      });

      if (response.ok) {
        const updatedGoal = await response.json();
        const beforePct =
          (parseFloat(prev.current_amount) / parseFloat(prev.target_amount)) * 100;
        const afterPct =
          (parseFloat(updatedGoal.current_amount) / parseFloat(updatedGoal.target_amount)) * 100;
        const milestones = [25, 50, 75, 100];
        for (const m of milestones) {
          if (beforePct < m && afterPct >= m) {
            try {
              await Notifications.scheduleNotificationAsync({
                content: {
                  title: 'Goal milestone',
                  body: `You're ${m}% of the way to ${prev.title}`,
                },
                trigger: null,
              });
            } catch (_) {}
            break;
          }
        }

        setShowAddMoneyModal(false);
        setAddAmount('');
        setContributionNote('');
        fetchGoals();

        if (updatedGoal.completed) {
          Alert.alert('Congratulations!', `You've reached your goal: ${selectedGoal.title}!`);
        } else {
          Alert.alert('Success', 'Money added to your goal!');
        }
      } else {
        throw new Error('fail');
      }
    } catch (error) {
      setGoals(prevGoals);
      Alert.alert('Error', 'Failed to add money');
    } finally {
      setIsSaving(false);
    }
  };

  const handleDeleteGoal = (goal) => {
    Alert.alert('Delete Goal', `Are you sure you want to delete "${goal.title}"?`, [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Delete',
        style: 'destructive',
        onPress: async () => {
          try {
            await fetch(`${API_URL}/goals/${goal.id}`, { method: 'DELETE' });
            fetchGoals();
          } catch (error) {
            Alert.alert('Error', 'Failed to delete goal');
          }
        },
      },
    ]);
  };

  const resetForm = () => {
    setTitle('');
    setTargetAmount('');
    setDeadline('');
    setSelectedIcon('flag');
    setSelectedColor('#2E7D32');
  };

  const totalSaved = goals.reduce((sum, g) => sum + parseFloat(g.current_amount || 0), 0);
  const totalTarget = goals.reduce((sum, g) => sum + parseFloat(g.target_amount || 0), 0);
  const activeGoals = goals.filter(g => !g.completed).length;
  const completedGoals = goals.filter(g => g.completed).length;

  if (isLoading) return <PageLoader />;

  const renderGoalCard = (goal) => {
    const target = parseFloat(goal.target_amount) || 0;
    const current = parseFloat(goal.current_amount) || 0;
    const progress01 = target > 0 ? Math.min(1, Math.max(0, current / target)) : 0;
    const progress = target > 0 ? (current / target) * 100 : 0;
    const remaining = parseFloat(goal.target_amount) - parseFloat(goal.current_amount);

    return (
      <View key={goal.id} style={styles.goalCard}>
        <View style={styles.goalHeader}>
          <View style={[styles.goalIconContainer, { backgroundColor: goal.color + '20' }]}>
            <Ionicons name={goal.icon} size={24} color={goal.color} />
          </View>
          <View style={styles.goalInfo}>
            <Text style={styles.goalTitle}>{goal.title}</Text>
            {goal.deadline && (
              <Text style={styles.goalDeadline}>
                Due: {new Date(goal.deadline).toLocaleDateString()}
              </Text>
            )}
          </View>
          <TouchableOpacity style={styles.goalMenu} onPress={() => openHistory(goal)}>
            <Ionicons name="time-outline" size={20} color={COLORS.primary} />
          </TouchableOpacity>
          <TouchableOpacity style={styles.goalMenu} onPress={() => handleDeleteGoal(goal)}>
            <Ionicons name="trash-outline" size={20} color={COLORS.expense} />
          </TouchableOpacity>
        </View>

        <View style={[styles.progressContainer, { alignItems: 'center', justifyContent: 'center' }]}>
          <View pointerEvents="none">
            <GoalRing3D progress={progress01} color={goal.color} size={72} />
          </View>
        </View>

        <View style={styles.goalFooter}>
          <Text style={styles.goalAmount}>
            <Text style={styles.goalAmountBold}>${parseFloat(goal.current_amount).toFixed(0)}</Text>
            {' / $'}{parseFloat(goal.target_amount).toFixed(0)}
          </Text>
          <Text style={[styles.goalPercentage, { color: goal.color }]}>
            {progress.toFixed(0)}%
          </Text>
        </View>

        {goal.completed ? (
          <View style={styles.completedBadge}>
            <Ionicons name="checkmark-circle" size={16} color={COLORS.income} />
            <Text style={styles.completedText}>Completed!</Text>
          </View>
        ) : (
          <TouchableOpacity
            style={styles.addMoneyButton}
            onPress={() => {
              setSelectedGoal(goal);
              setShowAddMoneyModal(true);
            }}
          >
            <Ionicons name="add-circle" size={18} color={COLORS.primary} />
            <Text style={styles.addMoneyText}>Add Money (${remaining.toFixed(0)} left)</Text>
          </TouchableOpacity>
        )}
      </View>
    );
  };

  const renderTipCard = (tip) => {
    const priorityStyle = {
      high: styles.tipPriorityHigh,
      medium: styles.tipPriorityMedium,
      low: styles.tipPriorityLow,
      info: styles.tipPriorityInfo,
    }[tip.priority] || styles.tipPriorityInfo;

    const iconColor = {
      high: COLORS.expense,
      medium: '#FF9800',
      low: COLORS.income,
      info: COLORS.primary,
    }[tip.priority] || COLORS.primary;

    return (
      <View key={tip.id} style={styles.tipCard}>
        <View style={[styles.tipIconContainer, priorityStyle]}>
          <Ionicons name={tip.icon} size={20} color={iconColor} />
        </View>
        <View style={styles.tipContent}>
          <Text style={styles.tipTitle}>{tip.title}</Text>
          <Text style={styles.tipDescription}>{tip.description}</Text>
        </View>
      </View>
    );
  };

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity style={styles.backButton} onPress={() => router.back()}>
          <Ionicons name="arrow-back" size={24} color={COLORS.text} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Savings Goals</Text>
        <TouchableOpacity style={styles.addButton} onPress={() => setShowCreateModal(true)}>
          <Ionicons name="add-circle" size={28} color={COLORS.primary} />
        </TouchableOpacity>
      </View>

      {/* Tabs */}
      <View style={styles.tabContainer}>
        <TouchableOpacity
          style={[styles.tab, activeTab === 'goals' && styles.tabActive]}
          onPress={() => setActiveTab('goals')}
        >
          <Text style={[styles.tabText, activeTab === 'goals' && styles.tabTextActive]}>
            My Goals
          </Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.tab, activeTab === 'tips' && styles.tabActive]}
          onPress={() => setActiveTab('tips')}
        >
          <Text style={[styles.tabText, activeTab === 'tips' && styles.tabTextActive]}>
            Saving Tips
          </Text>
        </TouchableOpacity>
      </View>

      <ScrollView
        style={styles.content}
        showsVerticalScrollIndicator={false}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
      >
        {activeTab === 'goals' ? (
          <>
            {/* Summary Card */}
            <View style={styles.summaryCard}>
              <Text style={styles.summaryTitle}>Total Saved</Text>
              <Text style={styles.summaryAmount}>${totalSaved.toFixed(2)}</Text>
              <View style={styles.summaryRow}>
                <View style={styles.summaryItem}>
                  <Text style={styles.summaryLabel}>Active Goals</Text>
                  <Text style={styles.summaryValue}>{activeGoals}</Text>
                </View>
                <View style={styles.summaryItem}>
                  <Text style={styles.summaryLabel}>Completed</Text>
                  <Text style={styles.summaryValue}>{completedGoals}</Text>
                </View>
                <View style={styles.summaryItem}>
                  <Text style={styles.summaryLabel}>Target</Text>
                  <Text style={styles.summaryValue}>${totalTarget.toFixed(0)}</Text>
                </View>
              </View>
            </View>

            {/* Goals List */}
            {goals.length === 0 ? (
              <EmptyGoals onCreate={() => setShowCreateModal(true)} />
            ) : (
              goals.map(renderGoalCard)
            )}
          </>
        ) : (
          <>
            {/* Savings Rate Card */}
            {tipsData && (
              <View style={styles.summaryCard}>
                <Text style={styles.summaryTitle}>Your Savings Rate</Text>
                <Text style={styles.summaryAmount}>{tipsData.savingsRate}%</Text>
                <View style={styles.summaryRow}>
                  <View style={styles.summaryItem}>
                    <Text style={styles.summaryLabel}>Income</Text>
                    <Text style={styles.summaryValue}>${tipsData.income?.toFixed(0) || 0}</Text>
                  </View>
                  <View style={styles.summaryItem}>
                    <Text style={styles.summaryLabel}>Expenses</Text>
                    <Text style={styles.summaryValue}>${tipsData.expenses?.toFixed(0) || 0}</Text>
                  </View>
                </View>
              </View>
            )}

            {/* Tips List */}
            <View style={styles.sectionHeader}>
              <Text style={styles.sectionTitle}>Personalized Tips</Text>
            </View>
            {tips.map(renderTipCard)}

            {/* Ask FinBot Card */}
            <TouchableOpacity 
              style={styles.askBotCard}
              onPress={() => router.push("/chat")}
              activeOpacity={0.8}
            >
              <View style={styles.askBotIcon}>
                <Ionicons name="sparkles" size={28} color="#fff" />
              </View>
              <View style={styles.askBotContent}>
                <Text style={styles.askBotTitle}>Need more advice?</Text>
                <Text style={styles.askBotDescription}>
                  Ask FinBot for personalized savings tips and financial guidance
                </Text>
              </View>
              <Ionicons name="chevron-forward" size={24} color={COLORS.primary} />
            </TouchableOpacity>
          </>
        )}
      </ScrollView>

      {/* Create Goal Modal */}
      <Modal visible={showCreateModal} transparent animationType="slide">
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Create New Goal</Text>
              <TouchableOpacity onPress={() => { setShowCreateModal(false); resetForm(); }}>
                <Ionicons name="close" size={24} color={COLORS.text} />
              </TouchableOpacity>
            </View>

            <ScrollView showsVerticalScrollIndicator={false}>
              <Text style={styles.modalLabel}>Goal Name</Text>
              <TextInput
                style={styles.modalInput}
                placeholder="e.g., Emergency Fund, Vacation"
                value={title}
                onChangeText={setTitle}
                placeholderTextColor={COLORS.textLight}
              />

              <Text style={styles.modalLabel}>Target Amount ($)</Text>
              <TextInput
                style={styles.modalInput}
                placeholder="0.00"
                value={targetAmount}
                onChangeText={setTargetAmount}
                keyboardType="numeric"
                placeholderTextColor={COLORS.textLight}
              />

              <Text style={styles.modalLabel}>Deadline (Optional)</Text>
              <TextInput
                style={styles.modalInput}
                placeholder="YYYY-MM-DD"
                value={deadline}
                onChangeText={setDeadline}
                placeholderTextColor={COLORS.textLight}
              />

              <Text style={styles.modalLabel}>Icon</Text>
              <View style={styles.iconGrid}>
                {GOAL_ICONS.map((icon) => (
                  <TouchableOpacity
                    key={icon}
                    style={[styles.iconOption, selectedIcon === icon && styles.iconOptionSelected]}
                    onPress={() => setSelectedIcon(icon)}
                  >
                    <Ionicons name={icon} size={22} color={selectedIcon === icon ? COLORS.primary : COLORS.text} />
                  </TouchableOpacity>
                ))}
              </View>

              <Text style={styles.modalLabel}>Color</Text>
              <View style={styles.colorGrid}>
                {GOAL_COLORS.map((color) => (
                  <TouchableOpacity
                    key={color}
                    style={[
                      styles.colorOption,
                      { backgroundColor: color },
                      selectedColor === color && styles.colorOptionSelected,
                    ]}
                    onPress={() => setSelectedColor(color)}
                  />
                ))}
              </View>

              <TouchableOpacity
                style={[styles.modalButton, isSaving && styles.modalButtonDisabled]}
                onPress={handleCreateGoal}
                disabled={isSaving}
              >
                <Text style={styles.modalButtonText}>
                  {isSaving ? 'Creating...' : 'Create Goal'}
                </Text>
              </TouchableOpacity>
            </ScrollView>
          </View>
        </View>
      </Modal>

      {/* Add Money Modal */}
      <Modal visible={showAddMoneyModal} transparent animationType="slide">
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Add Money</Text>
              <TouchableOpacity
                onPress={() => {
                  setShowAddMoneyModal(false);
                  setAddAmount('');
                  setContributionNote('');
                }}
              >
                <Ionicons name="close" size={24} color={COLORS.text} />
              </TouchableOpacity>
            </View>

            {selectedGoal && (
              <Text style={{ color: COLORS.textLight, marginBottom: 20, textAlign: 'center' }}>
                Adding to: {selectedGoal.title}
              </Text>
            )}

            <View style={styles.amountInputContainer}>
              <Text style={styles.currencySymbol}>$</Text>
              <TextInput
                style={styles.amountInput}
                placeholder="0"
                value={addAmount}
                onChangeText={setAddAmount}
                keyboardType="numeric"
                placeholderTextColor={COLORS.textLight}
              />
            </View>

            <TextInput
              style={{
                borderWidth: 1,
                borderColor: COLORS.border,
                borderRadius: 12,
                padding: 12,
                marginBottom: 16,
                color: COLORS.text,
              }}
              placeholder="Note (optional)"
              placeholderTextColor={COLORS.textLight}
              value={contributionNote}
              onChangeText={setContributionNote}
            />

            <View style={styles.quickAmounts}>
              {[10, 25, 50, 100].map((amount) => (
                <TouchableOpacity
                  key={amount}
                  style={styles.quickAmountButton}
                  onPress={() => setAddAmount(amount.toString())}
                >
                  <Text style={styles.quickAmountText}>${amount}</Text>
                </TouchableOpacity>
              ))}
            </View>

            <TouchableOpacity
              style={[styles.modalButton, isSaving && styles.modalButtonDisabled]}
              onPress={handleAddMoney}
              disabled={isSaving}
            >
              <Text style={styles.modalButtonText}>
                {isSaving ? 'Adding...' : 'Add to Goal'}
              </Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>

      <Modal visible={showHistoryModal} transparent animationType="slide">
        <View style={styles.modalOverlay}>
          <View style={[styles.modalContent, { maxHeight: '70%' }]}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>
                {historyGoal ? `History — ${historyGoal.title}` : 'History'}
              </Text>
              <TouchableOpacity
                onPress={() => {
                  setShowHistoryModal(false);
                  setHistoryGoal(null);
                }}
              >
                <Ionicons name="close" size={24} color={COLORS.text} />
              </TouchableOpacity>
            </View>
            <FlatList
              data={contributions}
              keyExtractor={(item) => String(item.id)}
              renderItem={({ item }) => (
                <View style={{ paddingVertical: 10, borderBottomWidth: 1, borderColor: COLORS.border }}>
                  <Text style={{ color: COLORS.text, fontWeight: '600' }}>
                    ${parseFloat(item.amount).toFixed(2)}
                  </Text>
                  <Text style={{ color: COLORS.textLight, fontSize: 12 }}>
                    {new Date(item.contributed_at).toLocaleString()}
                  </Text>
                  {item.note ? (
                    <Text style={{ color: COLORS.textLight }}>{item.note}</Text>
                  ) : null}
                </View>
              )}
              ListEmptyComponent={
                <Text style={{ color: COLORS.textLight, textAlign: 'center', marginTop: 20 }}>
                  No contributions yet
                </Text>
              }
            />
          </View>
        </View>
      </Modal>
    </View>
  );
}
