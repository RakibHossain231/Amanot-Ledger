import jsPDF from 'jspdf';
import html2canvas from 'html2canvas';
import ExcelJS from 'exceljs';
import { formatCurrency } from './currency';

/**
 * Helper to render an HTML string into a multi-page or single-page PDF
 * guaranteeing 100% accurate Bengali Unicode font rendering and ligatures.
 */
const renderHtmlToPdf = async (htmlString, fileName) => {
  const container = document.createElement('div');
  container.style.position = 'fixed';
  container.style.left = '-9999px';
  container.style.top = '0';
  container.style.width = '794px'; // Standard A4 width at 96 DPI
  container.style.backgroundColor = '#ffffff';
  container.style.color = '#1f2937';
  container.style.fontFamily = "'Hind Siliguri', 'Inter', -apple-system, sans-serif";
  container.style.padding = '0';
  container.style.margin = '0';
  container.style.boxSizing = 'border-box';
  container.innerHTML = htmlString;

  document.body.appendChild(container);

  try {
    // Wait for fonts to be ready
    if (document.fonts) {
      await document.fonts.ready;
    }

    const canvas = await html2canvas(container, {
      scale: 2, // High resolution crisp rendering
      useCORS: true,
      logging: false,
      backgroundColor: '#ffffff',
    });

    const imgData = canvas.toDataURL('image/png');
    const pdf = new jsPDF('p', 'mm', 'a4');
    const pdfWidth = pdf.internal.pageSize.getWidth();
    const pdfHeight = pdf.internal.pageSize.getHeight();

    const canvasWidth = canvas.width;
    const canvasHeight = canvas.height;
    const totalPdfHeight = (canvasHeight * pdfWidth) / canvasWidth;

    let heightLeft = totalPdfHeight;
    let position = 0;

    // First page
    pdf.addImage(imgData, 'PNG', 0, position, pdfWidth, totalPdfHeight);
    heightLeft -= pdfHeight;

    // Multi-page support if content is long
    while (heightLeft > 0) {
      position = heightLeft - totalPdfHeight;
      pdf.addPage();
      pdf.addImage(imgData, 'PNG', 0, position, pdfWidth, totalPdfHeight);
      heightLeft -= pdfHeight;
    }

    pdf.save(fileName);
  } finally {
    document.body.removeChild(container);
  }
};

/**
 * 1. Export Dashboard Summary to PDF with Full Bengali Support
 */
export const exportDashboardPDF = async (accountsWithSummary, overallSummary, lang = 'bn') => {
  const isBn = lang === 'bn';
  const title = isBn ? 'আমানত লেজার — ড্যাশবোর্ড বিবরণী' : 'Amanot Ledger — Dashboard Statement';
  const subtitle = isBn ? 'সকল অ্যাকাউন্টের ব্যালেন্স ও সামারি হিসাব' : 'Overview summary of all active accounts';
  const dateStr = new Date().toLocaleDateString(isBn ? 'bn-BD' : 'en-US', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  });

  const html = `
    <div style="font-family: 'Hind Siliguri', 'Inter', sans-serif; background: #ffffff; padding: 32px; color: #1e1b2e;">
      <!-- Header Banner -->
      <div style="background: linear-gradient(135deg, #7542C8 0%, #582CA1 100%); color: #ffffff; border-radius: 16px; padding: 24px 28px; margin-bottom: 24px;">
        <div style="display: flex; justify-content: space-between; align-items: center;">
          <div>
            <h1 style="margin: 0; font-size: 22px; font-weight: 700; letter-spacing: -0.3px;">${title}</h1>
            <p style="margin: 6px 0 0 0; font-size: 13px; opacity: 0.9;">${subtitle}</p>
          </div>
          <div style="text-align: right;">
            <span style="font-size: 11px; opacity: 0.8; display: block;">${isBn ? 'তারিখ' : 'Date'}</span>
            <span style="font-size: 13px; font-weight: 600;">${dateStr}</span>
          </div>
        </div>
      </div>

      <!-- Overview Cards -->
      <div style="display: grid; grid-template-columns: repeat(3, 1fr); gap: 14px; margin-bottom: 24px;">
        <div style="background: #F0FDF4; border: 1px solid #BBF7D0; border-radius: 14px; padding: 14px 18px;">
          <div style="font-size: 12px; color: #16A34A; font-weight: 600; margin-bottom: 4px;">${isBn ? 'মোট জমা (+)' : 'Total Credit (+)'}</div>
          <div style="font-size: 20px; font-weight: 700; color: #15803D;">${formatCurrency(overallSummary.totalCredit, lang)}</div>
        </div>

        <div style="background: #FEF2F2; border: 1px solid #FECACA; border-radius: 14px; padding: 14px 18px;">
          <div style="font-size: 12px; color: #DC2626; font-weight: 600; margin-bottom: 4px;">${isBn ? 'মোট প্রদান (−)' : 'Total Debit (−)'}</div>
          <div style="font-size: 20px; font-weight: 700; color: #B91C1C;">${formatCurrency(overallSummary.totalDebit, lang)}</div>
        </div>

        <div style="background: #F7F5FC; border: 1px solid #E9D5FF; border-radius: 14px; padding: 14px 18px;">
          <div style="font-size: 12px; color: #7542C8; font-weight: 600; margin-bottom: 4px;">${isBn ? 'নিট ব্যালেন্স' : 'Net Balance'}</div>
          <div style="font-size: 20px; font-weight: 700; color: ${overallSummary.netBalance >= 0 ? '#7542C8' : '#DC2626'};">
            ${formatCurrency(overallSummary.netBalance, lang)}
          </div>
        </div>
      </div>

      <!-- Accounts Table (Contains ONLY Account Name, Credit, Debit, Balance) -->
      <table style="width: 100%; border-collapse: collapse; margin-bottom: 24px; font-size: 13px;">
        <thead>
          <tr style="background: #7542C8; color: #ffffff;">
            <th style="padding: 12px 14px; text-align: left; border-top-left-radius: 10px; font-weight: 600;">${isBn ? 'অ্যাকাউন্টের নাম' : 'Account Name'}</th>
            <th style="padding: 12px 14px; text-align: right; font-weight: 600;">${isBn ? 'মোট জমা (+)' : 'Total Credit (+)'}</th>
            <th style="padding: 12px 14px; text-align: right; font-weight: 600;">${isBn ? 'মোট প্রদান (−)' : 'Total Debit (−)'}</th>
            <th style="padding: 12px 14px; text-align: right; border-top-right-radius: 10px; font-weight: 600;">${isBn ? 'বর্তমান ব্যালেন্স' : 'Current Balance'}</th>
          </tr>
        </thead>
        <tbody>
          ${accountsWithSummary.map((acc, idx) => `
            <tr style="border-bottom: 1px solid #F1F1F5; background: ${idx % 2 === 0 ? '#FFFFFF' : '#FAF9FD'};">
              <td style="padding: 11px 14px; font-weight: 600; color: #1E1B2E;">${acc.name}</td>
              <td style="padding: 11px 14px; text-align: right; color: #16A34A; font-weight: 600;">${formatCurrency(acc.credit, lang)}</td>
              <td style="padding: 11px 14px; text-align: right; color: #DC2626; font-weight: 600;">${formatCurrency(acc.debit, lang)}</td>
              <td style="padding: 11px 14px; text-align: right; font-weight: 700; color: ${acc.balance > 0 ? '#16A34A' : acc.balance < 0 ? '#DC2626' : '#6B7280'};">
                ${formatCurrency(acc.balance, lang)}
              </td>
            </tr>
          `).join('')}

          <!-- Grand Total Row -->
          <tr style="background: #F4F1FA; font-weight: 700; border-top: 2px solid #7542C8; border-bottom: 2px solid #7542C8;">
            <td style="padding: 12px 14px; color: #7542C8; font-size: 14px;">${isBn ? 'সর্বমোট স্থিতি (TOTAL)' : 'GRAND TOTAL'}</td>
            <td style="padding: 12px 14px; text-align: right; color: #16A34A; font-size: 14px;">${formatCurrency(overallSummary.totalCredit, lang)}</td>
            <td style="padding: 12px 14px; text-align: right; color: #DC2626; font-size: 14px;">${formatCurrency(overallSummary.totalDebit, lang)}</td>
            <td style="padding: 12px 14px; text-align: right; color: ${overallSummary.netBalance >= 0 ? '#7542C8' : '#DC2626'}; font-size: 14px;">
              ${formatCurrency(overallSummary.netBalance, lang)}
            </td>
          </tr>
        </tbody>
      </table>

      <!-- Footer Note -->
      <div style="border-top: 1px solid #E5E7EB; padding-top: 14px; display: flex; justify-content: space-between; font-size: 11px; color: #9CA3AF;">
        <span>আমানত লেজার (Amanot Ledger) — স্মার্ট মানি ও লেনদেন ব্যবস্থাপনা</span>
        <span>পৃষ্ঠা ১</span>
      </div>
    </div>
  `;

  await renderHtmlToPdf(html, `Amanot_Ledger_Dashboard_${Date.now()}.pdf`);
};

/**
 * 2. Export Individual Account Ledger to PDF with Full Bengali Support
 */
export const exportAccountPDF = async (account, summary, transactions, lang = 'bn') => {
  const isBn = lang === 'bn';
  const title = isBn ? 'ব্যক্তিগত লেজার খাতা বিবরণী' : 'Individual Ledger Statement';
  const dateStr = new Date().toLocaleDateString(isBn ? 'bn-BD' : 'en-US', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  });

  const html = `
    <div style="font-family: 'Hind Siliguri', 'Inter', sans-serif; background: #ffffff; padding: 32px; color: #1e1b2e;">
      <!-- Header Banner -->
      <div style="background: linear-gradient(135deg, #7542C8 0%, #582CA1 100%); color: #ffffff; border-radius: 16px; padding: 22px 26px; margin-bottom: 22px;">
        <div style="display: flex; justify-content: space-between; align-items: center;">
          <div>
            <div style="font-size: 11px; opacity: 0.85; text-transform: uppercase; letter-spacing: 0.5px;">${title}</div>
            <h1 style="margin: 4px 0 0 0; font-size: 22px; font-weight: 700;">${account.name}</h1>
          </div>
          <div style="text-align: right;">
            <span style="font-size: 11px; opacity: 0.8; display: block;">${isBn ? 'তারিখ' : 'Date'}</span>
            <span style="font-size: 13px; font-weight: 600;">${dateStr}</span>
          </div>
        </div>
      </div>

      <!-- Account Summary Cards -->
      <div style="display: grid; grid-template-columns: repeat(3, 1fr); gap: 14px; margin-bottom: 22px;">
        <div style="background: #F0FDF4; border: 1px solid #BBF7D0; border-radius: 14px; padding: 12px 16px;">
          <div style="font-size: 11px; color: #16A34A; font-weight: 600; margin-bottom: 3px;">${isBn ? 'মোট জমা (+)' : 'Total Credit (+)'}</div>
          <div style="font-size: 18px; font-weight: 700; color: #15803D;">${formatCurrency(summary.credit, lang)}</div>
        </div>

        <div style="background: #FEF2F2; border: 1px solid #FECACA; border-radius: 14px; padding: 12px 16px;">
          <div style="font-size: 11px; color: #DC2626; font-weight: 600; margin-bottom: 3px;">${isBn ? 'মোট প্রদান (−)' : 'Total Debit (−)'}</div>
          <div style="font-size: 18px; font-weight: 700; color: #B91C1C;">${formatCurrency(summary.debit, lang)}</div>
        </div>

        <div style="background: #F7F5FC; border: 1px solid #E9D5FF; border-radius: 14px; padding: 12px 16px;">
          <div style="font-size: 11px; color: #7542C8; font-weight: 600; margin-bottom: 3px;">${isBn ? 'বর্তমান ব্যালেন্স' : 'Current Balance'}</div>
          <div style="font-size: 18px; font-weight: 700; color: ${summary.balance > 0 ? '#16A34A' : summary.balance < 0 ? '#DC2626' : '#6B7280'};">
            ${formatCurrency(summary.balance, lang)}
          </div>
        </div>
      </div>

      <!-- Transactions History Table -->
      <div style="font-size: 14px; font-weight: 700; color: #1E1B2E; margin-bottom: 10px;">
        ${isBn ? 'সম্পূর্ণ লেনদেন হিস্ট্রি' : 'Transaction History'} (${transactions.length})
      </div>

      <table style="width: 100%; border-collapse: collapse; margin-bottom: 24px; font-size: 12px;">
        <thead>
          <tr style="background: #7542C8; color: #ffffff;">
            <th style="padding: 10px 12px; text-align: left; border-top-left-radius: 10px; font-weight: 600;">${isBn ? 'তারিখ' : 'Date'}</th>
            <th style="padding: 10px 12px; text-align: left; font-weight: 600;">${isBn ? 'বিবরণ / শিরোনাম' : 'Particular / Title'}</th>
            <th style="padding: 10px 12px; text-align: center; font-weight: 600;">${isBn ? 'মাধ্যম' : 'Method'}</th>
            <th style="padding: 10px 12px; text-align: right; font-weight: 600;">${isBn ? 'জমা (+)' : 'Credit (+)'}</th>
            <th style="padding: 10px 12px; text-align: right; border-top-right-radius: 10px; font-weight: 600;">${isBn ? 'প্রদান (−)' : 'Debit (−)'}</th>
          </tr>
        </thead>
        <tbody>
          ${transactions.length === 0 ? `
            <tr>
              <td colspan="5" style="padding: 24px; text-align: center; color: #9CA3AF;">
                ${isBn ? 'কোনো লেনদেন রেকর্ড পাওয়া যায়নি' : 'No transactions recorded yet'}
              </td>
            </tr>
          ` : transactions.map((tx, idx) => `
            <tr style="border-bottom: 1px solid #F1F1F5; background: ${idx % 2 === 0 ? '#FFFFFF' : '#FAF9FD'};">
              <td style="padding: 9px 12px; color: #6B7280; font-family: 'Inter', sans-serif;">${tx.date}</td>
              <td style="padding: 9px 12px; font-weight: 600; color: #1E1B2E;">${tx.particular}</td>
              <td style="padding: 9px 12px; text-align: center;">
                <span style="background: #F3E8FF; color: #7542C8; padding: 2px 8px; border-radius: 6px; font-size: 11px; font-weight: 600;">
                  ${tx.methodNameSnapshot || 'Cash'}
                </span>
              </td>
              <td style="padding: 9px 12px; text-align: right; color: #16A34A; font-weight: 600;">
                ${tx.type === 'credit' ? formatCurrency(tx.amount, lang) : '-'}
              </td>
              <td style="padding: 9px 12px; text-align: right; color: #DC2626; font-weight: 600;">
                ${tx.type === 'debit' ? formatCurrency(tx.amount, lang) : '-'}
              </td>
            </tr>
          `).join('')}
        </tbody>
      </table>

      <!-- Footer Note -->
      <div style="border-top: 1px solid #E5E7EB; padding-top: 14px; display: flex; justify-content: space-between; font-size: 11px; color: #9CA3AF;">
        <span>আমানত লেজার (Amanot Ledger) • ${account.name} এর আর্থিক বিবরণী</span>
        <span>পৃষ্ঠা ১</span>
      </div>
    </div>
  `;

  await renderHtmlToPdf(html, `Ledger_${account.name.replace(/\s+/g, '_')}_${Date.now()}.pdf`);
};

/**
 * 3. Export Dashboard Summary to Excel (.xlsx) with clean UTF-8
 */
export const exportDashboardExcel = async (accountsWithSummary, overallSummary) => {
  const workbook = new ExcelJS.Workbook();
  workbook.creator = 'Amanot Ledger';
  workbook.created = new Date();

  const worksheet = workbook.addWorksheet('Summary');

  // Title
  worksheet.addRow(['AMANOT LEDGER — ড্যাশবোর্ড বিবরণী']);
  worksheet.addRow([`Report Generated: ${new Date().toLocaleString()}`]);
  worksheet.addRow([]);

  // Header Row
  const headerRow = worksheet.addRow([
    'অ্যাকাউন্টের নাম (Account Name)',
    'মোট জমা (Total Credit +)',
    'মোট প্রদান (Total Debit -)',
    'বর্তমান ব্যালেন্স (Current Balance)',
  ]);

  headerRow.eachCell((cell) => {
    cell.fill = {
      type: 'pattern',
      pattern: 'solid',
      fgColor: { argb: 'FF7542C8' },
    };
    cell.font = { bold: true, color: { argb: 'FFFFFFFF' } };
    cell.alignment = { vertical: 'middle', horizontal: 'center' };
  });

  // Rows
  accountsWithSummary.forEach((acc) => {
    const row = worksheet.addRow([
      acc.name,
      acc.credit,
      acc.debit,
      acc.balance,
    ]);
    row.getCell(2).numFmt = '#,##0.00';
    row.getCell(3).numFmt = '#,##0.00';
    row.getCell(4).numFmt = '#,##0.00';
  });

  // Grand Total Row
  worksheet.addRow([]);
  const totalRow = worksheet.addRow([
    'সর্বমোট স্থিতি (GRAND TOTAL)',
    overallSummary.totalCredit,
    overallSummary.totalDebit,
    overallSummary.netBalance,
  ]);

  totalRow.eachCell((cell) => {
    cell.font = { bold: true };
    cell.fill = {
      type: 'pattern',
      pattern: 'solid',
      fgColor: { argb: 'FFF7F5FC' },
    };
  });
  totalRow.getCell(2).numFmt = '#,##0.00';
  totalRow.getCell(3).numFmt = '#,##0.00';
  totalRow.getCell(4).numFmt = '#,##0.00';

  worksheet.columns.forEach((column) => {
    column.width = 28;
  });

  const buffer = await workbook.xlsx.writeBuffer();
  downloadBlob(buffer, `Amanot_Ledger_Dashboard_${Date.now()}.xlsx`, 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
};

/**
 * 4. Export Individual Account Ledger to Excel (.xlsx) with clean UTF-8
 */
export const exportAccountExcel = async (account, summary, transactions) => {
  const workbook = new ExcelJS.Workbook();
  workbook.creator = 'Amanot Ledger';
  const worksheet = workbook.addWorksheet('Ledger');

  worksheet.addRow([`AMANOT LEDGER — ব্যক্তিগত খাতা বিবরণী`]);
  worksheet.addRow([`Account Name: ${account.name}`]);
  worksheet.addRow([`Generated At: ${new Date().toLocaleString()}`]);
  worksheet.addRow([]);

  // Summary Row
  const summaryHeader = worksheet.addRow(['মোট জমা (+)', 'মোট প্রদান (−)', 'বর্তমান ব্যালেন্স']);
  summaryHeader.font = { bold: true };
  const summaryRow = worksheet.addRow([summary.credit, summary.debit, summary.balance]);
  summaryRow.getCell(1).numFmt = '#,##0.00';
  summaryRow.getCell(2).numFmt = '#,##0.00';
  summaryRow.getCell(3).numFmt = '#,##0.00';
  worksheet.addRow([]);

  // Table Headers
  const headerRow = worksheet.addRow(['তারিখ (Date)', 'বিবরণ (Particular)', 'মাধ্যম (Method)', 'জমা (Credit +)', 'প্রদান (Debit -)']);
  headerRow.eachCell((cell) => {
    cell.fill = {
      type: 'pattern',
      pattern: 'solid',
      fgColor: { argb: 'FF7542C8' },
    };
    cell.font = { bold: true, color: { argb: 'FFFFFFFF' } };
    cell.alignment = { vertical: 'middle', horizontal: 'center' };
  });

  transactions.forEach((tx) => {
    const row = worksheet.addRow([
      tx.date,
      tx.particular,
      tx.methodNameSnapshot || 'Cash',
      tx.type === 'credit' ? tx.amount : '',
      tx.type === 'debit' ? tx.amount : '',
    ]);
    if (tx.type === 'credit') row.getCell(4).numFmt = '#,##0.00';
    if (tx.type === 'debit') row.getCell(5).numFmt = '#,##0.00';
  });

  worksheet.columns.forEach((column) => {
    column.width = 24;
  });

  const buffer = await workbook.xlsx.writeBuffer();
  downloadBlob(buffer, `Ledger_${account.name.replace(/\s+/g, '_')}_${Date.now()}.xlsx`, 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
};

function downloadBlob(buffer, fileName, mimeType) {
  const blob = new Blob([buffer], { type: mimeType });
  const link = document.createElement('a');
  link.href = URL.createObjectURL(blob);
  link.download = fileName;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
}
