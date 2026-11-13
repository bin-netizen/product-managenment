
const API_URL = `${import.meta.env.VITE_API_URL ?? "http://localhost:3000"}/products`;

export interface StockChange {
  productId: string;
  colorId?: string;
  delta: number;
}

export interface StockAdjustment {
  operationId: string;
  action: 'deduct' | 'restore';
  changes: StockChange[];
}

export interface StockAdjustmentResult {
  success: boolean;
  duplicate: boolean;
}

export async function adjustStockApi(
  data: StockAdjustment,
): Promise<StockAdjustmentResult> {
  const token = localStorage.getItem('access_token');

  const response = await fetch(
    `${API_URL}/stock-adjustments`,
    {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        ...(token
          ? { Authorization: `Bearer ${token}` }
          : {}),
      },
      body: JSON.stringify(data),
    },
  );

  if (response.status === 401) {
    window.dispatchEvent(
      new Event('auth:unauthorized'),
    );
  }

  if (!response.ok) {
    const error = await response.json().catch(() => null);

    throw new Error(
      error?.message || 'Không thể cập nhật tồn kho',
    );
  }

  return response.json();
}
