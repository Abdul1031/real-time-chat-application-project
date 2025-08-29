import { useChatStore } from "../store/useChatStore";

import Sidebar from "../components/Sidebar";
import NoChatSelected from "../components/NoChatSelected";
import ChatContainer from "../components/ChatContainer";

import React from "react";

// user look like this
interface User {
  _id: string;
  fullName: string;
  profilePic?: string;
}

// chat store only keep which user is selected for chat
interface ChatStore {
  selectedUser: User | null;
}

const HomePage: React.FC = () => {
  // get selectedUser from chat store
  const { selectedUser } = useChatStore() as ChatStore;

  return (
    // main full screen page with bg color
    <div className="h-screen bg-base-200">
      <div className="flex items-center justify-center pt-20 px-4">
        {/* main box for chat area */}
        <div className="bg-base-100 rounded-lg shadow-cl w-full max-w-6xl h-[calc(100vh-8rem)]">
          <div className="flex h-full rounded-lg overflow-hidden">
            {/* left side bar always show */}
            <Sidebar />

            {/* if no user selected then show empty state, else show chat box */}
            {!selectedUser ? <NoChatSelected /> : <ChatContainer />}
          </div>
        </div>
      </div>
    </div>
  );
};
export default HomePage;
