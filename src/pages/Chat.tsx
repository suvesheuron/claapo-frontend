import { useEffect, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { FaArrowLeft, FaPaperPlane, FaVideo } from 'react-icons/fa6';
import DashboardHeader from '../components/DashboardHeader';
import AppFooter from '../components/AppFooter';
import Avatar from '../components/Avatar';

const messages = [
  { id: 1, sender: 'other', text: 'Hi! I\'m interested in your project. I have 12 years of experience in directing commercial films.', time: '10:30 AM' },
  { id: 2, sender: 'me', text: 'Great! Can you share your showreel?', time: '10:32 AM' },
  { id: 3, sender: 'other', text: 'Sure! Here\'s the link: [Showreel URL]', time: '10:35 AM' },
  { id: 4, sender: 'me', text: 'Perfect! I\'ll review it and get back to you.', time: '10:36 AM' },
];

export default function Chat() {
  const { userId } = useParams<{ userId: string }>();
  const [message, setMessage] = useState('');

  useEffect(() => {
    document.title = 'Chat – CrewCall';
  }, []);

  const handleSend = (e: React.FormEvent) => {
    e.preventDefault();
    if (message.trim()) {
      // In real app, this would send message via API
      console.log('Sending message:', message);
      setMessage('');
    }
  };

  return (
    <div className="h-screen flex flex-col overflow-hidden bg-neutral-50 min-w-0 w-full">
      <DashboardHeader />

      <div className="flex-1 flex min-h-0 overflow-hidden">
        <main className="flex-1 flex flex-col min-h-0 min-w-0 overflow-hidden">
          <div className="flex-1 flex flex-col min-h-0">
            {/* Chat Header */}
            <div className="bg-white border-b border-neutral-200 p-4 flex items-center gap-3">
              <Link
                to="/dashboard"
                className="p-2 hover:bg-neutral-100 rounded-lg transition"
              >
                <FaArrowLeft className="w-5 h-5 text-neutral-600" />
              </Link>
              <Avatar name="John Director" size="sm" />
              <div className="flex-1 min-w-0">
                <h2 className="font-semibold text-neutral-900 truncate">John Director</h2>
                <p className="text-xs text-neutral-600">Director • Online</p>
              </div>
            </div>

            {/* Messages */}
            <div className="flex-1 overflow-y-auto p-4 space-y-4">
              {messages.map((msg) => (
                <div
                  key={msg.id}
                  className={`flex gap-3 ${msg.sender === 'me' ? 'justify-end' : 'justify-start'}`}
                >
                  {msg.sender === 'other' && (
                    <Avatar name="John Director" size="sm" />
                  )}
                  <div className={`max-w-[70%] ${msg.sender === 'me' ? 'order-2' : ''}`}>
                    <div
                      className={`rounded-lg p-3 ${
                        msg.sender === 'me'
                          ? 'bg-neutral-900 text-white'
                          : 'bg-white border border-neutral-200 text-neutral-900'
                      }`}
                    >
                      <p className="text-sm break-words">{msg.text}</p>
                      <p className={`text-xs mt-1 ${msg.sender === 'me' ? 'text-neutral-300' : 'text-neutral-500'}`}>
                        {msg.time}
                      </p>
                    </div>
                  </div>
                  {msg.sender === 'me' && (
                    <Avatar name="Me" size="sm" />
                  )}
                </div>
              ))}
            </div>

            {/* Message Input */}
            <form onSubmit={handleSend} className="bg-white border-t border-neutral-200 p-4">
              <div className="flex items-center gap-2">
                <input
                  type="text"
                  value={message}
                  onChange={(e) => setMessage(e.target.value)}
                  placeholder="Type a message..."
                  className="flex-1 px-4 py-2 border border-neutral-300 rounded-lg focus:outline-none focus:border-neutral-900"
                />
                <button
                  type="submit"
                  className="p-2 bg-neutral-900 text-white rounded-lg hover:bg-neutral-800"
                >
                  <FaPaperPlane className="w-5 h-5" />
                </button>
              </div>
            </form>
          </div>
        </main>
      </div>

      <AppFooter />
    </div>
  );
}

