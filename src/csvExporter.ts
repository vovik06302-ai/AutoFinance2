import { TransactionEntity, SalaryPayoutEntity } from './types';
import { Capacitor } from '@capacitor/core';
import { Filesystem, Directory, Encoding } from '@capacitor/filesystem';
import { Share } from '@capacitor/share';

export async function exportAndShareCsv(
  transactions: TransactionEntity[],
  payouts: SalaryPayoutEntity[] = [],
  periodTitle: string = 'Отчёт'
) {
  const BOM = '\uFEFF';
  const header = 'ID;Дата;Тип;Сумма (₽);Описание/Заметка;Клиент/Авто\n';

  // Sort all records chronologically descending
  const combined: {
    id: number;
    date: number;
    typeStr: string;
    amount: number;
    note: string;
    clientInfo: string;
  }[] = [];

  transactions.forEach(t => {
    let typeStr = 'Прибыль';
    if (t.type === 'EXPENSE') typeStr = 'Расходники';
    if (t.type === 'DEBTOR') typeStr = 'Долг';
    if (t.type === 'PROFIT' && t.note.toLowerCase().includes('погашение долга')) {
      typeStr = 'Погашение долга';
    }

    combined.push({
      id: t.id,
      date: t.date,
      typeStr,
      amount: t.amount,
      note: t.note,
      clientInfo: t.clientInfo
    });
  });

  payouts.forEach(p => {
    combined.push({
      id: p.id,
      date: p.date,
      typeStr: 'Выплата зарплаты',
      amount: p.amount,
      note: `Выплата зарплаты (${p.employeeName})`,
      clientInfo: p.employeeName
    });
  });

  combined.sort((a, b) => b.date - a.date);

  const rows = combined.map(item => {
    const dateStr = new Date(item.date).toLocaleString('ru-RU', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });

    const noteEscaped = (item.note || '').replace(/;/g, ',').replace(/\n/g, ' ');
    const clientEscaped = (item.clientInfo || '').replace(/;/g, ',').replace(/\n/g, ' ');

    return `${item.id};${dateStr};${item.typeStr};${item.amount};${noteEscaped};${clientEscaped}`;
  });

  const csvContent = BOM + header + rows.join('\n');
  const safeTitle = periodTitle.toLowerCase().replace(/[^a-z0-9а-яё]/gi, '_');
  const fileName = `report_${safeTitle}_${new Date().toISOString().slice(0, 10)}.csv`;

  if (Capacitor.isNativePlatform()) {
    try {
      const writeResult = await Filesystem.writeFile({
        path: fileName,
        data: csvContent,
        directory: Directory.Cache,
        encoding: Encoding.UTF8
      });

      await Share.share({
        title: `Финансовый отчёт (${periodTitle})`,
        text: `Экспорт финансового отчёта за ${periodTitle}`,
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
