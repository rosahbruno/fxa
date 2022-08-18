/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/. */
import { createHash } from 'crypto';

// Parse a comma-separated list with allowance for varied whitespace
export function commaSeparatedListToArray(s: string) {
  return (s || '')
    .trim()
    .split(',')
    .map((c) => c.trim())
    .filter((c) => !!c);
}

export function generateIdempotencyKey(params: string[]) {
  let sha = createHash('sha256');
  sha.update(params.join(''));
  return sha.digest('base64url');
}
