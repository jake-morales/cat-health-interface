import uuid
from datetime import datetime

from fastapi import APIRouter, Depends, HTTPException
from pydantic import BaseModel
from sqlalchemy.orm import Session

from app.db.database import get_db
from app.models.cat import Cat
from app.models.poop import Poop
from app.routers.auth import get_current_user

router = APIRouter(prefix="/poops")


class PoopCreate(BaseModel):
    cat_id: uuid.UUID
    timestamp: datetime
    hardness: int


class PoopUpdate(BaseModel):
    timestamp: datetime | None = None
    hardness: int | None = None


class PoopRead(PoopCreate):
    id: uuid.UUID

    model_config = {"from_attributes": True}


@router.post("/", response_model=PoopRead, status_code=201)
def add_poop(
    body: PoopCreate,
    current_user: uuid.UUID = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    cat = db.query(Cat).filter(Cat.id == body.cat_id, Cat.owner_id == current_user).first()
    if cat is None:
        raise HTTPException(status_code=404, detail="Cat not found")
    poop = Poop(owner_id=current_user, **body.model_dump())
    db.add(poop)
    db.commit()
    db.refresh(poop)
    return poop


@router.get("/", response_model=list[PoopRead])
def list_poops(
    cat_id: uuid.UUID | None = None,
    current_user: uuid.UUID = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    query = db.query(Poop).filter(Poop.owner_id == current_user)
    if cat_id is not None:
        query = query.filter(Poop.cat_id == cat_id)
    return query.order_by(Poop.timestamp.desc()).all()


@router.patch("/{poop_id}", response_model=PoopRead)
def update_poop(
    poop_id: uuid.UUID,
    body: PoopUpdate,
    current_user: uuid.UUID = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    poop = db.query(Poop).filter(Poop.id == poop_id, Poop.owner_id == current_user).first()
    if poop is None:
        raise HTTPException(status_code=404, detail="Poop not found")
    for field, value in body.model_dump(exclude_unset=True).items():
        setattr(poop, field, value)
    db.commit()
    db.refresh(poop)
    return poop


@router.delete("/{poop_id}", status_code=204)
def delete_poop(
    poop_id: uuid.UUID,
    current_user: uuid.UUID = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    poop = db.query(Poop).filter(Poop.id == poop_id, Poop.owner_id == current_user).first()
    if poop is None:
        raise HTTPException(status_code=404, detail="Poop not found")
    db.delete(poop)
    db.commit()
