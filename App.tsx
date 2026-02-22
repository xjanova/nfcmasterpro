import React, { useEffect } from 'react';
import { StatusBar, LogBox } from 'react-native';
import Toast from 'react-native-toast-message';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { LanguageProvider } from './src/context/LanguageContext';
import AppNavigator from './src/navigation/AppNavigator';
import { initNFC } from './src/services/nfcService';
import { initApiClient } from './src/services/apiService';

LogBox.ignoreLogs(['ViewPropTypes', 'ColorPropType']);

const App: React.FC = () => {
  useEffect(() => {
    // Initialize NFC and API on app start
    Promise.all([initNFC(), initApiClient()])
      .catch(console.error);
  }, []);

  return (
    <LanguageProvider>
      <GestureHandlerRootView style={{ flex: 1 }}>
        <StatusBar barStyle="light-content" backgroundColor="#0a0a0f" />
        <AppNavigator />
        <Toast />
      </GestureHandlerRootView>
    </LanguageProvider>
  );
};

export default App;
