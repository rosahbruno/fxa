/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/. */

// AUTOGENERATED BY glean_parser v14.5.2. DO NOT EDIT. DO NOT COMMIT.

import LabeledMetricType from '@mozilla/glean/private/metrics/labeled';
import BooleanMetricType from '@mozilla/glean/private/metrics/boolean';

/**
 * The set of marketing options at the time of an account sign up (standard flow).
 * For example, if the user only opted into getting 'news' then only news would be
 * marked as true
 *
 * Generated from `standard.marketing`.
 */
export const marketing = new LabeledMetricType(
  {
    category: 'standard',
    name: 'marketing',
    sendInPings: ['accounts-events', 'events'],
    lifetime: 'application',
    disabled: false,
  },
  BooleanMetricType,
  ['news', 'take_action', 'testing']
);
