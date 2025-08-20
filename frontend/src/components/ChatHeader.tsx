import React from "react";
import { X } from "lucide-react";

import { useChatStore } from "../store/useChatStore";

interface User {
  _id: string;
  fullName: string;
  profilePic?: string;
}

interface ChatHeaderStore {
  selectedUser: User;
  setSelectedUser: (user: User | null) => void;
}

const ChatHeader: React.FC = () => {
  const { selectedUser, setSelectedUser } = useChatStore() as ChatHeaderStore;

  return (
    <div className="p-2.5 border-b border-base-300">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          {/* Avatar */}
          <div className="avatar">
            <div className="size-10 rounded-full relative">
              <img
                src={selectedUser.profilePic || "/avatar.png"}
                alt={selectedUser.fullName}
              />
            </div>
          </div>

          {/* User info */}
          <div>
            <h3 className="font-medium">{selectedUser.fullName}</h3>
          </div>
        </div>

        {/* Close button */}
        <button onClick={() => setSelectedUser(null)}>
          <X />
        </button>
      </div>
    </div>
  );
};
export default ChatHeader;
