import React, { useEffect, useRef } from "react";
import ChatHeader from "./ChatHeader";
import MessageInput from "./MessageInput";
import MessageSkeleton from "./skeletons/MessageSkeleton";
import { useChatStore } from "../store/useChatStore";
import { useAuthStore } from "../store/useAuthStore";
import { formatMessageTime } from "../lib/utils";

// user info
interface User {
  _id: string;
  fullName: string;
  profilePic?: string;
}

// message info
interface Message {
  _id: string;
  senderId: string;
  receiverId: string;
  createdAt: string;
  image?: string;
  text?: string;
}

// store for chat
interface ChatStore {
  messages: Message[];
  getMessages: (userId: string) => Promise<void>;
  isMessagesLoading: boolean;
  selectedUser: User;
  subscribeToMessages: () => void;
  unsubscribeFromMessages: () => void;
}

// store for auth
interface AuthStore {
  authUser: User;
}

const ChatContainer: React.FC = () => {
  // get many thing from chat store
  const {
    messages,
    getMessages,
    isMessagesLoading,
    selectedUser,
    subscribeToMessages,
    unsubscribeFromMessages,
  } = useChatStore() as ChatStore;

  // get current user
  const { authUser } = useAuthStore() as AuthStore;

  // ref for auto scroll down
  const messageEndRef = useRef<HTMLDivElement>(null);

  // when user select, get msg and listen new msg
  useEffect(() => {
    if (selectedUser) {
      getMessages(selectedUser._id);
      subscribeToMessages();

      // when leave, stop listen
      return () => unsubscribeFromMessages();
    }
  }, [
    selectedUser,
    selectedUser?._id,
    getMessages,
    subscribeToMessages,
    unsubscribeFromMessages,
  ]);

  // auto scroll to bottom when new msg
  useEffect(() => {
    if (messageEndRef.current && messages) {
      messageEndRef.current.scrollIntoView({ behavior: "smooth" });
    }
  }, [messages]);

  // show loading skeleton when load
  if (isMessagesLoading) {
    return (
      <div className="flex-1 flex flex-col overflow-auto">
        <ChatHeader />
        <MessageSkeleton />
        <MessageInput />
      </div>
    );
  }

  // main chat box
  return (
    <div className="flex-1 flex flex-col overflow-auto">
      <ChatHeader />

      {/* msg list */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {messages.map((message: Message) => (
          <div
            key={message._id}
            className={`chat ${
              message.senderId === authUser._id ? "chat-end" : "chat-start"
            }`}
            ref={messageEndRef}
          >
            {/* user pic */}
            <div className=" chat-image avatar">
              <div className="size-10 rounded-full border">
                <img
                  src={
                    message.senderId === authUser._id
                      ? authUser.profilePic || "/avatar.png"
                      : selectedUser.profilePic || "/avatar.png"
                  }
                  alt="profile pic"
                />
              </div>
            </div>

            {/* time */}
            <div className="chat-header mb-1">
              <time className="text-xs opacity-50 ml-1">
                {formatMessageTime(message.createdAt)}
              </time>
            </div>

            {/* bubble msg */}
            <div className="chat-bubble flex flex-col">
              {message.image && (
                <img
                  src={message.image}
                  alt="Attachment"
                  className="sm:max-w-[200px] rounded-md mb-2"
                />
              )}
              {message.text && <p>{message.text}</p>}
            </div>
          </div>
        ))}

        {/* when no msg, show skeleton */}
        {messages.length === 0 ? <MessageSkeleton /> : null}
      </div>

      {/* input box bottom */}
      <MessageInput />
    </div>
  );
};

export default ChatContainer;
