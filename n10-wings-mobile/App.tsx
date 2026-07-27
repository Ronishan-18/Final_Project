import { useState, useEffect } from 'react';
import { View, ActivityIndicator, StyleSheet, Image, Text } from 'react-native';
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { StatusBar } from 'expo-status-bar';
import AsyncStorage from '@react-native-async-storage/async-storage';

import LoginScreen from './src/screens/LoginScreen';
import RegisterScreen from './src/screens/RegisterScreen';
import VerifyEmailScreen from './src/screens/VerifyEmailScreen';
import ForgotPasswordScreen from './src/screens/ForgotPasswordScreen';
import HomeScreen from './src/screens/Homescreen';
import TournamentDetailScreen from './src/screens/TournamentDetailScreen';
import ProfileScreen from './src/screens/ProfileScreen';
import { colors } from './theme/colors';

export type RootStackParamList = {
  Login: undefined;
  Register: undefined;
  VerifyEmail: { email?: string; pendingToken?: string } | undefined;
  ForgotPassword: { email?: string } | undefined;
  Home: undefined;
  TournamentDetail: { tournament: any };
  Profile: undefined;
};

const Stack = createNativeStackNavigator<RootStackParamList>();

export default function App() {
  const [isAuthenticated, setIsAuthenticated] = useState<boolean>(false);
  const [isCheckingAuth, setIsCheckingAuth] = useState<boolean>(true);

  useEffect(() => {
    checkAuthToken();
  }, []);

  const checkAuthToken = async () => {
    try {
      const token = await AsyncStorage.getItem('token');
      setIsAuthenticated(!!token);
    } catch {
      setIsAuthenticated(false);
    } finally {
      setIsCheckingAuth(false);
    }
  };

  const handleLoginSuccess = () => {
    setIsAuthenticated(true);
  };

  const handleLogout = () => {
    setIsAuthenticated(false);
  };

  if (isCheckingAuth) {
    return (
      <View style={styles.splashContainer}>
        <StatusBar style="light" />
        <Image source={require('./assets/logo.png')} style={styles.splashLogo} resizeMode="contain" />
        <ActivityIndicator color={colors.cyan} size="large" style={{ marginTop: 24 }} />
        <Text style={styles.splashText}>Loading N-10 Wings...</Text>
      </View>
    );
  }

  return (
    <NavigationContainer>
      <StatusBar style="light" />
      <Stack.Navigator
        id="RootStack"
        initialRouteName={isAuthenticated ? 'Home' : 'Login'}
        screenOptions={{
          headerShown: false,
          contentStyle: { backgroundColor: colors.bg },
        }}
      >
        <Stack.Screen name="Login">
          {(props) => <LoginScreen {...props} onLogin={handleLoginSuccess} />}
        </Stack.Screen>
        <Stack.Screen name="Register" component={RegisterScreen} />
        <Stack.Screen name="VerifyEmail" component={VerifyEmailScreen} />
        <Stack.Screen name="ForgotPassword" component={ForgotPasswordScreen} />
        <Stack.Screen name="Home" component={HomeScreen} />
        <Stack.Screen name="TournamentDetail" component={TournamentDetailScreen} />
        <Stack.Screen name="Profile">
          {(props) => <ProfileScreen {...props} onLogout={handleLogout} />}
        </Stack.Screen>
      </Stack.Navigator>
    </NavigationContainer>
  );
}

const styles = StyleSheet.create({
  splashContainer: {
    flex: 1,
    backgroundColor: colors.bg,
    alignItems: 'center',
    justifyContent: 'center',
  },
  splashLogo: {
    width: 200,
    height: 85,
  },
  splashText: {
    color: colors.muted,
    fontSize: 13,
    fontWeight: '600',
    letterSpacing: 1.5,
    marginTop: 16,
  },
});
