import { useEffect } from "react";
import { useAuthStore } from "../stores/authStore";
import { authApi } from "../lib/api";

export function useAuth() {
  const { user, isLoading, isAuthenticated, setUser, login, logout, setLoading } = useAuthStore();

  useEffect(() => {
    const token = localStorage.getItem("accessToken");
    if (!token) {
      setLoading(false);
      return;
    }
    authApi
      .me()
      .then((res: any) => setUser(res.data?.user))
      .catch(() => {
        localStorage.removeItem("accessToken");
        localStorage.removeItem("refreshToken");
        setLoading(false);
      });
  }, []);

  return { user, isLoading, isAuthenticated, login, logout };
}
