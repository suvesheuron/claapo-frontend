import { Link } from 'react-router-dom';
import { FaVideo, FaBell } from 'react-icons/fa6';

type DashboardHeaderProps = {
  userName?: string;
  userAvatar?: string;
};

export default function DashboardHeader({ userName = 'Production Studios Inc.', userAvatar }: DashboardHeaderProps) {
  return (
    <header className="border-b border-neutral-200 bg-white">
      <div className="max-w-[1920px] mx-auto px-4 sm:px-8 lg:px-16 py-6 flex items-center justify-between">
        <Link to="/" className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-lg bg-neutral-800 flex items-center justify-center">
            <FaVideo className="text-white text-xl" />
          </div>
          <span className="text-xl sm:text-2xl text-neutral-900 font-semibold">CrewCall</span>
        </Link>
        <div className="flex items-center gap-4 sm:gap-6">
          <Link to="/dashboard" className="flex items-center gap-2 px-4 py-2 text-neutral-600 hover:text-neutral-900 text-sm">
            <FaBell className="w-4 h-4" />
            <span className="hidden sm:inline">Notifications</span>
          </Link>
          <div className="flex items-center gap-3">
            <img
              src={userAvatar || 'https://api.dicebear.com/7.x/notionists/svg?scale=200&seed=42'}
              alt="Profile"
              className="w-8 h-8 rounded-full object-cover"
            />
            <span className="text-sm text-neutral-900 font-medium hidden sm:inline">{userName}</span>
          </div>
        </div>
      </div>
    </header>
  );
}
