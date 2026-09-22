const API_URL = "http://127.0.0.1:8000";

export interface Expense {
  id: number;
  amount: number;
  category: string;
  note?: string;
  date: string;
}

export interface CreateExpense {
  amount: number;
  category: string;
  note?: string;
  date: string;
}

export interface CategorySummary {
  category: string;
  total: number;
}

export interface Summary {
  total_spend: number;
  spend_by_category: CategorySummary[];
  current_month_total: number;
  previous_month_total: number;
  month_over_month_change_percent: number | null;
}

export async function createExpense(
  expense: CreateExpense,
): Promise<Expense> {
  const response = await fetch(`${API_URL}/expenses`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(expense),
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.detail || "Failed to create expense");
  }

  return response.json();
}

export async function getExpenses(): Promise<Expense[]> {
  const response = await fetch(`${API_URL}/expenses`);

  if (!response.ok) {
    throw new Error("Failed to fetch expenses");
  }

  return response.json();
}

export async function getSummary(): Promise<Summary> {
  const response = await fetch(`${API_URL}/summary`);

  if (!response.ok) {
    throw new Error("Failed to fetch summary");
  }

  return response.json();
}

export async function updateExpense(
  id: number,
  expense: CreateExpense,
): Promise<Expense> {
  const response = await fetch(`${API_URL}/expenses/${id}`, {
    method: "PUT",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(expense),
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.detail || "Failed to update expense");
  }

  return response.json();
}

export async function deleteExpense(id: number): Promise<void> {
  const response = await fetch(`${API_URL}/expenses/${id}`, {
    method: "DELETE",
  });

  if (!response.ok) {
    let errorMsg = "Failed to delete expense";
    try {
        const error = await response.json();
        errorMsg = error.detail || errorMsg;
    } catch {}
    throw new Error(errorMsg);
  }
}