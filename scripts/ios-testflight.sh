#!/bin/sh
# iOS: imzalı arşiv çıkarır ve TestFlight'a yükler (`npm run ipa` web derlemesi + cap sync'ten sonra çağırır).
# İmza bu Mac'teki Xcode hesabıyla otomatik yapılır (ekip AQ2Y664A4Z, project.pbxproj → DEVELOPMENT_TEAM); API anahtarı gerekmez.
# Yapı numarası her seferinde tarih-saatten üretilir (elle artırmaya gerek yok); sürüm adı MARKETING_VERSION'dan gelir.
set -e
TEAM_ID=AQ2Y664A4Z
ROOT="$(cd "$(dirname "$0")/.." && pwd)"
OUT="$ROOT/ios/App/output"
BUILD_NO="$(date +%y%m%d%H%M)"
rm -rf "$OUT" && mkdir -p "$OUT"

xcodebuild -project "$ROOT/ios/App/App.xcodeproj" -scheme App -configuration Release \
  -destination 'generic/platform=iOS' -archivePath "$OUT/GasStory.xcarchive" \
  CURRENT_PROJECT_VERSION="$BUILD_NO" -allowProvisioningUpdates -quiet archive

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
  -exportPath "$OUT/export" -allowProvisioningUpdates

echo "Yüklendi: yapı $BUILD_NO. App Store Connect → TestFlight'ta işlenince (5-15 dk) görünür."
