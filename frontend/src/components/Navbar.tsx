import { Link } from "react-router-dom";
import { useAuthStore } from "../store/useAuthStore";

// user data type
interface AuthUser {
  _id: string;
  fullName: string;
  name?: string;
  profilePic?: string;
}

// auth store have logout and user
interface AuthStore {
  logout: () => Promise<void>;
  authUser: AuthUser | null;
}

import { LogOut, MessageSquare, Settings, User } from "lucide-react";
import React from "react";

// top bar of app
const Navbar: React.FC = () => {
  const { logout, authUser } = useAuthStore() as AuthStore;

  return (
    // header fix on top
    <header
      className="bg-base-100 border-b border-base-300 fixed w-full top-0 z-40 
    backdrop-blur-lg bg-base-100/80"
    >
      <div className="container mx-auto px-4 h-16">
        <div className="flex items-center justify-between h-full">
          {/* left side logo */}
          <div className="flex items-center gap-8">
            <Link
              to="/"
              className="flex items-center gap-2.5 hover:opacity-80 transition-all"
            >
              <div className="size-9 rounded-lg bg-primary/10 flex items-center justify-center">
                <MessageSquare className="w-5 h-5 text-primary" />
              </div>
              <h1 className="text-lg font-bold">Chatty</h1>
            </Link>
          </div>

          {/* right side buttons */}
          <div className="flex items-center gap-2">
            {/* always show setting */}
            <Link
              to={"/settings"}
              className={`
              btn btn-sm gap-2 transition-colors
              `}
            >
              <Settings className="w-4 h-4" />
              <span className="hidden sm:inline">Settings</span>
            </Link>

            {/* only show when user login */}
            {authUser && (
              <>
                {/* profile btn */}
                <Link to={"/profile"} className={`btn btn-sm gap-2`}>
                  <User className="size-5" />
                  <span className="hidden sm:inline">Profile</span>
                </Link>

                {/* logout btn */}
                <button className="flex gap-2 items-center" onClick={logout}>
                  <LogOut className="size-5" />
                  <span className="hidden sm:inline">Logout</span>
                </button>
              </>
            )}
          </div>
        </div>
      </div>
    </header>
  );
};

export default Navbar;
