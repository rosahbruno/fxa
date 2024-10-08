/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/. */

// AUTOGENERATED BY glean_parser v14.5.2. DO NOT EDIT. DO NOT COMMIT.

import EventMetricType from '@mozilla/glean/private/metrics/event';

/**
 * User viewed the "Connecting your mobile device" screen with instructions to
 * open on desktop after trying to access the pair flow on mobile
 *
 * Generated from `cad_redirect_mobile.view`.
 */
export const view = new EventMetricType(
  {
    category: 'cad_redirect_mobile',
    name: 'view',
    sendInPings: ['events'],
    lifetime: 'ping',
    disabled: false,
  },
  []
);
