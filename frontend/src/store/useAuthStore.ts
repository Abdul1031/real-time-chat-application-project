import { create } from "zustand";
import { axiosInstance } from "../lib/axios.js";
import toast from "react-hot-toast";
import { io } from "socket.io-client";

// this is base url where api is running, i am just removing /api from it
const BASE_URL = import.meta.env.VITE_API_URL?.replace('/api', '') || '';

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
  socket: any;
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

  // this function is just checking if user is logged in or not
  checkAuth: async () => {
    try {
      const res = await axiosInstance.get("/auth/check");
      set({ authUser: res.data });
      (get() as AuthStoreState).connectSocket();
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
      (get() as AuthStoreState).connectSocket();
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
      (get() as AuthStoreState).connectSocket();
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
      (get() as AuthStoreState).disconnectSocket();
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
    const { authUser, socket } = get() as AuthStoreState;
    if (!authUser || socket?.connected) return;

    const newSocket = io(BASE_URL, {
      query: {
        userId: authUser._id,
      },
    });
    newSocket.connect();
    set({ socket: newSocket });
  },

  // this function disconnects the socket when user logs out
  disconnectSocket: () => {
    const { socket } = get() as AuthStoreState;
    if (socket?.connected) socket.disconnect();
  },
}));
