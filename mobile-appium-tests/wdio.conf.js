/**
 * WebdriverIO Appium Android Configuration for SmokPerio AI
 */

exports.config = {
  runner: 'local',
  port: 4723,
  specs: [
    './test/specs/**/*.js'
  ],
  maxInstances: 1,
  capabilities: [{
    platformName: 'Android',
    'appium:automationName': 'UiAutomator2',
    'appium:deviceName': 'Android Emulator',
    'appium:appPackage': 'com.simats.smokperioai',
    'appium:appActivity': 'com.simats.smokperioai.ui.splash.SplashActivity',
    'appium:noReset': false,
    'appium:newCommandTimeout': 240,
    'appium:autoGrantPermissions': true
  }],
  logLevel: 'info',
  bail: 0,
  waitforTimeout: 10000,
  connectionRetryTimeout: 120000,
  connectionRetryCount: 3,
  services: ['appium'],
  framework: 'mocha',
  reporters: ['spec'],
  mochaOpts: {
    ui: 'bdd',
    timeout: 60000
  }
};
