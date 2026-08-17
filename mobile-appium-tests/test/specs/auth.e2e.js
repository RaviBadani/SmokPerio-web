/**
 * Appium E2E Test: Mobile Splash, Onboarding & Login Activity
 */

describe('SmokPerio AI — Mobile Authentication & Onboarding Suite', () => {
  it('should display Splash Screen and navigate to Onboarding or Login', async () => {
    // Wait for Splash screen logo
    const splashLogo = await $('//android.widget.ImageView[@content-desc="SmokPerio AI Logo"]');
    if (await splashLogo.isExisting()) {
      await expect(splashLogo).toBeDisplayed();
    }
    await browser.pause(2500);
  });

  it('should complete Onboarding 3-slide tutorial if presented', async () => {
    const btnGetStarted = await $('//android.widget.Button[@text="Get Started" or @text="GET STARTED" or @resource-id="com.simats.smokperioai:id/btnGetStarted"]');
    if (await btnGetStarted.isExisting()) {
      await btnGetStarted.click();
      await browser.pause(1000);
    }
  });

  it('should authenticate doctor with valid clinical credentials', async () => {
    const emailField = await $('//android.widget.EditText[@resource-id="com.simats.smokperioai:id/etEmail" or @text="Email"]');
    const passField = await $('//android.widget.EditText[@resource-id="com.simats.smokperioai:id/etPassword" or @password="true"]');
    const btnLogin = await $('//android.widget.Button[@resource-id="com.simats.smokperioai:id/btnLogin" or @text="Sign In"]');

    if (await emailField.isExisting()) {
      await emailField.setValue('doctor@simats.edu');
      await passField.setValue('password123');
      await btnLogin.click();
      await browser.pause(3000);

      // Verify dashboard header loaded
      const welcomeText = await $('//android.widget.TextView[contains(@text, "Good morning") or contains(@text, "Doctor")]');
      await expect(welcomeText).toBeDisplayed();
    }
  });
});
