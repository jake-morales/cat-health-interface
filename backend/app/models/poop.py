import uuid

from sqlalchemy import Column, Integer, DateTime, ForeignKey
from sqlalchemy.dialects.postgresql import UUID

from app.db.database import Base


class Poop(Base):
    __tablename__ = "poops"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    cat_id = Column(UUID(as_uuid=True), ForeignKey("cats.id", ondelete="CASCADE"), nullable=False, index=True)
    owner_id = Column(UUID(as_uuid=True), nullable=False, index=True)
    timestamp = Column(DateTime(timezone=True), nullable=False)
    hardness = Column(Integer, nullable=False)
