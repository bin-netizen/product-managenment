
import { useMemo, useRef, useState, type FormEvent } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";

import ProductThumb from "../components/ProductThumb";
import { useOrders } from "../context/OrderContext";
import { useProducts } from "../context/ProductContext";
import type { PaymentMethod } from "../types/order";
import {
  formatInputPrice,
  formatPrice,
  parsePrice,
} from "../utils/format";
import { buildCustomers, canonicalPhone } from "../utils/customers";
import {
  calcMonthlyPayment,
  INSTALLMENT_MONTH_OPTIONS,
  PAYMENT_LABEL,
} from "../utils/orders";
import { availableStock, stockPoolKey } from "../utils/stock";

interface CartLine {
  key: string;
  productId: string;
  colorId?: string;
  quantity: number;
}

interface LocationState {
  productId?: string;
  colorId?: string;
}

const PHONE_PATTERN = /^(0|\+84)\d{9}$/;

function lineKey(productId: string, colorId?: string) {
  return `${productId}:${colorId ?? ""}`;
}

export default function CreateOrder() {
  const navigate = useNavigate();
  const location = useLocation();

  const { products } = useProducts();
  const { orders, createOrder } = useOrders();

  // Chặn bấm tạo đơn nhiều lần liên tiếp.
  const submittedRef = useRef(false);

  const [cart, setCart] = useState<CartLine[]>(() => {
    const state = location.state as LocationState | null;

    const product = state?.productId
      ? products.find((item) => item.id === state.productId)
      : undefined;

    if (!product) {
      return [];
    }

    const colorId =
      product.colors?.find((color) => color.id === state?.colorId)?.id ??
      product.colors?.[0]?.id;

    if (availableStock(product, colorId) < 1) {
      return [];
    }

    return [
      {
        key: lineKey(product.id, colorId),
        productId: product.id,
        colorId,
        quantity: 1,
      },
    ];
  });

  const [search, setSearch] = useState("");
  const [categoryFilter, setCategoryFilter] = useState("");
  const [colorPick, setColorPick] = useState<Record<string, string>>({});

  const [customerName, setCustomerName] = useState("");
  const [customerPhone, setCustomerPhone] = useState("");

  // Nhận diện khách cũ bằng số điện thoại.
  const phoneKey = canonicalPhone(customerPhone);
  const phoneComplete = /^0\d{9}$/.test(phoneKey);

  const existingCustomer = useMemo(
    () =>
      phoneComplete
        ? buildCustomers(orders).customers.find(
            (customer) => customer.key === phoneKey,
          )
        : undefined,
    [orders, phoneComplete, phoneKey],
  );

  const [note, setNote] = useState("");
  const [paymentMethod, setPaymentMethod] =
    useState<PaymentMethod>("cash");

  const [status, setStatus] = useState<"completed" | "pending">(
    "completed",
  );

  const [discountInput, setDiscountInput] = useState("");
  const [installmentMonths, setInstallmentMonths] = useState("12");
  const [downPaymentInput, setDownPaymentInput] = useState("");
  const [error, setError] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  const categories = useMemo(
    () =>
      Array.from(
        new Set(
          products
            .map((product) => product.category.trim())
            .filter(Boolean),
        ),
      ),
    [products],
  );

  const filteredProducts = useMemo(() => {
    const keyword = search.trim().toLowerCase();

    return products.filter((product) => {
      const matchKeyword =
        !keyword ||
        product.name.toLowerCase().includes(keyword) ||
        product.category.toLowerCase().includes(keyword);

      const matchCategory =
        !categoryFilter ||
        product.category.trim() === categoryFilter;

      return matchKeyword && matchCategory;
    });
  }, [products, search, categoryFilter]);

  // Gắn thông tin sản phẩm vào từng dòng giỏ hàng.
  const lines = useMemo(
    () =>
      cart.flatMap((line) => {
        const product = products.find(
          (item) => item.id === line.productId,
        );

        if (!product) {
          return [];
        }

        const color = line.colorId
          ? product.colors?.find((item) => item.id === line.colorId)
          : undefined;

        return [
          {
            ...line,
            product,
            color,
            unitPrice: color?.price ?? product.price,
          },
        ];
      }),
    [cart, products],
  );

  // Tổng số lượng đã chọn theo từng kho.
  const usedByPool = new Map<string, number>();

  lines.forEach((line) => {
    const pool = stockPoolKey(line.product, line.colorId);

    usedByPool.set(
      pool,
      (usedByPool.get(pool) ?? 0) + line.quantity,
    );
  });

  const subtotal = lines.reduce(
    (sum, line) => sum + line.unitPrice * line.quantity,
    0,
  );

  const discount = Math.min(parsePrice(discountInput), subtotal);
  const total = subtotal - discount;

  const isInstallment = paymentMethod === "installment";
  const downPayment = parsePrice(downPaymentInput);

  const monthlyPayment = calcMonthlyPayment(
    total,
    downPayment,
    Number(installmentMonths),
  );

  const itemCount = lines.reduce(
    (sum, line) => sum + line.quantity,
    0,
  );

  const addToCart = (productId: string, colorId?: string) => {
    const product = products.find((item) => item.id === productId);

    if (!product) {
      return;
    }

    setError("");

    setCart((current) => {
      const pool = stockPoolKey(product, colorId);

      const used = current
        .filter(
          (line) =>
            line.productId === productId &&
            stockPoolKey(product, line.colorId) === pool,
        )
        .reduce((sum, line) => sum + line.quantity, 0);

      if (used >= availableStock(product, colorId)) {
        return current;
      }

      const key = lineKey(productId, colorId);

      return current.some((line) => line.key === key)
        ? current.map((line) =>
            line.key === key
              ? { ...line, quantity: line.quantity + 1 }
              : line,
          )
        : [
            ...current,
            { key, productId, colorId, quantity: 1 },
          ];
    });
  };

  const changeQuantity = (key: string, next: number) => {
    setCart((current) =>
      current.map((line) => {
        if (line.key !== key) {
          return line;
        }

        const product = products.find(
          (item) => item.id === line.productId,
        );

        const pool = product
          ? stockPoolKey(product, line.colorId)
          : "";

        const others = current
          .filter(
            (item) =>
              item.productId === line.productId &&
              item.key !== key &&
              product !== undefined &&
              stockPoolKey(product, item.colorId) === pool,
          )
          .reduce((sum, item) => sum + item.quantity, 0);

        const max = Math.max(
          1,
          (product
            ? availableStock(product, line.colorId)
            : 1) - others,
        );

        const value = Math.floor(next) || 1;

        return {
          ...line,
          quantity: Math.min(max, Math.max(1, value)),
        };
      }),
    );
  };

  const removeLine = (key: string) => {
    setCart((current) =>
      current.filter((line) => line.key !== key),
    );
  };

  // Tạo đơn và chờ backend cập nhật tồn kho.
  const handleSubmit = async (event: FormEvent) => {
    event.preventDefault();

    if (submittedRef.current) {
      return;
    }

    if (lines.length === 0) {
      setError("Hãy thêm ít nhất một sản phẩm vào đơn hàng.");
      return;
    }

    const phone = customerPhone.replace(/[\s.]/g, "");

    if (phone && !PHONE_PATTERN.test(phone)) {
      setError(
        "Số điện thoại không hợp lệ (ví dụ: 0901234567).",
      );
      return;
    }

    if (isInstallment && downPayment >= total) {
      setError(
        "Tiền trả trước phải nhỏ hơn tổng thanh toán của đơn.",
      );
      return;
    }

    submittedRef.current = true;
    setIsSubmitting(true);
    setError("");

    try {
      const result = await createOrder({
        customerName,
        customerPhone: phone,
        note,
        paymentMethod,
        status: isInstallment ? "installment" : status,
        installment: isInstallment
          ? {
              months: Number(installmentMonths),
              downPayment,
            }
          : undefined,
        discount,
        items: lines.map((line) => ({
          productId: line.productId,
          productName: line.product.name,
          colorId: line.color?.id,
          colorName: line.color?.name,
          unitPrice: line.unitPrice,
          quantity: line.quantity,
        })),
      });

      if (!result.ok) {
        setError(result.error);
        submittedRef.current = false;
        setIsSubmitting(false);
        return;
      }

      navigate(`/orders/${result.order.id}`);
    } catch (error) {
      console.error("Lỗi tạo đơn hàng:", error);

      setError(
        error instanceof Error
          ? error.message
          : "Không thể tạo đơn hàng. Vui lòng thử lại.",
      );

      submittedRef.current = false;
      setIsSubmitting(false);
    }
  };

  return (
    <div className="page">
      <div className="page-heading">
        <div>

          <h1>Tạo đơn</h1>

          <p>
            Chọn sản phẩm, nhập thông tin khách hàng và chốt đơn.
            Kho sẽ được trừ tự động.
          </p>
        </div>

        <Link to="/orders" className="secondary-button">
          ← Danh sách đơn
        </Link>
      </div>

      <form className="sale-layout" onSubmit={handleSubmit}>
        {/* DANH SÁCH SẢN PHẨM */}

        <section className="content-card sale-products">
          <div className="section-header">
            <h2>Chọn sản phẩm</h2>
            <p>{filteredProducts.length} sản phẩm</p>
          </div>

          <div className="sale-toolbar">
            <input
              type="search"
              placeholder="Tìm theo tên hoặc hãng..."
              value={search}
              onChange={(event) => setSearch(event.target.value)}
            />

            <select
              value={categoryFilter}
              onChange={(event) =>
                setCategoryFilter(event.target.value)
              }
            >
              <option value="">Tất cả hãng</option>

              {categories.map((category) => (
                <option key={category} value={category}>
                  {category}
                </option>
              ))}
            </select>
          </div>

          {products.length === 0 ? (
            <div className="empty-state">
              <div className="empty-icon">📦</div>
              <h3>Chưa có sản phẩm để bán</h3>
              <p>Hãy thêm sản phẩm vào kho trước.</p>

              <Link
                to="/products/add"
                className="primary-button"
              >
                + Thêm sản phẩm
              </Link>
            </div>
          ) : filteredProducts.length === 0 ? (
            <p className="sale-empty">
              Không có sản phẩm phù hợp.
            </p>
          ) : (
            <ul className="sale-product-list">
              {filteredProducts.map((product) => {
                const hasColors =
                  !!product.colors && product.colors.length > 0;

                const colorId = hasColors
                  ? (colorPick[product.id] ?? product.colors[0].id)
                  : undefined;

                const color = hasColors
                  ? product.colors.find(
                      (item) => item.id === colorId,
                    )
                  : undefined;

                const stock = availableStock(product, colorId);

                const remaining =
                  stock -
                  (usedByPool.get(
                    stockPoolKey(product, colorId),
                  ) ?? 0);

                return (
                  <li className="sale-product" key={product.id}>
                    <ProductThumb
                      src={color?.image || product.image}
                      alt={product.name}
                      size={56}
                    />

                    <div className="sale-product-info">
                      <strong>{product.name}</strong>

                      <span>
                        {product.category} ·{" "}
                        <em
                          className={
                            stock <= 0
                              ? "stock out"
                              : stock <= 10
                                ? "stock low"
                                : "stock"
                          }
                        >
                          {stock <= 0
                            ? "Hết hàng"
                            : `Còn ${stock}`}
                        </em>
                      </span>

                      {hasColors && (
                        <select
                          aria-label={`Màu của ${product.name}`}
                          value={colorId}
                          onChange={(event) =>
                            setColorPick((current) => ({
                              ...current,
                              [product.id]: event.target.value,
                            }))
                          }
                        >
                          {product.colors.map((item) => (
                            <option key={item.id} value={item.id}>
                              {item.name} -{" "}
                              {formatPrice(item.price)}
                              {typeof item.quantity === "number"
                                ? ` · còn ${item.quantity}`
                                : ""}
                            </option>
                          ))}
                        </select>
                      )}
                    </div>

                    <div className="sale-product-side">
                      <strong>
                        {formatPrice(color?.price ?? product.price)}
                      </strong>

                      <button
                        type="button"
                        className="primary-button small"
                        disabled={remaining <= 0 || isSubmitting}
                        onClick={() =>
                          addToCart(product.id, colorId)
                        }
                      >
                        {stock <= 0
                          ? "Hết hàng"
                          : remaining <= 0
                            ? "Đã thêm hết"
                            : "+ Thêm"}
                      </button>
                    </div>
                  </li>
                );
              })}
            </ul>
          )}
        </section>

        {/* GIỎ HÀNG + KHÁCH HÀNG */}

        <aside className="sale-cart">
          <section className="content-card">
            <div className="section-header">
              <h2>Đơn hàng ({itemCount})</h2>
            </div>

            {lines.length === 0 ? (
              <p className="sale-empty">
                Chưa có sản phẩm. Bấm "+ Thêm" ở danh sách bên trái.
              </p>
            ) : (
              <ul className="cart-list">
                {lines.map((line) => {
                  const max =
                    availableStock(line.product, line.colorId) -
                    ((usedByPool.get(
                      stockPoolKey(line.product, line.colorId),
                    ) ?? 0) -
                      line.quantity);

                  return (
                    <li className="cart-line" key={line.key}>
                      <div className="cart-line-info">
                        <strong>{line.product.name}</strong>

                        <span>
                          {line.color
                            ? `${line.color.name} · `
                            : ""}
                          {formatPrice(line.unitPrice)}
                        </span>
                      </div>

                      <div className="qty-stepper">
                        <button
                          type="button"
                          aria-label="Giảm số lượng"
                          disabled={line.quantity <= 1 || isSubmitting}
                          onClick={() =>
                            changeQuantity(
                              line.key,
                              line.quantity - 1,
                            )
                          }
                        >
                          −
                        </button>

                        <input
                          type="number"
                          min={1}
                          max={max}
                          disabled={isSubmitting}
                          value={line.quantity}
                          onChange={(event) =>
                            changeQuantity(
                              line.key,
                              Number(event.target.value),
                            )
                          }
                        />

                        <button
                          type="button"
                          aria-label="Tăng số lượng"
                          disabled={
                            line.quantity >= max || isSubmitting
                          }
                          onClick={() =>
                            changeQuantity(
                              line.key,
                              line.quantity + 1,
                            )
                          }
                        >
                          +
                        </button>
                      </div>

                      <strong className="cart-line-total">
                        {formatPrice(
                          line.unitPrice * line.quantity,
                        )}
                      </strong>

                      <button
                        type="button"
                        className="cart-remove"
                        aria-label="Xóa khỏi đơn"
                        disabled={isSubmitting}
                        onClick={() => removeLine(line.key)}
                      >
                        ×
                      </button>
                    </li>
                  );
                })}
              </ul>
            )}
          </section>

          <section className="content-card sale-form">
            <div className="section-header">
              <h2>Khách hàng & thanh toán</h2>
            </div>

            <div className="sale-form-body">
              <div className="form-group">
                <label htmlFor="customerName">
                  Tên khách hàng
                </label>

                <input
                  id="customerName"
                  placeholder="Để trống = Khách lẻ"
                  disabled={isSubmitting}
                  value={customerName}
                  onChange={(event) =>
                    setCustomerName(event.target.value)
                  }
                />
              </div>

              <div className="form-group">
                <label htmlFor="customerPhone">
                  Số điện thoại
                </label>

                <input
                  id="customerPhone"
                  inputMode="tel"
                  placeholder="0901234567"
                  disabled={isSubmitting}
                  value={customerPhone}
                  onChange={(event) =>
                    setCustomerPhone(event.target.value)
                  }
                />

                {existingCustomer ? (
                  <small className="customer-hint">
                    Khách cũ{" "}
                    <strong>{existingCustomer.code}</strong> ·{" "}
                    {existingCustomer.name} ·{" "}
                    {existingCustomer.orderCount} đơn
                    {existingCustomer.outstanding > 0 &&
                      ` · còn nợ ${formatPrice(existingCustomer.outstanding)}`}
                    {!customerName.trim() && (
                      <>
                        {" "}
                        <button
                          type="button"
                          className="link-button"
                          disabled={isSubmitting}
                          onClick={() =>
                            setCustomerName(existingCustomer.name)
                          }
                        >
                          Dùng tên này
                        </button>
                      </>
                    )}
                  </small>
                ) : (
                  phoneComplete && (
                    <small className="customer-hint">
                      Khách mới, sẽ được cấp mã khi tạo đơn.
                    </small>
                  )
                )}
              </div>

              <div className="sale-form-row">
                <div className="form-group">
                  <label htmlFor="paymentMethod">
                    Thanh toán
                  </label>

                  <select
                    id="paymentMethod"
                    disabled={isSubmitting}
                    value={paymentMethod}
                    onChange={(event) =>
                      setPaymentMethod(
                        event.target.value as PaymentMethod,
                      )
                    }
                  >
                    {(
                      Object.keys(
                        PAYMENT_LABEL,
                      ) as PaymentMethod[]
                    ).map((method) => (
                      <option key={method} value={method}>
                        {PAYMENT_LABEL[method]}
                      </option>
                    ))}
                  </select>
                </div>

                {!isInstallment && (
                  <div className="form-group">
                    <label htmlFor="status">Trạng thái</label>

                    <select
                      id="status"
                      disabled={isSubmitting}
                      value={status}
                      onChange={(event) =>
                        setStatus(
                          event.target.value as
                            | "completed"
                            | "pending",
                        )
                      }
                    >
                      <option value="completed">
                        Hoàn thành ngay
                      </option>
                      <option value="pending">
                        Chờ xử lý (giao sau)
                      </option>
                    </select>
                  </div>
                )}
              </div>

              <div className="form-group">
                <label htmlFor="discount">Giảm giá (đ)</label>

                <input
                  id="discount"
                  inputMode="numeric"
                  placeholder="0"
                  disabled={isSubmitting}
                  value={discountInput}
                  onChange={(event) =>
                    setDiscountInput(
                      formatInputPrice(event.target.value),
                    )
                  }
                />
              </div>

              {isInstallment && (
                <div className="installment-box">
                  <div className="sale-form-row">
                    <div className="form-group">
                      <label htmlFor="installmentMonths">
                        Số tháng trả góp
                      </label>

                      <select
                        id="installmentMonths"
                        disabled={isSubmitting}
                        value={installmentMonths}
                        onChange={(event) =>
                          setInstallmentMonths(event.target.value)
                        }
                      >
                        {INSTALLMENT_MONTH_OPTIONS.map((months) => (
                          <option key={months} value={months}>
                            {months} tháng
                          </option>
                        ))}
                      </select>
                    </div>

                    <div className="form-group">
                      <label htmlFor="downPayment">
                        Trả trước (đ)
                      </label>

                      <input
                        id="downPayment"
                        inputMode="numeric"
                        placeholder="0"
                        disabled={isSubmitting}
                        value={downPaymentInput}
                        onChange={(event) =>
                          setDownPaymentInput(
                            formatInputPrice(event.target.value),
                          )
                        }
                      />
                    </div>
                  </div>

                  <div className="installment-preview">
                    <div>
                      <span>Còn lại sau trả trước</span>
                      <strong>
                        {formatPrice(
                          Math.max(0, total - downPayment),
                        )}
                      </strong>
                    </div>

                    <div>
                      <span>Dự kiến góp mỗi tháng</span>
                      <strong>{formatPrice(monthlyPayment)}</strong>
                    </div>
                  </div>

                  <small>
                    Không tính lãi. Đơn ở trạng thái "Đang trả góp"
                    cho đến khi bạn ghi nhận khách trả đủ và bấm
                    Hoàn thành.
                  </small>
                </div>
              )}

              <div className="form-group">
                <label htmlFor="note">Ghi chú</label>

                <textarea
                  id="note"
                  rows={2}
                  disabled={isSubmitting}
                  value={note}
                  onChange={(event) => setNote(event.target.value)}
                />
              </div>
            </div>

            <div className="sale-summary">
              <div>
                <span>Tạm tính</span>
                <strong>{formatPrice(subtotal)}</strong>
              </div>

              <div>
                <span>Giảm giá</span>
                <strong>- {formatPrice(discount)}</strong>
              </div>

              <div className="sale-total">
                <span>Tổng thanh toán</span>
                <strong>{formatPrice(total)}</strong>
              </div>
            </div>

            {error && (
              <div className="form-error" role="alert">
                {error}
              </div>
            )}

            <div className="form-actions">
              <button
                type="submit"
                className="primary-button block"
                disabled={lines.length === 0 || isSubmitting}
              >
                {isSubmitting ? "Đang tạo đơn..." : "Tạo đơn hàng"}
              </button>
            </div>
          </section>
        </aside>
      </form>
    </div>
  );
}
