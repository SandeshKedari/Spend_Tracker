from datetime import date
from sqlalchemy import create_engine
from sqlalchemy.orm import Session
from app.database import Base
from app.models import Expense
from app.services import calculate_summary


def test_summary_mom_calculation():
    engine = create_engine("sqlite:///:memory:")
    Base.metadata.create_all(engine)
    with Session(engine) as db:
        db.add_all([
            Expense(amount=100, category="Food", date=date(2026, 8, 10)),
            Expense(amount=150, category="Food", date=date(2026, 9, 10)),
        ])
        db.commit()
        summary = calculate_summary(db, date(2026, 9, 21))

    assert summary["current_month_total"] == 150
    assert summary["previous_month_total"] == 100
    assert summary["month_over_month_change_percent"] == 50


def test_summary_returns_none_when_previous_month_is_zero():
    engine = create_engine("sqlite:///:memory:")
    Base.metadata.create_all(engine)
    with Session(engine) as db:
        db.add(Expense(amount=150, category="Food", date=date(2026, 9, 10)))
        db.commit()
        summary = calculate_summary(db, date(2026, 9, 21))

    assert summary["month_over_month_change_percent"] is None
