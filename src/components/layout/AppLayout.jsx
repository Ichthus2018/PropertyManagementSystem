import { NavLink, useNavigate } from "react-router-dom";
import { useAuthStore } from "../../store/useAuthStore";
import {
  FaSignOutAlt,
  FaUserShield,
  FaUsers,
  FaUserCircle,
  FaChevronLeft,
  FaChevronRight,
  FaBars,
  FaTimes,
  FaHotel,
  FaDatabase,
  FaCog,
} from "react-icons/fa";
import { useState, Fragment } from "react"; // Import Fragment
import {
  Popover,
  PopoverButton,
  PopoverPanel,
  Transition,
} from "@headlessui/react"; // Import Popover components

// Import the Logout Modal (ensure path is correct)
import LogoutModal from "./LogoutModal";
import PopoverMenuItem from "../ui/PopoverMenuItem";

// Nav Item Component - STYLES UPDATED FOR NEW THEME
const NavItem = ({ to, icon, label, sidebarOpen }) => (
  <li>
    <NavLink
      to={to}
      className={({ isActive }) =>
        `flex items-center px-4 py-3 transition-all duration-300 rounded-lg group ${
          isActive
            ? "bg-gradient-to-r from-orange-400 to-red-500 text-white font-semibold shadow-md"
            : "text-gray-500 hover:bg-gray-100 hover:text-gray-800"
        }`
      }
    >
      {/* Icon color changes on active state via group-hover or direct class */}
      <div className="group-hover:text-gray-800">{icon}</div>
      {sidebarOpen && <span className="ml-3 whitespace-nowrap">{label}</span>}
    </NavLink>
  </li>
);

export default function AppLayout({ children }) {
  const { userProfile, isAdmin, logout } = useAuthStore();
  const navigate = useNavigate();
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [isLogoutModalOpen, setIsLogoutModalOpen] = useState(false); // State for the confirmation modal

  // This function is now called when the user CONFIRMS the logout in the modal
  const handleLogout = async () => {
    setIsLogoutModalOpen(false); // Close the modal
    await logout();
    navigate("/login");
  };

  // This function is called when the user clicks the initial logout button in the popover
  const handleLogoutClick = (closePopover) => {
    // Popover's close function is passed here
    closePopover(); // Close the Popover immediately
    setIsLogoutModalOpen(true); // Open the confirmation modal
  };

  const toggleSidebar = () => setSidebarOpen(!sidebarOpen);

  const profileImage = userProfile?.profile_image_url ? (
    <img
      src={userProfile.profile_image_url}
      alt="Profile"
      className="h-10 w-10 rounded-full object-cover ring-2 ring-orange-400"
    />
  ) : (
    <FaUserCircle className="h-10 w-10 text-orange-400" />
  );

  return (
    <div className="flex h-screen bg-white text-gray-800 overflow-hidden font-sans">
      {/* ====== SIDEBAR ====== */}
      <aside
        className={`
          fixed inset-y-0 left-0 z-50 flex h-full flex-col bg-white text-gray-800 border-r border-gray-200 transition-all duration-300 ease-in-out
          ${
            sidebarOpen
              ? "translate-x-0 w-64"
              : "-translate-x-full w-64 md:w-20"
          }
          md:static md:translate-x-0
        `}
      >
        {/* Sidebar Header */}
        <div className="flex items-center justify-between px-4 h-16 border-b border-gray-200">
          {sidebarOpen ? (
            <h1 className="text-2xl font-bold bg-gradient-to-r from-orange-400 to-red-500 bg-clip-text text-transparent transition-all">
              Cynthia
            </h1>
          ) : (
            <span className="text-2xl font-bold bg-gradient-to-r from-orange-400 to-red-500 bg-clip-text text-transparent">
              V
            </span>
          )}
          <button
            onClick={toggleSidebar}
            className="hidden md:flex items-center justify-center h-8 w-8 text-gray-500 hover:bg-gray-100 rounded-full"
            aria-label={sidebarOpen ? "Collapse sidebar" : "Expand sidebar"}
          >
            {sidebarOpen ? (
              <FaChevronLeft size={14} />
            ) : (
              <FaChevronRight size={14} />
            )}
          </button>
          <button
            onClick={toggleSidebar}
            className="md:hidden text-gray-500 hover:text-gray-900"
            aria-label="Close sidebar"
          >
            <FaTimes size={22} />
          </button>
        </div>

        {/* Navigation */}
        <nav className="flex-grow py-4 px-3 overflow-y-auto">
          <ul className="space-y-2">
            <NavItem
              to="/properties"
              icon={<FaHotel size={20} />}
              label="Properties"
              sidebarOpen={sidebarOpen}
            />
            <NavItem
              to="/units"
              icon={<FaHotel size={20} />}
              label="Units"
              sidebarOpen={sidebarOpen}
            />

            {isAdmin && (
              <NavItem
                to="/users"
                icon={<FaUsers size={20} />}
                label="Users"
                sidebarOpen={sidebarOpen}
              />
            )}
          </ul>
        </nav>
        <Popover className="relative p-4 border-t border-gray-200">
          <PopoverButton className="flex items-center gap-3 cursor-pointer rounded-lg p-2 hover:bg-gray-100 transition-all w-full text-left">
            {profileImage}
            {sidebarOpen && (
              <div className="min-w-0 flex-1">
                <p className="text-sm font-semibold truncate">
                  {userProfile?.first_name || "Administrator"}{" "}
                  {userProfile?.last_name}
                </p>
                <p className="text-xs text-orange-500 font-medium">
                  {userProfile?.role || "Admin"}
                </p>
              </div>
            )}
          </PopoverButton>

          {/* Popover Panel (the menu that appears) */}
          <Transition
            as={Fragment}
            enter="transition ease-out duration-200"
            enterFrom="opacity-0 translate-y-1"
            enterTo="opacity-100 translate-y-0"
            leave="transition ease-in duration-150"
            leaveFrom="opacity-100 translate-y-0"
            leaveTo="opacity-0 translate-y-1"
          >
            <PopoverPanel
              className={`
                absolute z-50 w-60 bg-white text-gray-800 rounded-xl shadow-2xl overflow-hidden
                border border-gray-200
                ${sidebarOpen ? "bottom-20 left-4" : "left-2 bottom-20"}
              `}
            >
              {({ close }) => (
                <>
                  <div className="px-4 py-3 border-b border-gray-100 bg-gray-50">
                    <p className="text-sm text-gray-500">Signed in as</p>
                    <p className="text-base font-semibold text-gray-800 truncate">
                      {userProfile?.first_name || "Administrator"}{" "}
                      {userProfile?.last_name}
                    </p>
                  </div>
                  {isAdmin && (
                    <div className="py-2">
                      <p className="px-4 pt-2 pb-2 text-xs font-semibold text-gray-400 uppercase tracking-wider">
                        Settings
                      </p>
                      <ul className="space-y-1">
                        <li>
                          <PopoverMenuItem
                            to="/settings/general"
                            icon={<FaCog size={16} />}
                            label="General"
                            close={close}
                          />
                        </li>
                        <li>
                          <PopoverMenuItem
                            to="/settings/property-data"
                            icon={<FaDatabase size={16} />}
                            label="Property Data"
                            close={close}
                          />
                        </li>
                        <li>
                          <PopoverMenuItem
                            to="/settings/user-management"
                            icon={<FaUsers size={16} />}
                            label="User Management"
                            close={close}
                          />
                        </li>
                      </ul>
                    </div>
                  )}
                  <button
                    onClick={() => handleLogoutClick(close)} // Pass the popover's close function
                    className="flex items-center w-full px-4 py-3 text-sm text-red-600 hover:bg-red-50 transition-colors duration-200"
                  >
                    <FaSignOutAlt className="mr-3" />
                    Logout
                  </button>
                </>
              )}
            </PopoverPanel>
          </Transition>
        </Popover>
      </aside>

      {/* ====== MAIN CONTENT AREA ====== */}
      <main className="flex-1 overflow-y-auto ">
        <button
          onClick={toggleSidebar}
          className="md:hidden fixed top-4 left-4 z-40 p-2 bg-white text-gray-600 rounded-lg shadow-md border border-gray-200"
          aria-label="Open sidebar"
        >
          <FaBars size={20} />
        </button>

        <div>{children}</div>
      </main>

      {/* Mobile Overlay */}
      {sidebarOpen && (
        <div
          onClick={toggleSidebar}
          className="md:hidden fixed inset-0 z-30 bg-black/40 backdrop-blur-sm"
          aria-hidden="true"
        ></div>
      )}

      {/* Render the Logout Modal */}
      <LogoutModal
        isOpen={isLogoutModalOpen}
        onClose={() => setIsLogoutModalOpen(false)}
        onConfirm={handleLogout}
      />
    </div>
  );
}
