"""Hash-chain based tamper evident audit log primitives."""
from __future__ import annotations

from dataclasses import dataclass
from datetime import datetime
import hashlib
import json
from typing import Iterable, Iterator, List, Sequence

def _canonical_timestamp(value: str | datetime) -> str:
    """Return a canonical timestamp representation."""
    if isinstance(value, datetime):
        if value.tzinfo is None:
            raise ValueError("datetime value must be timezone aware")
        return value.astimezone().isoformat(timespec="microseconds")
    return value


@dataclass(frozen=True)
class AuditRecord:
    """Immutable representation of a single audit log entry."""

    id: int
    ts: str
    actor: str
    action: str
    payload_json: str
    prev_hash: str
    this_hash: str

    def canonical_representation(self) -> str:
        """Serialize the record fields that are protected by the hash."""
        payload = json.loads(self.payload_json) if self.payload_json else None
        canonical_payload = json.dumps(payload, sort_keys=True, separators=(",", ":")) if payload is not None else "null"
        structure = {
            "actor": self.actor,
            "action": self.action,
            "payload": canonical_payload,
            "prev_hash": self.prev_hash,
            "ts": self.ts,
        }
        return json.dumps(structure, sort_keys=True, separators=(",", ":"))


class ChainIntegrityError(RuntimeError):
    """Raised when the audit log chain verification fails."""


class AuditChain:
    """Utility for computing and verifying audit log hash chains."""

    GENESIS_HASH = "0" * 64

    def __init__(self, records: Sequence[AuditRecord]):
        self._records: List[AuditRecord] = list(records)

    @staticmethod
    def compute_hash(prev_hash: str, ts: str | datetime, actor: str, action: str, payload_json: str) -> str:
        """Compute the hash for the given audit entry."""
        canonical_payload = AuditChain._canonical_payload(payload_json)
        canonical_ts = _canonical_timestamp(ts)
        structure = {
            "actor": actor,
            "action": action,
            "payload": canonical_payload,
            "prev_hash": prev_hash,
            "ts": canonical_ts,
        }
        digest = hashlib.sha256(json.dumps(structure, sort_keys=True, separators=(",", ":")).encode("utf-8"))
        return digest.hexdigest()

    @staticmethod
    def _canonical_payload(payload_json: str) -> str:
        if not payload_json:
            return "null"
        try:
            parsed = json.loads(payload_json)
        except json.JSONDecodeError as exc:  # pragma: no cover - defensive, validated before insert
            raise ValueError("payload_json must be valid JSON") from exc
        return json.dumps(parsed, sort_keys=True, separators=(",", ":"))

    def append_hashes(self) -> Iterator[str]:
        """Yield the expected hash values for the chain."""
        prev_hash = self.GENESIS_HASH
        for record in self._records:
            expected_hash = self.compute_hash(prev_hash, record.ts, record.actor, record.action, record.payload_json)
            yield expected_hash
            prev_hash = expected_hash

    def verify(self) -> None:
        """Verify the audit chain integrity."""
        prev_hash = self.GENESIS_HASH
        for record in self._records:
            expected_hash = self.compute_hash(prev_hash, record.ts, record.actor, record.action, record.payload_json)
            if record.prev_hash != prev_hash:
                raise ChainIntegrityError(
                    f"record {record.id} expected prev_hash {prev_hash} but found {record.prev_hash}"
                )
            if record.this_hash != expected_hash:
                raise ChainIntegrityError(
                    f"record {record.id} expected this_hash {expected_hash} but found {record.this_hash}"
                )
            prev_hash = record.this_hash

    @classmethod
    def from_rows(cls, rows: Iterable[tuple]) -> "AuditChain":
        """Build a chain from raw database rows."""
        records = [
            AuditRecord(
                id=row[0],
                ts=row[1],
                actor=row[2],
                action=row[3],
                payload_json=row[4],
                prev_hash=row[5],
                this_hash=row[6],
            )
            for row in rows
        ]
        return cls(records)

    def __iter__(self) -> Iterator[AuditRecord]:
        return iter(self._records)

    def __len__(self) -> int:  # pragma: no cover - trivial accessor
        return len(self._records)
