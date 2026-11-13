import {
  lazy,
  Suspense,
  useEffect,
  useRef,
  useState,
  type AnimationEvent,
  type CSSProperties,
  type FormEvent,
  type KeyboardEvent,
} from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import "./Login.css";

// Tải mô hình 3D theo yêu cầu: three.js khá nặng, không nên nằm trong bundle chính
const Galaxy1 = lazy(() => import("../components/Galaxy1"));

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const WORDS = ["iPhone", "Mac", "iPad", "Apple Watch", "AirPods", "Phụ kiện"];

// Thiên hà phủ kín cả trang, làm hình nền
const GALAXY_STYLE: CSSProperties = {
  position: "absolute",
  inset: 0,
  width: "100%",
  height: "100%",
  aspectRatio: "auto",
};

function EyeIcon({ off }: { off: boolean }) {
  return (
    <svg
      width="20"
      height="20"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.8"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      <path d="M2 12s3.6-7 10-7 10 7 10 7-3.6 7-10 7S2 12 2 12Z" />
      <circle cx="12" cy="12" r="3" />
      {off && <path d="M4 4l16 16" />}
    </svg>
  );
}

function BrandMark() {
  return (
    <svg
      width="20"
      height="20"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.8"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      <path d="M21 8 12 3 3 8l9 5 9-5Z" />
      <path d="M3 8v8l9 5 9-5V8" />
      <path d="M12 13v8" />
    </svg>
  );
}

function Login() {
  const { login } = useAuth();
  const navigate = useNavigate();

  const emailRef = useRef<HTMLInputElement>(null);
  const passwordRef = useRef<HTMLInputElement>(null);

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [capsLock, setCapsLock] = useState(false);
  const [touched, setTouched] = useState({ email: false, password: false });
  const [error, setError] = useState("");
  const [shake, setShake] = useState(false);
  const [loading, setLoading] = useState(false);
  const [wordIndex, setWordIndex] = useState(0);

  // Tự focus ô email khi vào trang
  useEffect(() => {
    emailRef.current?.focus();
  }, []);

  // Đổi từ khoá chạy chữ mỗi vài giây (tắt nếu người dùng giảm chuyển động)
  useEffect(() => {
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;

    const id = window.setInterval(() => {
      setWordIndex((i) => (i + 1) % WORDS.length);
    }, 2600);

    return () => window.clearInterval(id);
  }, []);

  const trimmedEmail = email.trim();
  const emailError = !trimmedEmail
    ? "Nhập email của bạn"
    : !EMAIL_RE.test(trimmedEmail)
      ? "Email chưa đúng định dạng, ví dụ: admin@shop.vn"
      : "";
  const passwordError = !password ? "Nhập mật khẩu" : "";

  const showEmailError = touched.email && emailError;
  const showPasswordError = touched.password && passwordError;

  function handleAnimationEnd(event: AnimationEvent<HTMLDivElement>) {
    if (event.animationName === "lg-shake") setShake(false);
  }

  function handlePasswordKey(event: KeyboardEvent<HTMLInputElement>) {
    setCapsLock(event.getModifierState("CapsLock"));
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (loading) return;

    setError("");
    setTouched({ email: true, password: true });

    if (emailError || passwordError) {
      if (emailError) emailRef.current?.focus();
      else passwordRef.current?.focus();
      setShake(true);
      return;
    }

    setLoading(true);

    try {
      await login(trimmedEmail, password);
      navigate("/", { replace: true });
    } catch (err) {
      setError(err instanceof Error ? err.message : "Đăng nhập thất bại!");
      setPassword("");
      passwordRef.current?.focus();
      setShake(true);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="lg-page">
      {/* Hình nền 3D phủ kín trang */}
      <Suspense fallback={null}>
        <Galaxy1 className="lg-galaxy" style={GALAXY_STYLE} />
      </Suspense>
      <div className="lg-shade" aria-hidden="true" />

      <aside className="lg-hero">
        <div className="lg-brand">
          <span className="lg-brand-mark">
            <BrandMark />
          </span>
          <span>Product Management</span>
        </div>

        <div className="lg-hero-body">
          <h2 className="lg-headline">
            <span>Quản lý</span>
            <span className="lg-word" key={wordIndex}>
              {WORDS[wordIndex]}
            </span>
            <span>gọn gàng hơn.</span>
          </h2>
          <p className="lg-hero-note">
            Sản phẩm, tồn kho và đơn hàng của cửa hàng, gom về một nơi.
          </p>
        </div>

        <p className="lg-hero-foot">Chỉ dành cho quản trị viên được cấp quyền.</p>
      </aside>

      <main className="lg-main">
        <div
          className={`lg-card${shake ? " lg-card--shake" : ""}`}
          onAnimationEnd={handleAnimationEnd}
        >
          <header className="lg-header">
            <h1>Đăng nhập quản trị</h1>
            <p>Nhập tài khoản để vào khu vực quản lý.</p>
          </header>

          <form className="lg-form" onSubmit={handleSubmit} noValidate>
            <div
              className={`lg-field${showEmailError ? " lg-field--invalid" : ""}`}
            >
              <input
                ref={emailRef}
                id="lg-email"
                type="email"
                inputMode="email"
                autoComplete="username"
                placeholder=" "
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                onBlur={() => setTouched((t) => ({ ...t, email: true }))}
                aria-invalid={!!showEmailError}
                aria-describedby={showEmailError ? "lg-email-hint" : undefined}
              />
              <label htmlFor="lg-email">Email</label>
              {showEmailError && (
                <p className="lg-hint" id="lg-email-hint">
                  {emailError}
                </p>
              )}
            </div>

            <div
              className={`lg-field${showPasswordError ? " lg-field--invalid" : ""}`}
            >
              <input
                ref={passwordRef}
                id="lg-password"
                type={showPassword ? "text" : "password"}
                autoComplete="current-password"
                placeholder=" "
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                onBlur={() => {
                  setTouched((t) => ({ ...t, password: true }));
                  setCapsLock(false);
                }}
                onKeyDown={handlePasswordKey}
                onKeyUp={handlePasswordKey}
                aria-invalid={!!showPasswordError}
                aria-describedby={
                  showPasswordError ? "lg-password-hint" : undefined
                }
              />
              <label htmlFor="lg-password">Mật khẩu</label>
              <button
                type="button"
                className="lg-toggle"
                onClick={() => setShowPassword((v) => !v)}
                aria-label={showPassword ? "Ẩn mật khẩu" : "Hiện mật khẩu"}
                aria-pressed={showPassword}
              >
                <EyeIcon off={showPassword} />
              </button>
              {showPasswordError && (
                <p className="lg-hint" id="lg-password-hint">
                  {passwordError}
                </p>
              )}
              {!showPasswordError && capsLock && (
                <p className="lg-hint lg-hint--note">Caps Lock đang bật</p>
              )}
            </div>

            <div className="lg-alert" role="alert" aria-live="assertive">
              {error && <p>{error}</p>}
            </div>

            <button type="submit" className="lg-submit" disabled={loading}>
              {loading && <span className="lg-spinner" aria-hidden="true" />}
              <span>{loading ? "Đang đăng nhập…" : "Đăng nhập"}</span>
            </button>
          </form>
        </div>
      </main>
    </div>
  );
}

export default Login;