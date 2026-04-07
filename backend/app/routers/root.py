from fastapi import APIRouter, Depends

from app.routers.auth import get_current_user

router = APIRouter()


@router.get("/health")
def health_check():
    return {"status": "ok"}


@router.get("/")
def read_root(_current_user: str = Depends(get_current_user)):
    return {"message": "Hello, World!"}
