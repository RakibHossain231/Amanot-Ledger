import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import ExcelJS from 'exceljs';

/**
 * Format plain numbers for reports
 */
const fmtNum = (val) => {
  const n = Number(val) || 0;
  return n.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
};

/**
 * 1. Export Dashboard Summary to PDF
 * Per spec: Contains ONLY Account Name, Total Credit, Total Debit, Current Balance, and Total Summary!
 */
export const exportDashboardPDF = (accountsWithSummary, overallSummary, lang = 'bn') => {
  const doc = new jsPDF({
    orientation: 'portrait',
    unit: 'pt',
    format: 'a4',
  });

  const title = lang === 'bn' ? 'আমানত লেজার - ড্যাশবোর্ড রিপোর্ট' : 'Amanot Ledger - Dashboard Report';
  const subtitle = lang === 'bn' ? 'ব্যক্তিগত আমানত ও লেনদেন হিসাব বিবরণী' : 'Account Balances & Summary Statement';
  const dateStr = new Date().toLocaleDateString(lang === 'bn' ? 'bn-BD' : 'en-US', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });

  // Header Title
  doc.setFillColor(117, 66, 200); // #7542C8
  doc.rect(0, 0, doc.internal.pageSize.getWidth(), 65, 'F');

  doc.setTextColor(255, 255, 255);
  doc.setFontSize(18);
  doc.setFont('helvetica', 'bold');
  doc.text(title, 40, 35);

  doc.setFontSize(10);
  doc.setFont('helvetica', 'normal');
  doc.text(`${subtitle} | Date: ${dateStr}`, 40, 52);

  // Table Data
  const headers = [
    lang === 'bn' ? 'Account Name' : 'Account Name',
    lang === 'bn' ? 'Total Credit (+)' : 'Total Credit (+)',
    lang === 'bn' ? 'Total Debit (-)' : 'Total Debit (-)',
    lang === 'bn' ? 'Current Balance' : 'Current Balance',
  ];

  const rows = accountsWithSummary.map((item) => [
    item.name,
    `BDT ${fmtNum(item.credit)}`,
    `BDT ${fmtNum(item.debit)}`,
    `BDT ${fmtNum(item.balance)}`,
  ]);

  // Bottom Total Row
  const totalRow = [
    'TOTAL SUMMARY',
    `BDT ${fmtNum(overallSummary.totalCredit)}`,
    `BDT ${fmtNum(overallSummary.totalDebit)}`,
    `BDT ${fmtNum(overallSummary.netBalance)}`,
  ];

  autoTable(doc, {
    startY: 85,
    head: [headers],
    body: [...rows, totalRow],
    theme: 'grid',
    headStyles: {
      fillColor: [117, 66, 200],
      textColor: [255, 255, 255],
      fontStyle: 'bold',
      halign: 'center',
    },
    bodyStyles: {
      textColor: [40, 40, 40],
      fontSize: 10,
    },
    columnStyles: {
      0: { fontStyle: 'bold' },
      1: { halign: 'right', textColor: [22, 163, 74] },
      2: { halign: 'right', textColor: [220, 38, 38] },
      3: { halign: 'right', fontStyle: 'bold' },
    },
    didParseCell: (data) => {
      // Highlight the total summary row at the bottom
      if (data.row.index === rows.length) {
        data.cell.styles.fillColor = [247, 245, 252];
        data.cell.styles.fontStyle = 'bold';
      }
    },
    margin: { left: 40, right: 40 },
  });

  doc.save(`Amanot_Ledger_Dashboard_${Date.now()}.pdf`);
};

/**
 * 2. Export Dashboard Summary to Excel (.xlsx)
 */
export const exportDashboardExcel = async (accountsWithSummary, overallSummary) => {
  const workbook = new ExcelJS.Workbook();
  workbook.creator = 'Amanot Ledger';
  workbook.created = new Date();

  const worksheet = workbook.addWorksheet('Dashboard Summary');

  // Title
  worksheet.addRow(['AMANOT LEDGER - SUMMARY STATEMENT']);
  worksheet.addRow([`Report Generated: ${new Date().toLocaleString()}`]);
  worksheet.addRow([]); // Blank line

  // Header Row
  const headerRow = worksheet.addRow([
    'Account Name',
    'Total Credit (+)',
    'Total Debit (-)',
    'Current Balance',
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

  // Total Row
  worksheet.addRow([]);
  const totalRow = worksheet.addRow([
    'TOTAL NET SUMMARY',
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
    column.width = 22;
  });

  const buffer = await workbook.xlsx.writeBuffer();
  downloadBlob(buffer, `Amanot_Ledger_Dashboard_${Date.now()}.xlsx`, 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
};

/**
 * 3. Export Individual Account Ledger to PDF
 * Per spec: Contains Account Name, Summary cards, and COMPLETE transaction history!
 */
export const exportAccountPDF = (account, summary, transactions, lang = 'bn') => {
  const doc = new jsPDF({
    orientation: 'portrait',
    unit: 'pt',
    format: 'a4',
  });

  const dateStr = new Date().toLocaleDateString(lang === 'bn' ? 'bn-BD' : 'en-US', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  });

  // Header Banner
  doc.setFillColor(117, 66, 200);
  doc.rect(0, 0, doc.internal.pageSize.getWidth(), 75, 'F');

  doc.setTextColor(255, 255, 255);
  doc.setFontSize(16);
  doc.setFont('helvetica', 'bold');
  doc.text(`AMANOT LEDGER - INDIVIDUAL STATEMENT`, 40, 32);

  doc.setFontSize(13);
  doc.text(`Account: ${account.name}`, 40, 50);

  doc.setFontSize(9);
  doc.setFont('helvetica', 'normal');
  doc.text(`Generated: ${dateStr}`, 40, 65);

  // Summary Box below header
  doc.setFillColor(247, 245, 252);
  doc.roundedRect(40, 85, doc.internal.pageSize.getWidth() - 80, 40, 5, 5, 'F');

  doc.setTextColor(80, 80, 80);
  doc.setFontSize(10);
  doc.text(`Total Credit (+): BDT ${fmtNum(summary.credit)}`, 55, 108);
  doc.text(`Total Debit (-): BDT ${fmtNum(summary.debit)}`, 220, 108);
  
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(summary.balance >= 0 ? 22 : 220, summary.balance >= 0 ? 163 : 38, summary.balance >= 0 ? 74 : 38);
  doc.text(`Net Balance: BDT ${fmtNum(summary.balance)}`, 380, 108);

  // Transaction History Table
  const headers = ['Date', 'Particular / Title', 'Method', 'Credit (+)', 'Debit (-)', 'Note'];

  const rows = transactions.map((tx) => [
    tx.date,
    tx.particular,
    tx.methodNameSnapshot || 'Cash',
    tx.type === 'credit' ? `BDT ${fmtNum(tx.amount)}` : '-',
    tx.type === 'debit' ? `BDT ${fmtNum(tx.amount)}` : '-',
    tx.note || '',
  ]);

  autoTable(doc, {
    startY: 135,
    head: [headers],
    body: rows,
    theme: 'grid',
    headStyles: {
      fillColor: [117, 66, 200],
      textColor: [255, 255, 255],
      fontStyle: 'bold',
      halign: 'center',
    },
    bodyStyles: {
      fontSize: 9,
    },
    columnStyles: {
      3: { halign: 'right', textColor: [22, 163, 74], fontStyle: 'bold' },
      4: { halign: 'right', textColor: [220, 38, 38], fontStyle: 'bold' },
    },
    margin: { left: 40, right: 40 },
  });

  doc.save(`Ledger_${account.name.replace(/\s+/g, '_')}_${Date.now()}.pdf`);
};

/**
 * 4. Export Individual Account Ledger to Excel (.xlsx)
 */
export const exportAccountExcel = async (account, summary, transactions) => {
  const workbook = new ExcelJS.Workbook();
  workbook.creator = 'Amanot Ledger';
  const worksheet = workbook.addWorksheet(`Ledger - ${account.name}`);

  worksheet.addRow([`AMANOT LEDGER - INDIVIDUAL STATEMENT`]);
  worksheet.addRow([`Account Name: ${account.name}`]);
  worksheet.addRow([`Generated At: ${new Date().toLocaleString()}`]);
  worksheet.addRow([]);

  // Summary Row
  const summaryRow = worksheet.addRow([
    'Total Credit (+)',
    summary.credit,
    'Total Debit (-)',
    summary.debit,
    'Current Balance',
    summary.balance,
  ]);
  summaryRow.font = { bold: true };
  worksheet.addRow([]);

  // Table Headers
  const headerRow = worksheet.addRow(['Date', 'Particular / Title', 'Method', 'Credit (+)', 'Debit (-)', 'Note']);
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
      tx.note || '',
    ]);
    if (tx.type === 'credit') row.getCell(4).numFmt = '#,##0.00';
    if (tx.type === 'debit') row.getCell(5).numFmt = '#,##0.00';
  });

  worksheet.columns.forEach((column) => {
    column.width = 18;
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
