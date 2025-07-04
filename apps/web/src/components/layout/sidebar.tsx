/**
 * @fileMetadata
 * @purpose Sidebar navigation component for the application.
 * @owner frontend-team
 * @dependencies ["lucide-react"]
 * @exports ["Sidebar"]
 * @complexity low
 * @tags ["component", "layout", "navigation"]
 * @status active
 */
import { Home, Shield, FileText, Camera, X } from 'lucide-react';

const Sidebar = ({ activeScreen, setActiveScreen, isCollapsed, onToggle }) => {
  const navItems = [
    { name: 'Home', icon: Home },
    { name: 'Assets', icon: Shield },
    { name: 'Assess', icon: Camera },
    { name: 'Claims', icon: FileText },
  ];

  return (
    <aside className={`bg-bgSecondary flex flex-col transition-all duration-300 ease-in-out border-r border-border ${isCollapsed ? 'w-20' : 'w-64'}`}>
      <div className={`flex items-center h-16 border-b border-border ${isCollapsed ? 'justify-center' : 'px-6'}`}>
        {!isCollapsed && <button onClick={onToggle} className="p-2 rounded-md hover:bg-bgTertiary"><X size={20} /></button>}
      </div>
      <nav className="flex-1 px-2 py-4 space-y-2">
        {navItems.map(item => (
          <a
            key={item.name}
            href="#"
            onClick={(e) => { e.preventDefault(); setActiveScreen(item.name); }}
            className={`flex items-center p-3 rounded-lg transition-colors ${activeScreen === item.name ? 'accent-blue-bg text-white' : 'hover:bg-bgTertiary'}`}
          >
            <item.icon size={22} className="flex-shrink-0" />
            {!isCollapsed && <span className="ml-4 font-medium">{item.name}</span>}
          </a>
        ))}
      </nav>
    </aside>
  );
};

export default Sidebar;
