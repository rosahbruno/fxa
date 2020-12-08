/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/. */
import { Injectable, UnauthorizedException } from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';
import { deriveHawkCredentials } from 'fxa-auth-client';
import { sessionTokenData } from 'fxa-shared/db/models/auth';
import { SessionToken } from 'fxa-shared/db/models/auth/session-token';
import { ExtendedError } from 'fxa-shared/nestjs/error';
import { Strategy } from 'passport-http-bearer';

export interface SessionTokenResult {
  token: string;
  session: SessionToken;
}

@Injectable()
export class SessionTokenStrategy extends PassportStrategy(Strategy) {
  async validate(token: string): Promise<SessionTokenResult> {
    try {
      const { id } = await deriveHawkCredentials(token, 'sessionToken');
      const session = await sessionTokenData(id);
      if (!session || !session.tokenVerified) {
        throw new UnauthorizedException('Invalid/unverified token');
      }
      return { token, session };
    } catch (err) {
      if (err.status) {
        // Re-throw NestJS errors that include a status.
        throw err;
      }
      throw ExtendedError.withCause(
        'Unexpected error during authentication.',
        err
      );
    }
  }
}
