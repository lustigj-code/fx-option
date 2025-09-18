# fx-option

Tamper-evident audit logging service for FX option platform.

## Development

Install dependencies using pip:

```bash
pip install -e .[test]
```

Run the test suite with coverage enforcement:

```bash
pytest
```

Use the `audit_verify` CLI to validate a SQLite audit log file:

```bash
audit_verify path/to/audit.db
```
