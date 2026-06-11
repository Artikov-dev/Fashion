import { useEffect, useRef } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { selectSidebarCollapsed, selectTheme } from '../../slices/uiSlice';
import { selectUser } from '../../slices/authSlice';
import { createRandomTask } from '../../slices/notificationsSlice';
import Sidebar from './Sidebar';
import Topbar  from './Topbar';

const TASK_INTERVAL_MS = 60_000; // 1 daqiqa

export default function Layout({ children }) {
  const dispatch  = useDispatch();
  const collapsed = useSelector(selectSidebarCollapsed);
  const theme     = useSelector(selectTheme);
  const user      = useSelector(selectUser);
  const timerRef  = useRef(null);

  useEffect(() => {
    document.documentElement.classList.toggle('dark', theme === 'dark');
  }, [theme]);

  /* Auto-create random task every 1 minute while logged in */
  useEffect(() => {
    if (!user) return;

    // fire once immediately on mount (after short delay so app settles)
    const boot = setTimeout(() => dispatch(createRandomTask()), 8_000);

    timerRef.current = setInterval(() => {
      dispatch(createRandomTask());
    }, TASK_INTERVAL_MS);

    return () => {
      clearTimeout(boot);
      clearInterval(timerRef.current);
    };
  }, [dispatch, user]);

  const sideW = collapsed ? 64 : 224;

  return (
    <div className="min-h-screen bg-[#F8FAFC] dark:bg-[#0F172A] text-gray-900 dark:text-white">
      <Sidebar />
      <div style={{ marginLeft: sideW, transition: 'margin-left .3s cubic-bezier(.4,0,.2,1)' }}
        className="flex flex-col min-h-screen">
        <Topbar />
        <main className="flex-1 p-6 overflow-auto">
          {children}
        </main>
      </div>
    </div>
  );
}
