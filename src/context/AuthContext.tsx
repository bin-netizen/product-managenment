import {
  createContext,
  useContext,
  useState,
  useEffect,
  type ReactNode,
} from "react";

const API_URL = import.meta.env.VITE_API_URL ?? "http://localhost:3000";

interface User {
  id: number;
  name: string;
  email: string;
  role: string;
}

interface AuthContextType {
  user: User | null;
  token: string | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  login: (email: string, password: string) => Promise<void>;
  logout: () => void;
}

interface AuthState {
  user: User | null;
  token: string | null;
}

function getInitialAuthState(): AuthState {
  const savedToken = localStorage.getItem("access_token");
  const savedUser = localStorage.getItem("user");

  if (!savedToken || !savedUser) {
    return { user: null, token: null };
  }

  try {
    const user = JSON.parse(savedUser) as User;

    if (
      typeof user.id !== "number" ||
      typeof user.name !== "string" ||
      typeof user.email !== "string" ||
      typeof user.role !== "string"
    ) {
      throw new Error("Thông tin người dùng không hợp lệ");
    }

    return {
      user,
      token: savedToken,
    };
  } catch {
    localStorage.removeItem("access_token");
    localStorage.removeItem("user");

    return { user: null, token: null };
  }
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [auth, setAuth] = useState<AuthState>(getInitialAuthState);

  const { user, token } = auth;

  // Đăng nhập
  async function login(email: string, password: string): Promise<void> {
    let response: Response;

    try {
      response = await fetch(`${API_URL}/auth/login`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ email, password }),
      });
    } catch {
      // fetch chỉ ném lỗi khi mất mạng / server không phản hồi
      throw new Error("Không kết nối được máy chủ. Kiểm tra mạng rồi thử lại.");
    }

    if (response.status === 401) {
      throw new Error("Email hoặc mật khẩu không đúng");
    }

    if (response.status === 429) {
      throw new Error("Bạn thử quá nhiều lần. Vui lòng đợi vài phút rồi thử lại.");
    }

    if (!response.ok) {
      throw new Error("Máy chủ đang gặp lỗi. Vui lòng thử lại sau.");
    }

    let data: { access_token?: string; user?: User };

    try {
      data = await response.json();
    } catch {
      throw new Error("Dữ liệu đăng nhập không hợp lệ");
    }

    if (!data.access_token || !data.user) {
      throw new Error("Dữ liệu đăng nhập không hợp lệ");
    }

    localStorage.setItem("access_token", data.access_token);
    localStorage.setItem("user", JSON.stringify(data.user));

    setAuth({
      token: data.access_token,
      user: data.user,
    });
  }

  // Đăng xuất
  function logout(): void {
    localStorage.removeItem("access_token");
    localStorage.removeItem("user");

    setAuth({
      token: null,
      user: null,
    });
  }

  // Tự động đăng xuất khi API trả về 401
  useEffect(() => {
    function handleUnauthorized() {
      localStorage.removeItem("access_token");
      localStorage.removeItem("user");

      setAuth({
        token: null,
        user: null,
      });
    }

    window.addEventListener("auth:unauthorized", handleUnauthorized);

    return () => {
      window.removeEventListener("auth:unauthorized", handleUnauthorized);
    };
  }, []);

  return (
    <AuthContext.Provider
      value={{
        user,
        token,
        isAuthenticated: !!token,
        isLoading: false,
        login,
        logout,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

// eslint-disable-next-line react-refresh/only-export-components
export function useAuth() {
  const context = useContext(AuthContext);

  if (!context) {
    throw new Error("useAuth phải được sử dụng bên trong AuthProvider");
  }

  return context;
}