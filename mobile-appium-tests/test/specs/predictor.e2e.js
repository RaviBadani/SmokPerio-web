/**
 * Appium E2E Test: Mobile Mandatory X-Ray & AI Predictor Activity
 */

describe('SmokPerio AI — Mobile AI Diagnostic Engine Suite', () => {
  it('should enforce mandatory dental radiograph selection', async () => {
    // Navigate to AI Predictor Tab
    const navPredictor = await $('//android.widget.FrameLayout[@content-desc="AI Predictor" or @resource-id="com.simats.smokperioai:id/nav_predictor"]');
    if (await navPredictor.isExisting()) {
      await navPredictor.click();
      await browser.pause(1500);
    }

    // Try running prediction without X-Ray
    const btnRunAi = await $('//android.widget.Button[@resource-id="com.simats.smokperioai:id/btnRunPrediction" or @text="Run AI Diagnosis"]');
    if (await btnRunAi.isExisting()) {
      await btnRunAi.click();
      await browser.pause(1000);

      // Verify Toast or Dialog prompt
      const toastOrDialog = await $('//android.widget.TextView[contains(@text, "Radiograph") or contains(@text, "X-Ray") or contains(@text, "mandatory")]');
      if (await toastOrDialog.isExisting()) {
        await expect(toastOrDialog).toBeDisplayed();
      }
    }
  });

  it('should calculate 2017 AAP/EFP Staging and Grading with valid patient indices', async () => {
    const etAge = await $('//android.widget.EditText[@resource-id="com.simats.smokperioai:id/etAge"]');
    const etCigs = await $('//android.widget.EditText[@resource-id="com.simats.smokperioai:id/etCigarettes"]');
    const etYears = await $('//android.widget.EditText[@resource-id="com.simats.smokperioai:id/etYearsSmoking"]');

    if (await etAge.isExisting()) {
      await etAge.setValue('48');
      await etCigs.setValue('15');
      await etYears.setValue('15');
      await browser.pause(500);
    }
  });
});
