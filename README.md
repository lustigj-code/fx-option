# fx-option

## Gateway service

The Python gateway service ships with an environment-driven configuration
system, a CLI entrypoint and Docker support so it can be deployed in container
platforms.

### Configuration

The service reads its configuration from the process environment.  The required
variables are:

| Variable | Description |
| --- | --- |
| `GATEWAY_INPUT_PATH` | Absolute or relative path to the directory where the service reads input payloads. |
| `GATEWAY_OUTPUT_PATH` | Directory where processed output should be written. |
| `GATEWAY_CLIENT_ID` | Client identifier used when authenticating with the upstream API. |
| `GATEWAY_CLIENT_SECRET` | Secret used together with the client identifier. |
| `GATEWAY_API_URL` | Base URL for the upstream API. |
| `GATEWAY_DRY_RUN` | Optional boolean flag (`true`/`false`) controlling dry-run mode. |

Example configuration snippet:

```bash
export GATEWAY_INPUT_PATH=/srv/gateway/incoming
export GATEWAY_OUTPUT_PATH=/srv/gateway/outgoing
export GATEWAY_CLIENT_ID=fx-gateway
export GATEWAY_CLIENT_SECRET=super-secret
export GATEWAY_API_URL=https://api.example.com
export GATEWAY_DRY_RUN=false
```

### Local execution

Install the Python dependencies (only `pytest` is needed for tests) and run the
service using the module CLI:

```bash
python -m services.gateway --log-level INFO
```

Use `--dry-run` or `--execute` to force dry-run mode on or off respectively.

### Container build & deployment

A Dockerfile is provided under `services/gateway/Dockerfile`.  Build and run the
container as follows:

```bash
docker build -t fx-gateway services/gateway

docker run --rm \
  -e GATEWAY_INPUT_PATH=/data/in \
  -e GATEWAY_OUTPUT_PATH=/data/out \
  -e GATEWAY_CLIENT_ID=fx-gateway \
  -e GATEWAY_CLIENT_SECRET=super-secret \
  -e GATEWAY_API_URL=https://api.example.com \
  -e GATEWAY_DRY_RUN=true \
  fx-gateway
```

The container entrypoint invokes `python -m services.gateway`.  Replace the
environment variables with production-ready values before deployment and request
@codex to review and address any issues raised during rollout.
