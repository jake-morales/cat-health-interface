# cat-health-interface
CHI = Cat Health Interface

A cat health tracking app for helping owners stay on top of their cat's care. Log your pet's habits, such as feedings, weight and fecal data.

## Architecture

```mermaid
flowchart LR
    mobile["<b>Frontend Mobile</b><br/>(React Native + Expo)"]
    web["<b>Frontend Web</b><br/>(React)"]
    backend["<b>Backend</b><br/>(Python/FastAPI)<br/>"]
    db["<b>Database</b><br/>(PostgreSQL)"]

    mobile --> backend
    web --> backend
    backend --> db

    classDef frontend fill:#E6F7FF,stroke:#1D4ED8,stroke-width:2px,color:#0F172A,rx:8,ry:8;
    classDef backend fill:#EEFCE8,stroke:#15803D,stroke-width:2px,color:#0F172A,rx:8,ry:8;
    classDef database fill:#FFF7E6,stroke:#C2410C,stroke-width:2px,color:#0F172A,rx:8,ry:8;

    class mobile,web frontend;
    class backend backend;
    class db database;

    linkStyle 0,1,2 stroke:#475569,stroke-width:2px;
```

The backend is deployed on AWS, and PostgreSQL is hosted on AWS RDS.

## Development

1. Start the Python backend locally. See `backend/README.md` for details.
2. Start either the web frontend `frontend-web/README.md` or mobile frontend `frontend-mobile/README.md` locally
