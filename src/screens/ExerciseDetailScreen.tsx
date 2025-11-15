import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Image,
  Dimensions,
  SafeAreaView,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Image as ExpoImage } from 'expo-image';

const { width: screenWidth } = Dimensions.get('window');

interface ExerciseDetailScreenProps {
  route: {
    params: {
      exercise: {
        id: string;
        name: string;
        bodyPart: string;
        equipment: string;
        gifUrl: string;
        target: string;
        secondaryMuscles?: string[];
        instructions?: string[];
        description?: string;
        difficulty?: string;
        category?: string;
      };
    };
  };
  navigation: any;
}

const ExerciseDetailScreen: React.FC<ExerciseDetailScreenProps> = ({ route, navigation }) => {
  const { exercise } = route.params;
  // Robust fallbacks in case API does not return these fields
  const secondaryMuscles = Array.isArray(exercise.secondaryMuscles) ? exercise.secondaryMuscles : [];
  const instructions = Array.isArray(exercise.instructions)
    ? exercise.instructions
    : [
        'Start with proper posture and warm up the target muscle group.',
        'Execute the movement with controlled form through full range of motion.',
        'Keep core engaged and avoid using momentum.',
        'Return to the starting position slowly and repeat for the desired reps.',
      ];

  return (
    <SafeAreaView style={styles.container}>
      <LinearGradient
        colors={['#0A0A0A', '#1A1A1A', '#2A2A2A']}
        style={styles.backgroundGradient}
      >
        <ScrollView contentContainerStyle={styles.scrollContent}>
          {/* Header */}
          <View style={styles.header}>
            <TouchableOpacity
              style={styles.backButton}
              onPress={() => {
                console.log('Back button pressed');
                navigation.goBack();
              }}
              activeOpacity={0.7}
            >
              <Text style={styles.backButtonText}>←</Text>
            </TouchableOpacity>
            <Text style={styles.headerTitle}>Exercise Details</Text>
            <View style={styles.headerSpacer} />
          </View>

          {/* Exercise GIF */}
          <View style={styles.gifContainer}>
            <ExpoImage
              source={{ uri: exercise.gifUrl }}
              style={styles.exerciseGif}
              contentFit="cover"
              transition={200}
              cachePolicy="memory-disk"
            />
          </View>

          {/* Exercise Info */}
          <View style={styles.infoContainer}>
            <Text style={styles.exerciseName}>{exercise.name}</Text>
            
            <View style={styles.metaContainer}>
              <View style={styles.metaItem}>
                <Text style={styles.metaLabel}>Target Muscle</Text>
                <Text style={styles.metaValue}>{exercise.target}</Text>
              </View>
              
              <View style={styles.metaItem}>
                <Text style={styles.metaLabel}>Body Part</Text>
                <Text style={styles.metaValue}>{exercise.bodyPart}</Text>
              </View>
              
              <View style={styles.metaItem}>
                <Text style={styles.metaLabel}>Equipment</Text>
                <Text style={styles.metaValue}>{exercise.equipment}</Text>
              </View>
            </View>

            {secondaryMuscles.length > 0 && (
              <View style={styles.secondaryMusclesContainer}>
                <Text style={styles.sectionTitle}>Secondary Muscles</Text>
                <View style={styles.muscleTagsContainer}>
                  {secondaryMuscles.map((muscle, index) => (
                    <View key={index} style={styles.muscleTag}>
                      <Text style={styles.muscleTagText}>{muscle}</Text>
                    </View>
                  ))}
                </View>
              </View>
            )}

            {/* Instructions */}
            <View style={styles.instructionsContainer}>
              <Text style={styles.sectionTitle}>How to Perform</Text>
              {instructions.map((instruction, index) => (
                <View key={index} style={styles.instructionStep}>
                  <View style={styles.stepNumber}>
                    <Text style={styles.stepNumberText}>{index + 1}</Text>
                  </View>
                  <Text style={styles.instructionText}>{instruction}</Text>
                </View>
              ))}
            </View>
          </View>
        </ScrollView>
      </LinearGradient>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  backgroundGradient: {
    flex: 1,
  },
  scrollContent: {
    paddingBottom: 20,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingTop: 40,
    paddingBottom: 20,
  },
  backButton: {
    width: 40,
    height: 40,
    justifyContent: 'center',
    alignItems: 'center',
  },
  backButtonText: {
    color: '#FFFFFF',
    fontSize: 28,
    fontWeight: 'bold',
  },
  headerTitle: {
    color: '#FFFFFF',
    fontSize: 18,
    fontWeight: 'bold',
  },
  headerSpacer: {
    width: 40,
  },
  gifContainer: {
    alignItems: 'center',
    marginBottom: 30,
    paddingHorizontal: 20,
  },
  exerciseGif: {
    width: screenWidth - 40,
    height: 300,
    borderRadius: 16,
    backgroundColor: '#FFFFFF',
  },
  infoContainer: {
    paddingHorizontal: 20,
  },
  exerciseName: {
    color: '#FFFFFF',
    fontSize: 24,
    fontWeight: 'bold',
    textAlign: 'center',
    marginBottom: 20,
    textTransform: 'capitalize',
  },
  metaContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 30,
  },
  metaItem: {
    flex: 1,
    alignItems: 'center',
    paddingHorizontal: 10,
  },
  metaLabel: {
    color: '#888888',
    fontSize: 12,
    fontWeight: '600',
    marginBottom: 4,
    textTransform: 'uppercase',
  },
  metaValue: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: 'bold',
    textAlign: 'center',
    textTransform: 'capitalize',
  },
  secondaryMusclesContainer: {
    marginBottom: 30,
  },
  sectionTitle: {
    color: '#FFFFFF',
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 15,
  },
  muscleTagsContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  muscleTag: {
    backgroundColor: 'rgba(74, 144, 226, 0.2)',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: '#4A90E2',
  },
  muscleTagText: {
    color: '#4A90E2',
    fontSize: 12,
    fontWeight: '600',
    textTransform: 'capitalize',
  },
  instructionsContainer: {
    marginBottom: 20,
  },
  instructionStep: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: 16,
  },
  stepNumber: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: '#4A90E2',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
    marginTop: 2,
  },
  stepNumberText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: 'bold',
  },
  instructionText: {
    flex: 1,
    color: '#CCCCCC',
    fontSize: 16,
    lineHeight: 24,
  },
});

export default ExerciseDetailScreen;
