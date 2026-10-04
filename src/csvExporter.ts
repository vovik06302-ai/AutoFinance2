import { TransactionEntity, SalaryPayoutEntity } from './types';
import { getUnifiedFeed, PAYMENT_METHODS, REVENUE_CATEGORIES } from './utils';
import { Capacitor } from '@capacitor/core';
import { Filesystem, Directory, Encoding } from '@capacitor/filesystem';
import { Share } from '@capacitor/share';

export interface SummaryTotals {
  profit: number;
  serviceProfit?: number;
  partsProfit?: number;
  debtors: number;
  consumables?: number;
  otherExpenses?: number;
  materialExpenses?: number;
  grandTotal: number;
  salaryTotal: number;
  netTotal: number;
  cashProfit?: number;
  sbpProfit?: number;
  cardProfit?: number;
  bankProfit?: number;
  netCashInRegister?: number;
}

export async function exportAndShareCsv(
  transactions: TransactionEntity[],
  payouts: SalaryPayoutEntity[] = [],
  periodTitle: string = 'Отчёт',
  summaryTotals?: SummaryTotals
) {
  const BOM = '\uFEFF';
  const header = 'ID;Дата;Категория;Направление;Оплата;Сумма (₽);Описание/Заметка;Клиент/Авто/Сотрудник\n';

  const feedItems = getUnifiedFeed(transactions, payouts);

  const rows = feedItems.map(item => {
    const dateStr = new Date(item.date).toLocaleString('ru-RU', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });

    const categoryDirection = item.revenueCategory
      ? REVENUE_CATEGORIES[item.revenueCategory]?.label || '-'
      : '-';

    const paymentMethodLabel = item.paymentMethod
      ? PAYMENT_METHODS[item.paymentMethod]?.label || 'Наличные'
      : 'Наличные';

    const noteEscaped = (item.note || '').replace(/;/g, ',').replace(/\n/g, ' ');
    const clientEscaped = (item.clientInfo || '').replace(/;/g, ',').replace(/\n/g, ' ');

    return `${item.originalId};${dateStr};${item.categoryLabel};${categoryDirection};${paymentMethodLabel};${item.amount};${noteEscaped};${clientEscaped}`;
  });

  let summaryRowsStr = '';
  if (summaryTotals) {
    summaryRowsStr = [
      '',
      `--- ИТОГИ ЗА ПЕРИОД: ${periodTitle} ---`,
      `;;;;Прибыль;${summaryTotals.profit};;`,
      `;;;;  из них Работы;${summaryTotals.serviceProfit ?? 0};;`,
      `;;;;  из них Запчасти;${summaryTotals.partsProfit ?? 0};;`,
      `;;;;Должники (непогашено);${summaryTotals.debtors};;`,
      `;;;;Зарплата сотрудников;${summaryTotals.salaryTotal};;`,
      `;;;;Расходники;${summaryTotals.consumables ?? summaryTotals.materialExpenses ?? 0};;`,
      `;;;;Прочие траты;${summaryTotals.otherExpenses ?? 0};;`,
      `;;;;Итого в кассе;${summaryTotals.grandTotal};;`,
      '',
      '--- КАССА И СПОСОБЫ ОПЛАТЫ ---',
      `;;;;Наличные (приход);${summaryTotals.cashProfit ?? 0};;`,
      `;;;;СБП / Переводы;${summaryTotals.sbpProfit ?? 0};;`,
      `;;;;Терминал (карта);${summaryTotals.cardProfit ?? 0};;`,
      `;;;;Безнал (по счёту);${summaryTotals.bankProfit ?? 0};;`,
      `;;;;Остаток наличных в кассе;${summaryTotals.netCashInRegister ?? 0};;`
    ].join('\n');
  }

  const csvContent = BOM + header + rows.join('\n') + (summaryRowsStr ? '\n' + summaryRowsStr : '');
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
