from datetime import date
from decimal import Decimal
from pydantic import BaseModel, ConfigDict, Field, field_validator


class ExpenseCreate(BaseModel):
    amount: Decimal = Field(gt=0, max_digits=12, decimal_places=2)
    category: str = Field(min_length=1, max_length=50)
    note: str | None = Field(default=None, max_length=500)
    date: date

    @field_validator("category")
    @classmethod
    def validate_category(cls, value: str) -> str:
        value = value.strip()
        if not value:
            raise ValueError("category must not be blank")
        return value


class ExpenseResponse(ExpenseCreate):
    id: int
    model_config = ConfigDict(from_attributes=True)


class CategorySummary(BaseModel):
    category: str
    total: Decimal


class SummaryResponse(BaseModel):
    total_spend: Decimal
    spend_by_category: list[CategorySummary]
    current_month_total: Decimal
    previous_month_total: Decimal
    month_over_month_change_percent: Decimal | None
