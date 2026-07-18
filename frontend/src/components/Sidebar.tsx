import { useEffect, useMemo, useState } from "react";
import { useChatStore } from "../store/useChatStore";
import { useAuthStore } from "../store/useAuthStore";
import SidebarSkeleton from "./skeletons/SidebarSkeleton";
import { Search, Users } from "lucide-react";

const Sidebar: React.FC = () => {
  const { getUsers, users, selectedUser, setSelectedUser, isUsersLoading, unreadCounts } =
    useChatStore();
  const { onlineUsers } = useAuthStore();

  const [search, setSearch] = useState("");
  const [onlineOnly, setOnlineOnly] = useState(false);

  // when page load, get users from server
  useEffect(() => {
    getUsers();
  }, [getUsers]);

  const filteredUsers = useMemo(() => {
    const list = Array.isArray(users) ? users : [];
    return list
      .filter((user) => !onlineOnly || onlineUsers.includes(user._id))
      .filter((user) =>
        search.trim() ? user.fullName.toLowerCase().includes(search.trim().toLowerCase()) : true
      );
  }, [users, onlineOnly, onlineUsers, search]);

  // if still loading users, show skeleton ui
  if (isUsersLoading) return <SidebarSkeleton />;

  return (
    // sidebar box for contacts
    <aside className="h-full w-20 lg:w-72 border-r border-base-300 flex flex-col transition-all duration-200">
      {/* top header part, show Contacts text */}
      <div className="border-b border-base-300 w-full p-5 space-y-3">
        <div className="flex items-center gap-2">
          <Users className="size-6" />
          <span className="font-medium hidden lg:block">Contacts</span>
          {onlineUsers.length > 0 && (
            <span className="hidden lg:inline text-xs text-base-content/50">
              ({onlineUsers.length} online)
            </span>
          )}
        </div>

        {/* search box, only really usable on wide screens */}
        <div className="hidden lg:block relative">
          <Search className="absolute left-2 top-1/2 -translate-y-1/2 size-4 text-base-content/40" />
          <input
            type="search"
            aria-label="Search contacts"
            placeholder="Search contacts..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="input input-bordered input-sm w-full pl-8"
          />
        </div>

        <label className="hidden lg:flex items-center gap-2 cursor-pointer">
          <input
            type="checkbox"
            checked={onlineOnly}
            onChange={(e) => setOnlineOnly(e.target.checked)}
            className="checkbox checkbox-xs"
          />
          <span className="text-xs text-base-content/70">Show online only</span>
        </label>
      </div>

      {/* user list scrollable */}
      <div className="overflow-y-auto w-full py-3">
        {filteredUsers.map((user) => {
          const isOnline = onlineUsers.includes(user._id);
          const unread = unreadCounts[user._id] ?? 0;
          return (
            // button for each user, click = select user
            <button
              key={user._id}
              onClick={() => setSelectedUser(user)}
              className={`
              relative w-full p-3 flex items-center gap-3
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
                  alt={user.fullName}
                  className="size-12 object-cover rounded-full"
                />
                {isOnline && (
                  <span
                    className="absolute bottom-0 right-0 size-3 bg-green-500 rounded-full ring-2 ring-base-100"
                    aria-label="Online"
                  />
                )}
              </div>

              {/* user name text */}
              <div className="hidden lg:flex flex-1 items-center justify-between min-w-0">
                <div className="min-w-0">
                  <div className="font-medium truncate">{user.fullName}</div>
                  <div className="text-xs text-base-content/50">
                    {isOnline ? "Online" : "Offline"}
                  </div>
                </div>
                {unread > 0 && (
                  <span className="badge badge-primary badge-sm shrink-0">{unread}</span>
                )}
              </div>

              {unread > 0 && (
                <span className="lg:hidden badge badge-primary badge-xs absolute top-2 right-2">
                  {unread}
                </span>
              )}
            </button>
          );
        })}

        {/* if no users found */}
        {filteredUsers.length === 0 && (
          <div className="text-center text-zinc-500 py-4">No users</div>
        )}
      </div>
    </aside>
  );
};

export default Sidebar;
