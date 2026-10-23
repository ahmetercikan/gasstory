#!/bin/sh
# iOS: imzalı arşiv çıkarır ve TestFlight'a yükler (`npm run ipa` web derlemesi + cap sync'ten sonra çağırır).
# Anahtarlar proje DIŞINDA durur: ~/.gasstory-ios.env (git'e girmez). İçeriği:
#   TEAM_ID=XXXXXXXXXX            # Apple Developer → Membership → Team ID
#   ASC_KEY_ID=XXXXXXXXXX         # App Store Connect → Kullanıcılar ve Erişim → Entegrasyonlar → API anahtarı
#   ASC_ISSUER_ID=xxxxxxxx-...    # aynı sayfadaki Issuer ID
#   ASC_KEY_PATH=$HOME/.appstoreconnect/AuthKey_XXXXXXXXXX.p8
# Yapı numarası her seferinde tarih-saatten üretilir (elle artırmaya gerek yok); sürüm adı MARKETING_VERSION'dan gelir.
set -e
ENV_FILE="${GASSTORY_IOS_ENV:-$HOME/.gasstory-ios.env}"
[ -f "$ENV_FILE" ] || { echo "Eksik: $ENV_FILE (bkz. scripts/ios-testflight.sh başı)"; exit 1; }
. "$ENV_FILE"
: "${TEAM_ID:?}" "${ASC_KEY_ID:?}" "${ASC_ISSUER_ID:?}" "${ASC_KEY_PATH:?}"

ROOT="$(cd "$(dirname "$0")/.." && pwd)"
OUT="$ROOT/ios/App/output"
BUILD_NO="$(date +%y%m%d%H%M)"
AUTH="-allowProvisioningUpdates -authenticationKeyPath $ASC_KEY_PATH -authenticationKeyID $ASC_KEY_ID -authenticationKeyIssuerID $ASC_ISSUER_ID"
rm -rf "$OUT" && mkdir -p "$OUT"

xcodebuild -project "$ROOT/ios/App/App.xcodeproj" -scheme App -configuration Release \
  -destination 'generic/platform=iOS' -archivePath "$OUT/GasStory.xcarchive" \
  DEVELOPMENT_TEAM="$TEAM_ID" CODE_SIGN_STYLE=Automatic CURRENT_PROJECT_VERSION="$BUILD_NO" \
  $AUTH archive

cat > "$OUT/export.plist" <<EOF
<?xml version="1.0" encoding="UTF-8"?>
<!DOCTYPE plist PUBLIC "-//Apple//DTD PLIST 1.0//EN" "http://www.apple.com/DTDs/PropertyList-1.0.dtd">
<plist version="1.0"><dict>
  <key>method</key><string>app-store-connect</string>
  <key>destination</key><string>upload</string>
  <key>teamID</key><string>$TEAM_ID</string>
  <key>signingStyle</key><string>automatic</string>
  <key>manageAppVersionAndBuildNumber</key><false/>
</dict></plist>
EOF

xcodebuild -exportArchive -archivePath "$OUT/GasStory.xcarchive" -exportOptionsPlist "$OUT/export.plist" \
  -exportPath "$OUT/export" $AUTH

echo "Yüklendi: yapı $BUILD_NO. App Store Connect → TestFlight'ta işlenince (5-15 dk) görünür."
