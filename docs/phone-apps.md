# GMO Scan on iPhone and Android

One codebase runs as the website, the iPhone app and the Android app. The
apps are the same pages wrapped with [Capacitor](https://capacitorjs.com).
Everything is built on GitHub's machines, so no Mac is needed.

## How it fits together

- **Website**: unchanged. Vercel builds `main` and serves the pages plus the
  `/api/lookup` server route.
- **Phone apps**: `npm run build:app` builds the pages as plain static files
  (`out/`) and copies them into `ios/` and `android/` (`cap sync`). The app
  has no server of its own, so barcode lookups go to the live site at the
  address in `.env.app`. That route allows the app's origins through CORS.
- **Sign-in**: the app talks to Supabase directly, the same as the website.
  Email + password works. Google sign-in is hidden in the app for now, because
  it returns to a web address the app can't receive yet.
- **App ID / bundle ID**: `com.hilltyler2x.gmoscan`. It must match exactly in
  `capacitor.config.ts` (and the Xcode project), the Apple Identifier, and the
  App Store Connect app record.

A change to `/api/lookup` reaches the apps as soon as Vercel deploys it. A
change to the pages reaches the apps only through a new app build.

## Automatic builds

`.github/workflows/build.yml` runs on every push to `main`:

| What | Where it goes |
| --- | --- |
| Android test APK | https://github.com/hilltyler2x/gmo-scan/releases/download/test-build/GMO-Scan-test.apk |
| Unsigned iPhone .ipa (for Sideloadly) | https://github.com/hilltyler2x/gmo-scan/releases/download/test-build/GMO-Scan-unsigned.ipa |
| Signed iPhone build | TestFlight, once the four Apple secrets are set |

Pull requests build both apps as a check and publish nothing. Runs on `main`
queue up rather than overlapping.

## Your one-time setup

### 1. GitHub secrets (needed for any app build to publish)

GitHub repo → **Settings** → **Secrets and variables** → **Actions** →
**New repository secret**. Add, spelled exactly:

| Secret name | What to paste |
| --- | --- |
| `NEXT_PUBLIC_SUPABASE_URL` | Same value as in Vercel (Project → Settings → Environment Variables) |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Same value as in Vercel |

### 2. Android test app (free)

1. On the Android phone, open the APK link above.
2. Download, open it, and allow installs from your browser when Android asks.
3. Test builds use a throwaway signing key: uninstall the old app before
   installing a newer build.

### 3. Apple Developer account

1. Join the Apple Developer Program at https://developer.apple.com/programs/
   ($99/year). Approval can take a day or two.
2. developer.apple.com → **Account** → **Membership details**. Copy the
   **Team ID**.

### 4. Register the app with Apple

1. developer.apple.com → **Certificates, Identifiers & Profiles** →
   **Identifiers** → **+** → **App IDs** → **App** → Continue.
2. Description: `GMO Scan`. Bundle ID: **Explicit**, `com.hilltyler2x.gmoscan`.
   No extra capabilities are needed. Continue → Register.
3. https://appstoreconnect.apple.com → **Apps** → **+** → **New App**.
   Platform **iOS**, Name `GMO Scan` (must be unique on the App Store; add a
   word if it's taken), language, Bundle ID `com.hilltyler2x.gmoscan`,
   SKU `gmoscan001`, User Access **Full Access**. Create.

### 5. The API key that lets GitHub upload builds

1. App Store Connect → **Users and Access** → **Integrations** →
   **App Store Connect API** → **Team Keys** → **+** (the first time, you may
   need to click **Request Access** and accept first).
2. Name `GitHub builds`, Access **Admin** (lower roles can fail at signing).
3. **Download the .p8 file right away.** Apple lets you download it only
   once. If it's lost, revoke the key and make a new one.
4. Copy the **Key ID** (next to the key) and the **Issuer ID** (above the list).

### 6. Give GitHub the four Apple secrets

Same page as step 1. Never paste these into a chat, an issue or a file in the repo.

| Secret name | What to paste |
| --- | --- |
| `APPLE_TEAM_ID` | Team ID from step 3 |
| `ASC_KEY_ID` | Key ID from step 5 |
| `ASC_ISSUER_ID` | Issuer ID from step 5 |
| `ASC_KEY_P8` | Open the .p8 in Notepad and paste all of it, including the `-----BEGIN PRIVATE KEY-----` and `-----END PRIVATE KEY-----` lines |

### 7. Install from TestFlight

1. Repo → **Actions** → **Phone app builds** → **Run workflow** (or merge any change).
2. Wait for Apple to process the build, usually 10 to 30 minutes. You get an email.
3. App Store Connect → GMO Scan → **TestFlight** → **Internal Testing** → **+**,
   create a group and add yourself.
4. Install the **TestFlight** app on the iPhone, sign in with the same Apple
   ID, and install GMO Scan. New builds show up there on their own.

**While waiting for Apple approval:** install the unsigned .ipa with
[Sideloadly](https://sideloadly.io) plus iTunes (from Apple's website, not the
Microsoft Store). Plug in the iPhone, drag the .ipa in, sign in with your
Apple ID. On the phone turn on Settings → Privacy & Security → **Developer
Mode**, then trust your Apple ID under Settings → General → **VPN & Device
Management**. These installs expire after 7 days.

## Working on it locally

```bash
npm run build:app        # static build + copy into ios/ and android/
npx cap open android     # opens Android Studio, if installed
```

`build:app` temporarily moves `app/api` aside (a static build can't contain
server routes) and puts it back afterwards. If the build is interrupted and
`app/_api.parked` is left behind, move it back to `app/api`.

App icons and splash screens are generated from `assets/icon-only.png`
(1024×1024, no transparency, square corners). To change them, replace that
file and run:

```bash
npx @capacitor/assets generate --ios --android \
  --iconBackgroundColor '#20301F' --iconBackgroundColorDark '#20301F' \
  --splashBackgroundColor '#20301F' --splashBackgroundColorDark '#20301F'
```

## Before submitting to the App Store

- **Apple rejects apps that are "just a website."** The app works offline for
  its screens and uses the camera, but a native barcode scanner (instead of
  the in-page one) would make the case stronger and scan faster.
- **The reviewer needs a way in.** Scanning works without an account, but give
  them a test login in App Review Information so they can see history.
- **Privacy policy URL is required**, and the App Privacy answers must match:
  email address (account), scan history stored in Supabase, barcodes sent to
  our server and to Open Food Facts / USDA for lookup, ingredient photos read
  on the phone only (not uploaded).
- The app is iPhone-only (`TARGETED_DEVICE_FAMILY = 1`), so iPad screenshots
  aren't required. iPhone 6.9" screenshots are.

## Asking for app store reviews

The app asks for a rating with the native App Store / Google Play review
dialog (`lib/reviewPrompt.ts`). It never asks on launch. It asks after a scan
that gave a real answer, once the user has had 3 of those and has opened the
app on a second day (or has had 6 in one day). After that it asks again every
14 days, up to 8 times. iOS itself shows the dialog at most 3 times a year,
and Google Play rations it too, so some asks show nothing.

There is no "Do you like the app?" question first: both stores forbid
filtering who gets the review dialog.

The scan page also has an "Enjoying GMO Scan? Rate it" link that opens the
store listing. On iPhone it stays hidden until `NEXT_PUBLIC_APPLE_APP_ID` in
`.env.app` is set to the app's number from its `apps.apple.com/app/id…`
address (after the App Store listing exists).

Testing: the dialog only appears for an app installed from the store (Google
Play internal testing track, or TestFlight on iPhone, where it never
submits a real review). The sideloaded test APK and .ipa skip it silently.
