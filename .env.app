# Used only by `npm run build:app` (the iPhone/Android build). Not a secret.
#
# The phone app ships the pages inside itself, but product lookups still run
# on the live site's /api/lookup route, so the app needs its address.
NEXT_PUBLIC_API_BASE=https://gmo-scan-ke9v.vercel.app

# The App Store's number for GMO Scan (from its apps.apple.com/app/idNNNN
# address). Leave empty until the listing exists; the in-app "Rate" link stays
# hidden on iPhone until it's set. Android needs nothing.
NEXT_PUBLIC_APPLE_APP_ID=
