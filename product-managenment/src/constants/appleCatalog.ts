/**
 * Danh mục sản phẩm Apple + bộ trường nhập theo từng loại.
 * Đặt tại: src/constants/appleCatalog.ts
 *
 * Toàn bộ form AddProduct được sinh ra từ file này. Muốn thêm/bớt một trường,
 * chỉ cần sửa ở đây — không phải đụng vào JSX. Trang Edit và trang Chi tiết
 * cũng có thể dùng lại cấu hình này để hiển thị bảng thông số.
 */

export type ProductType =
  | "iphone"
  | "mac"
  | "ipad"
  | "watch"
  | "headphone"
  | "speaker"
  | "accessory";

export type SpecValue = string | string[];

interface BaseField {
  key: string;
  label: string;
  required?: boolean;
  hint?: string;
  /** Chỉ hiện khi một trường select khác (cùng loại sản phẩm) có giá trị nằm trong `values`. */
  showIf?: { key: string; values: string[] };
}

export interface TextField extends BaseField {
  kind: "text";
  placeholder?: string;
  suggestions?: string[];
}

export interface SelectField extends BaseField {
  kind: "select";
  options: string[];
}

export interface MultiSelectField extends BaseField {
  kind: "multiselect";
  options: string[];
}

export type SpecField = TextField | SelectField | MultiSelectField;

export interface SpecSection {
  title: string;
  description?: string;
  fields: SpecField[];
}

export interface ProductTypeConfig {
  key: ProductType;
  label: string;
  hint: string;
  namePlaceholder: string;
  featurePlaceholder: string;
  sections: SpecSection[];
}

/* ------------------------------------------------------------------ */
/* Hằng số dùng chung                                                  */
/* ------------------------------------------------------------------ */

export const CONDITION_OPTIONS = [
  "Mới 100% (nguyên seal)",
  "Mới 100% (open-box)",
  "Like New (99%)",
  "Đã qua sử dụng",
];

export const COLOR_PRESETS = [
  { name: "Đen", color: "#1d1d1f" },
  { name: "Trắng", color: "#f5f5f7" },
  { name: "Bạc", color: "#e3e4e6" },
  { name: "Xám không gian", color: "#7d7e80" },
  { name: "Vàng", color: "#f2d8a7" },
  { name: "Titan tự nhiên", color: "#b8afa3" },
  { name: "Xanh dương", color: "#3b6fb6" },
  { name: "Xanh lá", color: "#a9c9a4" },
  { name: "Hồng", color: "#f1c8d0" },
  { name: "Tím", color: "#b9a9d6" },
  { name: "Đỏ", color: "#c0262d" },
  { name: "Cam", color: "#e8803a" },
];

const STORAGE_MOBILE = ["64GB", "128GB", "256GB", "512GB", "1TB", "2TB"];
const WIFI = ["Wi-Fi 5", "Wi-Fi 6", "Wi-Fi 6E", "Wi-Fi 7"];
const REGION_CODES = [
  "VN/A (Việt Nam)",
  "ZA/A (Singapore)",
  "LL/A (Mỹ)",
  "J/A (Nhật)",
  "KH/A (Hàn Quốc)",
  "ZP/A (Hồng Kông)",
  "CH/A (Trung Quốc)",
  "Khác",
];

/* ------------------------------------------------------------------ */
/* Helper dựng field cho gọn                                           */
/* ------------------------------------------------------------------ */

type Common = Pick<BaseField, "required" | "hint" | "showIf">;

const text = (
  key: string,
  label: string,
  o: Common & { placeholder?: string; suggestions?: string[] } = {},
): SpecField => ({ kind: "text", key, label, ...o });

const select = (
  key: string,
  label: string,
  options: string[],
  o: Common = {},
): SpecField => ({ kind: "select", key, label, options, ...o });

const multi = (
  key: string,
  label: string,
  options: string[],
  o: Common = {},
): SpecField => ({ kind: "multiselect", key, label, options, ...o });

/** Section dùng chung cho mọi thiết bị (trừ phụ kiện). */
const deviceSalesSection: SpecSection = {
  title: "Phiên bản & đóng gói",
  description: "Phiên bản quốc gia ảnh hưởng trực tiếp đến bảo hành và giá bán.",
  fields: [
    select("regionCode", "Phiên bản quốc gia", REGION_CODES, {
      required: true,
      hint: "VN/A là hàng phân phối chính thức tại Việt Nam.",
    }),
    text("partNumber", "Mã sản phẩm (Part number)", {
      placeholder: "Ví dụ: MYMC3VN/A",
    }),
    text("inBox", "Trong hộp có gì", {
      placeholder: "Ví dụ: Cáp USB-C, sách hướng dẫn",
    }),
  ],
};

/* ------------------------------------------------------------------ */
/* Phụ kiện: nhóm subtype để ẩn/hiện trường                            */
/* ------------------------------------------------------------------ */

const ACC_CASE = ["Ốp lưng / Case", "Bao da / Túi chống sốc"];
const ACC_SCREEN = ["Miếng dán màn hình"];
const ACC_CABLE = ["Cáp sạc / Cáp dữ liệu"];
const ACC_POWER = ["Củ sạc / Adapter", "Sạc không dây / MagSafe", "Pin dự phòng"];
const ACC_HUB = ["Hub / Cổng chuyển đổi"];
const ACC_BAND = ["Dây đeo Apple Watch"];
const ACC_STAND = ["Giá đỡ / Đế"];

const ACCESSORY_TYPES = [
  ...ACC_CASE,
  ...ACC_SCREEN,
  ...ACC_CABLE,
  ...ACC_POWER,
  ...ACC_HUB,
  ...ACC_BAND,
  ...ACC_STAND,
  "Bút Apple Pencil",
  "Bàn phím / Chuột / Trackpad",
  "AirTag / Định vị",
  "Phụ kiện khác",
];

const showFor = (values: string[]) => ({ key: "accessoryType", values });

/* ------------------------------------------------------------------ */
/* Cấu hình từng loại sản phẩm                                         */
/* ------------------------------------------------------------------ */

export const PRODUCT_TYPES: Record<ProductType, ProductTypeConfig> = {
  /* ------------------------------ iPhone ------------------------------ */
  iphone: {
    key: "iphone",
    label: "iPhone",
    hint: "Điện thoại",
    namePlaceholder: "Ví dụ: iPhone 17 Pro 256GB",
    featurePlaceholder: "Ví dụ: Camera 48MP, Face ID",
    sections: [
      {
        title: "Cấu hình",
        fields: [
          select(
            "series",
            "Dòng máy",
            ["iPhone", "iPhone Plus", "iPhone mini", "iPhone Air", "iPhone Pro", "iPhone Pro Max", "iPhone SE"],
            { required: true },
          ),
          select("storage", "Dung lượng", STORAGE_MOBILE, { required: true }),
          select("ram", "RAM", ["3GB", "4GB", "6GB", "8GB", "12GB"]),
          text("chip", "Chip", {
            required: true,
            placeholder: "Ví dụ: A19 Pro",
            suggestions: ["A19 Pro", "A19", "A18 Pro", "A18", "A17 Pro", "A16 Bionic", "A15 Bionic"],
          }),
          text("os", "Hệ điều hành", { placeholder: "Ví dụ: iOS 26" }),
        ],
      },
      {
        title: "Màn hình",
        fields: [
          text("screenSize", "Kích thước màn hình", { required: true, placeholder: "Ví dụ: 6.3 inch" }),
          text("screenTech", "Công nghệ màn hình", {
            placeholder: "Ví dụ: Super Retina XDR OLED, ProMotion 120Hz",
          }),
          text("resolution", "Độ phân giải", { placeholder: "Ví dụ: 2622 x 1206" }),
        ],
      },
      {
        title: "Camera",
        fields: [
          text("rearCamera", "Camera sau", { required: true, placeholder: "Ví dụ: 3 camera 48MP" }),
          text("frontCamera", "Camera trước", { placeholder: "Ví dụ: 18MP" }),
          text("video", "Quay video", { placeholder: "Ví dụ: 4K Dolby Vision 120fps" }),
        ],
      },
      {
        title: "Pin & sạc",
        fields: [
          text("battery", "Pin", { placeholder: "Ví dụ: Phát video đến 33 giờ" }),
          select("port", "Cổng kết nối", ["USB-C", "Lightning"], { required: true }),
          multi("charging", "Các kiểu sạc hỗ trợ", ["Sạc nhanh có dây", "MagSafe", "Qi2", "Qi"]),
        ],
      },
      {
        title: "Kết nối & bảo mật",
        fields: [
          select("network", "Mạng di động", ["4G LTE", "5G"], { required: true }),
          select("sim", "SIM", ["1 nano-SIM + 1 eSIM", "2 nano-SIM", "Dual eSIM", "1 nano-SIM"], { required: true }),
          select("wifi", "Wi-Fi", WIFI),
          text("bluetooth", "Bluetooth", { placeholder: "Ví dụ: Bluetooth 5.3" }),
          select("auth", "Xác thực sinh trắc học", ["Face ID", "Touch ID"]),
          multi("extras", "Tính năng nổi bật", [
            "NFC",
            "Siêu băng thông rộng (UWB)",
            "GPS hai tần số",
            "Dynamic Island",
            "Action Button",
            "Camera Control",
            "SOS khẩn cấp qua vệ tinh",
            "Phát hiện va chạm",
          ]),
        ],
      },
      {
        title: "Thiết kế",
        fields: [
          select("material", "Chất liệu khung", ["Titan", "Nhôm", "Thép không gỉ"]),
          text("waterproof", "Kháng nước & bụi", { placeholder: "Ví dụ: IP68" }),
          text("dimensions", "Kích thước", { placeholder: "Ví dụ: 150 x 71.9 x 8.3 mm" }),
          text("weight", "Trọng lượng", { placeholder: "Ví dụ: 199 g" }),
        ],
      },
      deviceSalesSection,
    ],
  },

  /* -------------------------------- Mac -------------------------------- */
  mac: {
    key: "mac",
    label: "Mac",
    hint: "MacBook, iMac, Mac mini...",
    namePlaceholder: "Ví dụ: MacBook Air 13 inch M4 16GB/256GB",
    featurePlaceholder: "Ví dụ: Pin đến 18 giờ, Touch ID",
    sections: [
      {
        title: "Cấu hình",
        fields: [
          select("series", "Dòng Mac", ["MacBook Air", "MacBook Pro", "iMac", "Mac mini", "Mac Studio", "Mac Pro"], {
            required: true,
          }),
          text("chip", "Chip", {
            required: true,
            placeholder: "Ví dụ: M4 Pro",
            suggestions: ["M5", "M4", "M4 Pro", "M4 Max", "M3", "M3 Pro", "M3 Max", "M2", "M1"],
          }),
          text("cpu", "CPU", { placeholder: "Ví dụ: 10 nhân (4 hiệu năng + 6 tiết kiệm điện)" }),
          text("gpu", "GPU", { placeholder: "Ví dụ: 10 nhân" }),
          select("ram", "RAM (bộ nhớ thống nhất)", ["8GB", "16GB", "24GB", "32GB", "48GB", "64GB", "96GB", "128GB", "192GB"], {
            required: true,
          }),
          select("storage", "Ổ cứng SSD", ["256GB", "512GB", "1TB", "2TB", "4TB", "8TB"], { required: true }),
          text("os", "Hệ điều hành", { placeholder: "Ví dụ: macOS 26" }),
        ],
      },
      {
        title: "Màn hình",
        description: "Mac mini, Mac Studio, Mac Pro không kèm màn hình — bỏ trống mục này.",
        fields: [
          text("screenSize", "Kích thước màn hình", {
            placeholder: "Ví dụ: 13.6 inch",
            suggestions: ["13.6 inch", "14.2 inch", "15.3 inch", "16.2 inch", "24 inch"],
          }),
          text("screenTech", "Công nghệ màn hình", { placeholder: "Ví dụ: Liquid Retina, True Tone" }),
          text("resolution", "Độ phân giải", { placeholder: "Ví dụ: 2560 x 1664" }),
        ],
      },
      {
        title: "Kết nối & bàn phím",
        fields: [
          text("ports", "Cổng kết nối", {
            required: true,
            placeholder: "Ví dụ: 2 x Thunderbolt 4, MagSafe 3, jack 3.5mm",
          }),
          select("wifi", "Wi-Fi", WIFI),
          text("bluetooth", "Bluetooth", { placeholder: "Ví dụ: Bluetooth 5.3" }),
          select("keyboardLayout", "Bố cục bàn phím", ["US (ANSI)", "UK (ISO)", "Nhật (JIS)", "Khác"], {
            hint: "Bỏ trống với Mac mini/Studio/Pro (không kèm bàn phím).",
          }),
          multi("extras", "Thành phần & tính năng", [
            "Touch ID",
            "Magic Keyboard",
            "Magic Mouse",
            "Force Touch trackpad",
            "Camera 1080p",
            "Hệ thống 6 loa",
            "Micro chất lượng studio",
          ]),
        ],
      },
      {
        title: "Pin, nguồn & thiết kế",
        fields: [
          text("battery", "Pin", { placeholder: "Ví dụ: Lên đến 18 giờ xem video" }),
          text("adapter", "Củ sạc kèm máy", { placeholder: "Ví dụ: 70W USB-C" }),
          text("dimensions", "Kích thước", { placeholder: "Ví dụ: 30.41 x 21.5 x 1.13 cm" }),
          text("weight", "Trọng lượng", { placeholder: "Ví dụ: 1.24 kg" }),
        ],
      },
      deviceSalesSection,
    ],
  },

  /* ------------------------------- iPad ------------------------------- */
  ipad: {
    key: "ipad",
    label: "iPad",
    hint: "Máy tính bảng",
    namePlaceholder: "Ví dụ: iPad Air 11 inch M3 Wi-Fi 128GB",
    featurePlaceholder: "Ví dụ: Hỗ trợ Apple Pencil Pro",
    sections: [
      {
        title: "Cấu hình",
        fields: [
          select("series", "Dòng iPad", ["iPad", "iPad mini", "iPad Air", "iPad Pro"], { required: true }),
          text("chip", "Chip", {
            required: true,
            placeholder: "Ví dụ: M3",
            suggestions: ["M5", "M4", "M3", "M2", "M1", "A17 Pro", "A16", "A15 Bionic", "A14 Bionic"],
          }),
          select("ram", "RAM", ["3GB", "4GB", "6GB", "8GB", "12GB", "16GB"]),
          select("storage", "Dung lượng", STORAGE_MOBILE, { required: true }),
          select("connectivity", "Kết nối mạng", ["Wi-Fi", "Wi-Fi + Cellular"], { required: true }),
          text("os", "Hệ điều hành", { placeholder: "Ví dụ: iPadOS 26" }),
        ],
      },
      {
        title: "Màn hình",
        fields: [
          text("screenSize", "Kích thước màn hình", {
            required: true,
            placeholder: "Ví dụ: 11 inch",
            suggestions: ["8.3 inch", "10.2 inch", "10.9 inch", "11 inch", "12.9 inch", "13 inch"],
          }),
          text("screenTech", "Công nghệ màn hình", { placeholder: "Ví dụ: Liquid Retina, True Tone" }),
          text("resolution", "Độ phân giải", { placeholder: "Ví dụ: 2360 x 1640" }),
        ],
      },
      {
        title: "Camera & phụ kiện hỗ trợ",
        fields: [
          text("rearCamera", "Camera sau", { placeholder: "Ví dụ: 12MP" }),
          text("frontCamera", "Camera trước", { placeholder: "Ví dụ: 12MP Center Stage" }),
          multi("pencil", "Apple Pencil hỗ trợ", [
            "Apple Pencil (USB-C)",
            "Apple Pencil (thế hệ 1)",
            "Apple Pencil (thế hệ 2)",
            "Apple Pencil Pro",
          ]),
          multi("keyboard", "Bàn phím hỗ trợ", [
            "Magic Keyboard",
            "Magic Keyboard Folio",
            "Smart Keyboard Folio",
            "Smart Folio",
          ]),
        ],
      },
      {
        title: "Pin, kết nối & thiết kế",
        fields: [
          text("battery", "Pin", { placeholder: "Ví dụ: Lên đến 10 giờ" }),
          select("port", "Cổng sạc", ["USB-C", "Lightning"], { required: true }),
          select("auth", "Xác thực sinh trắc học", ["Touch ID", "Face ID"]),
          select("wifi", "Wi-Fi", WIFI),
          text("bluetooth", "Bluetooth", { placeholder: "Ví dụ: Bluetooth 5.3" }),
          text("weight", "Trọng lượng", { placeholder: "Ví dụ: 462 g" }),
        ],
      },
      deviceSalesSection,
    ],
  },

  /* ------------------------------ Apple Watch ------------------------------ */
  watch: {
    key: "watch",
    label: "Apple Watch",
    hint: "Đồng hồ thông minh",
    namePlaceholder: "Ví dụ: Apple Watch Series 11 GPS 46mm",
    featurePlaceholder: "Ví dụ: Đo ECG, chống nước 50m",
    sections: [
      {
        title: "Cấu hình",
        fields: [
          select("series", "Dòng Apple Watch", ["Apple Watch Series", "Apple Watch SE", "Apple Watch Ultra"], {
            required: true,
          }),
          select("caseSize", "Kích thước mặt", ["40mm", "41mm", "42mm", "44mm", "45mm", "46mm", "49mm"], {
            required: true,
          }),
          select("caseMaterial", "Chất liệu vỏ", ["Nhôm", "Thép không gỉ", "Titan"], { required: true }),
          select("connectivity", "Kết nối", ["GPS", "GPS + Cellular"], { required: true }),
          text("chip", "Chip", {
            placeholder: "Ví dụ: S10",
            suggestions: ["S11", "S10", "S9", "S8", "S7", "S6"],
          }),
          text("os", "Hệ điều hành", { placeholder: "Ví dụ: watchOS 26" }),
        ],
      },
      {
        title: "Dây đeo",
        description: "Dây đeo đi kèm máy khi bán.",
        fields: [
          select(
            "bandType",
            "Loại dây",
            [
              "Sport Band",
              "Sport Loop",
              "Solo Loop",
              "Braided Solo Loop",
              "Milanese Loop",
              "Link Bracelet",
              "Ocean Band",
              "Alpine Loop",
              "Trail Loop",
              "Da",
              "Khác",
            ],
            { required: true },
          ),
          select("bandSize", "Kích cỡ dây", ["S/M", "M/L", "Dùng chung"], { required: true }),
        ],
      },
      {
        title: "Màn hình, pin & sức khỏe",
        fields: [
          text("screenTech", "Màn hình", { placeholder: "Ví dụ: Always-On Retina LTPO OLED, 2000 nits" }),
          text("battery", "Pin", { placeholder: "Ví dụ: Lên đến 18 giờ" }),
          text("waterproof", "Chống nước", { placeholder: "Ví dụ: 50m (WR50)" }),
          multi("sensors", "Cảm biến & sức khỏe", [
            "Điện tâm đồ (ECG)",
            "Oxy trong máu",
            "Nhịp tim",
            "Nhiệt độ cổ tay",
            "Phát hiện ngã",
            "Phát hiện va chạm",
            "Theo dõi giấc ngủ",
          ]),
          multi("extras", "Tính năng khác", [
            "NFC (Apple Pay)",
            "GPS hai tần số",
            "La bàn",
            "Đo độ cao",
            "Wi-Fi",
            "Bluetooth",
            "Siêu băng thông rộng (UWB)",
          ]),
          text("compatibility", "Tương thích iPhone", { placeholder: "Ví dụ: iPhone 11 trở lên" }),
          text("weight", "Trọng lượng", { placeholder: "Ví dụ: 34 g" }),
        ],
      },
      deviceSalesSection,
    ],
  },

  /* ------------------------------- Tai nghe ------------------------------- */
  headphone: {
    key: "headphone",
    label: "Tai nghe",
    hint: "AirPods, Beats",
    namePlaceholder: "Ví dụ: AirPods Pro 3",
    featurePlaceholder: "Ví dụ: Chống ồn chủ động, sạc MagSafe",
    sections: [
      {
        title: "Thông tin tai nghe",
        fields: [
          select("series", "Dòng sản phẩm", ["AirPods", "AirPods Pro", "AirPods Max", "EarPods", "Beats"], {
            required: true,
          }),
          text("generation", "Thế hệ / phiên bản", { placeholder: "Ví dụ: Thế hệ 3" }),
          select("form", "Kiểu dáng", ["In-ear không dây (True Wireless)", "Chụp tai (Over-ear)", "In-ear có dây"], {
            required: true,
          }),
          text("chip", "Chip âm thanh", { placeholder: "Ví dụ: H2", suggestions: ["H2", "H1", "W1"] }),
          select("compat", "Khả năng tương thích", ["Tối ưu cho thiết bị Apple", "Đa nền tảng (Bluetooth)"]),
        ],
      },
      {
        title: "Âm thanh & tính năng",
        fields: [
          multi("audioFeatures", "Tính năng âm thanh", [
            "Chống ồn chủ động (ANC)",
            "Chế độ xuyên âm",
            "Âm thanh thích ứng",
            "Âm thanh không gian",
            "Nhận biết cuộc trò chuyện",
            "Cách ly giọng nói",
          ]),
          multi("smartFeatures", "Tính năng thông minh", [
            "Siri rảnh tay",
            "Tìm qua Find My",
            "Ghép đôi nhanh với iPhone",
            "Chia sẻ âm thanh",
            "Đo nhịp tim",
            "Hỗ trợ trợ thính",
          ]),
          select("control", "Điều khiển", ["Cảm biến lực", "Cảm ứng vuốt", "Digital Crown", "Nút bấm"]),
          text("mic", "Micro", { placeholder: "Ví dụ: 2 micro + cảm biến gia tốc" }),
        ],
      },
      {
        title: "Kết nối & pin",
        fields: [
          text("bluetooth", "Bluetooth", { placeholder: "Ví dụ: Bluetooth 5.3" }),
          text("batteryBuds", "Pin tai nghe", { placeholder: "Ví dụ: Đến 6 giờ (bật ANC)" }),
          text("batteryCase", "Tổng thời lượng pin kèm hộp", { placeholder: "Ví dụ: Đến 30 giờ" }),
          multi("charging", "Cách sạc", ["USB-C", "Lightning", "MagSafe", "Sạc không dây Qi", "Sạc Apple Watch"], {
            required: true,
          }),
          text("waterproof", "Chống nước", { placeholder: "Ví dụ: IP54" }),
          text("weight", "Trọng lượng", { placeholder: "Ví dụ: 5.3 g mỗi bên" }),
        ],
      },
      deviceSalesSection,
    ],
  },

  /* --------------------------------- Loa --------------------------------- */
  speaker: {
    key: "speaker",
    label: "Loa",
    hint: "HomePod, Beats Pill",
    namePlaceholder: "Ví dụ: HomePod mini",
    featurePlaceholder: "Ví dụ: Điều khiển nhà thông minh bằng Siri",
    sections: [
      {
        title: "Thông tin loa",
        fields: [
          select("series", "Dòng sản phẩm", ["HomePod", "HomePod mini", "Beats Pill", "Beats (dòng khác)"], {
            required: true,
          }),
          select("power", "Nguồn điện", ["Cắm điện", "Pin tích hợp"], { required: true }),
          text("chip", "Chip", { placeholder: "Ví dụ: S7", suggestions: ["S7", "S5"] }),
          text("driver", "Cấu hình loa", { placeholder: "Ví dụ: 1 woofer + 5 tweeter" }),
          text("mic", "Micro", { placeholder: "Ví dụ: 4 micro" }),
        ],
      },
      {
        title: "Kết nối & tính năng",
        fields: [
          multi(
            "connectivity",
            "Kết nối",
            ["Wi-Fi", "Bluetooth", "Thread", "Siêu băng thông rộng (UWB)", "AirPlay 2", "USB-C", "Jack 3.5mm"],
            { required: true },
          ),
          multi("smartFeatures", "Tính năng thông minh", [
            "Siri",
            "Trung tâm nhà thông minh (HomeKit / Matter)",
            "Cặp stereo",
            "Âm thanh đa phòng",
            "Âm thanh không gian",
            "Cảm biến nhiệt độ & độ ẩm",
            "Intercom",
            "Chuyển nhạc từ iPhone",
          ]),
        ],
      },
      {
        title: "Pin & thiết kế",
        fields: [
          text("battery", "Pin (nếu có)", {
            placeholder: "Ví dụ: Đến 24 giờ",
            showIf: { key: "power", values: ["Pin tích hợp"] },
          }),
          text("waterproof", "Chống nước", { placeholder: "Ví dụ: IP67" }),
          text("dimensions", "Kích thước", { placeholder: "Ví dụ: Cao 168 mm, đường kính 142 mm" }),
          text("weight", "Trọng lượng", { placeholder: "Ví dụ: 2.3 kg" }),
        ],
      },
      deviceSalesSection,
    ],
  },

  /* -------------------------------- Phụ kiện -------------------------------- */
  accessory: {
    key: "accessory",
    label: "Phụ kiện",
    hint: "Ốp, cáp, sạc, dây đeo...",
    namePlaceholder: "Ví dụ: Ốp lưng MagSafe cho iPhone 17 Pro",
    featurePlaceholder: "Ví dụ: Chống sốc 3 mét, tương thích MagSafe",
    sections: [
      {
        title: "Loại & tương thích",
        description: "Chọn loại phụ kiện — các trường chi tiết bên dưới sẽ tự thay đổi theo loại.",
        fields: [
          select("accessoryType", "Loại phụ kiện", ACCESSORY_TYPES, { required: true }),
          select(
            "brand",
            "Thương hiệu",
            ["Apple", "Belkin", "Anker", "Spigen", "UAG", "ESR", "Baseus", "Native Union", "Mophie", "Khác"],
            { required: true },
          ),
          multi(
            "compatibleDevices",
            "Nhóm thiết bị tương thích",
            ["iPhone", "iPad", "Mac / MacBook", "Apple Watch", "AirPods", "Apple TV / HomePod", "Tất cả thiết bị Apple"],
            { required: true },
          ),
          text("compatibleModels", "Model tương thích cụ thể", {
            required: true,
            placeholder: "Ví dụ: iPhone 17 Pro Max",
          }),
        ],
      },
      {
        title: "Chi tiết phụ kiện",
        fields: [
          text("material", "Chất liệu", {
            placeholder: "Ví dụ: Silicone",
            suggestions: ["Silicone", "TPU trong", "Da", "Nhựa PC", "Kính cường lực", "Nhôm", "Vải dệt", "Nylon bện"],
            showIf: showFor([...ACC_CASE, ...ACC_SCREEN, ...ACC_BAND, ...ACC_STAND]),
          }),
          multi(
            "protection",
            "Tính năng bảo vệ",
            [
              "Chống sốc chuẩn quân đội",
              "Tương thích MagSafe",
              "Chống bám vân tay",
              "Chống trầy",
              "Chống nhìn trộm",
              "Viền nâng bảo vệ camera",
              "Chống ố vàng",
            ],
            { showIf: showFor([...ACC_CASE, ...ACC_SCREEN]) },
          ),
          select("bandWatchSize", "Kích thước mặt đồng hồ phù hợp", ["38/40/41/42mm", "42/44/45/46mm", "49mm"], {
            required: true,
            showIf: showFor(ACC_BAND),
          }),
          select("bandSize", "Kích cỡ dây", ["S/M", "M/L", "Dùng chung"], { showIf: showFor(ACC_BAND) }),
          text("connector", "Chuẩn đầu nối", {
            required: true,
            placeholder: "Ví dụ: USB-C ↔ USB-C",
            suggestions: ["USB-C ↔ USB-C", "USB-C ↔ Lightning", "USB-A ↔ Lightning", "USB-A ↔ USB-C", "Thunderbolt 4", "HDMI", "MagSafe 3"],
            showIf: showFor([...ACC_CABLE, ...ACC_HUB]),
          }),
          text("cableLength", "Độ dài cáp", {
            placeholder: "Ví dụ: 1m",
            suggestions: ["0.5m", "1m", "2m", "3m"],
            showIf: showFor(ACC_CABLE),
          }),
          text("wattage", "Công suất tối đa", {
            placeholder: "Ví dụ: 30W",
            showIf: showFor([...ACC_CABLE, ...ACC_POWER]),
          }),
          text("capacity", "Dung lượng pin", {
            required: true,
            placeholder: "Ví dụ: 10000mAh",
            showIf: showFor(["Pin dự phòng"]),
          }),
          multi("chargeStandard", "Chuẩn sạc", ["USB Power Delivery (PD)", "PPS", "MagSafe", "Qi2", "Qi"], {
            showIf: showFor([...ACC_CABLE, ...ACC_POWER]),
          }),
          select("mfi", "Chứng nhận MFi", ["Có", "Không", "Không áp dụng"], {
            hint: "Cáp/sạc Lightning không MFi dễ báo lỗi phụ kiện không được hỗ trợ.",
            showIf: showFor([...ACC_CABLE, ...ACC_POWER]),
          }),
          text("pack", "Quy cách đóng gói", { placeholder: "Ví dụ: 1 chiếc / bộ 2 chiếc" }),
        ],
      },
    ],
  },
};

export const PRODUCT_TYPE_LIST: ProductTypeConfig[] = Object.values(PRODUCT_TYPES);

/* ------------------------------------------------------------------ */
/* Tiện ích                                                            */
/* ------------------------------------------------------------------ */

export function isFieldVisible(field: SpecField, specs: Record<string, SpecValue>): boolean {
  if (!field.showIf) return true;
  const current = specs[field.showIf.key];
  return typeof current === "string" && field.showIf.values.includes(current);
}

export function getAllFields(type: ProductType): SpecField[] {
  return PRODUCT_TYPES[type].sections.flatMap((section) => section.fields);
}

export function getVisibleFields(type: ProductType, specs: Record<string, SpecValue>): SpecField[] {
  return getAllFields(type).filter((field) => isFieldVisible(field, specs));
}

const isEmpty = (value: SpecValue | undefined) =>
  value === undefined || (Array.isArray(value) ? value.length === 0 : value.trim() === "");

/** Khi đổi loại sản phẩm: chỉ giữ lại giá trị còn hợp lệ ở loại mới (vd. regionCode). */
export function pruneSpecs(specs: Record<string, SpecValue>, type: ProductType): Record<string, SpecValue> {
  const fields = new Map(getAllFields(type).map((field) => [field.key, field]));
  const next: Record<string, SpecValue> = {};

  for (const [key, value] of Object.entries(specs)) {
    const field = fields.get(key);
    if (!field) continue;
    if (field.kind === "select" && (Array.isArray(value) || !field.options.includes(value))) continue;
    if (field.kind === "multiselect" && (!Array.isArray(value) || !value.every((v) => field.options.includes(v)))) continue;
    if (field.kind === "text" && Array.isArray(value)) continue;
    next[key] = value;
  }

  return next;
}

/** Lọc specs trước khi lưu: bỏ trường đang ẩn, trường rỗng, và trim chuỗi. */
export function collectSpecs(type: ProductType, specs: Record<string, SpecValue>): Record<string, SpecValue> {
  const result: Record<string, SpecValue> = {};

  for (const field of getVisibleFields(type, specs)) {
    const value = specs[field.key];
    if (isEmpty(value)) continue;
    result[field.key] = Array.isArray(value) ? value : (value as string).trim();
  }

  return result;
}

export { isEmpty as isSpecEmpty };

export interface SpecGroup {
  title: string;
  rows: { label: string; value: string }[];
}

/** Dùng cho trang Chi tiết: gom thông số đã nhập theo từng nhóm để hiển thị. */
export function getSpecGroups(type: ProductType, specs: Record<string, SpecValue> | undefined): SpecGroup[] {
  if (!specs) return [];

  return PRODUCT_TYPES[type].sections
    .map((section) => ({
      title: section.title,
      rows: section.fields
        .filter((field) => !isEmpty(specs[field.key]))
        .map((field) => {
          const value = specs[field.key];
          return { label: field.label, value: Array.isArray(value) ? value.join(", ") : value };
        }),
    }))
    .filter((group) => group.rows.length > 0);
}