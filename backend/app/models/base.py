from sqlalchemy.orm import DeclarativeBase


# 모든 SQLAlchemy ORM 모델이 공유하는 베이스 클래스입니다.
# Alembic 마이그레이션이나 테이블 메타데이터 수집 시 이 Base를 기준으로 모델을 찾습니다.
class Base(DeclarativeBase):
    pass
