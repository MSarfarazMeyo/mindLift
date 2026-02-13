export default {
  expo: {
    name: 'MindLift',
    slug: 'Mind-Lift',
    version: '1.3.5',
    orientation: 'portrait',
    icon: './assets/images/FullLogo-5.jpg',
    scheme: 'mindlift',
    userInterfaceStyle: 'automatic',

    splash: {
      image: './assets/images/mindlift.png',
      resizeMode: 'contain',
      backgroundColor: '#DBE3FD',
    },

    updates: {
      url: 'https://u.expo.dev/59cbd475-fb93-4266-88af-48210b8b4a08',
      channel: 'production',
    },

    runtimeVersion: {
      policy: 'appVersion',
    },
    assetBundlePatterns: ['**/*'],
    ios: {
      supportsTablet: true,
      usesAppleSignIn: true,
      bundleIdentifier: 'com.mindlift.app',
      buildNumber: '35',
      infoPlist: {
        NSPhotoLibraryUsageDescription:
          'Your permission allows us to access your media gallery so you can upload images from your photo library to your wellness journal entries.',
      },
    },
    android: {
      package: 'com.gerald.mindlift',

      versionCode: 13,
      adaptiveIcon: {
        foregroundImage: './assets/notification_icon.png',
        backgroundColor: '#FFFFFF',
      },
    },
    web: {
      bundler: 'metro',
      output: 'single',
      favicon: './assets/images/favicon.png',
    },
    extra: {
      stripePublishableKey:
        'pk_live_51QwppxGDuPlVOKHMZN9iIzVozuv5eSUFfcXvCfQ9xUVgeMVbil1NyUrGgM0WUluKhfuKrkkOMORNBd1fyS58m1mg00M370E0aH',
      supabaseUrl: 'https://jtpzbrfatlrdxomqcgjb.supabase.co',
      supabaseAnonKey:
        'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imp0cHpicmZhdGxyZHhvbXFjZ2piIiwicm9sZSI6ImFub24iLCJpYXQiOjE3Mzk4MTI2NTMsImV4cCI6MjA1NTM4ODY1M30.EGweeHvEDhy3kUyuzAhZW46lnyXhXetEi0KJMCkSS9M',
      supabaseServiceRoleKey:
        'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imp0cHpicmZhdGxyZHhvbXFjZ2piIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTczOTgxMjY1MywiZXhwIjoyMDU1Mzg4NjUzfQ.wyuYXm_AKuAGj5eM2oEwypQpthfdaS6zuwuI-ibSRvA',
      supabaseUrl: 'https://jtpzbrfatlrdxomqcgjb.supabase.co',
      supabaseAnonKey:
        'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imp0cHpicmZhdGxyZHhvbXFjZ2piIiwicm9sZSI6ImFub24iLCJpYXQiOjE3Mzk4MTI2NTMsImV4cCI6MjA1NTM4ODY1M30.EGweeHvEDhy3kUyuzAhZW46lnyXhXetEi0KJMCkSS9M',
      supabaseServiceRoleKey:
        'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imp0cHpicmZhdGxyZHhvbXFjZ2piIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTczOTgxMjY1MywiZXhwIjoyMDU1Mzg4NjUzfQ.wyuYXm_AKuAGj5eM2oEwypQpthfdaS6zuwuI-ibSRvA',

      eas: {
        projectId: '59cbd475-fb93-4266-88af-48210b8b4a08',
      },
    },
    plugins: [
      'expo-router',
      'expo-secure-store',
      [
        'expo-sensors',
        {
          motionPermission:
            'Allow $(PRODUCT_NAME) to access your device motion',
        },
      ],

      [
        'expo-image-picker',
        {
          photosPermission:
            'Your permission allows us to access your media gallery so you can upload images from your photo library to your wellness journal entries.',
        },
      ],

      [
        'expo-notifications',
        {
          icon: './assets/notification_icon.png',
          color: '#ffffff',
          sounds: ['./assets/notification_sound.wav'],
        },
      ],

      [
        '@stripe/stripe-react-native',
        {
          enableGooglePay: true,
        },
      ],
    ],
    experiments: { typedRoutes: true },
    notification: {
      iosDisplayInForeground: true,
      androidMode: 'default',
      androidCollapsedTitle: 'New notifications',
    },
    eas: {
      projectId: '59cbd475-fb93-4266-88af-48210b8b4a08',
    },
  },
};
