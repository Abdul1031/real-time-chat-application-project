import Navbar from "./components/Navbar";

import HomePage from "./pages/HomePage";
import SignUpPage from "./pages/SignUpPage";
import LoginPage from "./pages/LoginPage";
import SettingsPage from "./pages/SettingsPage";
import ProfilePage from "./pages/ProfilePage";

import { Routes, Route, Navigate } from "react-router-dom";
import { useAuthStore } from "./store/useAuthStore";
import { useThemeStore } from "./store/useThemeStore";

import { Loader } from "lucide-react";
import { Toaster } from "react-hot-toast";

import React, { useEffect } from "react";

// this user interface, only keep user info
interface User {
  _id: string;
  fullName: string;
  profilePic?: string;
}

// this auth store interface, keep login user and some function
interface AuthStore {
  authUser: User | null;
  checkAuth: () => Promise<void>;
  isCheckingAuth: boolean;
  onlineUsers?: User[];
}

// this theme store, only for theme
interface ThemeStore {
  theme: string;
}

// this main app component
const App: React.FC = () => {
  const { authUser, checkAuth, isCheckingAuth } = useAuthStore() as AuthStore;
  const { theme } = useThemeStore() as ThemeStore;

  // when app start, we check user login or not
  useEffect(() => {
    checkAuth();
  }, [checkAuth]);

  // if still checking login, we show loading icon
  if (isCheckingAuth && !authUser)
    return (
      <div className="flex items-center justify-center h-screen">
        <Loader className="size-10 animate-spin" />
      </div>
    );

  // here main ui and route
  return (
    <div data-theme={theme}>
      {/* navbar always show on top */}
      <Navbar />

      {/* here we setup routes */}
      <Routes>
        {/* if user login go home, if not login go login page */}
        <Route
          path="/"
          element={authUser ? <HomePage /> : <Navigate to="/login" />}
        />
        {/* signup page only for no login user */}
        <Route
          path="/signup"
          element={!authUser ? <SignUpPage /> : <Navigate to="/" />}
        />
        {/* login page only for no login user */}
        <Route
          path="/login"
          element={!authUser ? <LoginPage /> : <Navigate to="/" />}
        />
        {/* setting page open always */}
        <Route path="/settings" element={<SettingsPage />} />
        {/* profile page only if login user, else go login page */}
        <Route
          path="/profile"
          element={authUser ? <ProfilePage /> : <Navigate to="/login" />}
        />
      </Routes>

      {/* toaster show success or error msg */}
      <Toaster />
    </div>
  );
};
export default App;
