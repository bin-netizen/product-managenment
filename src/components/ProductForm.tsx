import {
  type ChangeEvent,
  type FormEvent,
  type KeyboardEvent,
  type ReactNode,
  useState,
} from "react";
import { Link } from "react-router-dom";

import { fileToCompressedDataUrl } from "../utils/image";
import { getYouTubeId } from "../utils/media";
import { MediaPreview } from "./MediaPreview.tsx";
import type {
  Product,
  ProductColor,
  ProductInput,
  ProductMedia,
} from "../types/product";
import { formatInputPrice, parsePrice } from "../utils/format.ts";
import {
  COLOR_PRESETS,
  CONDITION_OPTIONS,
  PRODUCT_TYPES,
  PRODUCT_TYPE_LIST,
  collectSpecs,
  isFieldVisible,
  pruneSpecs,
  type ProductType,
  type SpecField,
  type SpecValue,
} from "../constants/appleCatalog";

interface ColorForm {
  uid: string;
  name: string;
  color: string;
  image: string;
  price: string;
  quantity: string;
}

type FormErrors = Record<string, string>;

// localStorage chỉ ~5MB cho cả cửa hàng, nên giới hạn số ảnh và chỉ nhận video qua link
const MAX_MEDIA = 8;

/* ------------------------------------------------------------------ */
/* Component con                                                       */
/* ------------------------------------------------------------------ */

interface FieldProps {
  label: string;
  required?: boolean;
  hint?: string;
  error?: string;
  htmlFor?: string;
  className?: string;
  children: ReactNode;
}

function Field({
  label,
  required,
  hint,
  error,
  htmlFor,
  className = "",
  children,
}: FieldProps) {
  return (
    <div
      className={`form-group ${className}`.trim()}
      data-invalid={error ? "true" : undefined}
    >
      <label htmlFor={htmlFor}>
        {label}
        {required && " *"}
      </label>

      {children}

      {error ? (
        <small className="field-error" role="alert">
          {error}
        </small>
      ) : (
        hint && <small>{hint}</small>
      )}
    </div>
  );
}

interface SpecInputProps {
  field: SpecField;
  value: SpecValue | undefined;
  error?: string;
  onChange: (key: string, value: SpecValue) => void;
}

function SpecInput({ field, value, error, onChange }: SpecInputProps) {
  const id = `spec-${field.key}`;
  const isMulti = field.kind === "multiselect";

  // Ô nhiều giá trị: giữ chuỗi người dùng gõ, còn specs lưu dạng mảng
  const [raw, setRaw] = useState(() =>
    Array.isArray(value) ? value.join(", ") : "",
  );

  const inputValue = isMulti ? raw : typeof value === "string" ? value : "";

  // Các lựa chọn cũ chỉ còn là gợi ý trong placeholder, không ép chọn
  const placeholder =
    field.kind === "text"
      ? field.placeholder
      : `Ví dụ: ${field.options.slice(0, 3).join(", ")}`;

  const hint =
    field.hint ?? (isMulti ? "Nhập nhiều giá trị, cách nhau bằng dấu phẩy." : undefined);

  const handleChange = (event: ChangeEvent<HTMLInputElement>) => {
    const text = event.target.value;

    if (isMulti) {
      setRaw(text);
      onChange(
        field.key,
        text
          .split(",")
          .map((item) => item.trim())
          .filter(Boolean),
      );
      return;
    }

    onChange(field.key, text);
  };

  return (
    <Field
      label={field.label}
      hint={hint}
      error={error}
      htmlFor={id}
      className={isMulti ? "full" : ""}
    >
      <input
        id={id}
        type="text"
        value={inputValue}
        placeholder={placeholder}
        aria-invalid={Boolean(error)}
        onChange={handleChange}
      />
    </Field>
  );
}

/* ------------------------------------------------------------------ */
/* Trang thêm sản phẩm                                                 */
/* ------------------------------------------------------------------ */

interface ProductFormProps {
  /** Có `initial` thì là form sửa, không có thì là form thêm mới. */
  initial?: Product;
  title: string;
  subtitle: string;
  backTo: string;
  submitLabel: string;
  onSubmit: (values: ProductInput) => void;
}

export default function ProductForm({
  initial,
  title,
  subtitle,
  backTo,
  submitLabel,
  onSubmit,
}: ProductFormProps) {
  const [productType, setProductType] = useState<ProductType | "">(
    initial?.productType ?? "",
  );
  const [name, setName] = useState(initial?.name ?? "");
  const [sku, setSku] = useState(initial?.sku ?? "");
  const [price, setPrice] = useState(
    initial ? formatInputPrice(String(initial.price)) : "",
  );
  const [quantity, setQuantity] = useState(
    initial ? String(initial.quantity) : "",
  );
  const [condition, setCondition] = useState(
    initial?.condition ?? CONDITION_OPTIONS[0],
  );
  const [warranty, setWarranty] = useState(
    String(initial?.warrantyMonths ?? 12),
  );
  const [description, setDescription] = useState(initial?.description ?? "");
  const [image, setImage] = useState(initial?.image ?? "");
  const [media, setMedia] = useState<ProductMedia[]>(initial?.media ?? []);
  const [videoLink, setVideoLink] = useState("");

  // Sản phẩm cũ chưa có loại thì vẫn cho chọn một lần, tránh bị kẹt khi sửa
  const typeLocked = Boolean(initial?.productType);

  const [specs, setSpecs] = useState<Record<string, SpecValue>>(
    initial?.specs ?? {},
  );
  const [colors, setColors] = useState<ColorForm[]>(() =>
    (initial?.colors ?? []).map((item) => ({
      uid: item.id,
      name: item.name,
      color: item.color,
      image: item.image,
      price: formatInputPrice(String(item.price)),
      quantity: item.quantity === undefined ? "" : String(item.quantity),
    })),
  );
  const [features, setFeatures] = useState<string[]>(initial?.features ?? []);
  const [featureInput, setFeatureInput] = useState("");

  const [errors, setErrors] = useState<FormErrors>({});

  const typeConfig = productType ? PRODUCT_TYPES[productType] : null;

  const clearError = (key: string) =>
    setErrors((current) => {
      if (!current[key]) return current;
      const next = { ...current };
      delete next[key];
      return next;
    });

  /* ---------- loại sản phẩm & thông số ---------- */

  const handleTypeChange = (next: ProductType) => {
    if (typeLocked || next === productType) return;

    setProductType(next);
    setSpecs((current) => pruneSpecs(current, next));
    setErrors({});
  };

  const handleSpecChange = (key: string, value: SpecValue) => {
    setSpecs((current) => ({ ...current, [key]: value }));
    clearError(`spec.${key}`);
  };

  /* ---------- ảnh ---------- */

  const handleMainImageChange = (event: ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    fileToCompressedDataUrl(file)
      .then((dataUrl) => {
        setImage(dataUrl);
        clearError("image");
      })
      .catch(() =>
        setErrors((current) => ({
          ...current,
          image: "Không đọc được ảnh này, vui lòng chọn file khác.",
        })),
      );
  };

  const handleColorImageChange = (
    uid: string,
    event: ChangeEvent<HTMLInputElement>,
  ) => {
    const file = event.target.files?.[0];
    if (!file) return;

    fileToCompressedDataUrl(file)
      .then((dataUrl) => {
        setColors((current) =>
          current.map((item) =>
            item.uid === uid ? { ...item, image: dataUrl } : item,
          ),
        );
      })
      .catch(() =>
        setErrors((current) => ({
          ...current,
          colors: "Không đọc được ảnh màu này, vui lòng chọn file khác.",
        })),
      );
  };

  /* ---------- thư viện ảnh & video ---------- */

  const handleMediaFiles = async (event: ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(event.target.files ?? []);
    event.target.value = ""; // cho phép chọn lại đúng file vừa chọn
    if (files.length === 0) return;

    const problems: string[] = [];
    const slots = Math.max(MAX_MEDIA - media.length, 0);
    const accepted = files.slice(0, slots);

    if (files.length > accepted.length) {
      problems.push(`Tối đa ${MAX_MEDIA} ảnh/video cho mỗi sản phẩm.`);
    }

    const results = await Promise.all(
      accepted.map(async (file): Promise<ProductMedia | null> => {
        try {
          if (file.type.startsWith("image/")) {
            return {
              id: crypto.randomUUID(),
              type: "image",
              url: await fileToCompressedDataUrl(file),
            };
          }

          problems.push(`"${file.name}" không phải file ảnh.`);
        } catch {
          problems.push(`Không đọc được "${file.name}".`);
        }

        return null;
      }),
    );

    const added = results.filter((item): item is ProductMedia => item !== null);

    if (added.length > 0) {
      setMedia((current) => [...current, ...added].slice(0, MAX_MEDIA));
    }

    if (problems.length > 0) {
      setErrors((current) => ({ ...current, media: problems.join(" ") }));
    } else {
      clearError("media");
    }
  };

  const addVideoLink = () => {
    const url = videoLink.trim();
    if (!url) return;

    const fail = (message: string) =>
      setErrors((current) => ({ ...current, media: message }));

    // Chỉ nhận http(s) để tránh link độc hại kiểu javascript:
    if (!/^https?:\/\//i.test(url)) {
      return fail("Link video phải bắt đầu bằng http:// hoặc https://");
    }

    if (!getYouTubeId(url) && !/\.(mp4|webm|ogg)(\?.*)?$/i.test(url)) {
      return fail("Chỉ hỗ trợ link YouTube hoặc file video .mp4 / .webm / .ogg.");
    }

    if (media.length >= MAX_MEDIA) {
      return fail(`Tối đa ${MAX_MEDIA} ảnh/video cho mỗi sản phẩm.`);
    }

    setMedia((current) => [
      ...current,
      { id: crypto.randomUUID(), type: "video", url },
    ]);
    setVideoLink("");
    clearError("media");
  };

  const handleVideoLinkKeyDown = (event: KeyboardEvent<HTMLInputElement>) => {
    if (event.key === "Enter") {
      event.preventDefault();
      addVideoLink();
    }
  };

  const removeMedia = (id: string) =>
    setMedia((current) => current.filter((item) => item.id !== id));

  const moveMediaToFirst = (id: string) =>
    setMedia((current) => {
      const target = current.find((item) => item.id === id);
      return target
        ? [target, ...current.filter((item) => item.id !== id)]
        : current;
    });

  /* ---------- màu sắc ---------- */

  const addColor = (preset?: { name: string; color: string }) => {
    setColors((current) => {
      if (
        preset &&
        current.some(
          (item) => item.name.toLowerCase() === preset.name.toLowerCase(),
        )
      ) {
        return current;
      }

      return [
        ...current,
        {
          uid: crypto.randomUUID(),
          name: preset?.name ?? "",
          color: preset?.color ?? "#2563eb",
          image: "",
          price, // mặc định bằng giá đại diện, sửa lại nếu màu này giá khác
          quantity: "",
        },
      ];
    });
    clearError("colors");
  };

  const removeColor = (uid: string) =>
    setColors((current) => current.filter((item) => item.uid !== uid));

  const updateColor = (
    uid: string,
    field: keyof Omit<ColorForm, "uid">,
    value: string,
  ) => {
    setColors((current) =>
      current.map((item) =>
        item.uid === uid
          ? {
              ...item,
              [field]:
                field === "price"
                  ? formatInputPrice(value)
                  : field === "quantity"
                    ? value.replace(/\D/g, "")
                    : value,
            }
          : item,
      ),
    );
    clearError("colors");
  };

  /* ---------- tính năng ---------- */

  const addFeature = () => {
    const trimmed = featureInput.trim();
    if (!trimmed) return;

    setFeatures((current) =>
      current.some((item) => item.toLowerCase() === trimmed.toLowerCase())
        ? current
        : [...current, trimmed],
    );
    setFeatureInput("");
  };

  const removeFeature = (index: number) =>
    setFeatures((current) => current.filter((_, i) => i !== index));

  const handleFeatureKeyDown = (event: KeyboardEvent<HTMLInputElement>) => {
    if (event.key === "Enter") {
      event.preventDefault();
      addFeature();
    }
  };

  /* ---------- validate & submit ---------- */

  const validate = (): FormErrors => {
    const next: FormErrors = {};

    if (!name.trim()) next.name = "Vui lòng nhập tên sản phẩm.";

    const priceValue = parsePrice(price);
    if (!price || !(priceValue > 0)) next.price = "Giá phải lớn hơn 0.";

    // Có màu thì kho tính theo từng màu, không dùng ô số lượng chung
    if (colors.length === 0) {
      const quantityValue = Number(quantity);
      if (
        quantity === "" ||
        !Number.isInteger(quantityValue) ||
        quantityValue < 0
      ) {
        next.quantity = "Số lượng phải là số nguyên từ 0 trở lên.";
      }
    }

    const warrantyValue = Number(warranty);
    if (
      warranty === "" ||
      !Number.isInteger(warrantyValue) ||
      warrantyValue < 0 ||
      warrantyValue > 60
    ) {
      next.warranty = "Bảo hành từ 0 đến 60 tháng.";
    }

    const names = new Set<string>();
    for (const item of colors) {
      const key = item.name.trim().toLowerCase();

      // Chỉ bắt buộc tên màu; giá / số lượng / ảnh có thể bỏ trống
      if (!key) {
        next.colors = "Vui lòng nhập tên cho tất cả các màu (hoặc xóa màu trống).";
        break;
      }

      if (names.has(key)) {
        next.colors = `Màu "${item.name.trim()}" bị trùng, mỗi màu chỉ nên xuất hiện một lần.`;
        break;
      }

      names.add(key);
    }

    return next;
  };

  const handleSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    if (!productType) {
      setErrors({ type: "Vui lòng chọn loại sản phẩm." });
      return;
    }

    const nextErrors = validate();
    setErrors(nextErrors);

    if (Object.keys(nextErrors).length > 0) {
      window.setTimeout(() => {
        document
          .querySelector<HTMLElement>('[data-invalid="true"]')
          ?.scrollIntoView({ behavior: "smooth", block: "center" });
      }, 0);
      return;
    }

    const productColors: ProductColor[] = colors.map((item) => ({
      id: item.uid,
      name: item.name.trim(),
      color: item.color,
      image: item.image,
      price: parsePrice(item.price) > 0 ? parsePrice(item.price) : parsePrice(price),
      quantity: Number(item.quantity) || 0,
    }));

    onSubmit({
      name: name.trim(),
      // category = tên loại (iPhone, Mac...) để các trang lọc/thống kê cũ vẫn chạy
      category: PRODUCT_TYPES[productType].label,
      productType,
      sku: sku.trim(),
      condition,
      warrantyMonths: Number(warranty),
      price: parsePrice(price),
      // Có màu thì tổng kho = tổng số lượng các màu
      quantity: productColors.length > 0
        ? productColors.reduce((sum, item) => sum + (item.quantity ?? 0), 0)
        : Number(quantity),
      description: description.trim(),
      image,
      media,
      colors: productColors,
      features,
      specs: collectSpecs(productType, specs),
    });

  };

  const hasColors = colors.length > 0;
  const colorsTotal = colors.reduce(
    (sum, item) => sum + (Number(item.quantity) || 0),
    0,
  );

  const errorCount = Object.keys(errors).length;

  /* ---------- render ---------- */

  return (
    <div className="page">
      <header className="page-header">
        <div>
          <h2>{title}</h2>
          <p>{subtitle}</p>
        </div>

        <Link to={backTo} className="secondary-button">
          ← Quay lại
        </Link>
      </header>

      <form className="form-card" onSubmit={handleSubmit} noValidate>
        {errorCount > 0 && (
          <div className="form-error" role="alert">
            Có {errorCount} mục cần kiểm tra lại. Các trường lỗi được đánh dấu
            màu đỏ bên dưới.
          </div>
        )}

        {/* LOẠI SẢN PHẨM */}

        <div className="form-section" data-invalid={errors.type ? "true" : undefined}>
          <div className="form-section-title">
            <h3>Loại sản phẩm *</h3>
            <p>
              {typeLocked
                ? "Loại sản phẩm đã được khóa, không thể thay đổi sau khi tạo."
                : "Mỗi loại có bộ thông số kỹ thuật riêng. Chọn cẩn thận vì sẽ không đổi được sau khi thêm sản phẩm."}
            </p>
          </div>

          <div className="type-picker" role="radiogroup" aria-label="Loại sản phẩm">
            {PRODUCT_TYPE_LIST.filter(
              (item) => !typeLocked || item.key === productType,
            ).map((item) => {
              const active = item.key === productType;

              return (
                <button
                  key={item.key}
                  type="button"
                  role="radio"
                  aria-checked={active}
                  aria-disabled={typeLocked}
                  disabled={typeLocked}
                  className={`type-card ${active ? "type-card-active" : ""}`.trim()}
                  onClick={() => handleTypeChange(item.key)}
                >
                  <strong>
                    {item.label}
                    {typeLocked && " 🔒"}
                  </strong>
                  <small>{item.hint}</small>
                </button>
              );
            })}
          </div>

          {errors.type && (
            <small className="field-error" role="alert">
              {errors.type}
            </small>
          )}
        </div>

        {!typeConfig || !productType ? (
          <div className="option-empty">
            Chọn một loại sản phẩm ở trên để bắt đầu nhập thông tin.
          </div>
        ) : (
          <>
            {/* THÔNG TIN CHUNG */}

            <div className="form-section">
              <div className="form-section-title">
                <h3>Thông tin chung</h3>
                <p>Thông tin này hiển thị ở thẻ sản phẩm và dùng để bán hàng.</p>
              </div>

              <div className="form-grid">
                <Field label="Tên sản phẩm" required error={errors.name} htmlFor="name">
                  <input
                    id="name"
                    type="text"
                    value={name}
                    aria-invalid={Boolean(errors.name)}
                    onChange={(event) => {
                      setName(event.target.value);
                      clearError("name");
                    }}
                    placeholder={typeConfig.namePlaceholder}
                  />
                </Field>

                <Field
                  label="Mã SKU (nội bộ)"
                  hint="Mã quản lý kho của cửa hàng, nên là duy nhất."
                  htmlFor="sku"
                >
                  <input
                    id="sku"
                    type="text"
                    value={sku}
                    onChange={(event) => setSku(event.target.value)}
                    placeholder="Ví dụ: IP17P-256-TN"
                  />
                </Field>

                <Field
                  label="Giá đại diện"
                  required
                  error={errors.price}
                  hint="Giá hiển thị ngoài thẻ sản phẩm."
                  htmlFor="price"
                >
                  <div className="input-with-suffix">
                    <input
                      id="price"
                      type="text"
                      inputMode="numeric"
                      value={price}
                      aria-invalid={Boolean(errors.price)}
                      onChange={(event) => {
                        setPrice(formatInputPrice(event.target.value));
                        clearError("price");
                      }}
                      placeholder="30.000.000"
                    />
                    <span>đ</span>
                  </div>
                </Field>

                {hasColors ? (
                  <Field
                    label="Tổng số lượng"
                    hint="Tự cộng từ số lượng của từng màu ở mục Màu sắc bên dưới."
                    htmlFor="quantity"
                  >
                    <input id="quantity" type="number" value={colorsTotal} disabled readOnly />
                  </Field>
                ) : (
                  <Field label="Số lượng" required error={errors.quantity} htmlFor="quantity">
                    <input
                      id="quantity"
                      type="number"
                      min="0"
                      step="1"
                      value={quantity}
                      aria-invalid={Boolean(errors.quantity)}
                      onChange={(event) => {
                        setQuantity(event.target.value);
                        clearError("quantity");
                      }}
                      placeholder="10"
                    />
                  </Field>
                )}

                <Field label="Tình trạng" required htmlFor="condition">
                  <select
                    id="condition"
                    value={condition}
                    onChange={(event) => setCondition(event.target.value)}
                  >
                    {CONDITION_OPTIONS.map((option) => (
                      <option key={option} value={option}>
                        {option}
                      </option>
                    ))}
                  </select>
                </Field>

                <Field label="Bảo hành (tháng)" required error={errors.warranty} htmlFor="warranty">
                  <input
                    id="warranty"
                    type="number"
                    min="0"
                    max="60"
                    step="1"
                    value={warranty}
                    aria-invalid={Boolean(errors.warranty)}
                    onChange={(event) => {
                      setWarranty(event.target.value);
                      clearError("warranty");
                    }}
                  />
                </Field>

                <Field label="Mô tả sản phẩm" className="full" htmlFor="description">
                  <textarea
                    id="description"
                    value={description}
                    onChange={(event) => setDescription(event.target.value)}
                    placeholder="Nhập mô tả ngắn về sản phẩm..."
                    rows={4}
                  />
                </Field>

                <Field
                  label="Ảnh đại diện"
                  error={errors.image}
                  hint="Không bắt buộc. Ảnh này hiển thị ngoài thẻ sản phẩm."
                  className="full"
                  htmlFor="main-image"
                >
                  <input
                    id="main-image"
                    type="file"
                    accept="image/*"
                    onChange={handleMainImageChange}
                  />

                  {image && (
                    <div className="image-preview">
                      <img src={image} alt="Ảnh đại diện" />
                    </div>
                  )}
                </Field>
              </div>
            </div>

            {/* ẢNH & VIDEO */}

            <div className="form-section">
              <div className="form-section-title">
                <h3>Ảnh & video sản phẩm</h3>
                <p>
                  Hiển thị trong trang chi tiết. Tối đa {MAX_MEDIA} mục. Ảnh tải
                  từ máy; video thêm bằng link YouTube hoặc file .mp4 / .webm.
                </p>
              </div>

              <Field
                label="Tải ảnh"
                error={errors.media}
                hint="Chọn được nhiều ảnh cùng lúc, ảnh sẽ được nén tự động."
                htmlFor="media-files"
                className="full"
              >
                <input
                  id="media-files"
                  type="file"
                  accept="image/*"
                  multiple
                  disabled={media.length >= MAX_MEDIA}
                  onChange={handleMediaFiles}
                />
              </Field>

              <div className="feature-input-row">
                <input
                  type="url"
                  value={videoLink}
                  onChange={(event) => setVideoLink(event.target.value)}
                  onKeyDown={handleVideoLinkKeyDown}
                  placeholder="Hoặc dán link video YouTube / .mp4"
                />

                <button
                  type="button"
                  className="secondary-button"
                  onClick={addVideoLink}
                >
                  + Thêm video
                </button>
              </div>

              {media.length === 0 ? (
                <div className="option-empty">Chưa có ảnh hoặc video nào.</div>
              ) : (
                <div className="media-grid">
                  {media.map((item, index) => (
                    <div className="media-card" key={item.id}>
                      <div className="media-thumb">
                        <MediaPreview item={item} />
                        {index === 0 && (
                          <span className="media-badge">Hiển thị đầu tiên</span>
                        )}
                      </div>

                      <div className="media-actions">
                        {index > 0 && (
                          <button
                            type="button"
                            className="secondary-button"
                            onClick={() => moveMediaToFirst(item.id)}
                          >
                            Đặt lên đầu
                          </button>
                        )}

                        <button
                          type="button"
                          className="delete-button"
                          onClick={() => removeMedia(item.id)}
                        >
                          Xóa
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* THÔNG SỐ THEO LOẠI */}

            {typeConfig.sections.map((section) => {
              const visible = section.fields.filter((field) =>
                isFieldVisible(field, specs),
              );

              if (visible.length === 0) return null;

              return (
                <div className="form-section" key={`${productType}-${section.title}`}>
                  <div className="form-section-title">
                    <h3>{section.title}</h3>
                    {section.description && <p>{section.description}</p>}
                  </div>

                  <div className="form-grid">
                    {visible.map((field) => (
                      <SpecInput
                        key={`${productType}-${field.key}`}
                        field={field}
                        value={specs[field.key]}
                        error={errors[`spec.${field.key}`]}
                        onChange={handleSpecChange}
                      />
                    ))}
                  </div>
                </div>
              );
            })}

            {/* MÀU SẢN PHẨM */}

            <div className="form-section" data-invalid={errors.colors ? "true" : undefined}>
              <div className="form-section-title-row">
                <div className="form-section-title">
                  <h3>Màu sắc sản phẩm</h3>
                  <p>
                    Chỉ cần tên màu. Giá để trống thì lấy giá đại diện, số lượng
                    để trống tính là 0. Khi có màu, tổng kho = tổng số lượng các màu.
                  </p>
                </div>

                <button
                  type="button"
                  className="secondary-button"
                  onClick={() => addColor()}
                >
                  + Thêm màu
                </button>
              </div>

              <div className="color-presets" aria-label="Chọn nhanh màu Apple">
                {COLOR_PRESETS.map((preset) => (
                  <button
                    key={preset.name}
                    type="button"
                    className="color-preset"
                    onClick={() => addColor(preset)}
                  >
                    <span
                      className="color-preset-dot"
                      style={{ backgroundColor: preset.color }}
                      aria-hidden="true"
                    />
                    {preset.name}
                  </button>
                ))}
              </div>

              {errors.colors && (
                <small className="field-error" role="alert">
                  {errors.colors}
                </small>
              )}

              {colors.length === 0 ? (
                <div className="option-empty">
                  Chưa có màu nào. Chọn nhanh một màu ở trên hoặc nhấn{" "}
                  <strong>+ Thêm màu</strong>.
                </div>
              ) : (
                <div className="color-form-list">
                  {colors.map((item, index) => (
                    <div className="color-form-card" key={item.uid}>
                      <div className="color-form-header">
                        <strong>Màu {index + 1}</strong>

                        <button
                          type="button"
                          className="delete-button"
                          onClick={() => removeColor(item.uid)}
                        >
                          Xóa
                        </button>
                      </div>

                      <div className="form-grid">
                        <Field label="Tên màu" required>
                          <input
                            type="text"
                            value={item.name}
                            onChange={(event) =>
                              updateColor(item.uid, "name", event.target.value)
                            }
                            placeholder="Ví dụ: Titan tự nhiên"
                          />
                        </Field>

                        <Field label="Màu hiển thị">
                          <div className="color-picker-row">
                            <input
                              type="color"
                              value={item.color}
                              onChange={(event) =>
                                updateColor(item.uid, "color", event.target.value)
                              }
                            />
                            <span>{item.color}</span>
                          </div>
                        </Field>

                        <Field label="Giá của màu này">
                          <div className="input-with-suffix">
                            <input
                              type="text"
                              inputMode="numeric"
                              value={item.price}
                              onChange={(event) =>
                                updateColor(item.uid, "price", event.target.value)
                              }
                              placeholder="30.000.000"
                            />
                            <span>đ</span>
                          </div>
                        </Field>

                        <Field label="Số lượng của màu này">
                          <input
                            type="number"
                            min="0"
                            step="1"
                            value={item.quantity}
                            onChange={(event) =>
                              updateColor(item.uid, "quantity", event.target.value)
                            }
                            placeholder="5"
                          />
                        </Field>

                        <Field label="Ảnh của màu này">
                          <input
                            type="file"
                            accept="image/*"
                            onChange={(event) =>
                              handleColorImageChange(item.uid, event)
                            }
                          />
                        </Field>

                        {item.image && (
                          <div className="form-group full">
                            <label>Xem trước ảnh màu {item.name || index + 1}</label>

                            <div className="image-preview">
                              <img
                                src={item.image}
                                alt={item.name || `Màu ${index + 1}`}
                              />
                            </div>
                          </div>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* CÔNG DỤNG / TÍNH NĂNG */}

            <div className="form-section">
              <div className="form-section-title">
                <h3>Công dụng / Tính năng nổi bật</h3>
                <p>Hiển thị trong trang chi tiết sản phẩm. Nhấn Enter để thêm nhanh.</p>
              </div>

              <div className="feature-input-row">
                <input
                  type="text"
                  value={featureInput}
                  onChange={(event) => setFeatureInput(event.target.value)}
                  onKeyDown={handleFeatureKeyDown}
                  placeholder={typeConfig.featurePlaceholder}
                />

                <button
                  type="button"
                  className="secondary-button"
                  onClick={addFeature}
                >
                  + Thêm
                </button>
              </div>

              {features.length > 0 && (
                <div className="feature-list">
                  {features.map((feature, index) => (
                    <div className="feature-item" key={feature}>
                      <span>✓</span>
                      <span>{feature}</span>

                      <button
                        type="button"
                        onClick={() => removeFeature(index)}
                        aria-label={`Xóa ${feature}`}
                      >
                        ×
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* ACTIONS */}

            <div className="form-actions">
              <Link to={backTo} className="secondary-button">
                Hủy
              </Link>

              <button type="submit" className="primary-button">
                {submitLabel}
              </button>
            </div>
          </>
        )}
      </form>
    </div>
  );
}