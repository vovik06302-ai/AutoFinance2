import fs from 'fs';
import path from 'path';
import { execSync } from 'child_process';

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

// 2. Configure AndroidManifest.xml permissions and FileProvider
if (fs.existsSync(manifestPath)) {
  let manifest = fs.readFileSync(manifestPath, 'utf8');

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

// 3. Verify Signing Keystore & Environment Variables
const keystorePathEnv = process.env.KEYSTORE_PATH;
const resolvedKeystorePath = keystorePathEnv
  ? path.resolve(keystorePathEnv)
  : (fs.existsSync('release.keystore') ? path.resolve('release.keystore') : path.resolve('../release.keystore'));

if (!fs.existsSync(resolvedKeystorePath)) {
  if (process.env.CI) {
    console.error(`❌ ERROR: Signing keystore file not found at: ${resolvedKeystorePath}`);
    console.error('Please ensure the "Prepare Signing Keystore" step runs before this script and generates release.keystore.');
    process.exit(1);
  } else {
    console.log(`⚠️ Warning: Keystore not found at ${resolvedKeystorePath}, generating local release.keystore...`);
    try {
      execSync('keytool -genkey -v -keystore release.keystore -storepass android -alias androiddebugkey -keypass android -keyalg RSA -keysize 2048 -validity 10000 -dname "CN=AutoFinance,O=AutoFinance,C=RU"', { stdio: 'inherit' });
    } catch (e) {
      console.warn('Could not auto-generate local release.keystore:', e.message);
    }
  }
} else {
  console.log(`🔑 Verified Keystore file at: ${resolvedKeystorePath}`);
}

// 4. Configure Versioning and Signing in android/app/build.gradle
if (fs.existsSync(gradlePath)) {
  let gradle = fs.readFileSync(gradlePath, 'utf8');

  // Calculate versionCode and versionName
  const tagVersion = process.env.TAG_NAME ? process.env.TAG_NAME.replace(/^v/i, '') : null;
  const pkgVersion = JSON.parse(fs.readFileSync('package.json', 'utf8')).version || '1.2.1';
  const versionName = tagVersion || pkgVersion;

  const parts = versionName.split('.').map(n => parseInt(n, 10) || 0);
  const versionCode = (parts[0] || 1) * 10000 + (parts[1] || 0) * 100 + (parts[2] || 0);

  console.log(`📌 Setting Version Name: ${versionName}, Version Code: ${versionCode}`);

  gradle = gradle.replace(/versionName\s+["'].*?["']/, `versionName "${versionName}"`);
  gradle = gradle.replace(/versionCode\s+\d+/, `versionCode ${versionCode}`);

  // Append persistent signing configuration safely at the end of build.gradle
  const signingConfigMarker = '// === CI PERSISTENT SIGNING CONFIG ===';
  if (gradle.includes(signingConfigMarker)) {
    gradle = gradle.substring(0, gradle.indexOf(signingConfigMarker)).trimEnd() + '\n';
  }

  const ciSigningBlock = `
${signingConfigMarker}
android {
    signingConfigs {
        ci {
            def kPath = System.getenv("KEYSTORE_PATH") ?: "../../release.keystore"
            def kPass = System.getenv("KEYSTORE_PASSWORD") ?: "android"
            def kAlias = System.getenv("KEY_ALIAS") ?: "androiddebugkey"
            def keyPass = System.getenv("KEY_PASSWORD") ?: "android"

            storeFile file(kPath)
            storePassword kPass
            keyAlias kAlias
            keyPassword keyPass
        }
    }
    buildTypes {
        debug {
            signingConfig signingConfigs.ci
        }
        release {
            signingConfig signingConfigs.ci
        }
    }
}
`;

  gradle = gradle + '\n' + ciSigningBlock;
  fs.writeFileSync(gradlePath, gradle, 'utf8');
  console.log('✅ Appended persistent CI signing config to android/app/build.gradle');
}

console.log('🎉 Android configuration completed successfully!');
