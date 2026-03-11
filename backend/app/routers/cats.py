import uuid
from datetime import date

from fastapi import APIRouter, Depends
from pydantic import BaseModel
from sqlalchemy.orm import Session

from app.db.database import get_db
from app.models.cat import Cat
from app.routers.auth import get_current_user

router = APIRouter(prefix="/cats")


class CatCreate(BaseModel):
    name: str
    breed: str | None = None
    age: int | None = None
    birthday: date | None = None


class CatRead(CatCreate):
    id: uuid.UUID

    model_config = {"from_attributes": True}


@router.post("/", response_model=CatRead, status_code=201)
def add_cat(
    body: CatCreate,
    current_user: uuid.UUID = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    cat = Cat(owner_id=current_user, **body.model_dump())
    db.add(cat)
    db.commit()
    db.refresh(cat)
    return cat


@router.get("/", response_model=list[CatRead])
def list_cats(
    current_user: uuid.UUID = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    return db.query(Cat).filter(Cat.owner_id == current_user).all()
