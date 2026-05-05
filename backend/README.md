# Backend

## Run locally

1. **PostgreSQL** — Have a server reachable from your machine (for example the official Postgres image with default user/database `postgres`). Use `export` below if your connection details differ from the defaults.

2. **Install dependencies** — From this directory:

   ```bash
   uv sync
   ```

3. **Configuration** — Export variables in your shell so the process sees them (see [Configuration](#configuration)). For a typical local run with Parameter Store disabled, set at least `ENV=local`:

   ```bash
   export ENV=local
   ```

   Optionally override database or JWT settings (otherwise built-in defaults apply):

   ```bash
   export DB_USER=postgres
   export DB_PASSWORD=password
   export DB_HOST=localhost
   export DB_PORT=5432
   export DB_NAME=postgres
   export SECRET_KEY=dev-secret-change-in-production
   ```

4. **Start the API** — After exporting variables in the **same shell session**, run the server. With the virtual environment activated:

   ```bash
   fastapi dev main.py
   ```

   Or via uv without activating the venv:

   ```bash
   uv run fastapi dev main.py
   ```

   Minimal example (exports then command):

   ```bash
   export ENV=local
   fastapi dev main.py
   ```

The server listens at `http://127.0.0.1:8000`. Interactive docs: `http://127.0.0.1:8000/docs`.

## Activate the virtual environment

```bash
source .venv/bin/activate
```

Or use `uv run` so you do not need to activate:

```bash
uv run <command>
```

## Configuration

Configuration is read from the process **environment** only (no `.env` file).

- **Hosted (default)** — If `ENV` is not `local` and `USE_LOCAL_CONFIG` is not set to a truthy value (`true`, `1`, `yes`), the app loads **database** and **JWT secret** from **AWS Systems Manager Parameter Store** (paths such as `/cat-health-interface/backend/development/db-user`, `…/secret-key`, etc.). The runtime needs AWS credentials (for example an EC2 instance profile), permission to read those parameters (and decrypt SecureStrings / KMS if applicable), and a resolved **AWS region** (for example `AWS_REGION` or `AWS_DEFAULT_REGION`).

- **Local development** — **`export ENV=local`** or **`export USE_LOCAL_CONFIG=true`**. The app then uses built-in non-sensitive defaults (Postgres on `localhost`, etc.); any `DB_*` or `SECRET_KEY` you export overrides those defaults.

Do **not** set `ENV=local` on production or staging hosts that should use Parameter Store.

## Run in production

Start with gunicorn and uvicorn workers (already listed in project dependencies):

```bash
uv run gunicorn main:app -k uvicorn.workers.UvicornWorker \
  --workers 4 \
  --bind 0.0.0.0:8000
```

Worker count rule of thumb: `2 × CPU cores + 1`. Ensure AWS access and region are configured so Parameter Store can be read when not using local config.
