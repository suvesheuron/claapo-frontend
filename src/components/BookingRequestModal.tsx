import { useState } from 'react';
import { FaXmark, FaCalendar } from 'react-icons/fa6';

type BookingRequestModalProps = {
  isOpen: boolean;
  onClose: () => void;
  userName: string;
  userRole: string;
  userRate: string;
  onSubmit: (dates: { start: string; end: string }, message: string) => void;
};

export default function BookingRequestModal({
  isOpen,
  onClose,
  userName,
  userRole,
  userRate,
  onSubmit,
}: BookingRequestModalProps) {
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [message, setMessage] = useState('');

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (startDate && endDate) {
      onSubmit({ start: startDate, end: endDate }, message);
      setStartDate('');
      setEndDate('');
      setMessage('');
      onClose();
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
      <div className="bg-white rounded-lg max-w-md w-full max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between p-4 sm:p-6 border-b border-neutral-200">
          <h2 className="text-lg sm:text-xl font-bold text-neutral-900">Send Booking Request</h2>
          <button
            onClick={onClose}
            className="p-2 hover:bg-neutral-100 rounded-lg transition"
            aria-label="Close"
          >
            <FaXmark className="w-5 h-5 text-neutral-600" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-4 sm:p-6 space-y-4">
          <div className="bg-neutral-50 rounded-lg p-4">
            <h3 className="font-semibold text-neutral-900 mb-1">{userName}</h3>
            <p className="text-sm text-neutral-600 mb-2">{userRole}</p>
            <p className="text-base font-semibold text-neutral-900">{userRate}</p>
          </div>

          <div>
            <label className="block text-sm font-medium text-neutral-700 mb-2">
              <FaCalendar className="inline mr-2" />
              Start Date *
            </label>
            <input
              type="date"
              value={startDate}
              onChange={(e) => setStartDate(e.target.value)}
              className="w-full px-3 py-2 border border-neutral-300 rounded-lg focus:outline-none focus:border-neutral-900"
              required
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-neutral-700 mb-2">
              <FaCalendar className="inline mr-2" />
              End Date *
            </label>
            <input
              type="date"
              value={endDate}
              onChange={(e) => setEndDate(e.target.value)}
              min={startDate}
              className="w-full px-3 py-2 border border-neutral-300 rounded-lg focus:outline-none focus:border-neutral-900"
              required
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-neutral-700 mb-2">
              Message (Optional)
            </label>
            <textarea
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              rows={3}
              placeholder="Add any specific requirements or notes..."
              className="w-full px-3 py-2 border border-neutral-300 rounded-lg focus:outline-none focus:border-neutral-900 resize-y"
            />
          </div>

          <div className="flex gap-3 pt-2">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 px-4 py-2 border border-neutral-300 text-neutral-700 rounded-lg hover:bg-neutral-50"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="flex-1 px-4 py-2 bg-neutral-900 text-white rounded-lg hover:bg-neutral-800"
            >
              Send Request
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

