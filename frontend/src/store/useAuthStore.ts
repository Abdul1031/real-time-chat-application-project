import { create } from "zustand";
import { axiosInstance, SOCKET_URL } from "../lib/axios.js";
import toast from "react-hot-toast";
import { io, Socket } from "socket.io-client";

// this is the user object, like what info user has
interface AuthUser {
  _id: string;
  fullName: string;
  profilePic?: string;
  email?: string;
  createdAt?: string;
}

// this is the whole auth store state, like all the things we are handling about user
interface AuthStoreState {
  authUser: AuthUser | null;
  isSigningUp: boolean;
  isLoggingIn: boolean;
  isUpdatingProfile: boolean;
  isCheckingAuth: boolean;
  socket: Socket | null;
  onlineUsers: string[];
  checkAuth: () => Promise<void>;
  signup: (data: { fullName: string; email: string; password: string }) => Promise<void>;
  login: (data: { email: string; password: string }) => Promise<void>;
  logout: () => Promise<void>;
  updateProfile: (data: { profilePic?: string }) => Promise<void>;
  connectSocket: () => void;
  disconnectSocket: () => void;
}

// this is the zustand store where we put all our auth logic
export const useAuthStore = create<AuthStoreState>((set, get) => ({
  authUser: null,
  isSigningUp: false,
  isLoggingIn: false,
  isUpdatingProfile: false,
  isCheckingAuth: true,
  socket: null,
  onlineUsers: [],

  // this function is just checking if user is logged in or not
  checkAuth: async () => {
    try {
      const res = await axiosInstance.get("/auth/check");
      set({ authUser: res.data });
      get().connectSocket();
    } catch (error: any) {
      set({ authUser: null });
    } finally {
      set({ isCheckingAuth: false });
    }
  },

  // this function is used when new user wants to signup
  signup: async (data: { fullName: string; email: string; password: string }) => {
    set({ isSigningUp: true });
    try {
      const res = await axiosInstance.post("/auth/signup", data);
      set({ authUser: res.data });
      toast.success("Account created successfully");
      get().connectSocket();
    } catch (error: any) {
      toast.error(error.response?.data?.message || "Signup failed");
    } finally {
      set({ isSigningUp: false });
    }
  },

  // this function is used when user wants to login
  login: async (data: { email: string; password: string }) => {
    set({ isLoggingIn: true });
    try {
      const res = await axiosInstance.post("/auth/login", data);
      set({ authUser: res.data });
      toast.success("Logged in successfully");
      get().connectSocket();
    } catch (error: any) {
      toast.error(error.response?.data?.message || "Login failed");
    } finally {
      set({ isLoggingIn: false });
    }
  },

  // this function is for logging out the user
  logout: async () => {
    try {
      await axiosInstance.post("/auth/logout");
      set({ authUser: null });
      toast.success("Logged out successfully");
      get().disconnectSocket();
    } catch (error: any) {
      toast.error(error.response?.data?.message || "Logout failed");
    } finally {
      set({ isCheckingAuth: false });
    }
  },

  // this function updates user profile (like profile pic)
  updateProfile: async (data: { profilePic?: string }) => {
    set({ isUpdatingProfile: true });
    try {
      const res = await axiosInstance.put("/auth/update-profile", data);
      set({ authUser: res.data });
      toast.success("Profile updated successfully");
    } catch (error: any) {
      toast.error(error.response?.data?.message || "Update failed");
    } finally {
      set({ isUpdatingProfile: false });
    }
  },

  // this function connects the socket when user is logged in
  connectSocket: () => {
    const { authUser, socket } = get();
    if (!authUser || socket?.connected) return;

    const newSocket = io(SOCKET_URL, {
      auth: {
        userId: authUser._id,
      },
      transports: ["websocket", "polling"],
    });

    newSocket.on("connect_error", (error) => {
      console.error("Socket connect error:", error);
    });

    newSocket.on("disconnect", (reason) => {
      console.warn("Socket disconnected:", reason);
    });

    newSocket.on("getOnlineUsers", (userIds: string[]) => {
      set({ onlineUsers: userIds });
    });

    set({ socket: newSocket });
  },

  // this function disconnects the socket when user logs out
  disconnectSocket: () => {
    const { socket } = get();
    if (socket?.connected) socket.disconnect();
    set({ socket: null, onlineUsers: [] });
  },
}));

// if a request comes back 401 (e.g. cookie expired), drop local auth state
// so the UI reflects the logged-out state instead of hanging in a broken session
window.addEventListener("auth:unauthorized", () => {
  const { authUser, disconnectSocket } = useAuthStore.getState();
  if (authUser) {
    disconnectSocket();
    useAuthStore.setState({ authUser: null });
  }
});
