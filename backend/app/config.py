"""App config: loads from AWS SSM Parameter Store by default.

Set ENV=local (or USE_LOCAL_CONFIG=true) to use non-sensitive Postgres defaults; optional
DB_* / SECRET_KEY env vars override those defaults for local development.
Hosted environments should not set ENV=local.
"""

import os
from typing import Final

_SSM_PARAMETER_NAMES: Final[dict[str, str]] = {
    "DB_HOST": "/cat-health-interface/backend/development/db-host",
    "DB_NAME": "/cat-health-interface/backend/development/db-name",
    "DB_PASSWORD": "/cat-health-interface/backend/development/db-password",
    "DB_PORT": "/cat-health-interface/backend/development/db-port",
    "DB_USER": "/cat-health-interface/backend/development/db-user",
    "SECRET_KEY": "/cat-health-interface/backend/development/secret-key",
}


def _truthy_env(name: str) -> bool:
    return os.environ.get(name, "").strip().lower() in ("1", "true", "yes")


def _use_local_defaults() -> bool:
    if _truthy_env("USE_LOCAL_CONFIG"):
        return True
    return os.environ.get("ENV", "").strip().lower() == "local"


def _load_local_defaults() -> dict[str, str]:
    """Non-sensitive defaults for local Postgres (e.g. docker-compose). Override via environment variables."""
    return {
        "DB_USER": os.environ.get("DB_USER", "postgres"),
        "DB_PASSWORD": os.environ.get("DB_PASSWORD", "postgres"),
        "DB_HOST": os.environ.get("DB_HOST", "localhost"),
        "DB_PORT": os.environ.get("DB_PORT", "5432"),
        "DB_NAME": os.environ.get("DB_NAME", "postgres"),
        "SECRET_KEY": os.environ.get("SECRET_KEY", "dev-secret-change-in-production"),
    }


def _load_parameters_from_ssm() -> dict[str, str]:
    import boto3
    from botocore.exceptions import BotoCoreError, ClientError

    ssm_client = boto3.client("ssm")
    parameter_names = list(_SSM_PARAMETER_NAMES.values())
    try:
        response = ssm_client.get_parameters(Names=parameter_names, WithDecryption=True)
    except (BotoCoreError, ClientError) as exc:
        raise RuntimeError("Failed to load config from AWS SSM Parameter Store") from exc

    invalid_parameters = response.get("InvalidParameters", [])
    if invalid_parameters:
        invalid_list = ", ".join(sorted(invalid_parameters))
        raise RuntimeError(f"Missing AWS SSM parameters: {invalid_list}")

    values_by_name = {param["Name"]: param["Value"] for param in response["Parameters"]}
    return {
        key: values_by_name[parameter_name]
        for key, parameter_name in _SSM_PARAMETER_NAMES.items()
    }


def _load_config() -> dict[str, str]:
    if _use_local_defaults():
        return _load_local_defaults()
    return _load_parameters_from_ssm()


_CONFIG = _load_config()

DB_USER: str = _CONFIG["DB_USER"]
DB_PASSWORD: str = _CONFIG["DB_PASSWORD"]
DB_HOST: str = _CONFIG["DB_HOST"]
DB_PORT: int = int(_CONFIG["DB_PORT"])
DB_NAME: str = _CONFIG["DB_NAME"]
SECRET_KEY: str = _CONFIG["SECRET_KEY"]

DATABASE_URL: str = f"postgresql://{DB_USER}:{DB_PASSWORD}@{DB_HOST}:{DB_PORT}/{DB_NAME}"
