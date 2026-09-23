from datetime import date
from decimal import Decimal
from pathlib import Path
from fastapi import Depends, FastAPI, HTTPException, Query, status
from fastapi.responses import FileResponse
from fastapi.staticfiles import StaticFiles
from sqlalchemy import select
from sqlalchemy.orm import Session
from .database import Base, engine, get_db
from .models import Expense
from .schemas import ExpenseCreate, ExpenseResponse, SummaryResponse
from .services import calculate_summary
from fastapi.middleware.cors import CORSMiddleware

app = FastAPI(title="Spend Tracker API", version="1.0.0")

app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "http://localhost:5173",
        "https://YOUR-VERCEL-URL.vercel.app",
    ],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

Base.metadata.create_all(bind=engine)


@app.post("/expenses", response_model=ExpenseResponse, status_code=status.HTTP_201_CREATED)
def create_expense(payload: ExpenseCreate, db: Session = Depends(get_db)):
    expense = Expense(
        amount=payload.amount,
        category=payload.category,
        note=payload.note,
        date=payload.date,
    )
    db.add(expense)
    db.commit()
    db.refresh(expense)
    return expense


@app.get("/expenses", response_model=list[ExpenseResponse])
def list_expenses(
    category: str | None = Query(default=None, min_length=1, max_length=50),
    start_date: date | None = None,
    end_date: date | None = None,
    db: Session = Depends(get_db),
):
    if start_date and end_date and start_date > end_date:
        raise HTTPException(status_code=400, detail="start_date must be before or equal to end_date")

    stmt = select(Expense).order_by(Expense.date.desc(), Expense.id.desc())
    if category:
        stmt = stmt.where(Expense.category == category.strip())
    if start_date:
        stmt = stmt.where(Expense.date >= start_date)
    if end_date:
        stmt = stmt.where(Expense.date <= end_date)
    return list(db.scalars(stmt).all())


@app.put("/expenses/{expense_id}", response_model=ExpenseResponse)
def update_expense(expense_id: int, payload: ExpenseCreate, db: Session = Depends(get_db)):
    expense = db.get(Expense, expense_id)
    if not expense:
        raise HTTPException(status_code=404, detail="Expense not found")
    
    expense.amount = payload.amount
    expense.category = payload.category
    expense.note = payload.note
    expense.date = payload.date
    
    db.commit()
    db.refresh(expense)
    return expense


@app.delete("/expenses/{expense_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_expense(expense_id: int, db: Session = Depends(get_db)):
    expense = db.get(Expense, expense_id)
    if not expense:
        raise HTTPException(status_code=404, detail="Expense not found")
    
    db.delete(expense)
    db.commit()
    return None


@app.get("/summary", response_model=SummaryResponse)
def summary(db: Session = Depends(get_db)):
    return calculate_summary(db)
