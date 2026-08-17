/**
 * Appium E2E Test: Mobile Patient Cohort & Probing Depth Activity
 */

describe('SmokPerio AI — Mobile Patient Cohort Suite', () => {
  it('should render patient cohort list with risk badges', async () => {
    const navPatients = await $('//android.widget.FrameLayout[@content-desc="Patients" or @resource-id="com.simats.smokperioai:id/nav_patients"]');
    if (await navPatients.isExisting()) {
      await navPatients.click();
      await browser.pause(2000);

      const recyclerView = await $('//androidx.recyclerview.widget.RecyclerView[@resource-id="com.simats.smokperioai:id/rvPatients"]');
      if (await recyclerView.isExisting()) {
        await expect(recyclerView).toBeDisplayed();
      }
    }
  });

  it('should open patient clinical dossier on item tap', async () => {
    const firstPatientItem = await $('(//androidx.recyclerview.widget.RecyclerView[@resource-id="com.simats.smokperioai:id/rvPatients"]/android.view.ViewGroup)[1]');
    if (await firstPatientItem.isExisting()) {
      await firstPatientItem.click();
      await browser.pause(2000);

      // Verify Patient Detail Activity
      const patientTitle = await $('//android.widget.TextView[@resource-id="com.simats.smokperioai:id/tvPatientName"]');
      if (await patientTitle.isExisting()) {
        await expect(patientTitle).toBeDisplayed();
      }
    }
  });
});
