/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/. */

import { expect, test } from '../../lib/fixtures/standard';

test.describe('severity-1 #smoke', () => {
  test('signin to sync and disconnect', async ({
    target,
    syncBrowserPages: { connectAnotherDevice, page, settings, signin },
    testAccountTracker,
  }) => {
    const credentials = await testAccountTracker.signUp();

    const url = new URL(target.contentServerUrl);
    url.searchParams.set('context', 'fx_desktop_v3');
    url.searchParams.set('entrypoint', 'fxa:enter_email');
    url.searchParams.set('service', 'sync');
    url.searchParams.set('action', 'email');
    await page.goto(url.toString());
    await signin.fillOutEmailFirstForm(credentials.email);
    await signin.fillOutPasswordForm(credentials.password);

    await expect(connectAnotherDevice.fxaConnected).toBeVisible();

    await settings.disconnectSync(credentials);

    // confirm left settings and back at sign in
    await page.waitForURL(`${target.contentServerUrl}/signin`);
  });

  test('disconnect RP', async ({
    pages: { relier, settings, signin },
    testAccountTracker,
  }) => {
    const credentials = await testAccountTracker.signUp();

    await relier.goto();
    await relier.clickEmailFirst();
    await signin.fillOutEmailFirstForm(credentials.email);
    await signin.fillOutPasswordForm(credentials.password);

    expect(await relier.isLoggedIn()).toBe(true);

    // Login to settings with cached creds
    await settings.goto();
    let services = await settings.connectedServices.services();

    expect(services.length).toEqual(3);

    // Sign out of 123Done
    const rp = services.find((service) => service.name.includes('123'));
    await rp?.signout();

    await expect(settings.alertBar).toBeVisible();

    services = await settings.connectedServices.services();

    expect(services.length).toEqual(2);
  });
});
