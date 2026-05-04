from typing import Final

import boto3
from botocore.exceptions import BotoCoreError, ClientError
from dotenv import load_dotenv

load_dotenv()

_SSM_PARAMETER_NAMES: Final[dict[str, str]] = {
    "DB_HOST": "/cat-health-interface/backend/development/db-host",
    "DB_NAME": "/cat-health-interface/backend/development/db-name",
    "DB_PASSWORD": "/cat-health-interface/backend/development/db-password",
    "DB_PORT": "/cat-health-interface/backend/development/db-port",
    "DB_USER": "/cat-health-interface/backend/development/db-user",
    "SECRET_KEY": "/cat-health-interface/backend/development/secret-key",
}


def _load_parameters_from_ssm() -> dict[str, str]:
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


_CONFIG = _load_parameters_from_ssm()

DB_USER: str = _CONFIG["DB_USER"]
DB_PASSWORD: str = _CONFIG["DB_PASSWORD"]
DB_HOST: str = _CONFIG["DB_HOST"]
DB_PORT: int = int(_CONFIG["DB_PORT"])
DB_NAME: str = _CONFIG["DB_NAME"]
SECRET_KEY: str = _CONFIG["SECRET_KEY"]

DATABASE_URL: str = f"postgresql://{DB_USER}:{DB_PASSWORD}@{DB_HOST}:{DB_PORT}/{DB_NAME}"
