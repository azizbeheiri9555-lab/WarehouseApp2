// app.config.js
export default {
  expo: {
    name: "مفكرتي الذكية",
    slug: "smart-notes-app",
    version: "1.0.0",
    orientation: "portrait",
    userInterfaceStyle: "automatic",
    icon: "./assets/icon.png",
    splash: {
      image: "./assets/splash.png",
      resizeMode: "contain",
      backgroundColor: "#6c63ff"
    },
    assetBundlePatterns: ["**/*"],
    ios: {
      supportsTablet: true,
      infoPlist: {
        NSPhotoLibraryUsageDescription: "يحتاج التطبيق للوصول إلى المعرض لإضافة صور للملاحظات",
        NSCameraUsageDescription: "يحتاج التطبيق للوصول إلى الكاميرا لالتقاط صور للملاحظات"
      }
    },
    android: {
      package: "com.smartnotes.app",
      adaptiveIcon: {
        foregroundImage: "./assets/adaptive-icon.png",
        backgroundColor: "#6c63ff"
      },
      permissions: [
        "android.permission.CAMERA",
        "android.permission.READ_EXTERNAL_STORAGE",
        "android.permission.WRITE_EXTERNAL_STORAGE"
      ]
    },
    plugins: [
      [
        "expo-image-picker",
        {
          photosPermission: "يحتاج التطبيق للوصول إلى معرض الصور لإضافة مرفقات."
        }
      ],
      [
        "expo-document-picker",
        {
          iCloudContainerName: "iCloud.com.smartnotes.app"
        }
      ]
    ],
    extra: {
      eas: {
        projectId: "24232a98-5969-43a1-99e6-862910d4e6f2"
      }
    }
  }
};
