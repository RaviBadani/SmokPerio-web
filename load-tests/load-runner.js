/**
 * SmokPerio AI — 100 Concurrent Virtual Users (1-Minute) Baseline Load Test Engine
 */

const fs = require('fs');
const path = require('path');
const fetch = globalThis.fetch || require('node-fetch');

// Configuration
const CONFIG = {
  baseUrl: process.env.BASE_URL || 'http://localhost/smokperio/',
  virtualUsers: 100,
  durationSeconds: 60,
  resultsDir: path.join(__dirname, 'results'),
  excelReportName: 'smokperio_baseline_load_test_report.xlsx'
};

const ENDPOINTS = [
  { name: 'Doctor Login', path: 'auth/login.php', method: 'POST', body: JSON.stringify({ email: 'doctor@simats.edu', password: 'password123' }) },
  { name: 'Patient Cohort', path: 'patients/index.php?practitioner_id=1', method: 'GET' },
  { name: 'AI Predictor Engine', path: 'predict/index.php?id=1', method: 'POST', body: JSON.stringify({ age: 48, cigarettes_per_day: 15, years_smoking: 15, cal_mean: 4.5, ppd_mean: 4.0, radiographic_bone_loss: 35.0, furcation_involvement: 1 }) },
  { name: 'Clinical Alerts', path: 'notifications/index.php', method: 'GET' },
  { name: 'Consultations Schedule', path: 'appointments/index.php', method: 'GET' },
  { name: 'PDF Report Export', path: 'report/index.php?id=1', method: 'GET' }
];

async function runLoadTest() {
  console.log('================================================================');
  console.log('  SMOKPERIO AI — 100 CONCURRENT USERS BASELINE LOAD TESTING     ');
  console.log('================================================================');
  console.log(`Target Base URL   : ${CONFIG.baseUrl}`);
  console.log(`Concurrent Users  : ${CONFIG.virtualUsers} Virtual Users (VUs)`);
  console.log(`Duration          : ${CONFIG.durationSeconds} Seconds (1 Minute)`);
  console.log(`Start Timestamp   : ${new Date().toISOString()}`);
  console.log('----------------------------------------------------------------\n');

  const startTime = Date.now();
  const endTime = startTime + (CONFIG.durationSeconds * 1000);

  const requestLogs = [];
  const secondBuckets = Array.from({ length: CONFIG.durationSeconds }, () => ({
    requests: 0,
    successes: 0,
    errors: 0,
    latencies: []
  }));

  const endpointStats = {};
  ENDPOINTS.forEach(ep => {
    endpointStats[ep.name] = { total: 0, successes: 0, errors: 0, latencies: [] };
  });

  let totalRequests = 0;
  let totalSuccess = 0;
  let totalErrors = 0;

  let isRunning = true;

  // Real-time second counter logger
  const intervalLogger = setInterval(() => {
    const elapsedSec = Math.floor((Date.now() - startTime) / 1000);
    if (elapsedSec >= 1 && elapsedSec <= CONFIG.durationSeconds) {
      const bucket = secondBuckets[elapsedSec - 1];
      const rps = bucket ? bucket.requests : 0;
      const avgLat = bucket && bucket.latencies.length > 0
        ? (bucket.latencies.reduce((a, b) => a + b, 0) / bucket.latencies.length).toFixed(1)
        : '0';
      process.stdout.write(`\r[Running] Elapsed: ${String(elapsedSec).padStart(2, '0')}s / 60s | Active VUs: ${CONFIG.virtualUsers} | Total Requests: ${totalRequests} | Current RPS: ${rps} req/sec | Avg Latency: ${avgLat}ms`);
    }
  }, 1000);

  // Worker task for each Virtual User
  async function userWorker(userId) {
    let epIndex = userId % ENDPOINTS.length;

    while (Date.now() < endTime && isRunning) {
      const ep = ENDPOINTS[epIndex];
      epIndex = (epIndex + 1) % ENDPOINTS.length;

      const reqStart = Date.now();
      const currentSecIndex = Math.min(CONFIG.durationSeconds - 1, Math.max(0, Math.floor((reqStart - startTime) / 1000)));

      let status = 200;
      let isSuccess = false;

      try {
        const url = CONFIG.baseUrl + ep.path;
        const options = {
          method: ep.method,
          headers: ep.method === 'POST' ? { 'Content-Type': 'application/json' } : {}
        };
        if (ep.body) options.body = ep.body;

        const res = await fetch(url, options);
        status = res.status;
        isSuccess = (status >= 200 && status < 400);
      } catch (err) {
        status = 500;
        isSuccess = false;
      }

      const latency = Math.max(1, Date.now() - reqStart);

      totalRequests++;
      if (isSuccess) totalSuccess++;
      else totalErrors++;

      // Record in second bucket
      if (secondBuckets[currentSecIndex]) {
        secondBuckets[currentSecIndex].requests++;
        if (isSuccess) secondBuckets[currentSecIndex].successes++;
        else secondBuckets[currentSecIndex].errors++;
        secondBuckets[currentSecIndex].latencies.push(latency);
      }

      // Record in endpoint stats
      endpointStats[ep.name].total++;
      if (isSuccess) endpointStats[ep.name].successes++;
      else endpointStats[ep.name].errors++;
      endpointStats[ep.name].latencies.push(latency);

      // Keep sample logs
      if (requestLogs.length < 2000) {
        requestLogs.push({
          timestamp: new Date().toISOString(),
          vuId: userId,
          endpoint: ep.name,
          method: ep.method,
          status,
          latencyMs: latency
        });
      }

      // Micro-pause between user clicks (15ms - 45ms realistic think time)
      await new Promise(r => setTimeout(r, 20 + Math.floor(Math.random() * 25)));
    }
  }

  // Launch 100 Concurrent Virtual Users simultaneously
  const workers = [];
  for (let u = 1; u <= CONFIG.virtualUsers; u++) {
    workers.push(userWorker(u));
  }

  await Promise.all(workers);
  isRunning = false;
  clearInterval(intervalLogger);

  const totalDurationSec = ((Date.now() - startTime) / 1000).toFixed(2);
  const avgRps = (totalRequests / parseFloat(totalDurationSec)).toFixed(1);

  // Compile all latencies
  const allLatencies = [];
  secondBuckets.forEach(b => allLatencies.push(...b.latencies));
  allLatencies.sort((a, b) => a - b);

  const minLat = allLatencies.length > 0 ? allLatencies[0] : 0;
  const maxLat = allLatencies.length > 0 ? allLatencies[allLatencies.length - 1] : 0;
  const avgLat = allLatencies.length > 0 ? (allLatencies.reduce((a, b) => a + b, 0) / allLatencies.length).toFixed(1) : 0;
  const p50 = allLatencies.length > 0 ? allLatencies[Math.floor(allLatencies.length * 0.50)] : 0;
  const p90 = allLatencies.length > 0 ? allLatencies[Math.floor(allLatencies.length * 0.90)] : 0;
  const p95 = allLatencies.length > 0 ? allLatencies[Math.floor(allLatencies.length * 0.95)] : 0;
  const p99 = allLatencies.length > 0 ? allLatencies[Math.floor(allLatencies.length * 0.99)] : 0;

  console.log('\n\n================================================================');
  console.log('             1-MINUTE BASELINE LOAD TEST RESULTS                ');
  console.log('================================================================');
  console.log(`Concurrent Users    : ${CONFIG.virtualUsers} VUs`);
  console.log(`Duration Tested     : ${totalDurationSec}s (1 Minute)`);
  console.log(`Total Requests Sent : ${totalRequests.toLocaleString()}`);
  console.log(`Successful Requests : ${totalSuccess.toLocaleString()}`);
  console.log(`Failed Requests     : ${totalErrors}`);
  console.log(`Error Rate          : ${((totalErrors / Math.max(1, totalRequests)) * 100).toFixed(2)}%`);
  console.log(`Throughput (RPS)    : ${avgRps} req/sec`);
  console.log('----------------------------------------------------------------');
  console.log(`Min Response Time   : ${minLat} ms (Fastest)`);
  console.log(`Average Response    : ${avgLat} ms (Average)`);
  console.log(`Max Response Time   : ${maxLat} ms (Slowest Peak)`);
  console.log(`50th Percentile     : ${p50} ms`);
  console.log(`90th Percentile     : ${p90} ms`);
  console.log(`95th Percentile     : ${p95} ms`);
  console.log(`99th Percentile     : ${p99} ms`);
  console.log('================================================================\n');

  // Ensure results dir exists
  if (!fs.existsSync(CONFIG.resultsDir)) {
    fs.mkdirSync(CONFIG.resultsDir, { recursive: true });
  }

  const resultsData = {
    summary: {
      virtualUsers: CONFIG.virtualUsers,
      durationSec: totalDurationSec,
      totalRequests,
      totalSuccess,
      totalErrors,
      errorRate: `${((totalErrors / Math.max(1, totalRequests)) * 100).toFixed(2)}%`,
      avgRps: parseFloat(avgRps),
      minLatencyMs: minLat,
      avgLatencyMs: parseFloat(avgLat),
      maxLatencyMs: maxLat,
      p50LatencyMs: p50,
      p90LatencyMs: p90,
      p95LatencyMs: p95,
      p99LatencyMs: p99,
      timestamp: new Date().toISOString()
    },
    endpointStats,
    secondTimeline: secondBuckets.map((b, sec) => ({
      second: sec + 1,
      requests: b.requests,
      rps: b.requests,
      avgLatencyMs: b.latencies.length > 0 ? parseFloat((b.latencies.reduce((x, y) => x + y, 0) / b.latencies.length).toFixed(1)) : 0,
      errors: b.errors
    })),
    sampleLogs: requestLogs
  };

  const resultsJsonPath = path.join(CONFIG.resultsDir, 'load-results.json');
  fs.writeFileSync(resultsJsonPath, JSON.stringify(resultsData, null, 2));
  console.log(`Saved raw JSON load test data to: ${resultsJsonPath}`);

  return resultsData;
}

if (require.main === module) {
  runLoadTest()
    .then(() => {
      console.log('\nNow generating Professional Excel Load Test Analysis Report...');
      require('./generate-load-excel').generateExcel();
    })
    .catch(err => {
      console.error('Load test error:', err);
      process.exit(1);
    });
}

module.exports = { runLoadTest };
