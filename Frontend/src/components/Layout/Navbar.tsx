// src/components/Layout/Navbar.tsx
import React, { useState, useRef, useEffect } from 'react';
import { useNavigate } from 'react-router-dom'; // ✅ ADD THIS
import { useAuth } from '../../context/AuthContext';

export interface NavbarProps {
  onSidebarToggle?: () => void;
  isSidebarCollapsed?: boolean;
  title?: string;
  user?: {
    name: string;
    email?: string;
    avatar?: string;
    role?: string;
  };
  showNotifications?: boolean;
  showSearch?: boolean;
}

const Navbar: React.FC<NavbarProps> = ({
  onSidebarToggle,
  isSidebarCollapsed = false,
  title = 'Dashboard',
  showNotifications = true,
  showSearch = true,
}) => {
  const { user } = useAuth(); // Get user from AuthContext
  const [isNotificationsOpen, setIsNotificationsOpen] = useState(false);
  const [isUserMenuOpen, setIsUserMenuOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const notificationsRef = useRef<HTMLDivElement>(null);
  const userMenuRef = useRef<HTMLDivElement>(null);
  
  const navigate = useNavigate(); // ✅ ADD THIS

  const notifications = [
    { id: 1, title: 'New message', description: 'You have a new message', time: '5 min ago', read: false },
    { id: 2, title: 'System update', description: 'System maintenance scheduled', time: '1 hour ago', read: false },
    { id: 3, title: 'Payment received', description: 'Your payment has been processed', time: '2 hours ago', read: true },
  ];

  const userMenuItems = [
    { label: 'Profile', icon: '👤' },
    { label: 'Settings', icon: '⚙️' },
    { label: 'Help & Support', icon: '❓' },
    { label: 'divider' },
    { label: 'Logout', icon: '🚪' },
  ];

  // Close dropdowns when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (notificationsRef.current && !notificationsRef.current.contains(event.target as Node)) {
        setIsNotificationsOpen(false);
      }
      if (userMenuRef.current && !userMenuRef.current.contains(event.target as Node)) {
        setIsUserMenuOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const unreadCount = notifications.filter(n => !n.read).length;

  // ✅ ADD THIS LOGOUT FUNCTION
  const handleLogout = () => {
    // Clear user data from localStorage
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    
    // Close the dropdown
    setIsUserMenuOpen(false);
    
    // Redirect to login page
    navigate('/login');
    
    console.log('Logged out successfully');
  };

  return (
    <nav className="bg-white shadow-md border-b border-gray-200 sticky top-0 z-30">
      <div className="px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          {/* Left side */}
          <div className="flex items-center">
            {/* Hamburger button */}
            {onSidebarToggle && (
              <button
                onClick={onSidebarToggle}
                className="p-2 rounded-md text-gray-500 hover:text-gray-700 hover:bg-gray-100 mr-2 md:mr-4"
                aria-label="Toggle sidebar"
              >
                {isSidebarCollapsed ? (
                  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
                  </svg>
                ) : (
                  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                )}
              </button>
            )}

            {/* Title */}
            <div className="flex flex-col">
              <h1 className="text-xl font-bold text-gray-800 dark:text-white">{title}</h1>
              <p className="text-xs text-gray-500 dark:text-gray-400 hidden md:block">
                Welcome back, {user?.name || 'User'}
              </p>
            </div>

            {/* Search bar (desktop) */}
            {showSearch && (
              <div className="hidden md:block ml-8">
                <div className="relative">
                  <input
                    type="text"
                    placeholder="Search..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="pl-10 pr-4 py-2 w-64 rounded-lg border border-gray-300 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                  <svg
                    className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                  </svg>
                </div>
              </div>
            )}
          </div>

          {/* Right side */}
          <div className="flex items-center space-x-4">
            {/* Search icon (mobile) */}
            {showSearch && (
              <button className="md:hidden p-2 rounded-lg hover:bg-gray-100">
                <svg className="w-5 h-5 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                </svg>
              </button>
            )}

            {/* Notifications */}
            {showNotifications && (
              <div className="relative" ref={notificationsRef}>
                <button
                  onClick={() => setIsNotificationsOpen(!isNotificationsOpen)}
                  className="p-2 rounded-lg hover:bg-gray-100 relative"
                  aria-label="Notifications"
                >
                  <svg className="w-5 h-5 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
                  </svg>
                  {unreadCount > 0 && (
                    <span className="absolute -top-1 -right-1 w-5 h-5 bg-red-500 text-white text-xs rounded-full flex items-center justify-center">
                      {unreadCount > 9 ? '9+' : unreadCount}
                    </span>
                  )}
                </button>

                {/* Notifications dropdown */}
                {isNotificationsOpen && (
                  <div className="absolute right-0 mt-2 w-80 bg-white rounded-lg shadow-xl border border-gray-200 z-50">
                    <div className="p-4 border-b">
                      <div className="flex justify-between items-center">
                        <h3 className="font-semibold">Notifications</h3>
                        {unreadCount > 0 && (
                          <button className="text-sm text-blue-600 hover:text-blue-800">
                            Mark all as read
                          </button>
                        )}
                      </div>
                    </div>
                    <div className="max-h-96 overflow-y-auto">
                      {notifications.map((note) => (
                        <div
                          key={note.id}
                          className={`p-4 border-b hover:bg-gray-50 ${!note.read ? 'bg-blue-50' : ''}`}
                        >
                          <div className="flex justify-between">
                            <p className="font-medium">{note.title}</p>
                            {!note.read && <div className="w-2 h-2 bg-blue-500 rounded-full"></div>}
                          </div>
                          <p className="text-sm text-gray-600 mt-1">{note.description}</p>
                          <p className="text-xs text-gray-500 mt-2">{note.time}</p>
                        </div>
                      ))}
                    </div>
                    <div className="p-3 text-center border-t">
                      <a href="/notifications" className="text-sm text-blue-600 hover:text-blue-800">
                        View all notifications
                      </a>
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* User menu */}
            <div className="relative" ref={userMenuRef}>
              <button
                onClick={() => setIsUserMenuOpen(!isUserMenuOpen)}
                className="flex items-center space-x-3 p-1 rounded-lg hover:bg-gray-100"
                aria-label="User menu"
              >
                <div className="w-8 h-8 rounded-full bg-gradient-to-r from-blue-500 to-purple-500 flex items-center justify-center text-white font-semibold">
                  {user?.name?.charAt(0)?.toUpperCase() || 'U'}
                </div>
                <div className="hidden md:block text-left">
                  <p className="font-medium text-gray-700 dark:text-gray-200">{user?.name || 'User'}</p>
                  <p className="text-xs text-gray-500 dark:text-gray-400">{user?.email || ''}</p>
                </div>
                <svg className="w-4 h-4 text-gray-500 hidden md:block" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                </svg>
              </button>

              {/* User dropdown - FIXED ✅ */}
              {isUserMenuOpen && user && (
                <div className="absolute right-0 mt-2 w-48 bg-white rounded-lg shadow-xl border border-gray-200 z-50">
                  <div className="p-4 border-b">
                    <p className="font-semibold">{user.name}</p>
                    <p className="text-sm text-gray-600 truncate">{user.email}</p>
                  </div>
                  <div className="py-2">
                    {userMenuItems.map((item, index) => (
                      item.label === 'divider' ? (
                        <div key={index} className="my-2 border-t"></div>
                      ) : (
                        <button
                          key={index}
                          onClick={item.label === 'Logout' ? handleLogout : () => {
                            console.log(`Navigate to ${item.label.toLowerCase()}`);
                            setIsUserMenuOpen(false);
                            // Add navigation for other items
                            if (item.label === 'Profile') navigate('/profile');
                            if (item.label === 'Settings') navigate('/settings');
                            if (item.label === 'Help & Support') navigate('/help');
                          }}
                          className="w-full text-left px-4 py-3 text-sm text-gray-700 hover:bg-gray-50 flex items-center space-x-3"
                        >
                          <span>{item.icon}</span>
                          <span>{item.label}</span>
                        </button>
                      )
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Mobile search bar */}
        {showSearch && searchQuery && (
          <div className="md:hidden pb-4">
            <div className="relative">
              <input
                type="text"
                placeholder="Search..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-10 pr-4 py-2 rounded-lg border border-gray-300 focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
              <svg
                className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
              </svg>
            </div>
          </div>
        )}
      </div>
    </nav>
  );
};

export default Navbar;