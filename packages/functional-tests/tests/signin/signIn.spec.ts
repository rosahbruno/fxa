/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/. */

import { test, expect } from '../../lib/fixtures/standard';

test.describe('signin here', () => {
  test('signin verified with incorrect password, click `forgot password?`', async ({
    target,
    page,
    credentials,
    pages: { login, resetPassword },
  }) => {
    await page.goto(target.contentServerUrl);
    await login.setEmail(credentials.email);
    await login.clickSubmit();
    await login.setPassword('incorrect password');
    await login.clickSubmit();

    // Verify the error
    expect(await login.getTooltipError()).toContain('Incorrect password');

    //Click forgot password link
    await login.clickForgotPassword();

    //Verify reset password header
    expect(await resetPassword.resetPasswordHeader()).toBe(true);
  });

  test('signin with email with leading/trailing whitespace on the email', async ({
    target,
    page,
    credentials,
    pages: { login },
  }) => {
    const emailWithleadingSpace = '   ' + credentials.email;
    await page.goto(target.contentServerUrl);
    await login.fillOutEmailFirstSignIn(
      emailWithleadingSpace,
      credentials.password
    );

    // Verify the header after login
    expect(await login.loginHeader()).toBe(true);

    // Need to clear the cache to get the new email
    await login.clearCache();

    await page.goto(target.contentServerUrl);
    const emailWithTrailingSpace = credentials.email + '  ';
    await login.fillOutEmailFirstSignIn(
      emailWithTrailingSpace,
      credentials.password
    );

    // Verify the header after login
    expect(await login.loginHeader()).toBe(true);
  });

  test('signin verified with password that incorrectly has leading whitespace', async ({
    target,
    page,
    credentials,
    pages: { login },
  }) => {
    await page.goto(target.contentServerUrl);
    await login.setEmail(credentials.email);
    await login.clickSubmit();
    await login.setPassword(' ' + credentials.password);
    await login.clickSubmit();

    // Verify the error
    expect(await login.getTooltipError()).toContain('Incorrect password');
  });

  test('login as an existing user', async ({
    target,
    page,
    credentials,
    pages: { login, settings },
  }) => {
    await page.goto(target.contentServerUrl);
    await login.fillOutEmailFirstSignIn(
      credentials.email,
      credentials.password
    );

    // Verify the header after login
    expect(await login.loginHeader()).toBe(true);

    // Sign out
    await settings.signOut();

    // Login as existing user
    await login.setEmail(credentials.email);
    await login.clickSubmit();
    await login.setPassword(credentials.password);
    await login.clickSubmit();

    // Verify the header after login
    expect(await login.loginHeader()).toBe(true);
  });
});
