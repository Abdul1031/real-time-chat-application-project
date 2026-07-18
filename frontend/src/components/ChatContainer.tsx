import React, { useEffect, useLayoutEffect, useRef, useState } from "react";
import { Loader2, Search, X } from "lucide-react";
import ChatHeader from "./ChatHeader";
import MessageInput from "./MessageInput";
import MessageSkeleton from "./skeletons/MessageSkeleton";
import DateSeparator from "./DateSeparator";
import MessageBubble from "./MessageBubble";
import { useChatStore } from "../store/useChatStore";
import { useAuthStore } from "../store/useAuthStore";

const isSameDay = (a: string, b: string) => {
  const da = new Date(a);
  const db = new Date(b);
  return (
    da.getFullYear() === db.getFullYear() &&
    da.getMonth() === db.getMonth() &&
    da.getDate() === db.getDate()
  );
};

const ChatContainer: React.FC = () => {
  const {
    messages,
    isMessagesLoading,
    isFetchingMore,
    hasMoreMessages,
    selectedUser,
    loadMoreMessages,
    setReplyingTo,
    toggleReaction,
    retryMessage,
  } = useChatStore();

  const { authUser } = useAuthStore();

  const messageEndRef = useRef<HTMLDivElement>(null);
  const scrollContainerRef = useRef<HTMLDivElement>(null);
  const prependAnchorRef = useRef<{ scrollHeight: number; scrollTop: number } | null>(null);
  const bubbleRefs = useRef<Map<string, HTMLDivElement>>(new Map());

  const [showSearch, setShowSearch] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");

  // auto-scroll to bottom on fresh load / new own messages, but not when prepending older history
  useEffect(() => {
    if (prependAnchorRef.current) return;
    messageEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages.length]);

  // preserve scroll position after older messages are prepended
  useLayoutEffect(() => {
    const container = scrollContainerRef.current;
    const anchor = prependAnchorRef.current;
    if (container && anchor && !isFetchingMore) {
      container.scrollTop = container.scrollHeight - anchor.scrollHeight + anchor.scrollTop;
      prependAnchorRef.current = null;
    }
  }, [messages, isFetchingMore]);

  const handleScroll = () => {
    const container = scrollContainerRef.current;
    if (!container || !selectedUser) return;
    if (container.scrollTop < 60 && hasMoreMessages && !isFetchingMore) {
      prependAnchorRef.current = {
        scrollHeight: container.scrollHeight,
        scrollTop: container.scrollTop,
      };
      loadMoreMessages();
    }
  };

  const scrollToMessage = (messageId: string) => {
    const el = bubbleRefs.current.get(messageId);
    el?.scrollIntoView({ behavior: "smooth", block: "center" });
    if (el) {
      el.classList.add("ring", "ring-primary");
      setTimeout(() => el.classList.remove("ring", "ring-primary"), 1200);
    }
  };

  if (!selectedUser || !authUser) return null;

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

  const filteredMessages = searchQuery.trim()
    ? messages.filter((m) => m.text?.toLowerCase().includes(searchQuery.trim().toLowerCase()))
    : messages;

  // main chat box
  return (
    <div className="flex-1 flex flex-col overflow-auto">
      <ChatHeader />

      {/* search toggle + bar */}
      <div className="border-b border-base-300 px-3 py-1.5 flex items-center justify-end gap-2">
        {showSearch ? (
          <div className="flex items-center gap-2 w-full">
            <Search className="size-4 text-base-content/40" />
            <input
              type="search"
              autoFocus
              aria-label="Search messages in this conversation"
              placeholder="Search in conversation..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="input input-bordered input-xs flex-1"
            />
            <button
              type="button"
              aria-label="Close search"
              className="btn btn-ghost btn-xs"
              onClick={() => {
                setShowSearch(false);
                setSearchQuery("");
              }}
            >
              <X className="size-3.5" />
            </button>
          </div>
        ) : (
          <button
            type="button"
            aria-label="Search messages"
            className="btn btn-ghost btn-xs"
            onClick={() => setShowSearch(true)}
          >
            <Search className="size-3.5" />
          </button>
        )}
      </div>

      {/* msg list */}
      <div
        ref={scrollContainerRef}
        onScroll={handleScroll}
        className="flex-1 overflow-y-auto p-4 space-y-1"
      >
        {isFetchingMore && (
          <div className="flex justify-center py-2">
            <Loader2 className="size-4 animate-spin text-base-content/50" />
          </div>
        )}

        {filteredMessages.length === 0 && searchQuery.trim() && (
          <p className="text-center text-sm text-base-content/50 py-4">No messages match "{searchQuery}"</p>
        )}

        {filteredMessages.map((message, idx) => {
          const prev = filteredMessages[idx - 1];
          const showDateSeparator = !prev || !isSameDay(prev.createdAt, message.createdAt);
          return (
            <React.Fragment key={message._id}>
              {showDateSeparator && <DateSeparator date={message.createdAt} />}
              <MessageBubble
                message={message}
                isOwn={message.senderId === authUser._id}
                authUser={authUser}
                peerUser={selectedUser}
                currentUserId={authUser._id}
                highlight={searchQuery}
                onReply={setReplyingTo}
                onToggleReaction={toggleReaction}
                onRetry={retryMessage}
                onQuoteClick={scrollToMessage}
                bubbleRef={(el) => {
                  if (el) bubbleRefs.current.set(message._id, el);
                  else bubbleRefs.current.delete(message._id);
                }}
              />
            </React.Fragment>
          );
        })}

        {/* when no msg, show skeleton */}
        {messages.length === 0 ? <MessageSkeleton /> : null}

        {/* sentinel for auto-scroll to bottom */}
        <div ref={messageEndRef} />
      </div>

      {/* input box bottom */}
      <MessageInput />
    </div>
  );
};

export default ChatContainer;
