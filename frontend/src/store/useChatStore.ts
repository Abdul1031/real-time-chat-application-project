import { create } from "zustand";
import toast from "react-hot-toast";
import { axiosInstance } from "../lib/axios";
import { useAuthStore } from "./useAuthStore";

// this is the user object, it has all info about a user
export interface User {
  _id: string;
  fullName: string;
  profilePic?: string;
  email?: string;
  createdAt?: string;
}

export interface ReplyPreviewData {
  _id: string;
  text?: string;
  image?: string;
  senderId: string;
}

export interface Reaction {
  userId: string;
  emoji: string;
}

// this is the message object, what a message looks like
export interface Message {
  _id: string;
  senderId: string;
  receiverId: string;
  createdAt: string;
  image?: string;
  text?: string;
  status?: "sent" | "delivered" | "seen";
  replyTo?: ReplyPreviewData | null;
  reactions?: Reaction[];
  isPending?: boolean;
  isFailed?: boolean;
}

interface SendMessagePayload {
  text: string;
  image: string | null;
}

// this is the chat store, it keeps all chat related states and functions
interface ChatStoreState {
  messages: Message[];
  users: User[];
  selectedUser: User | null;
  isUsersLoading: boolean;
  isMessagesLoading: boolean;
  isFetchingMore: boolean;
  hasMoreMessages: boolean;
  unreadCounts: Record<string, number>;
  isPeerTyping: boolean;
  replyingTo: Message | null;
  listenersInitialized: boolean;

  getUsers: () => Promise<void>;
  getMessages: (userId: string, before?: string) => Promise<void>;
  loadMoreMessages: () => Promise<void>;
  sendMessage: (messageData: SendMessagePayload) => Promise<void>;
  retryMessage: (localId: string) => Promise<void>;
  setSelectedUser: (selectedUser: User | null) => void;
  setReplyingTo: (message: Message | null) => void;
  toggleReaction: (messageId: string, emoji: string) => Promise<void>;
  markAsSeen: (peerId: string) => Promise<void>;
  clearUnread: (userId: string) => void;
  initSocketListeners: () => void;
  teardownSocketListeners: () => void;
}

let typingTimeout: ReturnType<typeof setTimeout> | null = null;

export const useChatStore = create<ChatStoreState>((set, get) => ({
  messages: [],
  users: [],
  selectedUser: null,
  isUsersLoading: false,
  isMessagesLoading: false,
  isFetchingMore: false,
  hasMoreMessages: false,
  unreadCounts: {},
  isPeerTyping: false,
  replyingTo: null,
  listenersInitialized: false,

  // this function gets all the users that can chat
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

  // this function gets messages with a selected user; pass `before` to load an older page
  getMessages: async (userId: string, before?: string) => {
    if (!userId) return;
    set(before ? { isFetchingMore: true } : { isMessagesLoading: true });
    try {
      const res = await axiosInstance.get(`/messages/${userId}`, {
        params: before ? { before } : undefined,
      });
      const { messages: page, hasMore } = res.data as {
        messages: Message[];
        hasMore: boolean;
      };
      set((state) => ({
        messages: before ? [...page, ...state.messages] : page,
        hasMoreMessages: hasMore,
      }));
    } catch (error: any) {
      toast.error(error.response?.data?.message || "Failed to fetch messages");
    } finally {
      set(before ? { isFetchingMore: false } : { isMessagesLoading: false });
    }
  },

  // load an older page of the currently open conversation
  loadMoreMessages: async () => {
    const { selectedUser, messages, hasMoreMessages, isFetchingMore } = get();
    if (!selectedUser || !hasMoreMessages || isFetchingMore || messages.length === 0) return;
    await get().getMessages(selectedUser._id, messages[0].createdAt);
  },

  // this function sends a new message to the selected user, optimistically
  sendMessage: async (messageData: SendMessagePayload) => {
    const { selectedUser, replyingTo } = get();
    const authUser = useAuthStore.getState().authUser;
    if (!selectedUser || !authUser) return;

    const localId = `local-${Date.now()}-${Math.random().toString(36).slice(2)}`;
    const optimisticMessage: Message = {
      _id: localId,
      senderId: authUser._id,
      receiverId: selectedUser._id,
      text: messageData.text,
      image: messageData.image ?? undefined,
      createdAt: new Date().toISOString(),
      status: "sent",
      reactions: [],
      replyTo: replyingTo
        ? {
            _id: replyingTo._id,
            text: replyingTo.text,
            image: replyingTo.image,
            senderId: replyingTo.senderId,
          }
        : null,
      isPending: true,
    };

    set((state) => ({
      messages: [...state.messages, optimisticMessage],
      replyingTo: null,
    }));

    try {
      const res = await axiosInstance.post(`/messages/send/${selectedUser._id}`, {
        text: messageData.text,
        image: messageData.image,
        replyTo: replyingTo?._id,
      });
      set((state) => ({
        messages: state.messages.map((m) => (m._id === localId ? res.data : m)),
      }));
    } catch (error: any) {
      set((state) => ({
        messages: state.messages.map((m) =>
          m._id === localId ? { ...m, isPending: false, isFailed: true } : m
        ),
      }));
      toast.error(error.response?.data?.error || "Failed to send message");
    }
  },

  // retries a message that previously failed to send
  retryMessage: async (localId: string) => {
    const { messages, selectedUser } = get();
    const message = messages.find((m) => m._id === localId);
    if (!message || !selectedUser) return;

    set((state) => ({
      messages: state.messages.map((m) =>
        m._id === localId ? { ...m, isPending: true, isFailed: false } : m
      ),
    }));

    try {
      const res = await axiosInstance.post(`/messages/send/${selectedUser._id}`, {
        text: message.text,
        image: message.image,
        replyTo: message.replyTo?._id,
      });
      set((state) => ({
        messages: state.messages.map((m) => (m._id === localId ? res.data : m)),
      }));
    } catch (error: any) {
      set((state) => ({
        messages: state.messages.map((m) =>
          m._id === localId ? { ...m, isPending: false, isFailed: true } : m
        ),
      }));
      toast.error(error.response?.data?.error || "Failed to send message");
    }
  },

  // this just changes which user is selected in chat, and loads/marks their thread
  setSelectedUser: (selectedUser: User | null) => {
    set({
      selectedUser,
      messages: [],
      hasMoreMessages: false,
      isPeerTyping: false,
      replyingTo: null,
    });
    if (selectedUser) {
      get().clearUnread(selectedUser._id);
      get().getMessages(selectedUser._id).then(() => get().markAsSeen(selectedUser._id));
    }
  },

  setReplyingTo: (message: Message | null) => set({ replyingTo: message }),

  // adds/removes the current user's reaction to a message
  toggleReaction: async (messageId: string, emoji: string) => {
    const authUser = useAuthStore.getState().authUser;
    if (!authUser) return;

    set((state) => ({
      messages: state.messages.map((m) => {
        if (m._id !== messageId) return m;
        const reactions = m.reactions ?? [];
        const existing = reactions.findIndex(
          (r) => r.userId === authUser._id && r.emoji === emoji
        );
        const nextReactions =
          existing >= 0
            ? reactions.filter((_, i) => i !== existing)
            : [...reactions, { userId: authUser._id, emoji }];
        return { ...m, reactions: nextReactions };
      }),
    }));

    try {
      await axiosInstance.put(`/messages/reaction/${messageId}`, { emoji });
    } catch (error: any) {
      toast.error(error.response?.data?.error || "Failed to react");
    }
  },

  // marks the peer's messages in this thread as seen, both locally and on the server
  markAsSeen: async (peerId: string) => {
    const authUser = useAuthStore.getState().authUser;
    if (!authUser) return;
    set((state) => ({
      messages: state.messages.map((m) =>
        m.senderId === peerId && m.receiverId === authUser._id
          ? { ...m, status: "seen" }
          : m
      ),
    }));
    try {
      await axiosInstance.put(`/messages/seen/${peerId}`);
    } catch {
      // non-critical, ignore
    }
  },

  clearUnread: (userId: string) =>
    set((state) => {
      if (!state.unreadCounts[userId]) return state;
      const next = { ...state.unreadCounts };
      delete next[userId];
      return { unreadCounts: next };
    }),

  // sets up the single, long-lived socket listener set for the whole chat feature
  initSocketListeners: () => {
    if (get().listenersInitialized) return;
    const socket = useAuthStore.getState().socket;
    if (!socket) return;

    socket.on("newMessage", (newMessage: Message) => {
      const { selectedUser } = get();
      const currentAuthUser = useAuthStore.getState().authUser;
      const isOwnMessage = !!currentAuthUser && newMessage.senderId === currentAuthUser._id;
      const isOpenThread =
        selectedUser &&
        (newMessage.senderId === selectedUser._id || newMessage.receiverId === selectedUser._id);

      if (isOpenThread) {
        set((state) => {
          // already have it by server _id — skip
          if (state.messages.some((msg) => msg._id === newMessage._id)) return state;

          // our own echoed message: reconcile with the still-pending optimistic entry
          // so the HTTP-response swap and the socket echo don't both leave a copy
          if (isOwnMessage) {
            const pendingIdx = state.messages.findIndex(
              (m) =>
                m.isPending &&
                m.senderId === newMessage.senderId &&
                m.receiverId === newMessage.receiverId &&
                (m.text ?? "") === (newMessage.text ?? "") &&
                (m.image ?? "") === (newMessage.image ?? "")
            );
            if (pendingIdx >= 0) {
              const next = state.messages.slice();
              next[pendingIdx] = newMessage;
              return { messages: next };
            }
          }

          return { messages: [...state.messages, newMessage] };
        });
        if (newMessage.senderId === selectedUser!._id && document.hasFocus()) {
          get().markAsSeen(selectedUser!._id);
        }
      }

      const isIncoming = currentAuthUser && newMessage.receiverId === currentAuthUser._id && !isOwnMessage;
      const isFromOpenThread = selectedUser && newMessage.senderId === selectedUser._id;
      if (isIncoming && !(isFromOpenThread && document.hasFocus())) {
        set((state) => ({
          unreadCounts: {
            ...state.unreadCounts,
            [newMessage.senderId]: (state.unreadCounts[newMessage.senderId] ?? 0) + 1,
          },
        }));

        const sender = get().users.find((u) => u._id === newMessage.senderId);
        if (typeof Notification !== "undefined" && Notification.permission === "granted") {
          try {
            new Notification(sender?.fullName || "New message", {
              body: newMessage.text || (newMessage.image ? "Sent an image" : ""),
              icon: sender?.profilePic || "/avatar.png",
              tag: newMessage.senderId,
            });
          } catch {
            // Notification constructor can throw in some environments (e.g. service worker contexts); ignore
          }
        }
      }
    });

    socket.on("reactionUpdated", ({ messageId, reactions }: { messageId: string; reactions: Reaction[] }) => {
      set((state) => ({
        messages: state.messages.map((m) => (m._id === messageId ? { ...m, reactions } : m)),
      }));
    });

    socket.on("messagesSeen", ({ peerId }: { by: string; peerId: string }) => {
      const authUserId = useAuthStore.getState().authUser?._id;
      set((state) => ({
        messages: state.messages.map((m) =>
          m.receiverId === peerId && m.senderId === authUserId ? { ...m, status: "seen" } : m
        ),
      }));
    });

    socket.on("typing", ({ senderId }: { senderId: string }) => {
      const { selectedUser } = get();
      if (selectedUser && senderId === selectedUser._id) set({ isPeerTyping: true });
    });

    socket.on("stopTyping", ({ senderId }: { senderId: string }) => {
      const { selectedUser } = get();
      if (selectedUser && senderId === selectedUser._id) set({ isPeerTyping: false });
    });

    set({ listenersInitialized: true });
  },

  teardownSocketListeners: () => {
    const socket = useAuthStore.getState().socket;
    socket?.off("newMessage");
    socket?.off("reactionUpdated");
    socket?.off("messagesSeen");
    socket?.off("typing");
    socket?.off("stopTyping");
    set({ listenersInitialized: false });
  },
}));

export const emitTyping = (receiverId: string) => {
  const socket = useAuthStore.getState().socket;
  if (!socket) return;
  socket.emit("typing", { receiverId });
  if (typingTimeout) clearTimeout(typingTimeout);
  typingTimeout = setTimeout(() => {
    socket.emit("stopTyping", { receiverId });
  }, 2000);
};

export const emitStopTyping = (receiverId: string) => {
  const socket = useAuthStore.getState().socket;
  if (!socket) return;
  if (typingTimeout) {
    clearTimeout(typingTimeout);
    typingTimeout = null;
  }
  socket.emit("stopTyping", { receiverId });
};
