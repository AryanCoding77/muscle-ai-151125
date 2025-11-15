import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  SafeAreaView,
  Alert,
  Dimensions,
  Image,
} from 'react-native';
import * as Haptics from 'expo-haptics';
import { useFocusEffect } from '@react-navigation/native';
import { COLORS } from '../config/constants';
import { Card } from '../components/ui/Card';
import { StatBadge } from '../components/dashboard/StatBadge';
import { getAnalysisHistory, deleteAnalysisFromDatabase, AnalysisHistoryRecord } from '../services/supabase';
import { useAuth } from '../context/AuthContext';
import { ConfirmationDialog } from '../components/ui/ConfirmationDialog';
import { MaterialCommunityIcons as Icon } from '@expo/vector-icons';
import type { AnalysisResult } from '../types';

const { width } = Dimensions.get('window');

export const ProgressScreen = ({ navigation }: any) => {
  const [analysisHistory, setAnalysisHistory] = useState<AnalysisResult[]>([]);
  const [loading, setLoading] = useState(true);
  const [showClearHistoryDialog, setShowClearHistoryDialog] = useState(false);
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [selectedAnalysisId, setSelectedAnalysisId] = useState<string | null>(null);
  const { user } = useAuth();

  useEffect(() => {
    loadAnalysisHistory();
  }, []);

  // Reload history whenever the Progress tab gains focus
  useFocusEffect(
    useCallback(() => {
      loadAnalysisHistory();
      return () => {};
    }, [])
  );

  const loadAnalysisHistory = async () => {
    try {
      if (!user?.id) {
        console.log('No authenticated user, skipping history load');
        setAnalysisHistory([]);
        return;
      }

      const dbHistory = await getAnalysisHistory(user.id);
      
      // Convert database records to AnalysisResult format
      const convertedHistory: AnalysisResult[] = dbHistory.map((record: AnalysisHistoryRecord) => ({
        id: record.id,
        timestamp: record.created_at,
        imageUri: record.image_url || '',
        muscleGroup: record.analysis_data?.overall_assessment?.strongest_muscles?.[0] || 'General Analysis',
        overallScore: record.overall_score || 0,
        analysis: record.analysis_data,
      }));

      setAnalysisHistory(convertedHistory);
    } catch (error) {
      console.error('Error loading analysis history:', error);
      setAnalysisHistory([]);
    } finally {
      setLoading(false);
    }
  };

  const clearHistory = async () => {
    await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    setShowClearHistoryDialog(true);
  };

  const handleClearHistoryConfirm = async () => {
    try {
      if (!user?.id) {
        setShowClearHistoryDialog(false);
        setTimeout(() => Alert.alert('Error', 'Authentication required'), 100);
        return;
      }

      // Delete all analyses for this user
      const deletePromises = analysisHistory.map(analysis => 
        deleteAnalysisFromDatabase(user.id, analysis.id)
      );
      
      await Promise.all(deletePromises);
      setAnalysisHistory([]);
      setShowClearHistoryDialog(false);
      setTimeout(() => Alert.alert('Success', 'Analysis history cleared successfully'), 100);
    } catch (error) {
      console.error('Error clearing history:', error);
      setShowClearHistoryDialog(false);
      setTimeout(() => Alert.alert('Error', 'Failed to clear history'), 100);
    }
  };

  const handleDeleteAnalysis = (analysisId: string) => {
    setSelectedAnalysisId(analysisId);
    setShowDeleteDialog(true);
  };

  const handleDeleteConfirm = async () => {
    try {
      if (!user?.id || !selectedAnalysisId) {
        setShowDeleteDialog(false);
        setTimeout(() => Alert.alert('Error', 'Authentication required'), 100);
        return;
      }
      
      await deleteAnalysisFromDatabase(user.id, selectedAnalysisId);
      loadAnalysisHistory();
      setShowDeleteDialog(false);
      setSelectedAnalysisId(null);
    } catch (error) {
      console.error('Error deleting analysis:', error);
      setShowDeleteDialog(false);
      setSelectedAnalysisId(null);
      setTimeout(() => Alert.alert('Error', 'Failed to delete analysis'), 100);
    }
  };

  const getProgressStats = () => {
    if (analysisHistory.length === 0) {
      return {
        totalAnalyses: 0,
        avgScore: 0,
        bestScore: 0,
        improvement: 0
      };
    }

    const totalAnalyses = analysisHistory.length;
    const scores = analysisHistory.map(a => a.overallScore || 0);
    const avgScore = scores.reduce((sum, score) => sum + score, 0) / scores.length;
    const bestScore = Math.max(...scores);
    
    // Calculate improvement: compare earliest score vs average of most recent up to 3 analyses
    // History is saved newest-first, so earliest is the last element
    let improvement = 0;
    if (totalAnalyses >= 2) {
      const earliestScore = scores[scores.length - 1];
      const recentScores = scores.slice(0, Math.min(3, scores.length));
      const recentAvg = recentScores.reduce((sum, score) => sum + score, 0) / recentScores.length;
      if (earliestScore > 0) {
        improvement = ((recentAvg - earliestScore) / earliestScore) * 100;
      } else {
        improvement = recentAvg > 0 ? 100 : 0;
      }
    }

    return {
      totalAnalyses,
      avgScore: Math.round(avgScore),
      bestScore: Math.round(bestScore),
      improvement: Math.round(improvement)
    };
  };

  const navigateToComparison = (analysis: AnalysisResult) => {
    navigation.navigate('Comparison', { analysis });
  };

  const stats = getProgressStats();

  if (loading) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.loadingContainer}>
          <Text style={styles.loadingText}>Loading progress...</Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView contentContainerStyle={styles.scrollContent}>
        {/* Header */}
        <View style={styles.header}>
          <Text style={styles.title}>Progress Tracking</Text>
          <Text style={styles.subtitle}>
            Monitor your muscle development journey over time
          </Text>
        </View>

        {/* Most Recent Analysis */}
        {analysisHistory.length > 0 && (
          <Card style={styles.recentCard}>
            <View style={styles.recentHeader}>
              <Text style={styles.recentTitle}>Most Recent Analysis</Text>
              <Text style={styles.recentDate}>
                {new Date(analysisHistory[0].timestamp).toLocaleString()}
              </Text>
            </View>

            {/* Scores row */}
            <View style={styles.recentStatsRow}>
              <View style={styles.recentStatItem}>
                <Text style={styles.recentStatLabel}>Overall Score</Text>
                <Text style={styles.recentStatValue}>
                  {(analysisHistory[0].overallScore ?? 0).toString()}
                </Text>
              </View>
              <View style={styles.recentStatItem}>
                <Text style={styles.recentStatLabel}>Symmetry</Text>
                <Text style={styles.recentStatValue}>
                  {(
                    (analysisHistory[0].analysis?.overall_assessment?.body_symmetry_score ?? 0)
                  ).toString()}
                </Text>
              </View>
              <View style={styles.recentStatItem}>
                <Text style={styles.recentStatLabel}>Confidence</Text>
                <Text style={styles.recentStatValue}>
                  {(
                    (analysisHistory[0].analysis?.analysis_metadata?.analysis_confidence ?? 0)
                  ).toString()}%
                </Text>
              </View>
            </View>

            {/* Muscle chips */}
            <View style={styles.chipsRow}>
              {(analysisHistory[0].analysis?.overall_assessment?.strongest_muscles || [])
                .slice(0, 3)
                .map((m: string, idx: number) => (
                  <View key={`strong-${idx}`} style={[styles.chip, styles.strongChip]}>
                    <Text style={[styles.chipText, styles.strongChipText]}>Strong: {m}</Text>
                  </View>
                ))}
              {(analysisHistory[0].analysis?.overall_assessment?.weakest_muscles || [])
                .slice(0, 3)
                .map((m: string, idx: number) => (
                  <View key={`weak-${idx}`} style={[styles.chip, styles.weakChip]}>
                    <Text style={[styles.chipText, styles.weakChipText]}>Weak: {m}</Text>
                  </View>
                ))}
            </View>

            <TouchableOpacity
              style={styles.viewReportBtn}
              onPress={() =>
                navigation.navigate('Results', {
                  analysis: analysisHistory[0].analysis,
                  imageUri: analysisHistory[0].imageUri,
                })
              }
            >
              <Text style={styles.viewReportText}>View Full Report</Text>
            </TouchableOpacity>
          </Card>
        )}

        {/* Progress Stats */}
        <View style={styles.statsSection}>
          <View style={styles.statsRow}>
            <StatBadge 
              label="Total Analyses" 
              value={stats.totalAnalyses.toString()} 
              unit="scans" 
              icon="📊" 
              style={styles.statCard} 
            />
            <StatBadge 
              label="Average Score" 
              value={stats.avgScore.toString()} 
              unit="pts" 
              icon="📈" 
              style={styles.statCard} 
            />
          </View>
          <View style={styles.statsRow}>
            <StatBadge 
              label="Best Score" 
              value={stats.bestScore.toString()} 
              unit="pts" 
              icon="🏆" 
              style={styles.statCard} 
            />
            <StatBadge 
              label="Improvement" 
              value={stats.improvement > 0 ? `+${stats.improvement}` : stats.improvement.toString()} 
              unit="%" 
              icon={stats.improvement >= 0 ? "📈" : "📉"} 
              style={styles.statCard}
              valueColor={
                stats.improvement > 0 
                  ? COLORS.success 
                  : stats.improvement < 0 
                  ? COLORS.danger 
                  : '#FFFFFF'
              }
            />
          </View>
        </View>

        {/* Analysis History */}
        <View style={styles.historySection}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>Analysis History</Text>
            {analysisHistory.length > 0 && (
              <TouchableOpacity onPress={clearHistory}>
                <Text style={styles.clearButton}>Clear All</Text>
              </TouchableOpacity>
            )}
          </View>

          {analysisHistory.length === 0 ? (
            <Card style={styles.emptyCard}>
              <Text style={styles.emptyTitle}>No Analysis History</Text>
              <Text style={styles.emptyText}>
                Start analyzing your muscles to track progress over time
              </Text>
              <TouchableOpacity 
                style={styles.startButton}
                onPress={() => navigation.navigate('Analyze')}
              >
                <Text style={styles.startButtonText}>Start First Analysis</Text>
              </TouchableOpacity>
            </Card>
          ) : (
            <View style={styles.historyList}>
              {analysisHistory.slice(0, 10).map((analysis, index) => (
                <TouchableOpacity
                  key={analysis.id}
                  style={styles.historyItem}
                  onPress={() =>
                    navigation.navigate('Results', {
                      analysis: analysis.analysis,
                      imageUri: analysis.imageUri,
                    })
                  }
                >
                  <View style={styles.historyContent}>
                    {analysis.imageUri && analysis.imageUri.trim() !== '' ? (
                      <Image 
                        source={{ uri: analysis.imageUri }} 
                        style={styles.historyThumbnail}
                        onError={(error) => {
                          console.warn('Failed to load analysis image:', analysis.imageUri, error);
                        }}
                      />
                    ) : (
                      <View style={[styles.historyThumbnail, styles.placeholderThumbnail]}>
                        <Text style={styles.placeholderText}>📸</Text>
                      </View>
                    )}
                    <View style={styles.historyInfo}>
                      <Text style={styles.historyDate}>
                        {new Date(analysis.timestamp).toLocaleDateString()}
                      </Text>
                      <Text style={styles.historyMuscle}>
                        {analysis.muscleGroup || 'General Analysis'}
                      </Text>
                    </View>
                    <View style={styles.historyScore}>
                      <Text style={styles.scoreValue}>
                        {analysis.overallScore || 0}
                      </Text>
                      <Text style={styles.scoreLabel}>pts</Text>
                    </View>
                    <View style={styles.spacer} />
                    <TouchableOpacity 
                      style={styles.deleteButton}
                      onPress={(e) => {
                        e.stopPropagation();
                        handleDeleteAnalysis(analysis.id);
                      }}
                    >
                      <Text style={styles.deleteIcon}>✕</Text>
                    </TouchableOpacity>
                  </View>
                </TouchableOpacity>
              ))}
              
              {analysisHistory.length > 10 && (
                <TouchableOpacity 
                  style={styles.viewAllButton}
                  onPress={() => navigation.navigate('History')}
                >
                  <Text style={styles.viewAllText}>
                    View All {analysisHistory.length} Analyses
                  </Text>
                </TouchableOpacity>
              )}
            </View>
          )}
        </View>

        {/* Progress Tips */}
        <Card style={styles.tipsCard}>
          <Text style={styles.tipsTitle}>💡 Progress Tips</Text>
          <View style={styles.tipsList}>
            <Text style={styles.tip}>• Take photos in consistent lighting</Text>
            <Text style={styles.tip}>• Use the same angles for better comparison</Text>
            <Text style={styles.tip}>• Analyze regularly to track improvements</Text>
            <Text style={styles.tip}>• Follow AI recommendations for better results</Text>
          </View>
        </Card>
      </ScrollView>

      {/* Confirmation Dialogs */}
      <ConfirmationDialog
        visible={showClearHistoryDialog}
        title="Clear History"
        message="This will remove all your analysis history. This action cannot be undone."
        confirmText="Clear"
        cancelText="Cancel"
        confirmButtonStyle="destructive"
        onConfirm={handleClearHistoryConfirm}
        onCancel={() => setShowClearHistoryDialog(false)}
        icon={<Icon name="delete-sweep" size={48} color={COLORS.danger} />}
      />

      <ConfirmationDialog
        visible={showDeleteDialog}
        title="Delete Analysis"
        message="Are you sure you want to delete this analysis?"
        confirmText="Delete"
        cancelText="Cancel"
        confirmButtonStyle="destructive"
        onConfirm={handleDeleteConfirm}
        onCancel={() => {
          setShowDeleteDialog(false);
          setSelectedAnalysisId(null);
        }}
        icon={<Icon name="delete" size={48} color={COLORS.danger} />}
      />
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.background,
  },
  scrollContent: {
    padding: 20,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    fontSize: 16,
    color: COLORS.textSecondary,
  },
  header: {
    alignItems: 'center',
    marginBottom: 30,
    marginTop: 40,
  },
  title: {
    fontSize: 32,
    fontWeight: 'bold',
    color: COLORS.text,
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 16,
    color: COLORS.textSecondary,
    textAlign: 'center',
    lineHeight: 22,
  },
  statsSection: {
    marginBottom: 30,
  },
  statsRow: {
    flexDirection: 'row',
    gap: 15,
    marginBottom: 15,
  },
  statCard: {
    flex: 1,
  },
  historySection: {
    marginBottom: 30,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: COLORS.text,
  },
  clearButton: {
    fontSize: 16,
    color: COLORS.danger,
    fontWeight: '600',
  },
  emptyCard: {
    padding: 30,
    alignItems: 'center',
  },
  emptyTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: COLORS.text,
    marginBottom: 8,
  },
  emptyText: {
    fontSize: 16,
    color: COLORS.textSecondary,
    textAlign: 'center',
    marginBottom: 20,
    lineHeight: 22,
  },
  startButton: {
    backgroundColor: COLORS.primary,
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 8,
  },
  startButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
  },
  historyList: {
    gap: 12,
  },
  historyItem: {
    backgroundColor: COLORS.surface,
    borderRadius: 12,
    padding: 16,
  },
  historyContent: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  historyInfo: {
    flex: 1,
  },
  historyDate: {
    fontSize: 16,
    fontWeight: '600',
    color: COLORS.text,
    marginBottom: 4,
  },
  historyMuscle: {
    fontSize: 14,
    color: COLORS.textSecondary,
  },
  historyScore: {
    alignItems: 'center',
  },
  scoreValue: {
    fontSize: 20,
    fontWeight: 'bold',
    color: COLORS.primary,
  },
  scoreLabel: {
    fontSize: 12,
    color: COLORS.textSecondary,
  },
  viewAllButton: {
    backgroundColor: COLORS.surface,
    borderRadius: 12,
    padding: 16,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  viewAllText: {
    fontSize: 16,
    fontWeight: '600',
    color: COLORS.primary,
  },
  tipsCard: {
    padding: 20,
  },
  tipsTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: COLORS.text,
    marginBottom: 16,
  },
  tipsList: {
    gap: 8,
  },
  tip: {
    fontSize: 14,
    color: COLORS.textSecondary,
    lineHeight: 20,
  },
  // Recent analysis styles
  recentCard: {
    padding: 16,
    marginBottom: 20,
  },
  recentHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 10,
  },
  recentTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: COLORS.text,
  },
  recentDate: {
    fontSize: 12,
    color: COLORS.textSecondary,
  },
  recentStatsRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 8,
    marginBottom: 12,
  },
  recentStatItem: {
    flex: 1,
    alignItems: 'center',
  },
  recentStatLabel: {
    color: COLORS.textSecondary,
    fontSize: 12,
    marginBottom: 4,
  },
  recentStatValue: {
    color: COLORS.text,
    fontSize: 18,
    fontWeight: '700',
  },
  chipsRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginBottom: 12,
  },
  chip: {
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 14,
    borderWidth: 1,
  },
  strongChip: {
    borderColor: COLORS.success,
    backgroundColor: 'rgba(52, 199, 89, 0.15)',
  },
  strongChipText: {
    color: COLORS.success,
    fontSize: 12,
    fontWeight: '600',
  },
  weakChip: {
    borderColor: COLORS.warning,
    backgroundColor: 'rgba(255, 149, 0, 0.15)',
  },
  weakChipText: {
    color: COLORS.warning,
    fontSize: 12,
    fontWeight: '600',
  },
  chipText: {
    fontSize: 12,
    fontWeight: '600',
  },
  viewReportBtn: {
    marginTop: 8,
    backgroundColor: COLORS.surface,
    borderRadius: 10,
    paddingVertical: 12,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  viewReportText: {
    color: COLORS.primary,
    fontSize: 14,
    fontWeight: '700',
  },
  // History item styles
  historyThumbnail: {
    width: 50,
    height: 50,
    borderRadius: 8,
    marginRight: 12,
  },
  deleteButton: {
    padding: 8,
    justifyContent: 'center',
    alignItems: 'center',
  },
  deleteIcon: {
    fontSize: 18,
    color: COLORS.danger,
    fontWeight: 'bold',
  },
  spacer: {
    width: 12,
  },
  placeholderThumbnail: {
    backgroundColor: COLORS.surface,
    borderWidth: 1,
    borderColor: COLORS.border,
    justifyContent: 'center',
    alignItems: 'center',
  },
  placeholderText: {
    fontSize: 24,
    color: COLORS.textSecondary,
  },
});
