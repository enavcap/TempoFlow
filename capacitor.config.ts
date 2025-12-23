import { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'com.tempoflow.app',
  appName: 'Tempo Flow',
  webDir: 'out',
  server: {
    androidScheme: 'https'
  },
  plugins: {
    SplashScreen: {
      launchShowDuration: 2000,
      backgroundColor: "#000000",
      androidSplashResourceName: "splash",
      showSpinner: false
    },
    StatusBar: {
      style: 'dark',
      backgroundColor: "#000000"
    },
    Haptics: {
      enabled: true
    }
  }
};

export default config;
