import React from "react";
import { X } from "lucide-react";

import { useChatStore } from "../store/useChatStore";
import { useAuthStore } from "../store/useAuthStore";

const ChatHeader: React.FC = () => {
  // get selected user and fn to clear user
  const { selectedUser, setSelectedUser, isPeerTyping } = useChatStore();
  const { onlineUsers } = useAuthStore();

  if (!selectedUser) return null;

  const isOnline = onlineUsers.includes(selectedUser._id);

  return (
    // top bar of chat box
    <div className="p-2.5 border-b border-base-300">
      <div className="flex items-center justify-between">
        {/* left side, user info */}
        <div className="flex items-center gap-3">
          <div className="avatar">
            <div className="size-10 rounded-full relative">
              <img
                src={selectedUser.profilePic || "/avatar.png"}
                alt={selectedUser.fullName}
              />
            </div>
          </div>

          <div>
            <h3 className="font-medium">{selectedUser.fullName}</h3>
            <p className="text-xs text-base-content/60" aria-live="polite">
              {isPeerTyping ? "typing…" : isOnline ? "Online" : "Offline"}
            </p>
          </div>
        </div>

        {/* right side, close btn */}
        <button onClick={() => setSelectedUser(null)} aria-label="Close conversation">
          <X />
        </button>
      </div>
    </div>
  );
};

export default ChatHeader;
