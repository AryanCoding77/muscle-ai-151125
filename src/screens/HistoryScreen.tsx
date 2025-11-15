// History Screen - View past analyses with timeline and comparison

import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Image,
  Alert,
  RefreshControl,
} from 'react-native';
import * as Haptics from 'expo-haptics';
import { useFocusEffect } from '@react-navigation/native';
import { MuscleAnalysisResponse } from '../types/api.types';
import { DataTransformer } from '../services/data/DataTransformer';
import { COLORS } from '../config/constants';
import { getAnalysisHistory, deleteAnalysisFromDatabase, AnalysisHistoryRecord } from '../services/supabase';
import { useAuth } from '../context/AuthContext';

interface HistoryItem {
  id: string;
  date: Date;
  imageUri: string;
  analysis: MuscleAnalysisResponse;
}

export const HistoryScreen = ({ navigation }: any) => {
  const [history, setHistory] = useState<HistoryItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [selectedItems, setSelectedItems] = useState<string[]>([]);
  const [compareMode, setCompareMode] = useState(false);
  const { user } = useAuth();

  useEffect(() => {
    loadHistory();
  }, []);

  // Reload history whenever the History screen gains focus
  useFocusEffect(
    useCallback(() => {
      loadHistory();
      return () => {};
    }, [])
  );

  const loadHistory = async () => {
    try {
      if (!user?.id) {
        console.log('No authenticated user, skipping history load');
        setHistory([]);
        return;
      }

      const dbHistory = await getAnalysisHistory(user.id);
      const mapped: HistoryItem[] = dbHistory.map((record: AnalysisHistoryRecord) => ({
        id: record.id,
        date: new Date(record.created_at),
        imageUri: record.image_url || '',
        analysis: record.analysis_data as MuscleAnalysisResponse,
      }));
      setHistory(mapped.sort((a, b) => b.date.getTime() - a.date.getTime()));
    } catch (error) {
      console.error('Failed to load history:', error);
      setHistory([]);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const onRefresh = () => {
    setRefreshing(true);
    loadHistory();
  };

  const toggleSelection = (id: string) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    if (selectedItems.includes(id)) {
      setSelectedItems(selectedItems.filter(item => item !== id));
    } else if (selectedItems.length < 2) {
      setSelectedItems([...selectedItems, id]);
    } else {
      Alert.alert('Limit Reached', 'You can only compare 2 analyses at a time');
    }
  };

  const startComparison = () => {
    if (selectedItems.length !== 2) {
      Alert.alert('Select 2 Items', 'Please select exactly 2 analyses to compare');
      return;
    }

    const items = history.filter(h => selectedItems.includes(h.id));
    navigation.navigate('Comparison', { items });
    setCompareMode(false);
    setSelectedItems([]);
  };

  const deleteItem = (id: string) => {
    Alert.alert(
      'Delete Analysis',
      'Are you sure you want to delete this analysis?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            try {
              if (!user?.id) {
                Alert.alert('Error', 'Authentication required');
                return;
              }

              const success = await deleteAnalysisFromDatabase(user.id, id);
              if (success) {
                const newHistory = history.filter(h => h.id !== id);
                setHistory(newHistory);
                Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
              } else {
                Alert.alert('Error', 'Failed to delete analysis');
              }
            } catch (error) {
              console.error('Error deleting analysis:', error);
              Alert.alert('Error', 'Failed to delete analysis');
            }
          },
        },
      ]
    );
  };

  const clearHistory = () => {
    Alert.alert(
      'Clear History',
      'This will delete all saved analyses. Continue?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Clear All',
          style: 'destructive',
          onPress: async () => {
            try {
              if (!user?.id) {
                Alert.alert('Error', 'Authentication required');
                return;
              }

              // Delete all analyses for this user
              const deletePromises = history.map(item => 
                deleteAnalysisFromDatabase(user.id, item.id)
              );
              
              await Promise.all(deletePromises);
              setHistory([]);
              Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
            } catch (error) {
              console.error('Error clearing history:', error);
              Alert.alert('Error', 'Failed to clear history');
            }
          },
        },
      ]
    );
  };

  const formatDate = (date: Date) => {
    const d = new Date(date);
    return d.toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  const getProgressTrend = (current: HistoryItem, previous?: HistoryItem) => {
    if (!previous) return null;
    
    const currentScore = current.analysis.overall_assessment.overall_physique_score;
    const previousScore = previous.analysis.overall_assessment.overall_physique_score;
    const diff = currentScore - previousScore;
    
    if (diff > 0) return { text: `+${diff.toFixed(1)}`, color: COLORS.success };
    if (diff < 0) return { text: diff.toFixed(1), color: COLORS.danger };
    return { text: '0.0', color: COLORS.textSecondary };
  };

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <Text style={styles.loadingText}>Loading history...</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
          <Text style={styles.backButtonText}>←</Text>
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Analysis History</Text>
        <View style={styles.headerActions}>
          {history.length > 0 && (
            <>
              <TouchableOpacity
                style={styles.actionButton}
                onPress={() => {
                  setCompareMode(!compareMode);
                  setSelectedItems([]);
                  Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                }}
              >
                <Text style={styles.actionButtonText}>
                  {compareMode ? '✕' : '⚖️'}
                </Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={styles.actionButton}
                onPress={clearHistory}
              >
                <Text style={styles.actionButtonText}>🗑️</Text>
              </TouchableOpacity>
            </>
          )}
        </View>
      </View>

      {/* Compare Mode Bar */}
      {compareMode && (
        <View style={styles.compareBar}>
          <Text style={styles.compareText}>
            Select 2 analyses to compare ({selectedItems.length}/2)
          </Text>
          <TouchableOpacity
            style={[
              styles.compareButton,
              selectedItems.length !== 2 && styles.compareButtonDisabled,
            ]}
            onPress={startComparison}
            disabled={selectedItems.length !== 2}
          >
            <Text style={styles.compareButtonText}>Compare</Text>
          </TouchableOpacity>
        </View>
      )}

      {/* History List */}
      <ScrollView
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
        }
        contentContainerStyle={styles.scrollContent}
      >
        {history.length === 0 ? (
          <View style={styles.emptyContainer}>
            <Text style={styles.emptyIcon}>📊</Text>
            <Text style={styles.emptyTitle}>No Analyses Yet</Text>
            <Text style={styles.emptyText}>
              Your muscle analysis history will appear here
            </Text>
            <TouchableOpacity
              style={styles.startButton}
              onPress={() => navigation.navigate('Home')}
            >
              <Text style={styles.startButtonText}>Start First Analysis</Text>
            </TouchableOpacity>
          </View>
        ) : (
          <>
            {/* Timeline View */}
            <View style={styles.timeline}>
              {history.map((item, index) => {
                const isSelected = selectedItems.includes(item.id);
                const trend = getProgressTrend(item, history[index + 1]);
                const summaryStats = DataTransformer.toSummaryStats(item.analysis);

                return (
                  <TouchableOpacity
                    key={item.id}
                    style={[
                      styles.timelineItem,
                      isSelected && styles.timelineItemSelected,
                    ]}
                    onPress={() => {
                      if (compareMode) {
                        toggleSelection(item.id);
                      } else {
                        navigation.navigate('Results', {
                          analysis: item.analysis,
                          imageUri: item.imageUri,
                        });
                      }
                    }}
                    onLongPress={() => deleteItem(item.id)}
                  >
                    {/* Timeline Dot */}
                    <View style={styles.timelineDot}>
                      <View style={styles.dot} />
                      {index < history.length - 1 && <View style={styles.line} />}
                    </View>

                    {/* Content Card */}
                    <View style={styles.card}>
                      {/* Selection Checkbox */}
                      {compareMode && (
                        <View style={styles.checkbox}>
                          {isSelected && <Text style={styles.checkmark}>✓</Text>}
                        </View>
                      )}

                      {/* Image and Info */}
                      <View style={styles.cardContent}>
                        <Image source={{ uri: item.imageUri }} style={styles.thumbnail} />
                        
                        <View style={styles.info}>
                          <Text style={styles.date}>{formatDate(item.date)}</Text>
                          
                          <View style={styles.scores}>
                            <View style={styles.scoreItem}>
                              <Text style={styles.scoreLabel}>Overall</Text>
                              <Text style={styles.scoreValue}>
                                {item.analysis.overall_assessment.overall_physique_score.toFixed(1)}
                              </Text>
                            </View>
                            <View style={styles.scoreItem}>
                              <Text style={styles.scoreLabel}>Symmetry</Text>
                              <Text style={styles.scoreValue}>
                                {item.analysis.overall_assessment.body_symmetry_score.toFixed(1)}
                              </Text>
                            </View>
                            <View style={styles.scoreItem}>
                              <Text style={styles.scoreLabel}>Muscles</Text>
                              <Text style={styles.scoreValue}>
                                {summaryStats.totalMusclesAnalyzed}
                              </Text>
                            </View>
                          </View>

                          {trend && (
                            <View style={styles.trend}>
                              <Text style={[styles.trendText, { color: trend.color }]}>
                                {trend.text} vs previous
                              </Text>
                            </View>
                          )}

                          <View style={styles.highlights}>
                            <Text style={styles.highlightText}>
                              💪 {item.analysis.overall_assessment.strongest_muscles[0]}
                            </Text>
                            <Text style={styles.highlightText}>
                              🎯 {item.analysis.overall_assessment.weakest_muscles[0]}
                            </Text>
                          </View>
                        </View>
                      </View>

                      {/* Quality Badge */}
                      <View
                        style={[
                          styles.qualityBadge,
                          item.analysis.analysis_metadata.image_quality === 'good' && styles.qualityGood,
                          item.analysis.analysis_metadata.image_quality === 'fair' && styles.qualityFair,
                          item.analysis.analysis_metadata.image_quality === 'poor' && styles.qualityPoor,
                        ]}
                      >
                        <Text style={styles.qualityText}>
                          {item.analysis.analysis_metadata.image_quality.toUpperCase()}
                        </Text>
                      </View>
                    </View>
                  </TouchableOpacity>
                );
              })}
            </View>

            {/* Progress Summary */}
            {history.length > 1 && (
              <View style={styles.progressSummary}>
                <Text style={styles.summaryTitle}>Progress Overview</Text>
                <View style={styles.summaryStats}>
                  <View style={styles.summaryItem}>
                    <Text style={styles.summaryLabel}>Total Analyses</Text>
                    <Text style={styles.summaryValue}>{history.length}</Text>
                  </View>
                  <View style={styles.summaryItem}>
                    <Text style={styles.summaryLabel}>Latest Score</Text>
                    <Text style={styles.summaryValue}>
                      {history[0].analysis.overall_assessment.overall_physique_score.toFixed(1)}
                    </Text>
                  </View>
                  <View style={styles.summaryItem}>
                    <Text style={styles.summaryLabel}>First Score</Text>
                    <Text style={styles.summaryValue}>
                      {history[history.length - 1].analysis.overall_assessment.overall_physique_score.toFixed(1)}
                    </Text>
                  </View>
                </View>
              </View>
            )}
          </>
        )}
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.background,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: COLORS.background,
  },
  loadingText: {
    color: COLORS.textSecondary,
    fontSize: 16,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingTop: 50,
    paddingHorizontal: 20,
    paddingBottom: 20,
  },
  backButton: {
    padding: 10,
  },
  backButtonText: {
    fontSize: 24,
    color: COLORS.text,
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: COLORS.text,
  },
  headerActions: {
    flexDirection: 'row',
  },
  actionButton: {
    padding: 10,
    marginLeft: 10,
  },
  actionButtonText: {
    fontSize: 20,
  },
  compareBar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: COLORS.surface,
    paddingHorizontal: 20,
    paddingVertical: 12,
    marginHorizontal: 20,
    marginBottom: 10,
    borderRadius: 12,
  },
  compareText: {
    color: COLORS.text,
    fontSize: 14,
  },
  compareButton: {
    backgroundColor: COLORS.primary,
    paddingHorizontal: 20,
    paddingVertical: 8,
    borderRadius: 8,
  },
  compareButtonDisabled: {
    opacity: 0.5,
  },
  compareButtonText: {
    color: COLORS.text,
    fontWeight: 'bold',
  },
  scrollContent: {
    paddingBottom: 30,
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingTop: 100,
  },
  emptyIcon: {
    fontSize: 64,
    marginBottom: 20,
  },
  emptyTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: COLORS.text,
    marginBottom: 10,
  },
  emptyText: {
    color: COLORS.textSecondary,
    fontSize: 16,
    marginBottom: 30,
  },
  startButton: {
    backgroundColor: COLORS.primary,
    paddingHorizontal: 30,
    paddingVertical: 15,
    borderRadius: 12,
  },
  startButtonText: {
    color: COLORS.text,
    fontWeight: 'bold',
    fontSize: 16,
  },
  timeline: {
    paddingHorizontal: 20,
  },
  timelineItem: {
    flexDirection: 'row',
    marginBottom: 20,
  },
  timelineItemSelected: {
    transform: [{ scale: 0.98 }],
  },
  timelineDot: {
    width: 40,
    alignItems: 'center',
  },
  dot: {
    width: 12,
    height: 12,
    borderRadius: 6,
    backgroundColor: COLORS.primary,
    marginTop: 20,
  },
  line: {
    width: 2,
    flex: 1,
    backgroundColor: COLORS.border,
    marginTop: 5,
  },
  card: {
    flex: 1,
    backgroundColor: COLORS.surface,
    borderRadius: 16,
    padding: 15,
    marginLeft: 10,
    position: 'relative',
  },
  checkbox: {
    position: 'absolute',
    top: 10,
    right: 10,
    width: 24,
    height: 24,
    borderRadius: 12,
    borderWidth: 2,
    borderColor: COLORS.primary,
    justifyContent: 'center',
    alignItems: 'center',
  },
  checkmark: {
    color: COLORS.primary,
    fontWeight: 'bold',
  },
  cardContent: {
    flexDirection: 'row',
  },
  thumbnail: {
    width: 80,
    height: 80,
    borderRadius: 12,
    marginRight: 15,
  },
  info: {
    flex: 1,
  },
  date: {
    color: COLORS.textSecondary,
    fontSize: 14,
    marginBottom: 10,
  },
  scores: {
    flexDirection: 'row',
    marginBottom: 10,
  },
  scoreItem: {
    marginRight: 20,
  },
  scoreLabel: {
    color: COLORS.textSecondary,
    fontSize: 12,
  },
  scoreValue: {
    color: COLORS.text,
    fontWeight: 'bold',
    fontSize: 16,
  },
  trend: {
    marginBottom: 10,
  },
  trendText: {
    fontSize: 14,
    fontWeight: 'bold',
  },
  highlights: {
    flexDirection: 'row',
    flexWrap: 'wrap',
  },
  highlightText: {
    color: COLORS.textSecondary,
    fontSize: 12,
    marginRight: 15,
  },
  qualityBadge: {
    position: 'absolute',
    top: 10,
    right: 10,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
    backgroundColor: COLORS.border,
  },
  qualityGood: {
    backgroundColor: COLORS.success,
  },
  qualityFair: {
    backgroundColor: COLORS.warning,
  },
  qualityPoor: {
    backgroundColor: COLORS.danger,
  },
  qualityText: {
    color: COLORS.text,
    fontSize: 10,
    fontWeight: 'bold',
  },
  progressSummary: {
    margin: 20,
    padding: 20,
    backgroundColor: COLORS.surface,
    borderRadius: 16,
  },
  summaryTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: COLORS.text,
    marginBottom: 15,
  },
  summaryStats: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  summaryItem: {
    alignItems: 'center',
  },
  summaryLabel: {
    color: COLORS.textSecondary,
    fontSize: 12,
    marginBottom: 5,
  },
  summaryValue: {
    color: COLORS.primary,
    fontSize: 20,
    fontWeight: 'bold',
  },
});
