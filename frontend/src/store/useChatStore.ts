
import { create } from "zustand";
import toast from "react-hot-toast";
import { axiosInstance } from "../lib/axios";
import { useAuthStore } from "./useAuthStore";

interface User {
  _id: string;
  fullName: string;
  profilePic?: string;
  email?: string;
  createdAt?: string;
}

interface Message {
  _id: string;
  senderId: string;
  receiverId: string;
  createdAt: string;
  image?: string;
  text?: string;
}

interface ChatStoreState {
  messages: Message[];
  users: User[];
  selectedUser: User | null;
  isUsersLoading: boolean;
  isMessagesLoading: boolean;
  getUsers: () => Promise<void>;
  getMessages: (userId: string) => Promise<void>;
  sendMessage: (messageData: { text: string; image: string | null }) => Promise<void>;
  subscribeToMessages: () => void;
  unsubscribeFromMessages: () => void;
  setSelectedUser: (selectedUser: User | null) => void;
}

export const useChatStore = create<ChatStoreState>((set, get) => ({
  messages: [],
  users: [],
  selectedUser: null,
  isUsersLoading: false,
  isMessagesLoading: false,

  getUsers: async () => {
    set({ isUsersLoading: true });
    try {
      const res = await axiosInstance.get("/messages/users");
      set({ users: res.data });
    } catch (error: any) {
      toast.error(error.response?.data?.message || "Failed to fetch users");
    } finally {
      set({ isUsersLoading: false });
    }
  },

  getMessages: async (userId: string) => {
    set({ isMessagesLoading: true });
    try {
      if (userId) {
        const res = await axiosInstance.get(`/messages/${userId}`);
        set({ messages: res.data });
      }
    } catch (error: any) {
      toast.error(error.response?.data?.message || "Failed to fetch messages");
    } finally {
      set({ isMessagesLoading: false });
    }
  },
  sendMessage: async (messageData: { text: string; image: string | null }) => {
    const { selectedUser, messages } = get() as ChatStoreState;
    try {
      if (!selectedUser) throw new Error("No user selected");
      const res = await axiosInstance.post(
        `/messages/send/${selectedUser._id}`,
        messageData
      );
      set({ messages: [...messages, res.data] });
    } catch (error: any) {
      toast.error(error.response?.data?.message || "Failed to send message");
    } finally {
      set({ isMessagesLoading: false });
    }
  },

  subscribeToMessages: () => {
    const { selectedUser } = get() as ChatStoreState;
    if (!selectedUser) return;

    const socket = (useAuthStore.getState() as any).socket;
    const authUser = useAuthStore.getState().authUser;
    
    if (!authUser) return;
    
    socket.on("newMessage", (newMessage: Message) => {
      const { selectedUser: currentSelectedUser } = get() as ChatStoreState;
      
      const isRelevantMessage = 
        (newMessage.senderId === currentSelectedUser?._id && newMessage.receiverId === authUser._id) ||
        (newMessage.senderId === authUser._id && newMessage.receiverId === currentSelectedUser?._id);
      
      if (!isRelevantMessage) return;

      const currentMessages = (get() as ChatStoreState).messages;
      const messageExists = currentMessages.some(msg => msg._id === newMessage._id);
      
      if (!messageExists) {
        set({
          messages: [...currentMessages, newMessage],
        });
      }
    });
  },

  unsubscribeFromMessages: () => {
    const socket = (useAuthStore.getState() as any).socket;
    socket.off("newMessage");
  },

  setSelectedUser: (selectedUser: User | null) => set({ selectedUser }),
}));
