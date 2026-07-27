import { useEffect, useRef } from "react";
import { io, Socket } from "socket.io-client";
import { useAuthStore } from "../stores/authStore";

export function useSocket() {
  const socketRef = useRef<Socket | null>(null);
  const { isAuthenticated, user } = useAuthStore();

  useEffect(() => {
    if (!isAuthenticated || !user) return;
    const socket = io("/", { query: { userId: user.id } });
    socketRef.current = socket;
    return () => {
      socket.close();
      socketRef.current = null;
    };
  }, [isAuthenticated, user?.id]);

  return socketRef;
}
