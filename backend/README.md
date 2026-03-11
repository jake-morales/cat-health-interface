# Backend

## Activate the virtual environment

```bash
source .venv/bin/activate
```

Or use `uv run` to run commands without manually activating:

```bash
uv run <command>
```

## Environment variables

The app requires the following environment variables to be set:

```
DB_USER
DB_PASSWORD
DB_HOST
DB_PORT
DB_NAME
SECRET_KEY
```

Copy `.env.example` to `.env` and fill in the values. The app loads it automatically on startup.

## Run the FastAPI server

With the virtual environment activated:

```bash
fastapi dev main.py
```

Or via uv:

```bash
uv run fastapi dev main.py
```

The server will start at `http://127.0.0.1:8000`. Interactive API docs are available at `http://127.0.0.1:8000/docs`.

## Run in production

Install `gunicorn` if not already present:

```bash
uv add gunicorn
```

Start the server with gunicorn managing uvicorn workers:

```bash
gunicorn main:app -k uvicorn.workers.UvicornWorker \
  --workers 4 \
  --bind 0.0.0.0:8000
```

Worker count rule of thumb: `2 × CPU cores + 1`. Ensure all required environment variables are set before starting (see above).
