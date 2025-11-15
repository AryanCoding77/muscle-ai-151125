// Main App Component with Authentication and Tab Navigation

import React, { useEffect, useRef } from 'react';
import { Platform, Linking, Alert } from 'react-native';
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { StatusBar } from 'expo-status-bar';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import * as NavigationBar from 'expo-navigation-bar';
import type { NavigationContainerRef } from '@react-navigation/native';
import { HomeScreen } from './src/screens/HomeScreen';
import { AnalyzeScreen } from './src/screens/AnalyzeScreen';
import { ProgressScreen } from './src/screens/ProgressScreen';
import { ProfileScreen } from './src/screens/ProfileScreen';
import { ResultsScreen } from './src/screens/ResultsScreen';
import { HistoryScreen } from './src/screens/HistoryScreen';
import { ComparisonScreen } from './src/screens/ComparisonScreen';
import { LoginScreen } from './src/screens/LoginScreen';
import { LoadingScreen } from './src/screens/LoadingScreen';
import { COLORS } from './src/config/constants';
import { CustomTabBar } from './src/components/navigation/CustomTabBar';
import { SettingsScreen } from './src/screens/SettingsScreen';
import ExerciseDetailScreen from './src/screens/ExerciseDetailScreen';
import { SubscriptionPlansScreen } from './src/screens/SubscriptionPlansScreen';
import { PaymentScreen } from './src/screens/PaymentScreen';
import { ManageSubscriptionScreen } from './src/screens/ManageSubscriptionScreen';
import { NotificationScreen } from './src/screens/NotificationScreen';
import { PrivacyPolicyScreen } from './src/screens/PrivacyPolicyScreen';
import { TermsConditionsScreen } from './src/screens/TermsConditionsScreen';
import { AuthProvider, useAuth } from './src/context/AuthContext';
import { NotificationProvider } from './src/context/NotificationContext';

const Tab = createBottomTabNavigator();
const Stack = createNativeStackNavigator();

// Stack navigator for screens that need to be pushed on top of tabs
function StackNavigator() {
  return (
    <Stack.Navigator
      screenOptions={{
        headerShown: false,
        contentStyle: {
          backgroundColor: COLORS.background,
        },
        animation: 'slide_from_right',
      }}
    >
      <Stack.Screen name="MainTabs" component={TabNavigator} />
      <Stack.Screen name="Results" component={ResultsScreen as unknown as React.ComponentType<any>} />
      <Stack.Screen name="History" component={HistoryScreen as unknown as React.ComponentType<any>} />
      <Stack.Screen name="Comparison" component={ComparisonScreen as unknown as React.ComponentType<any>} />
      <Stack.Screen name="Settings" component={SettingsScreen as unknown as React.ComponentType<any>} />
      <Stack.Screen name="Notifications" component={NotificationScreen as unknown as React.ComponentType<any>} />
      <Stack.Screen name="ExerciseDetail" component={ExerciseDetailScreen as unknown as React.ComponentType<any>} />
      <Stack.Screen name="SubscriptionPlans" component={SubscriptionPlansScreen as unknown as React.ComponentType<any>} />
      <Stack.Screen name="Payment" component={PaymentScreen as unknown as React.ComponentType<any>} />
      <Stack.Screen name="ManageSubscription" component={ManageSubscriptionScreen as unknown as React.ComponentType<any>} />
      <Stack.Screen name="PrivacyPolicy" component={PrivacyPolicyScreen as unknown as React.ComponentType<any>} />
      <Stack.Screen name="TermsConditions" component={TermsConditionsScreen as unknown as React.ComponentType<any>} />
    </Stack.Navigator>
  );
}

// Tab navigator for main app screens
function TabNavigator() {
  return (
    <Tab.Navigator
      tabBar={(props) => <CustomTabBar {...props} />}
      screenOptions={{
        headerShown: false,
        tabBarStyle: {
          backgroundColor: 'transparent',
          borderTopColor: 'transparent',
          borderTopWidth: 0,
          paddingTop: 0,
          paddingBottom: 0,
          height: 70,
          elevation: 0,
        },
        tabBarActiveTintColor: COLORS.primary,
        tabBarInactiveTintColor: COLORS.textSecondary,
        tabBarLabelStyle: {
          fontSize: 12,
          fontWeight: '600',
          marginTop: 4,
        },
      }}
    >
      <Tab.Screen name="Home" component={HomeScreen} />
      <Tab.Screen name="Analyze" component={AnalyzeScreen} />
      <Tab.Screen name="Progress" component={ProgressScreen} />
      <Tab.Screen name="Profile" component={ProfileScreen} />
    </Tab.Navigator>
  );
}

// Auth Stack Navigator for unauthenticated users
function AuthStackNavigator() {
  return (
    <Stack.Navigator
      screenOptions={{
        headerShown: false,
        contentStyle: {
          backgroundColor: COLORS.background,
        },
        animation: 'slide_from_right',
      }}
    >
      <Stack.Screen name="Login" component={LoginScreen as unknown as React.ComponentType<any>} />
      <Stack.Screen name="PrivacyPolicy" component={PrivacyPolicyScreen as unknown as React.ComponentType<any>} />
      <Stack.Screen name="TermsConditions" component={TermsConditionsScreen as unknown as React.ComponentType<any>} />
    </Stack.Navigator>
  );
}

// Main App Navigator with Authentication Logic
function AppNavigator() {
  const { user, loading } = useAuth();

  console.log('🚀 AppNavigator: loading =', loading, ', user =', user?.email || 'null');

  if (loading) {
    console.log('🔄 AppNavigator: Showing LoadingScreen');
    return <LoadingScreen />;
  }

  if (!user) {
    console.log('🔐 AppNavigator: No user, showing AuthStackNavigator');
    return <AuthStackNavigator />;
  }

  console.log('✅ AppNavigator: User authenticated, showing main app');
  return <StackNavigator />;
}

export default function App() {
  const navigationRef = useRef<NavigationContainerRef<any>>(null);

  useEffect(() => {
    // Set up immersive mode for Android navigation bar
    const setupNavigationBar = async () => {
      if (Platform.OS === 'android') {
        try {
          // Hide the navigation bar in immersive mode
          // Users can swipe up from bottom to temporarily show it
          await NavigationBar.setVisibilityAsync('hidden');
          await NavigationBar.setBehaviorAsync('inset-swipe');
        } catch (error) {
          console.log('Navigation bar setup error:', error);
        }
      }
    };

    setupNavigationBar();
  }, []);

  useEffect(() => {
    // Handle deep links for payment success
    const handleDeepLink = (url: string) => {
      console.log('🔗 Deep link received in App:', url);
      
      // Check if it's a payment success deep link
      if (url.includes('payment-success')) {
        console.log('✅ Payment success detected, navigating to homepage');
        
        // Wait for navigation to be ready, then navigate to home
        setTimeout(() => {
          if (navigationRef.current?.isReady()) {
            // Reset navigation stack and go to Home tab
            navigationRef.current.reset({
              index: 0,
              routes: [
                {
                  name: 'MainTabs',
                  state: {
                    routes: [{ name: 'Home' }],
                    index: 0,
                  },
                },
              ],
            });
            
            // Show success message
            Alert.alert(
              '✅ Payment Successful!',
              'Your subscription is now active. Enjoy unlimited access!',
              [{ text: 'Got it!' }]
            );
          }
        }, 500);
      }
    };

    // Handle initial URL when app is opened from deep link
    Linking.getInitialURL().then((url) => {
      if (url) {
        handleDeepLink(url);
      }
    });

    // Listen for deep links while app is running
    const subscription = Linking.addEventListener('url', (event) => {
      handleDeepLink(event.url);
    });

    return () => {
      subscription.remove();
    };
  }, []);

  return (
    <SafeAreaProvider>
      <AuthProvider>
        <NotificationProvider>
          <NavigationContainer ref={navigationRef}>
            <StatusBar style="light" />
            <AppNavigator />
          </NavigationContainer>
        </NotificationProvider>
      </AuthProvider>
    </SafeAreaProvider>
  );
}
