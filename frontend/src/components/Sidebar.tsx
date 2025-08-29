import { useEffect } from "react";
import { useChatStore } from "../store/useChatStore";
import SidebarSkeleton from "./skeletons/SidebarSkeleton";
import { Users } from "lucide-react";

// user type, like id, name, photo
interface User {
  _id: string;
  fullName: string;
  name?: string;
  profilePic?: string;
}

// store type, handle users and chat
interface ChatStore {
  getUsers: () => Promise<void>;
  users: User[];
  selectedUser: User | null;
  setSelectedUser: (user: User) => void;
  isUsersLoading: boolean;
}

const Sidebar: React.FC = () => {
  // take things from store, like users list and selected user
  const { getUsers, users, selectedUser, setSelectedUser, isUsersLoading } =
    useChatStore() as ChatStore;

  // when page load, get users from server
  useEffect(() => {
    getUsers();
  }, [getUsers]);

  // make sure users always array, if not empty array
  const filteredUsers: User[] = Array.isArray(users) ? users : [];

  // if still loading users, show skeleton ui
  if (isUsersLoading) return <SidebarSkeleton />;

  return (
    // sidebar box for contacts
    <aside className="h-full w-20 lg:w-72 border-r border-base-300 flex flex-col transition-all duration-200">
      {/* top header part, show Contacts text */}
      <div className="border-b border-base-300 w-full p-5">
        <div className="flex items-center gap-2">
          <Users className="size-6" />
          <span className="font-medium hidden lg:block">Contacts</span>
        </div>
      </div>

      {/* user list scrollable */}
      <div className="overflow-y-auto w-full py-3">
        {filteredUsers.map((user: User) => (
          // button for each user, click = select user
          <button
            key={user._id}
            onClick={() => setSelectedUser(user)}
            className={`
              w-full p-3 flex items-center gap-3
              hover:bg-base-300 transition-colors
              ${
                selectedUser?._id === user._id
                  ? "bg-base-300 ring-1 ring-base-300"
                  : ""
              }
            `}
          >
            {/* user image */}
            <div className="relative mx-auto lg:mx-0">
              <img
                src={user.profilePic || "/avatar.png"}
                alt={user.name || user.fullName}
                className="size-12 object-cover rounded-full"
              />
            </div>

            {/* user name text */}
            <div className="hidden lg:block text-left min-w-0">
              <div className="font-medium truncate">{user.fullName}</div>
            </div>
          </button>
        ))}

        {/* if no users found */}
        {filteredUsers.length === 0 && (
          <div className="text-center text-zinc-500 py-4">No users</div>
        )}
      </div>
    </aside>
  );
};

export default Sidebar;
