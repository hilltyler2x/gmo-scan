import type { CapacitorConfig } from "@capacitor/cli";

const config: CapacitorConfig = {
  // Must match the Apple App ID and the App Store Connect app record exactly.
  appId: "com.hilltyler2x.gmoscan",
  appName: "GMO Scan",
  // Static export of the app's pages, produced by `npm run build:app`.
  webDir: "out",
  ios: {
    // Let the page draw under the notch and home bar; the CSS keeps content
    // clear of them with safe-area insets.
    contentInset: "never",
  },
};

export default config;
