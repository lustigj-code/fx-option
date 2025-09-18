import ast
import json
import inspect
import sqlite3
from datetime import datetime, timezone
from pathlib import Path
from trace import Trace

import pytest

from audit_client import AuditClient
from services.audit.chain import AuditChain, ChainIntegrityError
from services.audit.cli import main as audit_verify_main
from services.audit.db import AuditLogRepository
import services.audit.chain as chain_module


def create_repository(db_path: str) -> AuditLogRepository:
    conn = sqlite3.connect(db_path)
    return AuditLogRepository(conn)


def test_repository_append_and_verify(tmp_path):
    db_path = tmp_path / "audit.db"
    repo = create_repository(db_path)
    first = repo.append("user", "create", {"amount": 10})
    assert first.prev_hash == AuditChain.GENESIS_HASH

    repo.append("user", "update", json.dumps({"status": "ok"}))
    repo.append("system", "heartbeat", None)

    chain = repo.all_records()
    chain.verify()

    computed_hashes = list(chain.append_hashes())
    stored_hashes = [record.this_hash for record in chain]
    assert computed_hashes == stored_hashes

    canonical = [record.canonical_representation() for record in chain]
    assert all(isinstance(value, str) for value in canonical)

    repo._conn.close()


def test_repository_rejects_naive_timestamp(tmp_path):
    db_path = tmp_path / "audit.db"
    repo = create_repository(db_path)
    naive = datetime(2024, 1, 1, 12, 0, 0)
    with pytest.raises(ValueError):
        repo.append("user", "create", {}, ts=naive)
    repo._conn.close()


def test_chain_detects_tampered_prev_hash(tmp_path):
    db_path = tmp_path / "audit.db"
    repo = create_repository(db_path)
    repo.append("user", "create", {"amount": 10})
    repo.append("user", "update", {"amount": 20})
    repo.append("user", "close", {"amount": 30})
    repo._conn.execute("UPDATE audit_log SET prev_hash = 'corrupt' WHERE id = 2")
    repo._conn.commit()

    with pytest.raises(ChainIntegrityError):
        repo.verify()
    repo._conn.close()


def test_chain_detects_tampered_hash(tmp_path):
    db_path = tmp_path / "audit.db"
    repo = create_repository(db_path)
    repo.append("user", "create", {"amount": 10})
    repo.append("user", "update", {"amount": 20})
    repo.append("user", "close", {"amount": 30})
    repo._conn.execute("UPDATE audit_log SET payload_json = '{\"amount\":999}' WHERE id = 3")
    repo._conn.commit()

    with pytest.raises(ChainIntegrityError):
        repo.verify()
    repo._conn.close()


def test_audit_client_log_and_iter(tmp_path):
    db_path = tmp_path / "audit.db"
    client = AuditClient(str(db_path))
    timestamp = datetime.now(timezone.utc)
    client.log("svc", "emit", {"value": 1}, ts=timestamp)
    client.log("svc", "emit", {"value": 2}, ts=timestamp)

    records = client.iter_records()
    assert len(records) == 2
    assert records[0].actor == "svc"


def test_cli_success(tmp_path, capsys):
    db_path = tmp_path / "audit.db"
    repo = create_repository(db_path)
    repo.append("user", "create", {"amount": 10})
    repo.append("user", "update", {"amount": 20})
    repo._conn.close()

    exit_code = audit_verify_main([str(db_path)])
    captured = capsys.readouterr()
    assert exit_code == 0
    assert "audit log ok" in captured.out


def test_cli_failure(tmp_path, capsys):
    db_path = tmp_path / "audit.db"
    repo = create_repository(db_path)
    repo.append("user", "create", {"amount": 10})
    repo.append("user", "update", {"amount": 20})
    repo._conn.execute("UPDATE audit_log SET action = 'tampered' WHERE id = 2")
    repo._conn.commit()
    repo._conn.close()

    exit_code = audit_verify_main([str(db_path)])
    captured = capsys.readouterr()
    assert exit_code == 1
    assert "verification failed" in captured.err


def test_compute_hash_handles_empty_payload():
    ts = datetime.now(timezone.utc).isoformat(timespec="microseconds")
    hashed_null = AuditChain.compute_hash(AuditChain.GENESIS_HASH, ts, "actor", "action", "null")
    hashed_empty = AuditChain.compute_hash(AuditChain.GENESIS_HASH, ts, "actor", "action", "")
    assert hashed_null == hashed_empty


def _function_lines(module) -> set[int]:
    source = Path(module.__file__).read_text()
    tree = ast.parse(source)
    lines: set[int] = set()

    def is_docstring(node: ast.stmt) -> bool:
        return isinstance(node, ast.Expr) and isinstance(getattr(node, "value", None), ast.Constant) and isinstance(
            node.value.value, str
        )

    source_lines = source.splitlines()

    def collect_body(body: list[ast.stmt]) -> None:
        for stmt in body:
            if is_docstring(stmt):
                continue
            if isinstance(stmt, (ast.FunctionDef, ast.AsyncFunctionDef, ast.ClassDef)):
                continue
            lineno = getattr(stmt, "lineno", None)
            if lineno is not None:
                lines.add(lineno)
            for child in ast.walk(stmt):
                if child is stmt or not isinstance(child, ast.stmt):
                    continue
                if isinstance(child, (ast.FunctionDef, ast.AsyncFunctionDef, ast.ClassDef)):
                    continue
                if is_docstring(child):
                    continue
                lineno = getattr(child, "lineno", None)
                if lineno is not None:
                    lines.add(lineno)

    class Visitor(ast.NodeVisitor):
        def visit_FunctionDef(self, node: ast.FunctionDef) -> None:
            if "# pragma: no cover" in source_lines[node.lineno - 1]:
                return
            collect_body(node.body)
            self.generic_visit(node)

        def visit_AsyncFunctionDef(self, node: ast.AsyncFunctionDef) -> None:  # pragma: no cover - no async in module
            collect_body(node.body)
            self.generic_visit(node)

        def visit_ClassDef(self, node: ast.ClassDef) -> None:
            for stmt in node.body:
                if isinstance(stmt, (ast.FunctionDef, ast.AsyncFunctionDef)):
                    self.visit(stmt)

    Visitor().visit(tree)
    return lines


def test_chain_module_has_full_coverage(tmp_path):
    db_path = tmp_path / "coverage.db"
    db_path_secondary = tmp_path / "coverage_tamper.db"

    def exercise_primary():
        repo = create_repository(db_path)
        aware = datetime.now(timezone.utc)
        repo.append("user", "create", {"amount": 1}, ts=aware)
        repo.append("user", "update", json.dumps({"status": "ok"}))
        repo.append("system", "heartbeat", None)
        chain = repo.all_records()
        list(chain.append_hashes())
        for record in chain:
            record.canonical_representation()
        repo.verify()
        chain_module._canonical_timestamp(aware)
        AuditChain.compute_hash(AuditChain.GENESIS_HASH, aware.isoformat(timespec="microseconds"), "user", "noop", "")
        try:
            chain_module._canonical_timestamp(datetime(2024, 1, 1, 0, 0, 0))
        except ValueError:
            pass
        with pytest.raises(ValueError):
            AuditChain._canonical_payload("not-json")
        repo._conn.execute("UPDATE audit_log SET prev_hash = 'bad' WHERE id = 2")
        repo._conn.commit()
        with pytest.raises(ChainIntegrityError):
            repo.verify()
        repo._conn.close()

    def exercise_secondary():
        repo = create_repository(db_path_secondary)
        repo.append("user", "create", {"amount": 1})
        repo.append("user", "update", {"amount": 2})
        repo.append("user", "close", {"amount": 3})
        repo._conn.execute("UPDATE audit_log SET payload_json = '{\"amount\":999}' WHERE id = 3")
        repo._conn.commit()
        tampered_chain = repo.all_records()
        with pytest.raises(ChainIntegrityError):
            tampered_chain.verify()
        repo._conn.close()

    tracer = Trace(count=True, trace=False)
    tracer.runfunc(exercise_primary)
    tracer.runfunc(exercise_secondary)

    results = tracer.results()
    module_path = Path(chain_module.__file__).resolve()
    executed = {lineno for (filename, lineno), _ in results.counts.items() if Path(filename).resolve() == module_path}
    required = _function_lines(chain_module)
    missing = sorted(required - executed)
    assert not missing, f"Missing coverage lines: {missing}"
