import uuid

from sqlalchemy import Column, Integer, String, Date
from sqlalchemy.dialects.postgresql import UUID

from app.db.database import Base


class Cat(Base):
    __tablename__ = "cats"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    owner_id = Column(UUID(as_uuid=True), nullable=False, index=True)
    name = Column(String, nullable=False)
    breed = Column(String, nullable=True)
    age = Column(Integer, nullable=True)
    birthday = Column(Date, nullable=True)
