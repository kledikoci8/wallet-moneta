import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useState, useEffect, useCallback } from 'react';
import { useFocusEffect } from '@react-navigation/native';
import { COLORS } from '../constants/colors';
import { API_URL } from '../constants/api';

export const GoalsCard = ({ userId }) => {
  const router = useRouter();
  const [goals, setGoals] = useState([]);
  const [isLoading, setIsLoading] = useState(true);

  const fetchGoals = useCallback(async () => {
    try {
      const response = await fetch(`${API_URL}/goals/${userId}`);
      const data = await response.json();
      setGoals(Array.isArray(data) ? data : []);
    } catch (error) {
      console.error('Error fetching goals:', error);
      setGoals([]);
    } finally {
      setIsLoading(false);
    }
  }, [userId]);

  useFocusEffect(
    useCallback(() => {
      fetchGoals();
    }, [fetchGoals])
  );

  const activeGoals = goals.filter(g => !g.completed);
  const totalSaved = goals.reduce((sum, g) => sum + parseFloat(g.current_amount || 0), 0);
  const totalTarget = goals.reduce((sum, g) => sum + parseFloat(g.target_amount || 0), 0);
  const overallProgress = totalTarget > 0 ? (totalSaved / totalTarget) * 100 : 0;

  // Get top 2 active goals to display
  const displayGoals = activeGoals.slice(0, 2);

  return (
    <TouchableOpacity 
      style={styles.container}
      onPress={() => router.push("/goals")}
      activeOpacity={0.8}
    >
      <View style={styles.header}>
        <View style={styles.headerLeft}>
          <View style={styles.iconContainer}>
            <Ionicons name="flag" size={20} color={COLORS.primary} />
          </View>
          <Text style={styles.title}>Savings Goals</Text>
        </View>
        <View style={styles.headerRight}>
          <Text style={styles.seeAll}>See All</Text>
          <Ionicons name="chevron-forward" size={16} color={COLORS.primary} />
        </View>
      </View>

      {goals.length === 0 ? (
        <View style={styles.emptyState}>
          <Ionicons name="add-circle-outline" size={32} color={COLORS.textLight} />
          <Text style={styles.emptyText}>No goals yet</Text>
          <Text style={styles.emptySubtext}>Tap to create your first savings goal</Text>
        </View>
      ) : (
        <>
          {/* Overall Progress */}
          <View style={styles.overallProgress}>
            <View style={styles.progressInfo}>
              <Text style={styles.savedAmount}>${totalSaved.toFixed(0)}</Text>
              <Text style={styles.targetAmount}> / ${totalTarget.toFixed(0)}</Text>
            </View>
            <Text style={styles.progressPercent}>{overallProgress.toFixed(0)}%</Text>
          </View>
          
          <View style={styles.progressBarContainer}>
            <View style={[styles.progressBar, { width: `${Math.min(overallProgress, 100)}%` }]} />
          </View>

          {/* Individual Goals */}
          <View style={styles.goalsList}>
            {displayGoals.map((goal) => {
              const progress = (parseFloat(goal.current_amount) / parseFloat(goal.target_amount)) * 100;
              return (
                <View key={goal.id} style={styles.goalItem}>
                  <View style={[styles.goalIcon, { backgroundColor: (goal.color || COLORS.primary) + '20' }]}>
                    <Ionicons name={goal.icon || 'flag'} size={16} color={goal.color || COLORS.primary} />
                  </View>
                  <View style={styles.goalInfo}>
                    <Text style={styles.goalTitle} numberOfLines={1}>{goal.title}</Text>
                    <View style={styles.goalProgressBar}>
                      <View style={[styles.goalProgressFill, { width: `${Math.min(progress, 100)}%`, backgroundColor: goal.color || COLORS.primary }]} />
                    </View>
                  </View>
                  <Text style={[styles.goalPercent, { color: goal.color || COLORS.primary }]}>
                    {progress.toFixed(0)}%
                  </Text>
                </View>
              );
            })}
          </View>

          {activeGoals.length > 2 && (
            <Text style={styles.moreGoals}>+{activeGoals.length - 2} more goals</Text>
          )}
        </>
      )}
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  container: {
    backgroundColor: COLORS.white,
    borderRadius: 16,
    padding: 16,
    marginHorizontal: 20,
    marginTop: 16,
    shadowColor: COLORS.shadow,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 3,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  headerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  iconContainer: {
    width: 36,
    height: 36,
    borderRadius: 10,
    backgroundColor: COLORS.primary + '15',
    justifyContent: 'center',
    alignItems: 'center',
  },
  title: {
    fontSize: 16,
    fontWeight: '700',
    color: COLORS.text,
  },
  headerRight: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  seeAll: {
    fontSize: 13,
    color: COLORS.primary,
    fontWeight: '600',
  },
  emptyState: {
    alignItems: 'center',
    paddingVertical: 20,
  },
  emptyText: {
    fontSize: 15,
    fontWeight: '600',
    color: COLORS.text,
    marginTop: 8,
  },
  emptySubtext: {
    fontSize: 13,
    color: COLORS.textLight,
    marginTop: 4,
  },
  overallProgress: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  progressInfo: {
    flexDirection: 'row',
    alignItems: 'baseline',
  },
  savedAmount: {
    fontSize: 20,
    fontWeight: '700',
    color: COLORS.primary,
  },
  targetAmount: {
    fontSize: 14,
    color: COLORS.textLight,
  },
  progressPercent: {
    fontSize: 16,
    fontWeight: '700',
    color: COLORS.primary,
  },
  progressBarContainer: {
    height: 8,
    backgroundColor: COLORS.border,
    borderRadius: 4,
    marginBottom: 16,
    overflow: 'hidden',
  },
  progressBar: {
    height: '100%',
    backgroundColor: COLORS.primary,
    borderRadius: 4,
  },
  goalsList: {
    gap: 12,
  },
  goalItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  goalIcon: {
    width: 32,
    height: 32,
    borderRadius: 8,
    justifyContent: 'center',
    alignItems: 'center',
  },
  goalInfo: {
    flex: 1,
  },
  goalTitle: {
    fontSize: 14,
    fontWeight: '500',
    color: COLORS.text,
    marginBottom: 4,
  },
  goalProgressBar: {
    height: 4,
    backgroundColor: COLORS.border,
    borderRadius: 2,
    overflow: 'hidden',
  },
  goalProgressFill: {
    height: '100%',
    borderRadius: 2,
  },
  goalPercent: {
    fontSize: 13,
    fontWeight: '600',
    minWidth: 40,
    textAlign: 'right',
  },
  moreGoals: {
    fontSize: 12,
    color: COLORS.textLight,
    textAlign: 'center',
    marginTop: 12,
  },
});
