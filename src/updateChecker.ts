import { UpdateStatus } from './types';
import { Capacitor } from '@capacitor/core';
import { Filesystem, Directory } from '@capacitor/filesystem';
import { FileOpener } from '@capacitor-community/file-opener';
import { Browser } from '@capacitor/browser';

import pkg from '../package.json';

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
      return { status: 'error', message: `Ошибка GitHub API (код ${response.status})` };
    }

    const releaseData = await response.json();
    const latestVersion = releaseData.tag_name || releaseData.name;
    const releaseNotes = releaseData.body || 'Новые улучшения и исправления ошибок.';

    // Find APK asset in release (prefer app-debug.apk)
    const apkAsset = releaseData.assets?.find((asset: any) =>
      asset.name.toLowerCase().endsWith('.apk') || asset.content_type === 'application/vnd.android.package-archive'
    );

    const downloadUrl = apkAsset?.browser_download_url || releaseData.html_url || `https://github.com/${GITHUB_REPO}/releases/latest`;

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

export async function openInExternalBrowser(url: string): Promise<void> {
  if (!url) return;
  try {
    if (Capacitor.isNativePlatform()) {
      await Browser.open({ url });
    } else {
      window.open(url, '_blank');
    }
  } catch (e) {
    console.error('Error opening external browser', e);
    window.open(url, '_blank');
  }
}

export async function downloadAndInstallApk(
  downloadUrl: string,
  onProgress: (progress: number) => void
): Promise<boolean> {
  if (!downloadUrl) {
    throw new Error('Ссылка для скачивания APK отсутствует');
  }

  if (!Capacitor.isNativePlatform()) {
    await openInExternalBrowser(downloadUrl);
    return true;
  }

  const fileName = 'app-debug.apk';

  // Method 1: Native Filesystem.downloadFile into Directory.Cache
  try {
    onProgress(10);

    let progressListener: any = null;
    try {
      progressListener = await Filesystem.addListener('progress', (p) => {
        if (p.contentLength > 0) {
          const percent = Math.round((p.bytes / p.contentLength) * 100);
          onProgress(Math.min(99, Math.max(10, percent)));
        }
      });
    } catch {
      // Progress listener optional
    }

    const downloadResult = await Filesystem.downloadFile({
      url: downloadUrl,
      path: fileName,
      directory: Directory.Cache,
      progress: true
    });

    if (progressListener) {
      try {
        await progressListener.remove();
      } catch {}
    }

    onProgress(100);

    const uriResult = await Filesystem.getUri({
      path: fileName,
      directory: Directory.Cache
    });
    const fileUri = downloadResult.path || uriResult.uri;

    if (!fileUri) {
      throw new Error('Не удалось определить путь к скачанному APK');
    }

    // Launch Android Package Installer intent via FileOpener
    await FileOpener.open({
      filePath: fileUri,
      contentType: 'application/vnd.android.package-archive'
    });

    return true;
  } catch (downloadErr: any) {
    console.warn('Filesystem.downloadFile failed, trying fetch fallback...', downloadErr);

    // Method 2 Fallback: Native CapacitorHttp fetch -> Base64 writeFile -> FileOpener
    try {
      onProgress(15);
      const response = await fetch(downloadUrl);
      if (!response.ok) {
        throw new Error(`Ошибка скачивания: HTTP ${response.status}`);
      }

      onProgress(40);
      const blob = await response.blob();
      onProgress(70);

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

      const savedFile = await Filesystem.writeFile({
        path: fileName,
        data: base64Data,
        directory: Directory.Cache
      });

      onProgress(100);

      await FileOpener.open({
        filePath: savedFile.uri,
        contentType: 'application/vnd.android.package-archive'
      });

      return true;
    } catch (fallbackErr: any) {
      console.error('All native APK download methods failed', fallbackErr);
      const msg = fallbackErr?.message || downloadErr?.message || 'Не удалось скачать или запустить установку APK';
      throw new Error(msg);
    }
  }
}
