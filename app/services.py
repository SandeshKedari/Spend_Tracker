from calendar import monthrange
from datetime import date
from decimal import Decimal, ROUND_HALF_UP
from sqlalchemy import func, select
from sqlalchemy.orm import Session
from .models import Expense

CENT = Decimal("0.01")


def money(value: Decimal) -> Decimal:
    return Decimal(value).quantize(CENT, rounding=ROUND_HALF_UP)


def month_bounds(year: int, month: int) -> tuple[date, date]:
    start = date(year, month, 1)
    end = date(year, month, monthrange(year, month)[1])
    return start, end


def previous_month(year: int, month: int) -> tuple[int, int]:
    return (year - 1, 12) if month == 1 else (year, month - 1)


def calculate_summary(db: Session, today: date | None = None) -> dict:
    today = today or date.today()
    current_start, current_end = month_bounds(today.year, today.month)
    prev_year, prev_month = previous_month(today.year, today.month)
    previous_start, previous_end = month_bounds(prev_year, prev_month)

    total = db.scalar(select(func.coalesce(func.sum(Expense.amount), 0))) or Decimal("0")
    rows = db.execute(
        select(Expense.category, func.sum(Expense.amount))
        .group_by(Expense.category)
        .order_by(Expense.category)
    ).all()
    by_category = [{"category": category, "total": money(total)} for category, total in rows]

    current_total = db.scalar(
        select(func.coalesce(func.sum(Expense.amount), 0)).where(
            Expense.date.between(current_start, current_end)
        )
    ) or Decimal("0")
    previous_total = db.scalar(
        select(func.coalesce(func.sum(Expense.amount), 0)).where(
            Expense.date.between(previous_start, previous_end)
        )
    ) or Decimal("0")

    if previous_total == 0:
        change = None if current_total == 0 else None
    else:
        change = money(((current_total - previous_total) / previous_total) * 100)

    return {
        "total_spend": money(total),
        "spend_by_category": by_category,
        "current_month_total": money(current_total),
        "previous_month_total": money(previous_total),
        "month_over_month_change_percent": change,
    }
