import React, { useEffect } from 'react';
import { LogBox } from 'react-native';
import Toast from 'react-native-toast-message';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { LanguageProvider } from './src/context/LanguageContext';
import { ThemeProvider } from './src/context/ThemeContext';
import AppNavigator from './src/navigation/AppNavigator';
import { initNFC } from './src/services/nfcService';
import { initApiClient } from './src/services/apiService';

LogBox.ignoreLogs(['ViewPropTypes', 'ColorPropType']);

const App: React.FC = () => {
  useEffect(() => {
    Promise.all([initNFC(), initApiClient()])
      .catch(console.error);
  }, []);

  return (
    <SafeAreaProvider>
      <ThemeProvider>
        <LanguageProvider>
          <GestureHandlerRootView style={{ flex: 1 }}>
            <AppNavigator />
            <Toast />
          </GestureHandlerRootView>
        </LanguageProvider>
      </ThemeProvider>
    </SafeAreaProvider>
  );
};

export default App;
