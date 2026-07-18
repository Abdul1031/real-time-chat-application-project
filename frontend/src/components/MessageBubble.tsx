import React, { useState } from "react";
import { Check, CheckCheck, Loader2, Reply, RotateCw, Smile } from "lucide-react";
import type { Message, User } from "../store/useChatStore";
import { formatMessageTime } from "../lib/utils";
import EmojiReactionPicker from "./EmojiReactionPicker";

interface MessageBubbleProps {
  message: Message;
  isOwn: boolean;
  authUser: User;
  peerUser: User;
  currentUserId: string;
  highlight?: string;
  onReply: (message: Message) => void;
  onToggleReaction: (messageId: string, emoji: string) => void;
  onRetry: (localId: string) => void;
  onQuoteClick: (messageId: string) => void;
  bubbleRef?: (el: HTMLDivElement | null) => void;
}

const highlightText = (text: string, query?: string) => {
  if (!query?.trim()) return text;
  const lower = text.toLowerCase();
  const q = query.trim().toLowerCase();
  const idx = lower.indexOf(q);
  if (idx === -1) return text;
  return (
    <>
      {text.slice(0, idx)}
      <mark className="bg-warning/60 rounded px-0.5">{text.slice(idx, idx + q.length)}</mark>
      {text.slice(idx + q.length)}
    </>
  );
};

const MessageBubble: React.FC<MessageBubbleProps> = ({
  message,
  isOwn,
  authUser,
  peerUser,
  currentUserId,
  highlight,
  onReply,
  onToggleReaction,
  onRetry,
  onQuoteClick,
  bubbleRef,
}) => {
  const [showPicker, setShowPicker] = useState(false);

  const groupedReactions = (message.reactions ?? []).reduce<Record<string, number>>((acc, r) => {
    acc[r.emoji] = (acc[r.emoji] ?? 0) + 1;
    return acc;
  }, {});

  return (
    <div
      ref={bubbleRef}
      data-message-id={message._id}
      className={`chat group ${isOwn ? "chat-end" : "chat-start"}`}
    >
      {/* user pic */}
      <div className="chat-image avatar">
        <div className="size-10 rounded-full border">
          <img
            src={isOwn ? authUser.profilePic || "/avatar.png" : peerUser.profilePic || "/avatar.png"}
            alt="profile pic"
          />
        </div>
      </div>

      {/* time */}
      <div className="chat-header mb-1">
        <time className="text-xs opacity-50 ml-1">{formatMessageTime(message.createdAt)}</time>
      </div>

      {/* bubble msg */}
      <div className="chat-bubble flex flex-col relative">
        {message.replyTo && (
          <button
            type="button"
            onClick={() => onQuoteClick(message.replyTo!._id)}
            className="text-left text-xs opacity-70 border-l-2 border-current pl-2 mb-1.5 truncate max-w-[220px] hover:opacity-100"
          >
            {message.replyTo.text || (message.replyTo.image ? "Image" : "")}
          </button>
        )}

        {message.image && (
          <img
            src={message.image}
            alt="Attachment"
            className="sm:max-w-[200px] rounded-md mb-2"
          />
        )}
        {message.text && <p>{highlightText(message.text, highlight)}</p>}

        {isOwn && (
          <span className="self-end mt-1 flex items-center gap-1 text-xs opacity-70">
            {message.isPending ? (
              <Loader2 className="size-3 animate-spin" />
            ) : message.isFailed ? (
              <button
                type="button"
                onClick={() => onRetry(message._id)}
                className="flex items-center gap-1 text-error hover:underline"
              >
                <RotateCw className="size-3" /> Retry
              </button>
            ) : message.status === "seen" ? (
              <CheckCheck className="size-3.5 text-primary" aria-label="Seen" />
            ) : message.status === "delivered" ? (
              <CheckCheck className="size-3.5" aria-label="Delivered" />
            ) : (
              <Check className="size-3.5" aria-label="Sent" />
            )}
          </span>
        )}
      </div>

      {/* reactions row */}
      {Object.keys(groupedReactions).length > 0 && (
        <div className="flex gap-1 mt-1 flex-wrap">
          {Object.entries(groupedReactions).map(([emoji, count]) => {
            const reacted = (message.reactions ?? []).some(
              (r) => r.emoji === emoji && r.userId === currentUserId
            );
            return (
              <button
                key={emoji}
                type="button"
                onClick={() => onToggleReaction(message._id, emoji)}
                className={`text-xs rounded-full px-1.5 py-0.5 border ${
                  reacted ? "bg-primary/20 border-primary" : "bg-base-200 border-base-300"
                }`}
              >
                {emoji} {count}
              </button>
            );
          })}
        </div>
      )}

      {/* hover actions: reply + react */}
      <div className="chat-footer opacity-0 group-hover:opacity-100 transition-opacity flex items-center gap-1 mt-1 relative">
        <button
          type="button"
          onClick={() => onReply(message)}
          aria-label="Reply to this message"
          className="btn btn-ghost btn-xs"
        >
          <Reply className="size-3.5" />
        </button>
        <button
          type="button"
          onClick={() => setShowPicker((v) => !v)}
          aria-label="Add reaction"
          className="btn btn-ghost btn-xs"
        >
          <Smile className="size-3.5" />
        </button>
        {showPicker && (
          <div className="absolute top-full z-10 mt-1">
            <EmojiReactionPicker
              onSelect={(emoji) => {
                onToggleReaction(message._id, emoji);
                setShowPicker(false);
              }}
            />
          </div>
        )}
      </div>
    </div>
  );
};

export default MessageBubble;
