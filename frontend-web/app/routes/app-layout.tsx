import { useEffect, useRef, useState } from "react";
import { NavLink, Outlet, useNavigate } from "react-router";
import { clearAuth, isLoggedIn } from "~/lib/auth";
import { CatProvider, useCats } from "~/lib/cat-context";
import { clearSelectedCatId } from "~/lib/selected-cat";

function HamburgerIcon() {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" className="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <line x1="3" y1="6" x2="21" y2="6" />
      <line x1="3" y1="12" x2="21" y2="12" />
      <line x1="3" y1="18" x2="21" y2="18" />
    </svg>
  );
}

function GearIcon() {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" className="w-4 h-4 shrink-0" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="12" cy="12" r="3" />
      <path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1-2.83 2.83l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-4 0v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83-2.83l.06-.06A1.65 1.65 0 0 0 4.68 15a1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1 0-4h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 2.83-2.83l.06.06A1.65 1.65 0 0 0 9 4.68a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 4 0v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 2.83l-.06.06A1.65 1.65 0 0 0 19.4 9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 0 4h-.09a1.65 1.65 0 0 0-1.51 1z" />
    </svg>
  );
}

function Sidebar({ open, onToggle }: { open: boolean; onToggle: () => void }) {
  const navigate = useNavigate();
  const { cats, selectedCat, setSelectedCat } = useCats();
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  // Close dropdown when sidebar collapses
  useEffect(() => {
    if (!open) setDropdownOpen(false);
  }, [open]);

  function handleLogout() {
    clearAuth();
    clearSelectedCatId();
    navigate("/");
  }

  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setDropdownOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const navLinkClass = ({ isActive }: { isActive: boolean }) =>
    `flex items-center rounded-lg text-sm font-medium transition-colors ${
      open ? "gap-3 px-3 py-2" : "justify-center p-2"
    } ${
      isActive
        ? "bg-indigo-50 text-indigo-700"
        : "text-gray-600 hover:bg-gray-100 hover:text-gray-900"
    }`;

  return (
    <aside
      className={`bg-white border-r border-gray-200 flex flex-col shrink-0 transition-all duration-200 ${
        open ? "w-56" : "w-14"
      }`}
    >
      {/* Header: hamburger + logo */}
      <div className={`flex items-center border-b border-gray-100 h-14 ${open ? "px-3 gap-2" : "justify-center"}`}>
        <button
          onClick={onToggle}
          className="p-2 rounded-lg text-gray-500 hover:bg-gray-100 hover:text-gray-900 transition-colors shrink-0"
          title={open ? "Collapse sidebar" : "Expand sidebar"}
        >
          <HamburgerIcon />
        </button>
        {open && (
          <span className="text-base font-bold text-gray-900 truncate">🐱 Cat Health</span>
        )}
      </div>

      {/* Cat avatar with dropdown */}
      <div className={`border-b border-gray-100 relative ${open ? "px-3 pt-3 pb-2" : "px-2 py-3 flex justify-center"}`} ref={dropdownRef}>
        <button
          onClick={() => open && setDropdownOpen((v) => !v)}
          className={`flex items-center rounded-lg hover:bg-gray-100 transition-colors ${
            open ? "gap-3 px-2 py-2 w-full text-left" : "p-1 cursor-default"
          }`}
          title={!open ? (selectedCat?.name ?? "No cat selected") : undefined}
        >
          <div className="w-9 h-9 rounded-full bg-indigo-600 text-white flex items-center justify-center font-bold text-base shrink-0">
            {selectedCat ? selectedCat.name.charAt(0).toUpperCase() : "?"}
          </div>
          {open && (
            <>
              <span className="text-sm text-gray-700 truncate flex-1">
                {selectedCat ? selectedCat.name : "Select a cat"}
              </span>
              <span className="text-gray-400 text-xs">{dropdownOpen ? "▲" : "▼"}</span>
            </>
          )}
        </button>

        {open && dropdownOpen && (
          <div className="absolute left-3 right-3 top-full mt-1 bg-white border border-gray-200 rounded-xl shadow-lg z-50 overflow-hidden">
            {cats.length === 0 ? (
              <p className="px-4 py-3 text-sm text-gray-400">No cats yet</p>
            ) : (
              cats.map((cat) => (
                <button
                  key={cat.id}
                  onClick={() => {
                    setSelectedCat(cat.id);
                    setDropdownOpen(false);
                  }}
                  className={`w-full flex items-center gap-3 px-4 py-2.5 text-sm text-left transition-colors ${
                    selectedCat?.id === cat.id
                      ? "bg-indigo-50 text-indigo-700 font-medium"
                      : "text-gray-700 hover:bg-gray-50"
                  }`}
                >
                  <div className="w-7 h-7 rounded-full bg-indigo-100 text-indigo-700 flex items-center justify-center font-bold text-xs shrink-0">
                    {cat.name.charAt(0).toUpperCase()}
                  </div>
                  <span className="truncate">{cat.name}</span>
                  {selectedCat?.id === cat.id && <span className="ml-auto">✓</span>}
                </button>
              ))
            )}
          </div>
        )}
      </div>

      {/* Nav */}
      <nav className={`flex-1 py-4 space-y-1 ${open ? "px-3" : "px-2"}`}>
        <NavLink to="/dashboard" end className={navLinkClass} title={!open ? "Home" : undefined}>
          <span>🏠</span>
          {open && <span>Home</span>}
        </NavLink>
        <NavLink to="/dashboard/poops" className={navLinkClass} title={!open ? "Poops" : undefined}>
          <span>💩</span>
          {open && <span>Poops</span>}
        </NavLink>
      </nav>

      {/* Bottom actions */}
      <div className={`border-t border-gray-100 flex flex-col gap-1 ${open ? "px-3 py-4" : "px-2 py-4"}`}>
        <NavLink
          to="/dashboard/settings"
          title={!open ? "Settings" : undefined}
          className={({ isActive }) =>
            `flex items-center rounded-lg text-sm font-medium transition-colors ${
              open ? "gap-3 px-3 py-2" : "justify-center p-2"
            } ${
              isActive ? "bg-indigo-50 text-indigo-700" : "text-gray-600 hover:bg-gray-100 hover:text-gray-900"
            }`
          }
        >
          <GearIcon />
          {open && <span>Settings</span>}
        </NavLink>
        <button
          onClick={handleLogout}
          title={!open ? "Log out" : undefined}
          className={`flex items-center rounded-lg text-sm font-medium text-gray-600 hover:bg-gray-100 hover:text-gray-900 transition-colors ${
            open ? "gap-3 px-3 py-2" : "justify-center p-2"
          }`}
        >
          <svg xmlns="http://www.w3.org/2000/svg" className="w-4 h-4 shrink-0" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" />
            <polyline points="16 17 21 12 16 7" />
            <line x1="21" y1="12" x2="9" y2="12" />
          </svg>
          {open && <span>Log out</span>}
        </button>
      </div>
    </aside>
  );
}

export default function AppLayout() {
  const navigate = useNavigate();
  const [sidebarOpen, setSidebarOpen] = useState(true);

  useEffect(() => {
    if (!isLoggedIn()) {
      navigate("/login");
    }
  }, [navigate]);

  return (
    <CatProvider onUnauthorized={() => navigate("/login")}>
      <div className="min-h-screen flex bg-gray-50">
        <Sidebar open={sidebarOpen} onToggle={() => setSidebarOpen((v) => !v)} />
        <div className="flex-1 flex flex-col min-w-0">
          <main className="flex-1 p-6 overflow-auto">
            <Outlet />
          </main>
        </div>
      </div>
    </CatProvider>
  );
}
