// Comparison Screen - Compare two muscle analyses side by side

import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Image,
  Dimensions,
} from 'react-native';
import { LineChart } from 'react-native-chart-kit';
import { MuscleAnalysisResponse } from '../types/api.types';
import { DataTransformer } from '../services/data/DataTransformer';
import { COLORS } from '../config/constants';

const { width: screenWidth } = Dimensions.get('window');

interface ComparisonScreenProps {
  route: {
    params: {
      items: Array<{
        id: string;
        date: Date;
        imageUri: string;
        analysis: MuscleAnalysisResponse;
      }>;
    };
  };
  navigation: any;
}

export const ComparisonScreen: React.FC<ComparisonScreenProps> = ({ route, navigation }) => {
  const { items } = route.params;
  const [older, newer] = items.sort((a, b) => 
    new Date(a.date).getTime() - new Date(b.date).getTime()
  );

  const comparisonData = DataTransformer.toComparisonData(
    older.analysis,
    newer.analysis
  );

  const formatDate = (date: Date) => {
    return new Date(date).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
    });
  };

  const getChangeIndicator = (change: number) => {
    if (change > 0) return { symbol: '↑', color: COLORS.success };
    if (change < 0) return { symbol: '↓', color: COLORS.danger };
    return { symbol: '→', color: COLORS.textSecondary };
  };

  // Prepare line chart data
  const lineChartData = {
    labels: comparisonData.muscles.map(m => m.name.substring(0, 3)),
    datasets: [
      {
        data: comparisonData.muscles.map(m => m.before),
        color: (opacity = 1) => `rgba(255, 99, 132, ${opacity})`,
        strokeWidth: 2,
      },
      {
        data: comparisonData.muscles.map(m => m.after),
        color: (opacity = 1) => `rgba(0, 122, 255, ${opacity})`,
        strokeWidth: 2,
      },
    ],
    legend: [formatDate(older.date), formatDate(newer.date)],
  };

  const chartConfig = {
    backgroundColor: COLORS.surface,
    backgroundGradientFrom: COLORS.surface,
    backgroundGradientTo: COLORS.background,
    decimalPlaces: 1,
    color: (opacity = 1) => `rgba(255, 255, 255, ${opacity})`,
    labelColor: (opacity = 1) => `rgba(255, 255, 255, ${opacity})`,
    style: {
      borderRadius: 16,
    },
    propsForDots: {
      r: '4',
      strokeWidth: '2',
    },
  };

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
          <Text style={styles.backButtonText}>←</Text>
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Progress Comparison</Text>
        <View style={styles.placeholder} />
      </View>

      <ScrollView showsVerticalScrollIndicator={false}>
        {/* Images */}
        <View style={styles.imagesContainer}>
          <View style={styles.imageWrapper}>
            <Image source={{ uri: older.imageUri }} style={styles.compareImage} />
            <Text style={styles.imageDate}>{formatDate(older.date)}</Text>
            <Text style={styles.imageLabel}>Before</Text>
          </View>
          <View style={styles.vsContainer}>
            <Text style={styles.vsText}>VS</Text>
          </View>
          <View style={styles.imageWrapper}>
            <Image source={{ uri: newer.imageUri }} style={styles.compareImage} />
            <Text style={styles.imageDate}>{formatDate(newer.date)}</Text>
            <Text style={styles.imageLabel}>After</Text>
          </View>
        </View>

        {/* Overall Progress */}
        <View style={styles.progressCard}>
          <Text style={styles.sectionTitle}>Overall Progress</Text>
          <View style={styles.progressStats}>
            <View style={styles.progressStat}>
              <Text style={styles.statLabel}>Physique Score</Text>
              <View style={styles.statValues}>
                <Text style={styles.statBefore}>
                  {comparisonData.overall.physiqueBefore.toFixed(1)}
                </Text>
                <View>
                  <Text style={[styles.changeArrow, { color: getChangeIndicator(comparisonData.overall.physiqueChange).color }]}>
                    {getChangeIndicator(comparisonData.overall.physiqueChange).symbol}
                  </Text>
                </View>
                <Text style={styles.statAfter}>
                  {comparisonData.overall.physiqueAfter.toFixed(1)}
                </Text>
              </View>
              <Text style={[styles.changeValue, { color: getChangeIndicator(comparisonData.overall.physiqueChange).color }]}>
                {comparisonData.overall.physiqueChange > 0 ? '+' : ''}{comparisonData.overall.physiqueChange.toFixed(1)}
              </Text>
            </View>

            <View style={styles.progressStat}>
              <Text style={styles.statLabel}>Symmetry Score</Text>
              <View style={styles.statValues}>
                <Text style={styles.statBefore}>
                  {comparisonData.overall.symmetryBefore.toFixed(1)}
                </Text>
                <View>
                  <Text style={[styles.changeArrow, { color: getChangeIndicator(comparisonData.overall.symmetryChange).color }]}>
                    {getChangeIndicator(comparisonData.overall.symmetryChange).symbol}
                  </Text>
                </View>
                <Text style={styles.statAfter}>
                  {comparisonData.overall.symmetryAfter.toFixed(1)}
                </Text>
              </View>
              <Text style={[styles.changeValue, { color: getChangeIndicator(comparisonData.overall.symmetryChange).color }]}>
                {comparisonData.overall.symmetryChange > 0 ? '+' : ''}{comparisonData.overall.symmetryChange.toFixed(1)}
              </Text>
            </View>
          </View>
        </View>

        {/* Line Chart */}
        <View style={styles.chartContainer}>
          <Text style={styles.sectionTitle}>Muscle Development Comparison</Text>
          <ScrollView horizontal showsHorizontalScrollIndicator={false}>
            <LineChart
              data={lineChartData}
              width={Math.max(screenWidth - 40, comparisonData.muscles.length * 50)}
              height={220}
              chartConfig={chartConfig}
              style={styles.chart}
              bezier
              withDots
              withInnerLines
              withOuterLines
              withVerticalLabels
              withHorizontalLabels
              fromZero
            />
          </ScrollView>
        </View>

        {/* Individual Muscle Changes */}
        <View style={styles.muscleChangesContainer}>
          <Text style={styles.sectionTitle}>Individual Muscle Progress</Text>
          {comparisonData.muscles.map((muscle, index) => {
            const indicator = getChangeIndicator(muscle.change);
            return (
              <View key={index} style={styles.muscleChangeItem}>
                <Text style={styles.muscleName}>{muscle.name}</Text>
                <View style={styles.muscleProgress}>
                  <Text style={styles.muscleScore}>{muscle.before.toFixed(1)}</Text>
                  <View style={styles.progressBarContainer}>
                    <View
                      style={[
                        styles.progressBarBefore,
                        { width: `${(muscle.before / 10) * 100}%` },
                      ]}
                    />
                    <View
                      style={[
                        styles.progressBarAfter,
                        { width: `${(muscle.after / 10) * 100}%` },
                      ]}
                    />
                  </View>
                  <Text style={styles.muscleScore}>{muscle.after.toFixed(1)}</Text>
                  <Text style={[styles.muscleChange, { color: indicator.color }]}>
                    {indicator.symbol} {Math.abs(muscle.change).toFixed(1)}
                  </Text>
                </View>
              </View>
            );
          })}
        </View>

        {/* Improvements & Declines */}
        <View style={styles.changesContainer}>
          <View style={styles.changeSection}>
            <Text style={styles.changeSectionTitle}>💪 Most Improved</Text>
            {comparisonData.improvements.slice(0, 3).map((imp, index) => (
              <View key={index} style={styles.changeItem}>
                <Text style={styles.changeItemName}>{imp.muscle}</Text>
                <Text style={[styles.changeItemValue, { color: COLORS.success }]}>
                  +{imp.improvement.toFixed(1)}
                </Text>
              </View>
            ))}
          </View>

          {comparisonData.declines.length > 0 && (
            <View style={styles.changeSection}>
              <Text style={styles.changeSectionTitle}>⚠️ Needs Attention</Text>
              {comparisonData.declines.slice(0, 3).map((dec, index) => (
                <View key={index} style={styles.changeItem}>
                  <Text style={styles.changeItemName}>{dec.muscle}</Text>
                  <Text style={[styles.changeItemValue, { color: COLORS.danger }]}>
                    {dec.decline.toFixed(1)}
                  </Text>
                </View>
              ))}
            </View>
          )}
        </View>

        {/* Time Period Summary */}
        <View style={styles.summaryCard}>
          <Text style={styles.summaryTitle}>Progress Summary</Text>
          <Text style={styles.summaryPeriod}>
            {Math.round((new Date(newer.date).getTime() - new Date(older.date).getTime()) / (1000 * 60 * 60 * 24))} days between analyses
          </Text>
          <View style={styles.summaryStats}>
            <Text style={styles.summaryText}>
              • Average muscle improvement: {comparisonData.overall.averageChange > 0 ? '+' : ''}{comparisonData.overall.averageChange.toFixed(1)}
            </Text>
            <Text style={styles.summaryText}>
              • Muscles improved: {comparisonData.improvements.length}
            </Text>
            <Text style={styles.summaryText}>
              • Muscles declined: {comparisonData.declines.length}
            </Text>
          </View>
        </View>
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.background,
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
  placeholder: {
    width: 44,
  },
  imagesContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    marginBottom: 20,
  },
  imageWrapper: {
    alignItems: 'center',
  },
  compareImage: {
    width: 140,
    height: 140,
    borderRadius: 12,
    marginBottom: 8,
  },
  imageDate: {
    color: COLORS.textSecondary,
    fontSize: 12,
    marginBottom: 4,
  },
  imageLabel: {
    color: COLORS.text,
    fontWeight: 'bold',
    fontSize: 14,
  },
  vsContainer: {
    paddingHorizontal: 20,
  },
  vsText: {
    color: COLORS.textSecondary,
    fontWeight: 'bold',
    fontSize: 18,
  },
  progressCard: {
    backgroundColor: COLORS.surface,
    marginHorizontal: 20,
    padding: 20,
    borderRadius: 16,
    marginBottom: 20,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: COLORS.text,
    marginBottom: 15,
  },
  progressStats: {
    flexDirection: 'row',
    justifyContent: 'space-around',
  },
  progressStat: {
    alignItems: 'center',
  },
  statLabel: {
    color: COLORS.textSecondary,
    fontSize: 14,
    marginBottom: 10,
  },
  statValues: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 5,
  },
  statBefore: {
    color: COLORS.textSecondary,
    fontSize: 16,
    marginRight: 10,
  },
  statAfter: {
    color: COLORS.text,
    fontSize: 18,
    fontWeight: 'bold',
    marginLeft: 10,
  },
  changeArrow: {
    fontSize: 20,
    fontWeight: 'bold',
  },
  changeValue: {
    fontSize: 14,
    fontWeight: 'bold',
  },
  chartContainer: {
    marginHorizontal: 20,
    marginBottom: 20,
  },
  chart: {
    borderRadius: 16,
  },
  muscleChangesContainer: {
    marginHorizontal: 20,
    marginBottom: 20,
  },
  muscleChangeItem: {
    backgroundColor: COLORS.surface,
    padding: 15,
    borderRadius: 12,
    marginBottom: 10,
  },
  muscleName: {
    color: COLORS.text,
    fontWeight: 'bold',
    fontSize: 16,
    marginBottom: 10,
  },
  muscleProgress: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  muscleScore: {
    color: COLORS.textSecondary,
    fontSize: 14,
    width: 35,
  },
  progressBarContainer: {
    flex: 1,
    height: 8,
    backgroundColor: COLORS.border,
    borderRadius: 4,
    marginHorizontal: 10,
    position: 'relative',
  },
  progressBarBefore: {
    position: 'absolute',
    height: '100%',
    backgroundColor: 'rgba(255, 99, 132, 0.3)',
    borderRadius: 4,
  },
  progressBarAfter: {
    position: 'absolute',
    height: '100%',
    backgroundColor: COLORS.primary,
    borderRadius: 4,
  },
  muscleChange: {
    fontSize: 14,
    fontWeight: 'bold',
    marginLeft: 10,
  },
  changesContainer: {
    flexDirection: 'row',
    marginHorizontal: 20,
    marginBottom: 20,
  },
  changeSection: {
    flex: 1,
    backgroundColor: COLORS.surface,
    padding: 15,
    borderRadius: 12,
    marginHorizontal: 5,
  },
  changeSectionTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: COLORS.text,
    marginBottom: 10,
  },
  changeItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 8,
  },
  changeItemName: {
    color: COLORS.textSecondary,
    fontSize: 14,
  },
  changeItemValue: {
    fontWeight: 'bold',
    fontSize: 14,
  },
  summaryCard: {
    backgroundColor: COLORS.surface,
    marginHorizontal: 20,
    marginBottom: 30,
    padding: 20,
    borderRadius: 16,
  },
  summaryTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: COLORS.text,
    marginBottom: 10,
  },
  summaryPeriod: {
    color: COLORS.textSecondary,
    fontSize: 14,
    marginBottom: 15,
  },
  summaryStats: {
    gap: 8,
  },
  summaryText: {
    color: COLORS.text,
    fontSize: 14,
    marginBottom: 5,
  },
});
