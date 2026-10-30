
import {
  createContext,
  useContext,
  useState,
  useEffect,
  type ReactNode,
} from "react";

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

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [token, setToken] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  // Khôi phục thông tin đăng nhập khi tải lại trang
  useEffect(() => {
    const savedToken = localStorage.getItem("access_token");
    const savedUser = localStorage.getItem("user");

    if (savedToken && savedUser) {
      try {
        setToken(savedToken);
        setUser(JSON.parse(savedUser));
      } catch {
        localStorage.removeItem("access_token");
        localStorage.removeItem("user");
      }
    }

    setIsLoading(false);
  }, []);

  // Đăng nhập
  async function login(email: string, password: string) {
    const response = await fetch("http://localhost:3000/auth/login", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ email, password }),
    });

    if (!response.ok) {
      throw new Error("Email hoặc mật khẩu không đúng");
    }

    const data = await response.json();

    localStorage.setItem("access_token", data.access_token);
    localStorage.setItem("user", JSON.stringify(data.user));

    setToken(data.access_token);
    setUser(data.user);
  }

  // Đăng xuất
  function logout() {
    localStorage.removeItem("access_token");
    localStorage.removeItem("user");

    setToken(null);
    setUser(null);
  }
// Tự động đăng xuất khi API trả về 401
useEffect(() => {
  function handleUnauthorized() {
    logout();
  }

  window.addEventListener("auth:unauthorized", handleUnauthorized);

  return () => {
    window.removeEventListener(
      "auth:unauthorized",
      handleUnauthorized,
    );
  };
}, []);
  return (
    <AuthContext.Provider
      value={{
        user,
        token,
        isAuthenticated: !!token,
        isLoading,
        login,
        logout,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);

  if (!context) {
    throw new Error("useAuth phải được sử dụng bên trong AuthProvider");
  }

  return context;
}
