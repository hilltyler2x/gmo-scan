# Publishing GMO Scan on Google Play

The developer account is an **organization** account (Enouement / FYEKICKS,
LLC), so the "12 testers for 14 days" closed-test rule for new personal
accounts does not apply: the app can go to production as soon as Google's
review passes.

| Thing | Value |
| --- | --- |
| Package name (permanent after the first upload) | `com.hilltyler2x.gmoscan` |
| Privacy policy URL | https://gmo-scan-ke9v.vercel.app/privacy |
| Account deletion URL | https://gmo-scan-ke9v.vercel.app/delete-account |
| Signed release build | https://github.com/hilltyler2x/gmo-scan/releases/download/test-build/GMO-Scan-release.aab |
| Feature graphic and 512 icon | the project's `google-play/` folder |

## 1. Trader status

Play Console → **Settings** → **Developer account** → **Account details** →
Trader status → **I am a trader**. Publishing as an LLC makes you one. Your
business address, phone and email are then shown on the listing to users in
the EU. (Declaring non-trader removes the app from the EU instead.)

## 2. Create the upload key (once, on your Windows PC)

1. Install the free JDK from https://adoptium.net (Temurin, latest LTS). Keep
   the installer's "Add to PATH" option on.
2. Open a **new** PowerShell window and run:

   ```powershell
   keytool -genkeypair -v -keystore "$HOME\gmo-scan-upload.jks" -alias upload -keyalg RSA -keysize 2048 -validity 10000
   ```

   It asks for a password (make one up and write it down) and some name
   fields (your name and "FYEKICKS, LLC" are fine; the rest can be blank).
3. Copy the key file as text:

   ```powershell
   [Convert]::ToBase64String([IO.File]::ReadAllBytes("$HOME\gmo-scan-upload.jks")) | Set-Clipboard
   ```

4. **Back up `gmo-scan-upload.jks` and the password** somewhere safe (a
   password manager or a USB drive). If they are lost, Google can reset the
   upload key, but it takes a support request and a few days.

## 3. Give GitHub the four Android secrets

GitHub repo → **Settings** → **Secrets and variables** → **Actions** →
**New repository secret**:

| Secret name | What to paste |
| --- | --- |
| `ANDROID_KEYSTORE_BASE64` | The text from step 2.3 (Ctrl+V) |
| `ANDROID_KEYSTORE_PASSWORD` | The password you made up |
| `ANDROID_KEY_ALIAS` | `upload` |
| `ANDROID_KEY_PASSWORD` | The same password again |

The two Supabase secrets from docs/phone-apps.md must be there too. Then
**Actions** → **Phone app builds** → **Run workflow**. About 4 minutes later
the signed `.aab` is at the link in the table above. Every merge to `main`
makes a new one with a higher version number.

## 4. Create the app

Play Console → **Home** → **Create app**: name `GMO Scan`, default language
English (United States), **App**, **Free**. Tick the declarations → Create.

## 5. Set up your app (Dashboard checklist)

**App access**: "All or some functionality is restricted". Add instructions:
"Scanning works without an account. To see scan history, sign in with:" and
give a test email and password (create one in the app first).

**Ads**: No.

**Content rating**: start the questionnaire, enter your email, category
**All other app types**, answer **No** to every question. Expected result:
Everyone / PEGI 3.

**Target audience**: tick **13–15, 16–17, 18 and over**. Don't tick anything
under 13 (that brings in the Families policy).

**News app**: No. **Government app**: No. **Financial features**: none.

**Health apps**: if asked, GMO Scan gives food ingredient information, so
"Nutrition and weight management" is the closest category.

**Data safety**:

- Does your app collect or share any of the required user data types? **Yes**
- Is all user data encrypted in transit? **Yes**
- Do you provide a way for users to request that their data is deleted?
  **Yes**, with the account deletion URL above.
- Data types collected (none are shared):

  | Data type | Collected | Required? | Purpose |
  | --- | --- | --- | --- |
  | Personal info → Email address | Yes | Optional (only with an account) | Account management |
  | App activity → Other user-generated content (scan history) | Yes | Optional | App functionality |

- Photos, camera video and ingredient photos are processed on the phone only
  and never leave it, so they are **not** "collected". Barcodes sent for a
  product lookup aren't linked to you.

**Privacy policy**: the privacy policy URL above.

## 6. Store listing

**Grow users** → **Store presence** → **Main store listing**:

- **App name**: GMO Scan
- **Short description** (80 max):
  `Scan a grocery barcode to see if it's bioengineered (GMO), and why.`
- **Full description**:

  ```
  Is it GMO? Scan the barcode and find out in seconds.

  GMO Scan checks packaged food against public product databases (Open Food Facts and USDA FoodData Central) and gives you a straight answer: YES, NO, or UNKNOWN, with the reason behind it.

  • Official "Bioengineered" disclosures are reported as a confirmed YES
  • Ingredients commonly made from GM crops (corn, soy, canola, sugar beet and more) are flagged and listed
  • Certified non-GMO products are recognized
  • Product not in the database, or no ingredient list? Take a photo of the ingredients and GMO Scan reads it right on your phone
  • Sign in to keep a history of everything you've scanned, and delete any of it whenever you like

  No ads. No tracking. Scanning works without an account.

  GMO Scan is an information tool, not legal, medical or nutritional advice. Results depend on the data available for each product; when in doubt, check the package label.
  ```

- **App icon**: `app-icon-512.png` from the `google-play/` folder
- **Feature graphic**: `feature-graphic-1024x500.png` from the same folder
- **Phone screenshots** (at least 2): install the test APK, scan a few real
  products, and take screenshots on the phone (power + volume down). Good
  ones: the scan screen, a YES result with flagged ingredients, a NO result,
  and scan history.
- **Category** (Store settings): **Food & Drink**. Contact email: your
  support address. Website: https://gmo-scan-ke9v.vercel.app

## 7. Release

1. **Test and release** → **Testing** → **Internal testing** → **Create new
   release**. When asked about app signing, accept **Google-managed app
   signing** (the default). Upload `GMO-Scan-release.aab`, save, review,
   **Start rollout**. Add yourself as a tester and install from the opt-in
   link to check it, including the review prompt (it only appears for
   store-installed builds).
2. **Production** → **Create new release** → **Add from library** (pick the
   same build) → choose countries → **Send for review**. The first review
   usually takes a few days.

For later releases: merge to `main`, download the new `.aab` from the same
link, and upload it to a new release. (Uploading automatically from GitHub is
possible with a Play service account; ask when manual uploads get tedious.)
