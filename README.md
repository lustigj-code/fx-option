# fx-option

This monorepo hosts the FX Option experience, including the public client portal, the internal
admin console, and the gateway that mediates traffic between them and downstream services.

## Prerequisites

- [Node.js](https://nodejs.org/) 18+
- [pnpm](https://pnpm.io/) 8+

## One-click local stack

Use the helper script to spin up the entire stack after installing dependencies:

```bash
pnpm install
./scripts/run-dev.sh
```

The script launches the gateway, portal, and admin applications concurrently using `pnpm dlx concurrently`.
Logs are color coded so you can quickly spot which service produced each line. Stop everything with `Ctrl+C`.

## Manual commands

Each application can still be started individually if you prefer:

```bash
pnpm --filter gateway dev
pnpm --filter portal-web dev
pnpm --filter admin dev
```

## Environment variables

| Variable | Default | Description |
| --- | --- | --- |
| `GATEWAY_PORT` | `4000` | Port for the local gateway HTTP server. |
| `GATEWAY_LOG_LEVEL` | `info` | Logging verbosity for the gateway. |
| `PORTAL_API_URL` | `http://localhost:4000` | URL used by the customer-facing portal when calling the gateway. |
| `ADMIN_API_URL` | `http://localhost:4000` | URL used by the internal admin console when calling the gateway. |
| `AUTH_ISSUER_URL` | _(required)_ | OIDC issuer used by the portal and admin applications. |
| `AUTH_CLIENT_ID` | _(required)_ | OAuth client ID shared across SPA front-ends. |
| `AUTH_CLIENT_SECRET` | _(optional)_ | Backend credential for privileged automation (only needed server-side). |
| `SENTRY_DSN` | _(optional)_ | Enables error reporting when defined. |

Store secrets such as `AUTH_CLIENT_SECRET` in a `.env.local` file instead of committing them.

## API assets

Generated assets documenting the gateway endpoints live in [`docs/api`](docs/api):

- [`gateway-openapi.yaml`](docs/api/gateway-openapi.yaml) – OpenAPI 3.1 description for use with Swagger UI or Stoplight.
- [`gateway.postman_collection.json`](docs/api/gateway.postman_collection.json) – Postman collection for quick manual testing.

Import either artifact into your favorite tool to explore the available endpoints.

## Linting

Run the portal and admin lint checks before opening a pull request:

```bash
pnpm --filter portal-web lint
pnpm --filter admin lint
```

These commands are also executed automatically in CI. If the filters do not match any packages,
verify that you ran the commands from the monorepo root.
