import { TransactionEntity } from './types';
import { Capacitor } from '@capacitor/core';
import { Filesystem, Directory, Encoding } from '@capacitor/filesystem';
import { Share } from '@capacitor/share';

export async function exportAndShareCsv(transactions: TransactionEntity[], filterName: string) {
  const BOM = '\uFEFF';
  const header = 'ID;Дата;Тип;Сумма;Описание/Заметка;Клиент/Авто\n';

  const rows = transactions.map(item => {
    const dateStr = new Date(item.date).toLocaleString('ru-RU', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });

    const typeStr = item.type === 'PROFIT' ? 'Прибыль' : item.type === 'EXPENSE' ? 'Расходники' : 'Должник';
    const noteEscaped = item.note.replace(/;/g, ',').replace(/\n/g, ' ');
    const clientEscaped = item.clientInfo.replace(/;/g, ',').replace(/\n/g, ' ');

    return `${item.id};${dateStr};${typeStr};${item.amount};${noteEscaped};${clientEscaped}`;
  });

  const csvContent = BOM + header + rows.join('\n');
  const fileName = `finance_report_${new Date().toISOString().slice(0, 10)}.csv`;

  if (Capacitor.isNativePlatform()) {
    try {
      // Save file to Cache directory via Capacitor Filesystem
      const writeResult = await Filesystem.writeFile({
        path: fileName,
        data: csvContent,
        directory: Directory.Cache,
        encoding: Encoding.UTF8
      });

      // Share file using Capacitor Share
      await Share.share({
        title: `Финансовый отчёт (${filterName})`,
        text: `Экспорт финансового отчёта (${filterName})`,
        url: writeResult.uri,
        dialogTitle: 'Поделиться отчётом CSV'
      });
    } catch (err) {
      console.error('Error sharing CSV via Capacitor', err);
      fallbackBrowserDownload(csvContent, fileName);
    }
  } else {
    fallbackBrowserDownload(csvContent, fileName);
  }
}

function fallbackBrowserDownload(csvContent: string, fileName: string) {
  const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);

  const link = document.createElement('a');
  link.setAttribute('href', url);
  link.setAttribute('download', fileName);
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}
