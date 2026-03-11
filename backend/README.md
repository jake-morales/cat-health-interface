# Backend

## Activate the virtual environment

```bash
source .venv/bin/activate
```

Or use `uv run` to run commands without manually activating:

```bash
uv run <command>
```

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
