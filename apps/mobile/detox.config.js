/** @type {Detox.DetoxConfig} */
module.exports = {
  testRunner: {
    args: {
      $0: "jest",
      config: "e2e/jest.config.js",
    },
    jest: {
      setupTimeout: 120000,
    },
  },
  apps: {
    "ios.debug": {
      type: "ios.app",
      binaryPath:
        "ios/build/Build/Products/Debug-iphonesimulator/ClaimGuardian.app",
      build:
        "xcodebuild -workspace ios/ClaimGuardian.xcworkspace -scheme ClaimGuardian -configuration Debug -sdk iphonesimulator -derivedDataPath ios/build",
    },
    "ios.release": {
      type: "ios.app",
      binaryPath:
        "ios/build/Build/Products/Release-iphonesimulator/ClaimGuardian.app",
      build:
        "xcodebuild -workspace ios/ClaimGuardian.xcworkspace -scheme ClaimGuardian -configuration Release -sdk iphonesimulator -derivedDataPath ios/build",
    },
    "android.debug": {
      type: "android.apk",
      binaryPath: "android/app/build/outputs/apk/debug/app-debug.apk",
      build:
        "cd android && ./gradlew assembleDebug assembleAndroidTest -DtestBuildType=debug",
      reversePorts: [8081],
    },
    "android.release": {
      type: "android.apk",
      binaryPath: "android/app/build/outputs/apk/release/app-release.apk",
      build:
        "cd android && ./gradlew assembleRelease assembleAndroidTest -DtestBuildType=release",
      reversePorts: [8081],
    },
  },
  devices: {
    simulator: {
      type: "ios.simulator",
      device: {
        type: "iPhone 14 Pro",
      },
    },
    "ios.simulator": {
      type: "ios.simulator",
      device: {
        type: "iPhone 14 Pro",
      },
    },
    "android.emulator": {
      type: "android.emulator",
      device: {
        avdName: "Pixel_4_API_30",
      },
    },
    "android.attached": {
      type: "android.attached",
      device: {
        adbName: ".*",
      },
    },
    "ios.device": {
      type: "ios.device",
      device: {
        id: ".*",
      },
    },
  },
  configurations: {
    "ios.sim.debug": {
      device: "simulator",
      app: "ios.debug",
    },
    "ios.sim.release": {
      device: "ios.simulator",
      app: "ios.release",
    },
    "android.emu.debug": {
      device: "android.emulator",
      app: "android.debug",
    },
    "android.emu.release": {
      device: "android.emulator",
      app: "android.release",
    },
    "android.device.debug": {
      device: "android.attached",
      app: "android.debug",
    },
    "ios.device.debug": {
      device: "ios.device",
      app: "ios.debug",
    },
  },
};
