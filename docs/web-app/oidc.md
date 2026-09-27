# Password-free sign-in with OIDC and tsidp

The app supports OpenID Connect Authorization Code flow with PKCE. Set `AUTH_MODE=oidc` to replace the shared editor password entirely. Public reading remains public. Only the explicitly allowed identities can edit; each permitted identity has full editor access. There is no automatic enrollment or role management.

## tsidp setup

Use the current [standalone Tailscale tsidp](https://github.com/tailscale/tsidp), rather than the older experimental `tailscale/cmd/tsidp` examples that use `unused` credentials.

1. Run tsidp on your tailnet with persistent state, following its README. Grant the intended administrator access to its admin UI. The browser and the Stamp Book container must both resolve and reach the tsidp HTTPS hostname. Container access to your host's tailnet DNS and routing is deployment-dependent; a separate tsidp service alone does not put the application container on the tailnet.
2. Register an OIDC client for The Stamp Book through tsidp's client-management UI. Register exactly `https://YOUR-STAMP-BOOK-HOST/auth/oidc/callback` as the redirect URI. Use Authorization Code flow, scopes `openid profile email`, and `client_secret_post` client authentication. Save the issued client ID and secret. This app does not dynamically register clients.
3. Use tsidp's HTTPS base issuer (the `issuer` value in `/.well-known/openid-configuration`) as `OIDC_ISSUER`. Do not append the discovery path to that setting.
4. Set `OIDC_ALLOWED_SUBJECTS` to the exact Tailscale user ID strings allowed to edit, separated by commas. In current tsidp, the `sub` claim is the Tailscale user ID. You can inspect your own device's user ID with `tailscale status --json` → `Self.UserID` and match it to the `User` map. For unusual/federated configurations, use the actual `sub` emitted by your configured issuer. The allowlist is scoped to that one trusted issuer.
5. Set `OIDC_PROVIDER=tsidp` for the “Sign in with Tailscale” button. This uses the same verified OIDC protocol as other providers; it does not trust Tailscale headers or a browser-supplied email address. tsidp's email-shaped claims may be synthesized and do not include `email_verified`, so authorization uses the stable subject instead.

The application never receives your Tailscale login password. The OIDC client secret identifies this application to tsidp; it is not a user password.

## Container deployment

Use the standalone `compose.oidc.yaml` file instead of `compose.yaml`:

```sh
cp .env.oidc.example .env
# Edit .env with your issuer, client ID, subject allowlist and public origin.
# Put the client secret in the separate file named by OIDC_CLIENT_SECRET_FILE.
docker compose pull
# First deployment only; skip this when reusing an existing database:
docker compose run --rm stamp-book npm run web:import -- --vault vault --data /data
docker compose up -d
```

`.env.oidc.example` sets `COMPOSE_FILE=compose.oidc.yaml`. Alternatively, pass `-f compose.oidc.yaml` to each command. Do not merge the two standalone files: that would retain the old password-secret requirement. Retain the same Compose project name/directory when switching an existing deployment, so it continues using the same `stamp-book-data` volume. No data migration is needed to change authentication.

The secret file must be readable by container UID 1000. Never commit it. A public OIDC client is also supported: set `OIDC_CLIENT_AUTH_METHOD=none` and point the Compose secret at an empty file. Confidential clients may use `client_secret_post` (default) or `client_secret_basic` to match the provider registration.

Set `ORIGIN` to the exact externally visible HTTPS origin, including any nonstandard port, with no path or trailing slash. The app uses that fixed origin for the callback, secure cookies and write-request origin checks. Configure your HTTPS reverse proxy accordingly. HTTP is accepted only for loopback development. The issuer must also use HTTPS outside loopback.

For a local build, use `docker compose -f compose.oidc.yaml -f compose.build.yaml build` and the same two files with `up -d`.

## Other OIDC providers and local configuration

Set `OIDC_PROVIDER=oidc` for the generic login button. Configure a confidential or public client and allowlist its exact `sub` values; do not put email addresses in the subject allowlist unless your provider deliberately uses those as its subject values.

The same environment variables work with `npm start`. `OIDC_CLIENT_SECRET` is supported for environments that inject secrets directly; `OIDC_CLIENT_SECRET_FILE` takes precedence. `AUTH_MODE=oidc` never reads or requires `APP_PASSWORD` or `APP_PASSWORD_FILE`, and disables `/api/login`. If `AUTH_MODE` is omitted, a configured `OIDC_ISSUER` selects OIDC; otherwise the existing password mode is retained for compatibility. Invalid OIDC configuration fails closed; there is no password fallback after an OIDC failure.

## Sessions and troubleshooting

Sign-in verifies issuer, audience, expiry, signature, nonce, state, PKCE and the browser-bound callback transaction. Transactions expire after ten minutes and can be consumed once. Editing sessions last up to twelve hours and are cleared on restart. Writes retain origin and CSRF checks. Auth routes are never service-worker cached. Saved revisions record the authenticated issuer and subject.

“Sign out” ends this app's session, not your tailnet or identity-provider session; signing in again may be immediate. Identity-provider logout and back-channel revocation are not implemented. Removing a subject from configuration and restarting the app revokes its existing app sessions.

If login fails, check the exact redirect URI, client authentication method, issuer discovery, container connectivity and subject allowlist. Do not disable TLS verification or paste tokens into logs. If the account is not allowed, the editor shows an access-denied message. You must configure your own provider to test a real tsidp login; automated tests use a local provider with signed tokens and enforce the same protocol checks.
