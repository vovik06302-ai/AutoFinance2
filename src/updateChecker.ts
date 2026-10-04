import { UpdateStatus } from './types';
import { Capacitor } from '@capacitor/core';
import { Filesystem, Directory } from '@capacitor/filesystem';

import pkg from '../package.json';

// Requirement 7: Single constant for GITHUB_REPO
export const GITHUB_REPO = "vovik06302-ai/AutoFinance2";
export const CURRENT_VERSION = pkg.version;

export async function checkForAppUpdates(): Promise<UpdateStatus> {
  try {
    const url = `https://api.github.com/repos/${GITHUB_REPO}/releases/latest`;
    const response = await fetch(url, {
      headers: {
        'Accept': 'application/vnd.github.v3+json'
      }
    });

    if (!response.ok) {
      if (response.status === 404) {
        return { status: 'up_to_date', currentVersion: CURRENT_VERSION };
      }
      return { status: 'error', message: `Ошибка GitHub API: ${response.status}` };
    }

    const releaseData = await response.json();
    const latestVersion = releaseData.tag_name || releaseData.name;
    const releaseNotes = releaseData.body || 'Новые улучшения и исправления ошибок.';

    // Find APK asset in release
    const apkAsset = releaseData.assets?.find((asset: any) =>
      asset.name.endsWith('.apk') || asset.content_type === 'application/vnd.android.package-archive'
    );

    const downloadUrl = apkAsset?.browser_download_url || releaseData.html_url;

    if (isNewerVersion(latestVersion, CURRENT_VERSION)) {
      return {
        status: 'update_available',
        latestVersion,
        releaseNotes,
        downloadUrl
      };
    } else {
      return {
        status: 'up_to_date',
        currentVersion: CURRENT_VERSION
      };
    }
  } catch (err: any) {
    console.error('Failed to check for updates', err);
    return {
      status: 'error',
      message: 'Не удалось проверить обновления. Проверьте интернет-соединение.'
    };
  }
}

function isNewerVersion(latest: string, current: string): boolean {
  const cleanLatest = latest.replace(/^v/i, '').trim();
  const cleanCurrent = current.replace(/^v/i, '').trim();

  if (cleanLatest === cleanCurrent) return false;

  const latestParts = cleanLatest.split('.').map(n => parseInt(n, 10) || 0);
  const currentParts = cleanCurrent.split('.').map(n => parseInt(n, 10) || 0);

  const maxLen = Math.max(latestParts.length, currentParts.length);
  for (let i = 0; i < maxLen; i++) {
    const l = latestParts[i] || 0;
    const c = currentParts[i] || 0;
    if (l > c) return true;
    if (l < c) return false;
  }

  return false;
}

export async function downloadAndInstallApk(
  downloadUrl: string,
  onProgress: (progress: number) => void
): Promise<boolean> {
  if (!downloadUrl) return false;

  if (!Capacitor.isNativePlatform()) {
    // In web browser, open download URL directly in a new tab
    window.open(downloadUrl, '_blank');
    return true;
  }

  try {
    // Download APK via fetch with progress simulation
    onProgress(10);
    const response = await fetch(downloadUrl);
    if (!response.ok) throw new Error(`HTTP ${response.status}`);

    onProgress(40);
    const blob = await response.blob();
    onProgress(70);

    // Convert blob to base64
    const reader = new FileReader();
    const base64Data = await new Promise<string>((resolve, reject) => {
      reader.onloadend = () => {
        const res = reader.result as string;
        const base64 = res.split(',')[1] || res;
        resolve(base64);
      };
      reader.onerror = reject;
      reader.readAsDataURL(blob);
    });

    onProgress(90);

    const fileName = 'app-update.apk';
    const savedFile = await Filesystem.writeFile({
      path: fileName,
      data: base64Data,
      directory: Directory.Cache
    });

    onProgress(100);

    // Trigger Android package installer intent
    window.location.href = savedFile.uri;
    return true;
  } catch (err: any) {
    console.error('Failed to download update APK', err);
    throw err;
  }
}
