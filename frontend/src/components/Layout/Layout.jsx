import { useEffect } from 'react';
import { useSelector } from 'react-redux';
import { selectSidebarCollapsed, selectTheme } from '../../slices/uiSlice';
import Sidebar from './Sidebar';
import Topbar  from './Topbar';

export default function Layout({ children }) {
  const collapsed = useSelector(selectSidebarCollapsed);
  const theme     = useSelector(selectTheme);

  useEffect(() => {
    document.documentElement.classList.toggle('dark', theme === 'dark');
  }, [theme]);

  const sideW = collapsed ? 'ml-16' : 'ml-56';

  return (
    <div className="min-h-screen bg-[#F8FAFC] dark:bg-[#0F172A] text-gray-900 dark:text-white">
      <Sidebar />
      <div className={`${sideW} transition-all duration-300 flex flex-col min-h-screen`}>
        <Topbar />
        <main className="flex-1 p-6 overflow-auto">
          {children}
        </main>
      </div>
    </div>
  );
}
