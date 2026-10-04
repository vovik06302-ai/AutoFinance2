import fs from 'fs';
import path from 'path';

const manifestPath = path.resolve('android/app/src/main/AndroidManifest.xml');
const filePathsDir = path.resolve('android/app/src/main/res/xml');
const filePathsFile = path.join(filePathsDir, 'file_paths.xml');
const gradlePath = path.resolve('android/app/build.gradle');

console.log('🔧 Configuring Android native project...');

// 1. Ensure res/xml/file_paths.xml exists
if (!fs.existsSync(filePathsDir)) {
  fs.mkdirSync(filePathsDir, { recursive: true });
}

const filePathsContent = `<?xml version="1.0" encoding="utf-8"?>
<paths xmlns:android="http://schemas.android.com/apk/res/android">
    <cache-path name="cache" path="." />
    <external-path name="external_files" path="." />
    <files-path name="files" path="." />
</paths>`;

fs.writeFileSync(filePathsFile, filePathsContent, 'utf8');
console.log('✅ Updated res/xml/file_paths.xml');

// 2. Configure AndroidManifest.xml
if (fs.existsSync(manifestPath)) {
  let manifest = fs.readFileSync(manifestPath, 'utf8');

  // Add permissions if missing
  const permissions = [
    'android.permission.INTERNET',
    'android.permission.RECORD_AUDIO',
    'android.permission.REQUEST_INSTALL_PACKAGES'
  ];

  permissions.forEach(perm => {
    if (!manifest.includes(perm)) {
      manifest = manifest.replace(
        '<manifest',
        `<manifest xmlns:android="http://schemas.android.com/apk/res/android">\n    <uses-permission android:name="${perm}" />`
      );
    }
  });

  // Add FileProvider inside <application> if missing
  if (!manifest.includes('androidx.core.content.FileProvider')) {
    const providerXml = `
        <provider
            android:name="androidx.core.content.FileProvider"
            android:authorities="\${applicationId}.fileprovider"
            android:exported="false"
            android:grantUriPermissions="true">
            <meta-data
                android:name="android.support.FILE_PROVIDER_PATHS"
                android:resource="@xml/file_paths" />
        </provider>
    `;

    if (manifest.includes('</application>')) {
      manifest = manifest.replace('</application>', `${providerXml}\n    </application>`);
    }
  }

  fs.writeFileSync(manifestPath, manifest, 'utf8');
  console.log('✅ Configured AndroidManifest.xml permissions and FileProvider');
}

// 3. Configure Versioning and Signing in android/app/build.gradle
if (fs.existsSync(gradlePath)) {
  let gradle = fs.readFileSync(gradlePath, 'utf8');

  // Version extraction from TAG_NAME or package.json
  const tagVersion = process.env.TAG_NAME ? process.env.TAG_NAME.replace(/^v/i, '') : null;
  const pkgVersion = JSON.parse(fs.readFileSync('package.json', 'utf8')).version || '1.2.0';
  const versionName = tagVersion || pkgVersion;

  const parts = versionName.split('.').map(n => parseInt(n, 10) || 0);
  const versionCode = (parts[0] || 1) * 10000 + (parts[1] || 0) * 100 + (parts[2] || 0);

  console.log(`📌 Setting Version Name: ${versionName}, Version Code: ${versionCode}`);

  gradle = gradle.replace(/versionName\s+["'].*?["']/, `versionName "${versionName}"`);
  gradle = gradle.replace(/versionCode\s+\d+/, `versionCode ${versionCode}`);

  // Ensure debug signingConfig is configured with debug.keystore if available
  if (fs.existsSync('debug.keystore') || fs.existsSync('../debug.keystore')) {
    if (!gradle.includes('signingConfigs')) {
      const signingBlock = `
    signingConfigs {
        debug {
            storeFile file('../../debug.keystore')
            storePassword 'android'
            keyAlias 'androiddebugkey'
            keyPassword 'android'
        }
    }
`;
      gradle = gradle.replace('android {', `android {${signingBlock}`);
    }
  }

  fs.writeFileSync(gradlePath, gradle, 'utf8');
  console.log('✅ Updated android/app/build.gradle version & signing settings');
}

console.log('🎉 Android configuration completed successfully!');
