import { useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";

import { useOrders } from "../context/OrderContext";
import { useProducts } from "../context/ProductContext";
import { formatPrice } from "../utils/format";
import { getSpecGroups } from "../constants/appleCatalog";
import { salesByProduct } from "../utils/orders";
import { availableStock, hasOwnStock } from "../utils/stock";

export default function ProductDetail() {
  const { id } = useParams();
  const navigate = useNavigate();

  const {
    getProductById,
    deleteProduct,
  } = useProducts();

  const { orders } = useOrders();

  const product = id
    ? getProductById(id)
    : undefined;

  const sales = product
    ? salesByProduct(orders).get(product.id)
    : undefined;

  const [selectedColorId, setSelectedColorId] =
    useState<string | null>(
      product?.colors?.[0]?.id ?? null,
    );

  if (!product) {
    return (
      <div className="page">
        <div className="content-card">
          <div className="empty-state">
            <div className="empty-icon">❌</div>

            <h3>Không tìm thấy sản phẩm</h3>

            <p>
              Sản phẩm bạn đang tìm kiếm không tồn tại.
            </p>

            <Link
              to="/products"
              className="primary-button"
            >
              ← Quay lại sản phẩm
            </Link>
          </div>
        </div>
      </div>
    );
  }

  const selectedColor =
    product.colors?.find(
      (color) => color.id === selectedColorId,
    ) ?? product.colors?.[0];

  const displayImage =
    selectedColor?.image || product.image;

  const displayPrice =
    selectedColor?.price ?? product.price;

  // Màu đang chọn có kho riêng thì bán theo kho của màu đó
  const selectedStock = availableStock(product, selectedColor?.id);
  const selectedHasOwnStock = hasOwnStock(selectedColor);

  const prices = product.colors?.length
    ? product.colors.map((color) => color.price)
    : [product.price];
  const minPrice = Math.min(...prices);
  const maxPrice = Math.max(...prices);
  const priceRange =
    minPrice === maxPrice
      ? formatPrice(minPrice)
      : `${formatPrice(minPrice)} - ${formatPrice(maxPrice)}`;

  const handleDelete = () => {
    const confirmed = window.confirm(
      sales
        ? `Sản phẩm "${product.name}" đã bán ${sales.quantity} cái. Xóa sản phẩm thì các đơn hàng cũ vẫn được giữ nguyên, nhưng bạn không thể bán tiếp sản phẩm này. Vẫn xóa?`
        : `Bạn có chắc muốn xóa sản phẩm "${product.name}" không?`,
    );

    if (!confirmed) {
      return;
    }

    deleteProduct(product.id);
    navigate("/products");
  };

  return (
    <div className="page">
      {/* HEADER */}

      <header className="page-header">
        <div>
          <h2>Chi tiết sản phẩm</h2>

          <p>
            Xem thông tin và các phiên bản của sản phẩm
          </p>
        </div>

        <div className="detail-header-actions">
          <Link
            to="/products"
            className="secondary-button"
          >
            ← Danh sách
          </Link>
        </div>
      </header>

      {/* THÔNG TIN CHÍNH */}

      <section className="detail-product-card">
        <div className="detail-product-main">
          {/* ẢNH */}

          <div className="detail-image">
            {displayImage ? (
              <img
                src={displayImage}
                alt={
                  selectedColor
                    ? `${product.name} ${selectedColor.name}`
                    : product.name
                }
              />
            ) : (
              <span className="detail-image-empty">📦</span>
            )}
          </div>

          {/* THÔNG TIN */}

          <div className="detail-info">
            <span className="category-badge">
              {product.category}
            </span>

            <h1>{product.name}</h1>

            {/* GIÁ */}

            <div className="detail-price">
              {formatPrice(displayPrice)}
            </div>

            {/* MÀU */}

            {product.colors &&
              product.colors.length > 0 && (
                <div className="color-selector">
                  <div className="color-selector-title">
                    <strong>
                      Màu sắc:
                    </strong>

                    <span>
                      {selectedColor?.name}
                    </span>
                  </div>

                  <div className="color-options">
  {product.colors.map((color) => (
    <button
      type="button"
      key={color.id}
      className={
        selectedColor?.id === color.id
          ? "color-option active"
          : "color-option"
      }
      onMouseEnter={() =>
        setSelectedColorId(color.id)
      }
      onFocus={() =>
        setSelectedColorId(color.id)
      }
      onClick={() =>
        setSelectedColorId(color.id)
      }
      title={`${color.name} - ${formatPrice(color.price)}`}
    >
      <div className="color-option-image">
        {color.image && (
          <img
            src={color.image}
            alt={color.name}
          />
        )}
      </div>

      <div className="color-option-info">
        <div className="color-option-name">
          <span
            className="color-dot"
            style={{
              backgroundColor: color.color,
            }}
          />

          <span>{color.name}</span>
        </div>

        <strong>
          {formatPrice(color.price)}
        </strong>

        {typeof color.quantity === "number" && (
          <small>
            {color.quantity > 0
              ? `Còn ${color.quantity}`
              : "Hết hàng"}
          </small>
        )}
      </div>
    </button>
  ))}
</div>

                  <p className="color-hint">
                    Di chuột hoặc chạm vào màu để xem ảnh
                    và giá của phiên bản đó.
                  </p>
                </div>
              )}

            {/* SỐ LƯỢNG */}

            <div className="detail-stock">
              <span>
                {selectedHasOwnStock
                  ? `Còn lại (màu ${selectedColor?.name})`
                  : "Số lượng trong kho"}
              </span>

              <strong>
                {selectedStock}
              </strong>
            </div>

            {selectedHasOwnStock && (
              <div className="detail-stock">
                <span>Tổng kho (tất cả màu)</span>

                <strong>
                  {product.quantity}
                </strong>
              </div>
            )}

            {/* ACTION */}

            <div className="detail-actions">
              {selectedStock > 0 && (
                <Link
                  to="/orders/new"
                  state={{
                    productId: product.id,
                    colorId: selectedColor?.id,
                  }}
                  className="primary-button"
                >
                  🛒 Tạo đơn bán
                </Link>
              )}

              <Link
                to={`/products/${product.id}/edit`}
                className="secondary-button"
              >
                ✏️ Chỉnh sửa
              </Link>

              <button
                type="button"
                className="delete-button large"
                onClick={handleDelete}
              >
                🗑️ Xóa sản phẩm
              </button>
            </div>
          </div>
        </div>
      </section>

      {/* TÍNH NĂNG */}

      {product.features &&
        product.features.length > 0 && (
          <section className="detail-content-card">
            <div className="detail-section-title">
              <span className="detail-section-icon">
                ✨
              </span>

              <div>
                <h3>
                  Công dụng / Tính năng
                </h3>

                <p>
                  Những điểm nổi bật của sản phẩm
                </p>
              </div>
            </div>

            <div className="detail-feature-grid">
              {product.features.map(
                (feature, index) => (
                  <div
                    className="detail-feature-item"
                    key={index}
                  >
                    <span className="feature-check">
                      ✓
                    </span>

                    <span>{feature}</span>
                  </div>
                ),
              )}
            </div>
          </section>
        )}

      {/* THÔNG SỐ KỸ THUẬT */}

      {product.productType &&
        getSpecGroups(product.productType, product.specs).length > 0 && (
          <section className="detail-content-card">
            <div className="detail-section-title">
              <span className="detail-section-icon">⚙️</span>

              <div>
                <h3>Thông số kỹ thuật</h3>
                <p>
                  {product.condition} · Bảo hành {product.warrantyMonths ?? 0} tháng
                </p>
              </div>
            </div>

            {getSpecGroups(product.productType, product.specs).map((group) => (
              <div key={group.title}>
                <h4 className="spec-group-title">{group.title}</h4>

                <div className="detail-info-grid">
                  {group.rows.map((row) => (
                    <div className="detail-info-item" key={row.label}>
                      <span>{row.label}</span>
                      <strong>{row.value}</strong>
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </section>
        )}

      {/* THÔNG TIN */}

      <section className="detail-content-card">
        <div className="detail-section-title">
          <span className="detail-section-icon">
            📋
          </span>

          <div>
            <h3>Thông tin sản phẩm</h3>

            <p>
              Phiên bản, giá, doanh số và ngày tạo
            </p>
          </div>
        </div>

        <div className="detail-info-grid">
          <div className="detail-info-item">
            <span>Số phiên bản màu</span>
            <strong>
              {product.colors?.length || 0}
            </strong>
          </div>

          <div className="detail-info-item">
            <span>Khoảng giá</span>
            <strong>{priceRange}</strong>
          </div>

          <div className="detail-info-item">
            <span>Giá đại diện</span>
            <strong>
              {formatPrice(product.price)}
            </strong>
          </div>

          <div className="detail-info-item">
            <span>Đã bán</span>
            <strong>{sales?.quantity ?? 0}</strong>
          </div>

          <div className="detail-info-item">
            <span>Doanh thu từ sản phẩm</span>
            <strong>{formatPrice(sales?.revenue ?? 0)}</strong>
          </div>

          <div className="detail-info-item">
            <span>Ngày tạo</span>
            <strong>
              {new Date(
                product.createdAt,
              ).toLocaleDateString("vi-VN")}
            </strong>
          </div>
        </div>
      </section>

      {/* MÔ TẢ */}

      <section className="detail-content-card">
        <div className="detail-section-title">
          <span className="detail-section-icon">
            📝
          </span>

          <div>
            <h3>Mô tả sản phẩm</h3>

            <p>Thông tin chi tiết</p>
          </div>
        </div>

        <div className="detail-full-description">
          {product.description ? (
            <p>{product.description}</p>
          ) : (
            <p className="muted-text">
              Chưa có mô tả chi tiết.
            </p>
          )}
        </div>
      </section>
    </div>
  );
}