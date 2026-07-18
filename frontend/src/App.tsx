import Navbar from "./components/Navbar";

import HomePage from "./pages/HomePage";
import SignUpPage from "./pages/SignUpPage";
import LoginPage from "./pages/LoginPage";
import SettingsPage from "./pages/SettingsPage";
import ProfilePage from "./pages/ProfilePage";

import { Routes, Route, Navigate } from "react-router-dom";
import { useAuthStore } from "./store/useAuthStore";
import { useThemeStore } from "./store/useThemeStore";
import { useChatStore } from "./store/useChatStore";

import { Loader } from "lucide-react";
import { Toaster } from "react-hot-toast";

import React, { useEffect, useMemo } from "react";

const APP_TITLE = "Chatty";

// this main app component
const App: React.FC = () => {
  const { authUser, checkAuth, isCheckingAuth, socket } = useAuthStore();
  const { theme } = useThemeStore();
  const { initSocketListeners, teardownSocketListeners, unreadCounts, selectedUser, markAsSeen } =
    useChatStore();

  // when app start, we check user login or not
  useEffect(() => {
    checkAuth();
  }, [checkAuth]);

  // once the socket is connected, wire up the app-wide message/typing/reaction listeners
  useEffect(() => {
    if (socket) {
      initSocketListeners();
    }
    return () => {
      teardownSocketListeners();
    };
  }, [socket, initSocketListeners, teardownSocketListeners]);

  // re-mark the open thread as seen when the tab regains focus
  useEffect(() => {
    const onFocus = () => {
      if (selectedUser) markAsSeen(selectedUser._id);
    };
    window.addEventListener("focus", onFocus);
    return () => window.removeEventListener("focus", onFocus);
  }, [selectedUser, markAsSeen]);

  // reflect total unread count in the tab title
  const totalUnread = useMemo(
    () => Object.values(unreadCounts).reduce((sum, n) => sum + n, 0),
    [unreadCounts]
  );
  useEffect(() => {
    document.title = totalUnread > 0 ? `(${totalUnread}) ${APP_TITLE}` : APP_TITLE;
  }, [totalUnread]);

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
