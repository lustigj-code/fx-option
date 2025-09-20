from __future__ import annotations

from pathlib import Path

import pytest

from services.gateway.settings import GatewaySettings, load_settings


@pytest.fixture
def env(monkeypatch, tmp_path: Path) -> dict[str, str]:
    env = {
        "GATEWAY_INPUT_PATH": str(tmp_path / "in"),
        "GATEWAY_OUTPUT_PATH": str(tmp_path / "out"),
        "GATEWAY_CLIENT_ID": "client",
        "GATEWAY_CLIENT_SECRET": "secret",
        "GATEWAY_API_URL": "https://api.example.com",
    }
    for key, value in env.items():
        monkeypatch.setenv(key, value)
    return env


def test_load_settings_defaults_to_false_dry_run(env: dict[str, str]) -> None:
    settings = load_settings()
    assert settings.dry_run is False
    assert settings.input_path == Path(env["GATEWAY_INPUT_PATH"])
    assert settings.output_path == Path(env["GATEWAY_OUTPUT_PATH"])
    assert settings.credentials.client_id == env["GATEWAY_CLIENT_ID"]
    assert settings.credentials.client_secret == env["GATEWAY_CLIENT_SECRET"]
    assert settings.api_url == env["GATEWAY_API_URL"]


def test_from_env_supports_custom_prefix(env: dict[str, str]) -> None:
    prefix_env = {
        "TEST_INPUT_PATH": env["GATEWAY_INPUT_PATH"],
        "TEST_OUTPUT_PATH": env["GATEWAY_OUTPUT_PATH"],
        "TEST_CLIENT_ID": env["GATEWAY_CLIENT_ID"],
        "TEST_CLIENT_SECRET": env["GATEWAY_CLIENT_SECRET"],
        "TEST_API_URL": env["GATEWAY_API_URL"],
        "TEST_DRY_RUN": "yes",
    }
    settings = GatewaySettings.from_env(prefix_env, prefix="TEST_")
    assert settings.dry_run is True


def test_parse_bool_rejects_invalid_values(env: dict[str, str], monkeypatch: pytest.MonkeyPatch) -> None:
    monkeypatch.setenv("GATEWAY_DRY_RUN", "maybe")
    with pytest.raises(ValueError):
        load_settings()


def test_missing_variable_raises_runtime_error(env: dict[str, str], monkeypatch: pytest.MonkeyPatch) -> None:
    monkeypatch.delenv("GATEWAY_CLIENT_ID")
    with pytest.raises(RuntimeError):
        load_settings()
