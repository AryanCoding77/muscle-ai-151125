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

export const TermsConditionsScreen = ({ navigation }: any) => {
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
          <Text style={styles.headerTitle}>Terms & Conditions</Text>
          <View style={styles.headerSpacer} />
        </View>

        {/* Content */}
        <ScrollView style={styles.scrollView} contentContainerStyle={styles.scrollContent}>
          <View style={styles.contentContainer}>
            <Text style={styles.lastUpdated}>Last updated: January 1, 2024</Text>
            
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>1. Acceptance of Terms</Text>
              <Text style={styles.sectionText}>
                Lorem ipsum dolor sit amet, consectetur adipiscing elit. By accessing and using this application, you accept and agree to be bound by the terms and provision of this agreement. Sed do eiusmod tempor incididunt ut labore et dolore magna aliqua.
              </Text>
            </View>

            <View style={styles.section}>
              <Text style={styles.sectionTitle}>2. Use License</Text>
              <Text style={styles.sectionText}>
                Permission is granted to temporarily download one copy of Muscle AI per device for personal, non-commercial transitory viewing only. This is the grant of a license, not a transfer of title, and under this license you may not:
              </Text>
              <Text style={styles.bulletPoint}>• Modify or copy the materials</Text>
              <Text style={styles.bulletPoint}>• Use the materials for any commercial purpose</Text>
              <Text style={styles.bulletPoint}>• Attempt to decompile or reverse engineer any software</Text>
              <Text style={styles.bulletPoint}>• Remove any copyright or other proprietary notations</Text>
            </View>

            <View style={styles.section}>
              <Text style={styles.sectionTitle}>3. User Account</Text>
              <Text style={styles.sectionText}>
                Ut enim ad minim veniam, quis nostrud exercitation ullamco laboris nisi ut aliquip ex ea commodo consequat. When you create an account with us, you must provide information that is accurate, complete, and current at all times.
              </Text>
              <Text style={styles.sectionText}>
                You are responsible for safeguarding the password and for all activities that occur under your account.
              </Text>
            </View>

            <View style={styles.section}>
              <Text style={styles.sectionTitle}>4. Prohibited Uses</Text>
              <Text style={styles.sectionText}>
                You may not use our service:
              </Text>
              <Text style={styles.bulletPoint}>• For any unlawful purpose or to solicit others to unlawful acts</Text>
              <Text style={styles.bulletPoint}>• To violate any international, federal, provincial, or state regulations, rules, laws, or local ordinances</Text>
              <Text style={styles.bulletPoint}>• To infringe upon or violate our intellectual property rights or the intellectual property rights of others</Text>
              <Text style={styles.bulletPoint}>• To harass, abuse, insult, harm, defame, slander, disparage, intimidate, or discriminate</Text>
            </View>

            <View style={styles.section}>
              <Text style={styles.sectionTitle}>5. Content</Text>
              <Text style={styles.sectionText}>
                Duis aute irure dolor in reprehenderit in voluptate velit esse cillum dolore eu fugiat nulla pariatur. Our service allows you to post, link, store, share and otherwise make available certain information, text, graphics, videos, or other material.
              </Text>
              <Text style={styles.sectionText}>
                You are responsible for content that you post to the service, including its legality, reliability, and appropriateness.
              </Text>
            </View>

            <View style={styles.section}>
              <Text style={styles.sectionTitle}>6. Privacy Policy</Text>
              <Text style={styles.sectionText}>
                Your privacy is important to us. Please review our Privacy Policy, which also governs your use of the service, to understand our practices.
              </Text>
            </View>

            <View style={styles.section}>
              <Text style={styles.sectionTitle}>7. Subscription Terms</Text>
              <Text style={styles.sectionText}>
                Excepteur sint occaecat cupidatat non proident, sunt in culpa qui officia deserunt mollit anim id est laborum. Some parts of the service are billed on a subscription basis.
              </Text>
              <Text style={styles.bulletPoint}>• Subscriptions automatically renew unless cancelled</Text>
              <Text style={styles.bulletPoint}>• You can cancel your subscription at any time</Text>
              <Text style={styles.bulletPoint}>• Refunds are handled according to our refund policy</Text>
            </View>

            <View style={styles.section}>
              <Text style={styles.sectionTitle}>8. Disclaimer</Text>
              <Text style={styles.sectionText}>
                The information on this application is provided on an "as is" basis. To the fullest extent permitted by law, this Company excludes all representations, warranties, conditions and terms.
              </Text>
            </View>

            <View style={styles.section}>
              <Text style={styles.sectionTitle}>9. Limitations</Text>
              <Text style={styles.sectionText}>
                In no event shall Muscle AI or its suppliers be liable for any damages (including, without limitation, damages for loss of data or profit, or due to business interruption) arising out of the use or inability to use the materials on Muscle AI's application.
              </Text>
            </View>

            <View style={styles.section}>
              <Text style={styles.sectionTitle}>10. Accuracy of Materials</Text>
              <Text style={styles.sectionText}>
                The materials appearing on Muscle AI's application could include technical, typographical, or photographic errors. Muscle AI does not warrant that any of the materials on its application are accurate, complete, or current.
              </Text>
            </View>

            <View style={styles.section}>
              <Text style={styles.sectionTitle}>11. Modifications</Text>
              <Text style={styles.sectionText}>
                Muscle AI may revise these terms of service for its application at any time without notice. By using this application, you are agreeing to be bound by the then current version of these terms of service.
              </Text>
            </View>

            <View style={styles.section}>
              <Text style={styles.sectionTitle}>12. Contact Information</Text>
              <Text style={styles.sectionText}>
                If you have any questions about these Terms and Conditions, please contact us at:
              </Text>
              <Text style={styles.contactInfo}>Email: legal@muscleai.com</Text>
              <Text style={styles.contactInfo}>Address: 123 Fitness Street, Health City, HC 12345</Text>
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
