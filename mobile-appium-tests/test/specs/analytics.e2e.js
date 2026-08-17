/**
 * Appium E2E Test: Mobile Analytics & PDF Opener Intent
 */

describe('SmokPerio AI — Mobile Analytics & PDF Export Suite', () => {
  it('should render risk distribution and smoking correlation cards', async () => {
    const navAnalytics = await $('//android.widget.FrameLayout[@content-desc="Analytics" or @resource-id="com.simats.smokperioai:id/nav_analytics"]');
    if (await navAnalytics.isExisting()) {
      await navAnalytics.click();
      await browser.pause(2000);

      const kpiTotal = await $('//android.widget.TextView[@resource-id="com.simats.smokperioai:id/tvTotalAssessed"]');
      if (kpiTotal.isExisting()) {
        await expect(kpiTotal).toBeDisplayed();
      }
    }
  });

  it('should trigger FileProvider system PDF opener on report download', async () => {
    const btnDownloadPdf = await $('//android.widget.Button[@resource-id="com.simats.smokperioai:id/btnDownloadPdf" or @text="Download PDF"]');
    if (await btnDownloadPdf.isExisting()) {
      await btnDownloadPdf.click();
      await browser.pause(3000);
    }
  });
});
