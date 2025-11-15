// Results Screen - Modern fitness analysis results with beautiful UI

import React, { useEffect, useRef, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Image,
  Dimensions,
  Animated,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Image as ExpoImage } from 'expo-image';
import { Svg, Circle, Defs, LinearGradient as SvgLinearGradient, Stop } from 'react-native-svg';
import * as Haptics from 'expo-haptics';
import { MuscleAnalysisResponse } from '../types/api.types';
import { DataTransformer } from '../services/data/DataTransformer';
import { useExerciseRecommendations, MuscleWithExercises } from '../hooks/useExerciseRecommendations';

const { width: screenWidth, height: screenHeight } = Dimensions.get('window');

interface ResultsScreenProps {
  route: {
    params: {
      analysis: MuscleAnalysisResponse;
      imageUri: string;
    };
  };
  navigation: any;
}

// Custom circular progress component with animation
const CircularProgress: React.FC<{
  size: number;
  progress: number;
  color: string;
  backgroundColor?: string;
  strokeWidth?: number;
  children?: React.ReactNode;
}> = ({ size, progress, color, backgroundColor = '#2A2A2A', strokeWidth = 8, children }) => {
  const [animatedProgress, setAnimatedProgress] = useState(0);
  const radius = (size - strokeWidth) / 2;
  const circumference = radius * 2 * Math.PI;

  useEffect(() => {
    // Animate progress from 0 to target value
    const timer = setTimeout(() => {
      let currentProgress = 0;
      const increment = progress / 60; // 60 frames for smooth animation
      const interval = setInterval(() => {
        currentProgress += increment;
        if (currentProgress >= progress) {
          currentProgress = progress;
          clearInterval(interval);
        }
        setAnimatedProgress(currentProgress);
      }, 25); // ~40fps
    }, 300); // Start after 300ms delay

    return () => clearTimeout(timer);
  }, [progress]);

  const strokeDashoffset = circumference - (animatedProgress / 100) * circumference;

  return (
    <View style={{ width: size, height: size, position: 'relative' }}>
      <Svg width={size} height={size} style={{ transform: [{ rotate: '-90deg' }] }}>
        <Defs>
          <SvgLinearGradient id={`gradient-${size}`} x1="0%" y1="0%" x2="100%" y2="100%">
            <Stop offset="0%" stopColor={color} stopOpacity="1" />
            <Stop offset="100%" stopColor={color} stopOpacity="0.6" />
          </SvgLinearGradient>
        </Defs>
        <Circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          stroke={backgroundColor}
          strokeWidth={strokeWidth}
          fill="transparent"
        />
        <Circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          stroke={`url(#gradient-${size})`}
          strokeWidth={strokeWidth}
          fill="transparent"
          strokeDasharray={circumference}
          strokeDashoffset={strokeDashoffset}
          strokeLinecap="round"
        />
      </Svg>
      <View style={{
        position: 'absolute',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        justifyContent: 'center',
        alignItems: 'center',
      }}>
        {children}
      </View>
    </View>
  );
};

export const ResultsScreen: React.FC<ResultsScreenProps> = ({ route, navigation }) => {
  const { analysis, imageUri } = route.params;
  
  const progressData = DataTransformer.toProgressData(analysis.muscle_analysis);
  const rankedMuscles = DataTransformer.toRankedList(analysis.muscle_analysis);
  const recommendations = DataTransformer.toActionableRecommendations(analysis.recommendations);
  const summaryStats = DataTransformer.toSummaryStats(analysis);

  // Exercise recommendations from ExerciseDB based on weakest muscles
  const {
    loading: exLoading,
    error: exError,
    hasApiKey,
    musclesWithExercises,
  } = useExerciseRecommendations(analysis);

  // State for managing expanded dropdowns
  const [expandedMuscles, setExpandedMuscles] = useState<Set<string>>(new Set());

  // Get muscle scores with colors
  const getMuscleColor = (score: number) => {
    if (score >= 8) return '#4ADE80'; // Green
    if (score >= 6) return '#FCD34D'; // Yellow
    if (score >= 4) return '#FB923C'; // Orange
    return '#EF4444'; // Red
  };

  const getScoreLabel = (score: number) => {
    if (score >= 8) return 'Excellent';
    if (score >= 6) return 'Good';
    if (score >= 4) return 'Fair';
    return 'Needs Work';
  };

  const toggleMuscleExpansion = (muscleName: string) => {
    const newExpanded = new Set(expandedMuscles);
    if (newExpanded.has(muscleName)) {
      newExpanded.delete(muscleName);
    } else {
      newExpanded.add(muscleName);
    }
    setExpandedMuscles(newExpanded);
  };

  return (
    <View style={styles.container}>
      <ScrollView style={styles.scrollView} showsVerticalScrollIndicator={false}>
        {/* Top Image Section with Overlay Header */}
        <View style={styles.imageSection}>
          <Image source={{ uri: imageUri }} style={styles.topImage} />
          
          {/* Header Overlay */}
          <View style={styles.headerOverlay}>
            <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
              <Text style={styles.backButtonText}>←</Text>
            </TouchableOpacity>
            <Text style={styles.headerTitle}>Analyze Results</Text>
            <TouchableOpacity onPress={() => {}} style={styles.shareButton}>
              <Text style={styles.shareButtonText}>⚬—⚬—⚬</Text>
            </TouchableOpacity>
          </View>
          
          {/* Dark Gradient Transition */}
          <LinearGradient
            colors={['transparent', 'rgba(10,10,10,0.3)', 'rgba(10,10,10,0.7)', '#0A0A0A']}
            style={styles.imageGradientOverlay}
          />
        </View>

        {/* Overall Score Section */}
        <View style={styles.scoreSection}>
          <View style={styles.scoreCard}>
            <View style={styles.scoreContent}>
              <CircularProgress
                size={140}
                progress={summaryStats.averageScore * 10}
                color={getMuscleColor(summaryStats.averageScore)}
                strokeWidth={10}
              >
                <Text style={styles.circularScoreValue}>{summaryStats.averageScore.toFixed(1)}</Text>
              </CircularProgress>
              
              <View style={styles.scoreDetails}>
                <Text style={styles.overallScoreLabel}>Overall Score</Text>
                <View style={[styles.healthBadge, { 
                  backgroundColor: getMuscleColor(summaryStats.averageScore) 
                }]}>
                  <Text style={styles.healthBadgeText}>{getScoreLabel(summaryStats.averageScore)}</Text>
                </View>
              </View>
            </View>
          </View>
        </View>

        {/* Key Metrics */}
        <View style={styles.metricsContainer}>
          <View style={styles.metricCard}>
            <CircularProgress
              size={80}
              progress={analysis.overall_assessment.body_symmetry_score * 10}
              color="#60A5FA"
            >
              <Text style={styles.metricValue}>{analysis.overall_assessment.body_symmetry_score.toFixed(1)}</Text>
              <Text style={styles.metricUnit}>10</Text>
            </CircularProgress>
            <Text style={styles.metricLabel}>Symmetry</Text>
          </View>
          
          <View style={styles.metricCard}>
            <CircularProgress
              size={80}
              progress={analysis.analysis_metadata.analysis_confidence}
              color="#34D399"
            >
              <Text style={styles.metricValue}>{analysis.analysis_metadata.analysis_confidence}</Text>
              <Text style={styles.metricUnit}>%</Text>
            </CircularProgress>
            <Text style={styles.metricLabel}>Confidence</Text>
          </View>
        </View>

        {/* Muscle Group Ratings */}
        <View style={styles.sectionContainer}>
          <Text style={styles.sectionTitle}>Muscle Group Ratings</Text>
          <Text style={styles.sectionSubtitle}>
            Weakest: <Text style={{ color: '#EF4444' }}>{analysis.overall_assessment.weakest_muscles.join(', ')}</Text>
          </Text>
          
          {progressData.map((muscle, index) => (
            <AnimatedMuscleCard
              key={index}
              muscle={muscle}
              getMuscleColor={getMuscleColor}
              index={index}
            />
          ))}
        </View>

        {/* Workout Recommendations */}
        <View style={styles.sectionContainer}>
          <Text style={styles.sectionTitle}>Workout Recommendations</Text>
          <Text style={styles.sectionSubtitle}>Personalized exercises to improve weaker areas</Text>

          {!hasApiKey && (
            <View style={styles.apiKeyBanner}>
              <Text style={styles.bannerText}>
                Add your RapidAPI key in .env as EXPO_PUBLIC_RAPIDAPI_KEY and reload the app to see exercise GIFs.
              </Text>
            </View>
          )}

          {hasApiKey && exLoading && (
            <View style={styles.apiKeyBanner}>
              <Text style={styles.bannerText}>Loading exercises…</Text>
            </View>
          )}

          {hasApiKey && exError && (
            <View style={styles.apiKeyBanner}>
              <Text style={styles.bannerText}>Failed to load exercises: {exError}</Text>
            </View>
          )}

          {hasApiKey && !exLoading && !exError && musclesWithExercises.length > 0 && (
            <View>
              {musclesWithExercises.map((muscleData) => {
                const isExpanded = expandedMuscles.has(muscleData.muscle.common_name);
                return (
                  <View key={muscleData.muscle.common_name} style={styles.muscleDropdown}>
                    <TouchableOpacity
                      style={styles.muscleDropdownHeader}
                      onPress={() => toggleMuscleExpansion(muscleData.muscle.common_name)}
                    >
                      <View style={styles.muscleDropdownLeft}>
                        <View style={[styles.muscleScoreIndicator, { 
                          backgroundColor: getMuscleColor(muscleData.muscle.development_score) 
                        }]} />
                        <Text style={styles.muscleDropdownName}>{muscleData.muscle.common_name}</Text>
                        <Text style={styles.muscleDropdownScore}>
                          {muscleData.muscle.development_score.toFixed(1)}
                        </Text>
                      </View>
                      <View style={styles.muscleDropdownRight}>
                        <Text style={[styles.dropdownArrow, { 
                          transform: [{ rotate: isExpanded ? '180deg' : '0deg' }] 
                        }]}>
                          ▼
                        </Text>
                      </View>
                    </TouchableOpacity>

                    {isExpanded && muscleData.exercises.length > 0 && (
                      <View style={styles.exerciseList}>
                        <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.exerciseScroll}>
                          {muscleData.exercises.map((exercise) => (
                            <TouchableOpacity 
                              key={exercise.id} 
                              style={styles.exerciseCard}
                              onPress={() => navigation.navigate('ExerciseDetail', { exercise })}
                            >
                              <ExpoImage
                                source={{ uri: exercise.gifUrl }}
                                style={styles.exerciseGif}
                                contentFit="cover"
                                transition={200}
                                cachePolicy="memory-disk"
                              />
                              <Text style={styles.exerciseName} numberOfLines={2}>{exercise.name}</Text>
                              <Text style={styles.exerciseMeta}>{exercise.equipment} • {exercise.bodyPart}</Text>
                            </TouchableOpacity>
                          ))}
                        </ScrollView>
                      </View>
                    )}
                  </View>
                );
              })}
            </View>
          )}
        </View>


        {/* Bottom Spacing */}
        <View style={{ height: 40 }} />
      </ScrollView>
    </View>
  );
};

// Animated Muscle Card Component
const AnimatedMuscleCard: React.FC<{
  muscle: any;
  getMuscleColor: (score: number) => string;
  index: number;
}> = ({ muscle, getMuscleColor, index }) => {
  const [animatedWidth, setAnimatedWidth] = useState(0);

  useEffect(() => {
    // Stagger animation based on index
    const timer = setTimeout(() => {
      let currentWidth = 0;
      const targetWidth = muscle.percentage;
      const increment = targetWidth / 60; // 60 frames for smooth animation
      const interval = setInterval(() => {
        currentWidth += increment;
        if (currentWidth >= targetWidth) {
          currentWidth = targetWidth;
          clearInterval(interval);
        }
        setAnimatedWidth(currentWidth);
      }, 25); // ~40fps
    }, 500 + (index * 100)); // Stagger each card by 100ms

    return () => clearTimeout(timer);
  }, [muscle.percentage, index]);

  return (
    <View style={styles.muscleCard}>
      <View style={styles.muscleHeader}>
        <Text style={styles.muscleName}>{muscle.muscle}</Text>
        <View style={styles.scoreContainer}>
          <Text style={[styles.muscleScore, { color: getMuscleColor(muscle.score) }]}>
            {muscle.score.toFixed(1)}
          </Text>
          <View style={[styles.scoreIndicator, { backgroundColor: getMuscleColor(muscle.score) }]} />
        </View>
      </View>
      <View style={styles.progressBarBackground}>
        <LinearGradient
          colors={[getMuscleColor(muscle.score), `${getMuscleColor(muscle.score)}80`]}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 0 }}
          style={[styles.progressBarFill, { width: `${animatedWidth}%` }]}
        />
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#0A0A0A',
  },
  imageSection: {
    position: 'relative',
    width: '100%',
    height: 300,
  },
  topImage: {
    width: '100%',
    height: '100%',
    resizeMode: 'cover',
  },
  headerOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingTop: 30,
    paddingHorizontal: 20,
    paddingBottom: 15,
    zIndex: 2,
  },
  imageGradientOverlay: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    height: 80,
    zIndex: 1,
  },
  scoreSection: {
    alignItems: 'center',
    paddingVertical: 30,
    paddingHorizontal: 20,
    backgroundColor: '#0A0A0A',
  },
  scoreCard: {
    backgroundColor: '#1A1A1A',
    borderRadius: 16,
    borderWidth: 2,
    borderColor: '#333333',
    paddingVertical: 24,
    paddingHorizontal: 32,
    alignItems: 'center',
    width: screenWidth - 40,
    marginHorizontal: 20,
  },
  scoreContent: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
  circularScoreValue: {
    fontSize: 32,
    fontWeight: 'bold',
    color: '#FFFFFF',
  },
  scoreDetails: {
    marginLeft: 20,
    alignItems: 'flex-start',
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
    padding: 12,
  },
  backButtonText: {
    fontSize: 32,
    fontWeight: 'bold',
    color: '#FFFFFF',
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#FFFFFF',
  },
  shareButton: {
    padding: 12,
  },
  shareButtonText: {
    fontSize: 22,
    fontWeight: 'bold',
    color: '#FFFFFF',
  },
  scrollView: {
    flex: 1,
  },
  heroSection: {
    flexDirection: 'row',
    padding: 20,
    borderRadius: 20,
    marginHorizontal: 20,
    marginBottom: 20,
    alignItems: 'center',
  },
  bodyImage: {
    width: 120,
    height: 160,
    borderRadius: 12,
    marginRight: 20,
  },
  overallScoreContainer: {
    flex: 1,
    alignItems: 'center',
  },
  overallScoreValue: {
    fontSize: 48,
    fontWeight: 'bold',
    color: '#FFFFFF',
    marginBottom: 5,
  },
  overallScoreLabel: {
    fontSize: 16,
    color: '#A0A0A0',
    marginBottom: 10,
  },
  healthBadge: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
  },
  healthBadgeText: {
    color: '#FFFFFF',
    fontWeight: 'bold',
    fontSize: 14,
  },
  metricsContainer: {
    flexDirection: 'row',
    paddingHorizontal: 20,
    marginBottom: 30,
    justifyContent: 'space-around',
  },
  metricCard: {
    alignItems: 'center',
    backgroundColor: '#1A1A1A',
    padding: 20,
    borderRadius: 16,
    minWidth: 120,
  },
  metricValue: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#FFFFFF',
  },
  metricUnit: {
    fontSize: 12,
    color: '#A0A0A0',
    marginTop: -5,
  },
  metricLabel: {
    fontSize: 14,
    color: '#A0A0A0',
    marginTop: 10,
  },
  sectionContainer: {
    paddingHorizontal: 20,
    marginBottom: 30,
  },
  sectionTitle: {
    fontSize: 22,
    fontWeight: 'bold',
    color: '#FFFFFF',
    marginBottom: 8,
  },
  sectionSubtitle: {
    fontSize: 14,
    color: '#A0A0A0',
    marginBottom: 20,
  },
  muscleCard: {
    backgroundColor: '#1A1A1A',
    padding: 16,
    borderRadius: 12,
    marginBottom: 12,
  },
  muscleHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  muscleName: {
    fontSize: 16,
    fontWeight: '600',
    color: '#FFFFFF',
  },
  scoreContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  muscleScore: {
    fontSize: 16,
    fontWeight: 'bold',
    marginRight: 8,
  },
  scoreIndicator: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  progressBarBackground: {
    height: 6,
    backgroundColor: '#2A2A2A',
    borderRadius: 3,
    overflow: 'hidden',
  },
  progressBarFill: {
    height: '100%',
    borderRadius: 3,
  },
  apiKeyBanner: {
    backgroundColor: '#1A1A1A',
    borderWidth: 1,
    borderColor: '#333333',
    padding: 12,
    borderRadius: 10,
    marginBottom: 12,
  },
  bannerText: {
    color: '#A0A0A0',
    fontSize: 13,
  },
  muscleDropdown: {
    backgroundColor: '#1A1A1A',
    borderRadius: 12,
    marginBottom: 12,
    overflow: 'hidden',
  },
  muscleDropdownHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 16,
  },
  muscleDropdownLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  muscleScoreIndicator: {
    width: 12,
    height: 12,
    borderRadius: 6,
    marginRight: 12,
  },
  muscleDropdownName: {
    fontSize: 16,
    fontWeight: '600',
    color: '#FFFFFF',
    flex: 1,
  },
  muscleDropdownScore: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#FFFFFF',
    marginLeft: 8,
  },
  muscleDropdownRight: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  exerciseCount: {
    fontSize: 12,
    color: '#A0A0A0',
    marginRight: 8,
  },
  dropdownArrow: {
    fontSize: 12,
    color: '#A0A0A0',
  },
  exerciseList: {
    paddingHorizontal: 16,
    paddingTop: 16,
    paddingBottom: 20,
  },
  recommendationCard: {
    backgroundColor: '#1A1A1A',
    padding: 16,
    borderRadius: 12,
    marginBottom: 12,
  },
  targetHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 10,
  },
  targetTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#FFFFFF',
  },
  exerciseScroll: {
    paddingBottom: 4,
  },
  exerciseCard: {
    width: 160,
    backgroundColor: '#1A1A1A',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#333333',
    marginRight: 12,
    overflow: 'hidden',
  },
  exerciseGif: {
    width: 160,
    height: 180,
    backgroundColor: '#0F0F0F',
  },
  exerciseName: {
    color: '#FFFFFF',
    fontSize: 13,
    fontWeight: '600',
    paddingHorizontal: 10,
    paddingTop: 8,
  },
  exerciseMeta: {
    color: '#A0A0A0',
    fontSize: 11,
    paddingHorizontal: 10,
    paddingBottom: 10,
    paddingTop: 4,
  },
  recHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  recIconContainer: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  recIcon: {
    fontSize: 20,
    color: '#FFFFFF',
  },
  recContent: {
    flex: 1,
  },
  recTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#FFFFFF',
    marginBottom: 2,
  },
  recFrequency: {
    fontSize: 12,
    color: '#A0A0A0',
  },
  priorityBadge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
    borderWidth: 1,
  },
  priorityText: {
    fontSize: 10,
    fontWeight: 'bold',
  },
  exercisesList: {
    marginTop: 8,
  },
  exerciseItem: {
    fontSize: 14,
    color: '#FFFFFF',
    marginBottom: 4,
  },
  moreExercises: {
    fontSize: 12,
    color: '#A0A0A0',
    fontStyle: 'italic',
  },
});
