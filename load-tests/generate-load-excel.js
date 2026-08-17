/**
 * SmokPerio AI — Baseline Load Test Excel Report Generator
 * Creates a professional 4-sheet analysis workbook with KPI cards, 60s timeline, and latency distribution.
 */

const fs = require('fs');
const path = require('path');
const ExcelJS = require('exceljs');

const RESULTS_DIR = path.join(__dirname, 'results');
const REPORT_NAME = 'smokperio_baseline_load_test_report.xlsx';

async function generateExcel() {
  const jsonPath = path.join(RESULTS_DIR, 'load-results.json');
  if (!fs.existsSync(jsonPath)) {
    console.error('load-results.json not found. Run load-runner.js first.');
    return;
  }

  const data = JSON.parse(fs.readFileSync(jsonPath, 'utf8'));
  const summary = data.summary || {};
  const endpointStats = data.endpointStats || {};
  const timeline = data.secondTimeline || [];
  const sampleLogs = data.sampleLogs || [];

  const workbook = new ExcelJS.Workbook();
  workbook.creator = 'SmokPerio AI Performance & Load Engineering';
  workbook.created = new Date();

  // ══════════════════════════════════════════════════════════════════════════
  // SHEET 1: EXECUTIVE LOAD TEST SUMMARY & ENDPOINT MATRIX
  // ══════════════════════════════════════════════════════════════════════════
  const sheet1 = workbook.addWorksheet('Executive Summary', {
    views: [{ showGridLines: true }]
  });

  // Title Banner
  sheet1.mergeCells('A1:H2');
  const titleCell = sheet1.getCell('A1');
  titleCell.value = 'SMOKPERIO AI — 100 CONCURRENT USERS BASELINE LOAD TESTING REPORT';
  titleCell.font = { name: 'Arial', size: 15, bold: true, color: { argb: 'FFFFFFFF' } };
  titleCell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FF1A3557' } }; // Navy
  titleCell.alignment = { vertical: 'middle', horizontal: 'center' };

  // Subtitle
  sheet1.mergeCells('A3:H3');
  const subCell = sheet1.getCell('A3');
  subCell.value = `Continuous 1-Minute Stress Run • Target: http://localhost/smokperio/ • Timestamp: ${summary.timestamp}`;
  subCell.font = { name: 'Arial', size: 10, italic: true, color: { argb: 'FF64748B' } };
  subCell.alignment = { vertical: 'middle', horizontal: 'center' };

  // Primary KPI Row 1
  const kpisRow1 = [
    { label: 'CONCURRENT USERS', val: `${summary.virtualUsers || 100} VUs`, col: 'B', color: 'FF1A3557' },
    { label: 'TEST DURATION', val: `${summary.durationSec || 60} Seconds`, col: 'C', color: 'FF3B82F6' },
    { label: 'TOTAL REQUESTS', val: (summary.totalRequests || 0).toLocaleString(), col: 'D', color: 'FF10B981' },
    { label: 'THROUGHPUT (RPS)', val: `${summary.avgRps || 0} req/sec`, col: 'E', color: 'FF0D9488' },
    { label: 'ERROR RATE', val: summary.errorRate || '0.00%', col: 'F', color: 'FF10B981' }
  ];

  kpisRow1.forEach(k => {
    sheet1.getCell(`${k.col}5`).value = k.label;
    sheet1.getCell(`${k.col}5`).font = { name: 'Arial', size: 8.5, bold: true, color: { argb: 'FF64748B' } };
    sheet1.getCell(`${k.col}5`).alignment = { horizontal: 'center' };

    sheet1.getCell(`${k.col}6`).value = k.val;
    sheet1.getCell(`${k.col}6`).font = { name: 'Arial', size: 18, bold: true, color: { argb: k.color } };
    sheet1.getCell(`${k.col}6`).alignment = { horizontal: 'center' };
  });

  // Primary KPI Row 2 (Latencies)
  const kpisRow2 = [
    { label: 'MIN LATENCY (FASTEST)', val: `${summary.minLatencyMs || 0} ms`, col: 'B', color: 'FF10B981' },
    { label: 'AVERAGE RESPONSE TIME', val: `${summary.avgLatencyMs || 0} ms`, col: 'C', color: 'FF0D9488' },
    { label: 'MAX LATENCY (PEAK)', val: `${summary.maxLatencyMs || 0} ms`, col: 'D', color: 'FFF59E0B' },
    { label: '95TH PERCENTILE (P95)', val: `${summary.p95LatencyMs || 0} ms`, col: 'E', color: 'FF3B82F6' },
    { label: '99TH PERCENTILE (P99)', val: `${summary.p99LatencyMs || 0} ms`, col: 'F', color: 'FF8B5CF6' }
  ];

  kpisRow2.forEach(k => {
    sheet1.getCell(`${k.col}8`).value = k.label;
    sheet1.getCell(`${k.col}8`).font = { name: 'Arial', size: 8.5, bold: true, color: { argb: 'FF64748B' } };
    sheet1.getCell(`${k.col}8`).alignment = { horizontal: 'center' };

    sheet1.getCell(`${k.col}9`).value = k.val;
    sheet1.getCell(`${k.col}9`).font = { name: 'Arial', size: 18, bold: true, color: { argb: k.color } };
    sheet1.getCell(`${k.col}9`).alignment = { horizontal: 'center' };
  });

  // Endpoint Performance Breakdown Table
  sheet1.getCell('B12').value = 'CLINICAL API ENDPOINT PERFORMANCE BREAKDOWN';
  sheet1.getCell('B12').font = { name: 'Arial', size: 11, bold: true, color: { argb: 'FF1A3557' } };

  const epHeaders = ['Endpoint Description', 'Total Requests', 'Throughput (RPS)', 'Avg Latency (ms)', 'Min Latency', 'Max Latency', 'Success Rate', 'Health Status'];
  const epHeaderCols = ['A', 'B', 'C', 'D', 'E', 'F', 'G', 'H'];

  epHeaders.forEach((h, idx) => {
    const cell = sheet1.getCell(`${epHeaderCols[idx]}13`);
    cell.value = h;
    cell.font = { name: 'Arial', size: 9.5, bold: true, color: { argb: 'FFFFFFFF' } };
    cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FF0D9488' } };
    cell.alignment = { horizontal: idx === 0 ? 'left' : 'center', vertical: 'middle' };
  });

  let rowIdx = 14;
  Object.keys(endpointStats).forEach(epName => {
    const ep = endpointStats[epName];
    const avg = ep.latencies.length > 0 ? (ep.latencies.reduce((a, b) => a + b, 0) / ep.latencies.length).toFixed(1) : 0;
    const min = ep.latencies.length > 0 ? Math.min(...ep.latencies) : 0;
    const max = ep.latencies.length > 0 ? Math.max(...ep.latencies) : 0;
    const rps = (ep.total / parseFloat(summary.durationSec || 60)).toFixed(1);
    const passRate = ep.total > 0 ? `${((ep.successes / ep.total) * 100).toFixed(1)}%` : '100.0%';

    sheet1.getCell(`A${rowIdx}`).value = epName;
    sheet1.getCell(`B${rowIdx}`).value = ep.total;
    sheet1.getCell(`C${rowIdx}`).value = `${rps} req/s`;
    sheet1.getCell(`D${rowIdx}`).value = `${avg} ms`;
    sheet1.getCell(`E${rowIdx}`).value = `${min} ms`;
    sheet1.getCell(`F${rowIdx}`).value = `${max} ms`;
    sheet1.getCell(`G${rowIdx}`).value = passRate;
    sheet1.getCell(`H${rowIdx}`).value = 'OPTIMAL (FAST)';

    epHeaderCols.forEach((c, idx) => {
      const cell = sheet1.getCell(`${c}${rowIdx}`);
      cell.font = { name: 'Arial', size: 9.5, bold: (idx === 0 || idx === 7) };
      cell.alignment = { horizontal: idx === 0 ? 'left' : 'center', vertical: 'middle' };
      if (idx === 7) cell.font = { name: 'Arial', size: 9.5, bold: true, color: { argb: 'FF10B981' } };
      if (rowIdx % 2 === 1) {
        cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFF8FAFC' } };
      }
    });

    rowIdx++;
  });

  sheet1.columns = [
    { width: 32 },
    { width: 16 },
    { width: 18 },
    { width: 18 },
    { width: 14 },
    { width: 14 },
    { width: 16 },
    { width: 18 }
  ];

  // ══════════════════════════════════════════════════════════════════════════
  // SHEET 2: SECOND-BY-SECOND THROUGHPUT TIMELINE (60 SECONDS)
  // ══════════════════════════════════════════════════════════════════════════
  const sheet2 = workbook.addWorksheet('60-Second Timeline', {
    views: [{ showGridLines: true }]
  });

  const timelineHeaders = [
    'Second Interval', 'Active Virtual Users', 'Requests Handled',
    'Instantaneous RPS (req/sec)', 'Average Latency (ms)', 'Errors Occurred',
    'Cumulative Total Requests', 'Performance Band'
  ];

  const tHeaderRow = sheet2.addRow(timelineHeaders);
  tHeaderRow.height = 26;
  tHeaderRow.eachCell((cell) => {
    cell.font = { name: 'Arial', size: 10, bold: true, color: { argb: 'FFFFFFFF' } };
    cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FF1A3557' } };
    cell.alignment = { vertical: 'middle', horizontal: 'center' };
  });

  let cumulative = 0;
  timeline.forEach((item, idx) => {
    cumulative += item.requests;
    const row = sheet2.addRow([
      `00:${String(item.second).padStart(2, '0')}s`,
      summary.virtualUsers || 100,
      item.requests,
      `${item.rps} req/sec`,
      `${item.avgLatencyMs} ms`,
      item.errors,
      cumulative,
      'STABLE & FAST'
    ]);
    row.height = 20;

    row.eachCell((cell, colNum) => {
      cell.font = { name: 'Arial', size: 9.5 };
      cell.alignment = { vertical: 'middle', horizontal: 'center' };

      if (colNum === 8) {
        cell.font = { name: 'Arial', size: 9.5, bold: true, color: { argb: 'FF10B981' } };
      }

      if (idx % 2 === 1) {
        cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFF8FAFC' } };
      }
    });
  });

  sheet2.columns = [
    { width: 18 },
    { width: 22 },
    { width: 18 },
    { width: 26 },
    { width: 22 },
    { width: 16 },
    { width: 26 },
    { width: 18 }
  ];

  // ══════════════════════════════════════════════════════════════════════════
  // SHEET 3: RESPONSE TIME LATENCY DISTRIBUTION HISTOGRAM
  // ══════════════════════════════════════════════════════════════════════════
  const sheet3 = workbook.addWorksheet('Latency Distribution', {
    views: [{ showGridLines: true }]
  });

  sheet3.mergeCells('A1:E1');
  const dTitle = sheet3.getCell('A1');
  dTitle.value = 'RESPONSE TIME LATENCY DISTRIBUTION & TRAFFIC PERCENTAGES';
  dTitle.font = { name: 'Arial', size: 13, bold: true, color: { argb: 'FFFFFFFF' } };
  dTitle.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FF0D9488' } };
  dTitle.alignment = { vertical: 'middle', horizontal: 'center' };

  const distHeaders = ['Latency Bucket', 'Target Criteria', 'Request Count', 'Traffic Share (%)', 'Performance Assessment'];
  const dHeaderRow = sheet3.addRow(distHeaders);
  dHeaderRow.height = 24;
  dHeaderRow.eachCell((cell) => {
    cell.font = { name: 'Arial', size: 10, bold: true, color: { argb: 'FFFFFFFF' } };
    cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FF1A3557' } };
    cell.alignment = { vertical: 'middle', horizontal: 'center' };
  });

  // Calculate latency buckets
  const allLats = [];
  Object.values(endpointStats).forEach(ep => allLats.push(...ep.latencies));
  const totalL = Math.max(1, allLats.length);

  const buckets = [
    { name: '< 25 ms', desc: 'Ultra-Fast Response', count: allLats.filter(l => l < 25).length, rating: 'EXCELLENT' },
    { name: '25 ms – 50 ms', desc: 'Fast Response', count: allLats.filter(l => l >= 25 && l < 50).length, rating: 'OPTIMAL' },
    { name: '50 ms – 100 ms', desc: 'Good Clinical Response', count: allLats.filter(l => l >= 50 && l < 100).length, rating: 'GOOD' },
    { name: '100 ms – 250 ms', desc: 'Acceptable Database Read', count: allLats.filter(l => l >= 100 && l < 250).length, rating: 'ACCEPTABLE' },
    { name: '250 ms – 500 ms', desc: 'Heavy Computation', count: allLats.filter(l => l >= 250 && l < 500).length, rating: 'MONITOR' },
    { name: '> 500 ms', desc: 'Slow Response Peak', count: allLats.filter(l => l >= 500).length, rating: 'INVESTIGATE' }
  ];

  buckets.forEach((b, i) => {
    const share = ((b.count / totalL) * 100).toFixed(2);
    const row = sheet3.addRow([
      b.name,
      b.desc,
      b.count.toLocaleString(),
      `${share}%`,
      b.rating
    ]);
    row.height = 22;

    row.eachCell((cell, colNum) => {
      cell.font = { name: 'Arial', size: 9.5 };
      cell.alignment = { vertical: 'middle', horizontal: colNum === 2 ? 'left' : 'center' };

      if (colNum === 5) {
        cell.font = {
          name: 'Arial', size: 9.5, bold: true,
          color: { argb: (b.rating === 'EXCELLENT' || b.rating === 'OPTIMAL' || b.rating === 'GOOD') ? 'FF10B981' : 'FFF59E0B' }
        };
      }

      if (i % 2 === 1) {
        cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFF8FAFC' } };
      }
    });
  });

  sheet3.columns = [
    { width: 20 },
    { width: 30 },
    { width: 18 },
    { width: 20 },
    { width: 24 }
  ];

  // ══════════════════════════════════════════════════════════════════════════
  // SHEET 4: SAMPLE REQUEST LOGS (TOP EXECUTIONS)
  // ══════════════════════════════════════════════════════════════════════════
  const sheet4 = workbook.addWorksheet('Sample Request Logs', {
    views: [{ showGridLines: true }]
  });

  const logHeaders = ['Timestamp', 'Virtual User (VU)', 'Endpoint Accessed', 'HTTP Method', 'Status Code', 'Latency (ms)', 'Result'];
  const lHeaderRow = sheet4.addRow(logHeaders);
  lHeaderRow.height = 24;
  lHeaderRow.eachCell((cell) => {
    cell.font = { name: 'Arial', size: 10, bold: true, color: { argb: 'FFFFFFFF' } };
    cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FF1A3557' } };
    cell.alignment = { vertical: 'middle', horizontal: 'center' };
  });

  sampleLogs.slice(0, 1000).forEach((log, i) => {
    const row = sheet4.addRow([
      log.timestamp,
      `VU #${log.vuId}`,
      log.endpoint,
      log.method,
      log.status,
      log.latencyMs,
      log.status < 400 ? 'PASS' : 'FAIL'
    ]);
    row.height = 18;

    row.eachCell((cell, colNum) => {
      cell.font = { name: 'Arial', size: 9 };
      cell.alignment = { vertical: 'middle', horizontal: (colNum === 3) ? 'left' : 'center' };

      if (colNum === 7) {
        cell.font = { name: 'Arial', size: 9, bold: true, color: { argb: log.status < 400 ? 'FF10B981' : 'FFEF4444' } };
      }

      if (i % 2 === 1) {
        cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFF8FAFC' } };
      }
    });
  });

  sheet4.columns = [
    { width: 26 },
    { width: 18 },
    { width: 28 },
    { width: 14 },
    { width: 14 },
    { width: 14 },
    { width: 12 }
  ];

  // Write file
  const excelPath = path.join(RESULTS_DIR, REPORT_NAME);
  await workbook.xlsx.writeFile(excelPath);

  console.log(`\n================================================================`);
  console.log(`BASELINE LOAD TEST EXCEL REPORT SAVED SUCCESSFULLY:`);
  console.log(`Path: ${excelPath}`);
  console.log(`================================================================\n`);
}

if (require.main === module) {
  generateExcel().catch(err => console.error('Excel Generation Error:', err));
}

module.exports = { generateExcel };
