/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/. */

// AUTOGENERATED BY glean_parser v14.5.1. DO NOT EDIT. DO NOT COMMIT.

import EventMetricType from '@mozilla/glean/private/metrics/event';

/**
 * User clicks on the Apple third party link from email first page.
 *
 * Generated from `email.first_apple_oauth_start`.
 */
export const firstAppleOauthStart = new EventMetricType(
  {
    category: 'email',
    name: 'first_apple_oauth_start',
    sendInPings: ['events'],
    lifetime: 'ping',
    disabled: false,
  },
  []
);

/**
 * User clicks on the Google third party link from email first page.
 *
 * Generated from `email.first_google_oauth_start`.
 */
export const firstGoogleOauthStart = new EventMetricType(
  {
    category: 'email',
    name: 'first_google_oauth_start',
    sendInPings: ['events'],
    lifetime: 'ping',
    disabled: false,
  },
  []
);

/**
 * Email First Page View
 * A view of the page that prompts the user to enter their email address. From
 * there the user either gets directed to the registration or login flow depending
 * on if their email is registered to an account.'
 *
 * Generated from `email.first_view`.
 */
export const firstView = new EventMetricType(
  {
    category: 'email',
    name: 'first_view',
    sendInPings: ['events'],
    lifetime: 'ping',
    disabled: false,
  },
  []
);
