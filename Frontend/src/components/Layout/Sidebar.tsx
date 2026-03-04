import React, { useState, useEffect } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { Home, FileText, BarChart3, Users, Bell, Mail, Settings } from "lucide-react";

const Sidebar = () => {
  const [collapsed, setCollapsed] = useState(false);
  const navigate = useNavigate();
  const location = useLocation();

  const [displayName, setDisplayName] = useState("User");
  const [displayEmail, setDisplayEmail] = useState("");

  const loadUser = () => {
    const profile = JSON.parse(localStorage.getItem("profile") || "null");
    const user = JSON.parse(localStorage.getItem("user") || "null");

    const name =
      profile?.full_name ||
      user?.name ||
      user?.email ||
      "User";

    const email = user?.email || "";

    setDisplayName(name);
    setDisplayEmail(email);
  };

  useEffect(() => {
    loadUser();
  }, []);

  useEffect(() => {
    const handleProfileUpdate = () => loadUser();
    window.addEventListener("profileUpdated", handleProfileUpdate);
    return () => window.removeEventListener("profileUpdated", handleProfileUpdate);
  }, []);

  // ✅ FIXED LOGOUT
  const handleLogout = () => {
    localStorage.removeItem("token");
    localStorage.removeItem("user");
    localStorage.removeItem("profile");

    navigate("/login");
    window.location.reload(); // ensures AuthContext updates
  };

  const navItems = [
    { label: "Dashboard", icon: Home, path: "/" },
    { label: "Expenses", icon: FileText, path: "/expenses" },
    { label: "Analytics", icon: BarChart3, path: "/analytics" },
    { label: "Predictions", icon: Users, path: "/predictions" },
    { label: "Anomalies", icon: Bell, path: "/anomalies" },
    { label: "Scanner", icon: Mail, path: "/scan" },
    { label: "Settings", icon: Settings, path: "/settings" }
  ];

  return (
    <aside
      className="flex flex-col h-full bg-white border-r transition-all duration-300 relative"
      style={{ width: collapsed ? "4rem" : "16rem" }}
    >
      {/* Header */}
      <div className="flex items-center gap-3 px-4 py-5 border-b">
        <div className="bg-blue-600 text-white p-2 rounded-lg">
          <Home size={20} />
        </div>
        {!collapsed && (
          <div>
            <h1 className="font-bold text-lg">FinAI : Sentinel</h1>
            <p className="text-xs text-gray-500">Expense Tracker</p>
          </div>
        )}
      </div>

      {/* Toggle */}
      <button
        onClick={() => setCollapsed(!collapsed)}
        className="absolute -right-3 top-6 w-6 h-6 rounded-full bg-white border shadow flex items-center justify-center"
      >
        {collapsed ? ">" : "<"}
      </button>

      {/* Navigation */}
      <nav className="flex-1 p-3 space-y-2">
        {navItems.map((item) => (
          <button
            key={item.path}
            onClick={() => navigate(item.path)}
            className={`w-full flex items-center gap-3 px-3 py-2 rounded-lg transition ${
              location.pathname === item.path
                ? "bg-blue-50 text-blue-700"
                : "text-gray-700 hover:bg-gray-100"
            }`}
          >
            <item.icon size={20} />
            {!collapsed && item.label}
          </button>
        ))}
      </nav>

      {/* Footer */}
      <div className="px-4 py-4 border-t">
        {!collapsed ? (
          <div className="space-y-3">
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-full bg-blue-600 text-white flex items-center justify-center font-semibold">
                {displayName.charAt(0).toUpperCase()}
              </div>
              <div>
                <p className="font-medium text-sm">{displayName}</p>
                <p className="text-xs text-gray-500">{displayEmail}</p>
              </div>
            </div>

            <button
              onClick={handleLogout}
              className="w-full px-3 py-2 rounded-lg text-gray-700 hover:bg-red-50 hover:text-red-600"
            >
              Logout
            </button>
          </div>
        ) : (
          <button
            onClick={handleLogout}
            className="w-full flex justify-center text-gray-700 hover:text-red-600"
          >
            Logout
          </button>
        )}
      </div>
    </aside>
  );
};

export default Sidebar;