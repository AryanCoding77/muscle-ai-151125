import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  SafeAreaView,
  TouchableOpacity,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { MaterialCommunityIcons as Icon } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import { COLORS } from '../config/constants';

export const PrivacyPolicyScreen = ({ navigation }: any) => {
  const handleGoBack = async () => {
    try {
      await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    } catch {}
    navigation.goBack();
  };

  return (
    <LinearGradient
      colors={['#A67C52', '#8B4513', '#2F1B14', '#1A1A1A', '#0F0F0F', '#0A0A0A']}
      style={styles.container}
    >
      <SafeAreaView style={styles.safeArea}>
        {/* Header */}
        <View style={styles.header}>
          <TouchableOpacity style={styles.backButton} onPress={handleGoBack}>
            <Icon name="arrow-left" size={24} color="#FFFFFF" />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Privacy Policy</Text>
          <View style={styles.headerSpacer} />
        </View>

        {/* Content */}
        <ScrollView style={styles.scrollView} contentContainerStyle={styles.scrollContent}>
          <View style={styles.contentContainer}>
            <Text style={styles.lastUpdated}>Last updated: January 1, 2024</Text>
            
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>1. Information We Collect</Text>
              <Text style={styles.sectionText}>
                Lorem ipsum dolor sit amet, consectetur adipiscing elit. Sed do eiusmod tempor incididunt ut labore et dolore magna aliqua. Ut enim ad minim veniam, quis nostrud exercitation ullamco laboris nisi ut aliquip ex ea commodo consequat.
              </Text>
              <Text style={styles.sectionText}>
                Duis aute irure dolor in reprehenderit in voluptate velit esse cillum dolore eu fugiat nulla pariatur. Excepteur sint occaecat cupidatat non proident, sunt in culpa qui officia deserunt mollit anim id est laborum.
              </Text>
            </View>

            <View style={styles.section}>
              <Text style={styles.sectionTitle}>2. How We Use Your Information</Text>
              <Text style={styles.sectionText}>
                Sed ut perspiciatis unde omnis iste natus error sit voluptatem accusantium doloremque laudantium, totam rem aperiam, eaque ipsa quae ab illo inventore veritatis et quasi architecto beatae vitae dicta sunt explicabo.
              </Text>
              <Text style={styles.bulletPoint}>• Nemo enim ipsam voluptatem quia voluptas sit aspernatur</Text>
              <Text style={styles.bulletPoint}>• Neque porro quisquam est, qui dolorem ipsum quia dolor sit amet</Text>
              <Text style={styles.bulletPoint}>• Consectetur, adipisci velit, sed quia non numquam eius modi</Text>
            </View>

            <View style={styles.section}>
              <Text style={styles.sectionTitle}>3. Data Security</Text>
              <Text style={styles.sectionText}>
                At vero eos et accusamus et iusto odio dignissimos ducimus qui blanditiis praesentium voluptatum deleniti atque corrupti quos dolores et quas molestias excepturi sint occaecati cupiditate non provident.
              </Text>
            </View>

            <View style={styles.section}>
              <Text style={styles.sectionTitle}>4. Third-Party Services</Text>
              <Text style={styles.sectionText}>
                Similique sunt in culpa qui officia deserunt mollitia animi, id est laborum et dolorum fuga. Et harum quidem rerum facilis est et expedita distinctio. Nam libero tempore, cum soluta nobis est eligendi optio cumque nihil impedit quo minus.
              </Text>
            </View>

            <View style={styles.section}>
              <Text style={styles.sectionTitle}>5. Cookies and Tracking</Text>
              <Text style={styles.sectionText}>
                Temporibus autem quibusdam et aut officiis debitis aut rerum necessitatibus saepe eveniet ut et voluptates repudiandae sint et molestiae non recusandae. Itaque earum rerum hic tenetur a sapiente delectus.
              </Text>
            </View>

            <View style={styles.section}>
              <Text style={styles.sectionTitle}>6. Your Rights</Text>
              <Text style={styles.sectionText}>
                Ut aut reiciendis voluptatibus maiores alias consequatur aut perferendis doloribus asperiores repellat. Lorem ipsum dolor sit amet, consectetur adipiscing elit, sed do eiusmod tempor incididunt ut labore et dolore magna aliqua.
              </Text>
              <Text style={styles.bulletPoint}>• Right to access your personal data</Text>
              <Text style={styles.bulletPoint}>• Right to rectification of inaccurate data</Text>
              <Text style={styles.bulletPoint}>• Right to erasure of your data</Text>
              <Text style={styles.bulletPoint}>• Right to data portability</Text>
            </View>

            <View style={styles.section}>
              <Text style={styles.sectionTitle}>7. Contact Information</Text>
              <Text style={styles.sectionText}>
                If you have any questions about this Privacy Policy, please contact us at:
              </Text>
              <Text style={styles.contactInfo}>Email: privacy@muscleai.com</Text>
              <Text style={styles.contactInfo}>Address: 123 Fitness Street, Health City, HC 12345</Text>
            </View>

            <View style={styles.section}>
              <Text style={styles.sectionTitle}>8. Changes to This Policy</Text>
              <Text style={styles.sectionText}>
                We may update our Privacy Policy from time to time. We will notify you of any changes by posting the new Privacy Policy on this page and updating the "Last updated" date at the top of this Privacy Policy.
              </Text>
            </View>
          </View>
        </ScrollView>
      </SafeAreaView>
    </LinearGradient>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  safeArea: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingTop: 20,
    paddingBottom: 15,
    marginTop: 20,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255, 255, 255, 0.1)',
  },
  backButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#FFFFFF',
  },
  headerSpacer: {
    width: 40,
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    paddingBottom: 30,
  },
  contentContainer: {
    padding: 20,
  },
  lastUpdated: {
    fontSize: 14,
    color: 'rgba(255, 255, 255, 0.6)',
    textAlign: 'center',
    marginBottom: 30,
    fontStyle: 'italic',
  },
  section: {
    marginBottom: 25,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#FF6B35',
    marginBottom: 12,
  },
  sectionText: {
    fontSize: 14,
    color: 'rgba(255, 255, 255, 0.8)',
    lineHeight: 20,
    marginBottom: 10,
  },
  bulletPoint: {
    fontSize: 14,
    color: 'rgba(255, 255, 255, 0.8)',
    lineHeight: 20,
    marginBottom: 5,
    paddingLeft: 10,
  },
  contactInfo: {
    fontSize: 14,
    color: '#50C878',
    lineHeight: 20,
    marginBottom: 5,
    fontWeight: '500',
  },
});
