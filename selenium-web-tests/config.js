/**
 * SmokPerio AI — Test Suite Configuration
 */

module.exports = {
  baseUrl: process.env.BASE_URL || 'http://localhost/smokperio/',
  webUrl: process.env.WEB_URL || 'http://localhost/smokperio/web/',
  defaultDoctor: {
    email: 'doctor@simats.edu',
    password: 'password123',
    name: 'Dr. Aris Thorne'
  },
  timeoutMs: 10000,
  concurrency: 10,
  outputDir: __dirname + '/test-results',
  excelReportName: 'smokperio_web_test_report_500.xlsx'
};
