/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/. */
import { NextRequest, NextResponse } from 'next/server';

export function middleware(request: NextRequest) {
  // Read env vars directly from process.env
  // As of 05-15-2024 its not possible to use app/config in middleware
  const accountsStaticCdn = process.env.CSP__ACCOUNTS_STATIC_CDN;

  /*
   * CSP Notes
   *  - Next.js next/image currently causes an inline style CSP error.
   *    There is a work around available, however at this time, we've opted
   *    to use 'unsafe-inline' to match what's in fxa-payments-server
   *    https://github.com/vercel/next.js/issues/45184
   */
  const nonce = Buffer.from(crypto.randomUUID()).toString('base64');
  const cspHeader = `
    default-src 'self';
    connect-src 'self' https://api.stripe.com;
    frame-src https://js.stripe.com https://hooks.stripe.com;
    script-src 'self' 'nonce-${nonce}' 'strict-dynamic' https: http: 'unsafe-inline' ${
    process.env.NODE_ENV === 'production' ? '' : `'unsafe-eval'`
  } https://js.stripe.com;
    script-src-elem 'self' 'nonce-${nonce}' 'strict-dynamic' https: http: 'unsafe-inline' ${
    process.env.NODE_ENV === 'production' ? '' : `'unsafe-eval'`
  } https://js.stripe.com;
    style-src 'self' 'unsafe-inline';
    img-src 'self' blob: data: ${accountsStaticCdn};
    font-src 'self';
    object-src 'none';
    base-uri 'self';
    form-action 'self';
    frame-ancestors 'none';
    upgrade-insecure-requests;
`;
  // Replace newline characters and spaces
  const contentSecurityPolicyHeaderValue = cspHeader
    .replace(/\s{2,}/g, ' ')
    .trim();

  const requestHeaders = new Headers(request.headers);
  requestHeaders.set(
    'Content-Security-Policy',
    contentSecurityPolicyHeaderValue
  );

  const response = NextResponse.next({
    request: {
      headers: requestHeaders,
    },
  });
  response.headers.set(
    'Content-Security-Policy',
    contentSecurityPolicyHeaderValue
  );

  return response;
}

export const config = {
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - api (API routes)
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     */
    {
      source: '/((?!api|_next/static|_next/image|favicon.ico).*)',
      missing: [
        { type: 'header', key: 'next-router-prefetch' },
        { type: 'header', key: 'purpose', value: 'prefetch' },
      ],
    },
  ],
};
