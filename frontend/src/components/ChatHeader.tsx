import React from "react";
import { X } from "lucide-react";

import { useChatStore } from "../store/useChatStore";

// user type, got id, name, pic
interface User {
  _id: string;
  fullName: string;
  profilePic?: string;
}

// store type for chat header
interface ChatHeaderStore {
  selectedUser: User;
  setSelectedUser: (user: User | null) => void;
}

const ChatHeader: React.FC = () => {
  // get selected user and fn to clear user
  const { selectedUser, setSelectedUser } = useChatStore() as ChatHeaderStore;

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
          </div>
        </div>

        {/* right side, close btn */}
        <button onClick={() => setSelectedUser(null)}>
          <X />
        </button>
      </div>
    </div>
  );
};

export default ChatHeader;
