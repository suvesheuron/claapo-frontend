import { useEffect, useState } from 'react';
import { FaTruck, FaHouse, FaCalendar, FaPlus, FaPencil, FaTrash, FaUser } from 'react-icons/fa6';
import DashboardHeader from '../../components/DashboardHeader';
import DashboardSidebar from '../../components/DashboardSidebar';
import AppFooter from '../../components/AppFooter';

const navLinks = [
  { icon: FaHouse,     label: 'Dashboard',   to: '/dashboard' },
  { icon: FaCalendar,  label: 'Availability', to: '/dashboard/vendor-availability' },
  { icon: FaTruck,     label: 'Equipment',   to: '/dashboard/equipment' },
  { icon: FaUser,      label: 'Profile',     to: '/dashboard/vendor-profile' },
];

const initialEquipment = [
  { id: 1, name: 'RED Camera Package', rate: '₹15,000/day', status: 'available' as const, category: 'Camera' },
  { id: 2, name: 'Lighting Kit (LED)', rate: '₹8,000/day',  status: 'available' as const, category: 'Lighting' },
  { id: 3, name: 'Gimbal Stabilizer',  rate: '₹5,000/day',  status: 'booked' as const,   category: 'Camera' },
  { id: 4, name: 'Transport Van',      rate: '₹3,500/day',  status: 'available' as const, category: 'Transport' },
  { id: 5, name: 'Sound Recording Kit',rate: '₹6,000/day',  status: 'available' as const, category: 'Audio' },
  { id: 6, name: 'Drone Package',      rate: '₹12,000/day', status: 'booked' as const,   category: 'Camera' },
];

export default function Equipment() {
  useEffect(() => { document.title = 'Equipment – Claapo'; }, []);
  const [equipment, setEquipment] = useState(initialEquipment);

  const toggleStatus = (id: number) => {
    setEquipment((prev) =>
      prev.map((item) =>
        item.id === id
          ? { ...item, status: item.status === 'available' ? 'booked' as const : 'available' as const }
          : item
      )
    );
  };

  const available = equipment.filter((e) => e.status === 'available').length;
  const booked = equipment.filter((e) => e.status === 'booked').length;

  return (
    <div className="h-screen flex flex-col overflow-hidden bg-[#F3F4F6] w-full">
      <DashboardHeader userName="Equipment Rentals Co." />

      <div className="flex-1 flex min-h-0 overflow-hidden">
        <DashboardSidebar links={navLinks} />

        <main className="flex-1 flex flex-col min-h-0 min-w-0 overflow-hidden">
          <div className="flex-1 min-h-0 overflow-auto">
            <div className="max-w-[1000px] mx-auto px-4 sm:px-6 lg:px-8 py-5">

              <div className="flex items-center justify-between mb-5">
                <div>
                  <h1 className="text-xl font-bold text-neutral-900">Equipment</h1>
                  <p className="text-sm text-neutral-500 mt-0.5">Manage your inventory, rates, and availability</p>
                </div>
                <button
                  onClick={() => alert('Add Equipment – connect to backend')}
                  className="rounded-xl px-4 py-2.5 bg-[#3678F1] text-white text-sm font-semibold hover:bg-[#2563d4] flex items-center gap-2 transition-colors"
                >
                  <FaPlus className="w-3 h-3" /> Add Equipment
                </button>
              </div>

              {/* Summary */}
              <div className="grid grid-cols-3 gap-3 mb-5">
                {[
                  { label: 'Total Items',  value: equipment.length, color: 'text-neutral-900' },
                  { label: 'Available',    value: available,        color: 'text-[#22C55E]' },
                  { label: 'Booked',       value: booked,           color: 'text-[#F40F02]' },
                ].map(({ label, value, color }) => (
                  <div key={label} className="rounded-2xl bg-white border border-neutral-200 p-4">
                    <p className="text-xs text-neutral-500">{label}</p>
                    <p className={`text-xl font-bold mt-1 ${color}`}>{value}</p>
                  </div>
                ))}
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                {equipment.map((item) => (
                  <div key={item.id} className="rounded-2xl bg-white border border-neutral-200 p-4 hover:shadow-sm hover:border-neutral-300 transition-all">
                    <div className="flex items-start justify-between gap-2 mb-3">
                      <div className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 ${
                        item.status === 'available' ? 'bg-[#DCFCE7]' : 'bg-[#FEE2E2]'
                      }`}>
                        <FaTruck className={`text-sm ${item.status === 'available' ? 'text-[#15803D]' : 'text-[#B91C1C]'}`} />
                      </div>
                      <span className={`text-[10px] font-semibold px-2 py-0.5 rounded-full ${
                        item.status === 'available'
                          ? 'bg-[#DCFCE7] text-[#15803D]'
                          : 'bg-[#FEE2E2] text-[#B91C1C]'
                      }`}>
                        {item.status === 'available' ? 'Available' : 'Booked'}
                      </span>
                    </div>

                    <p className="text-[10px] font-semibold text-neutral-400 uppercase tracking-wider mb-1">{item.category}</p>
                    <h3 className="text-sm font-bold text-neutral-900 mb-1 truncate">{item.name}</h3>
                    <p className="text-sm font-semibold text-[#3678F1] mb-3">{item.rate}</p>

                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => toggleStatus(item.id)}
                        className={`flex-1 text-[11px] py-1.5 rounded-xl font-semibold transition-colors ${
                          item.status === 'available'
                            ? 'bg-[#FEE2E2] text-[#B91C1C] hover:bg-red-200'
                            : 'bg-[#DCFCE7] text-[#15803D] hover:bg-green-200'
                        }`}
                      >
                        {item.status === 'available' ? 'Mark Booked' : 'Mark Available'}
                      </button>
                      <button
                        onClick={() => alert(`Edit: ${item.name}`)}
                        className="w-8 h-8 rounded-xl bg-[#F3F4F6] flex items-center justify-center text-neutral-500 hover:bg-[#EEF4FF] hover:text-[#3678F1] transition-colors shrink-0"
                      >
                        <FaPencil className="text-xs" />
                      </button>
                      <button
                        onClick={() => alert(`Delete: ${item.name}`)}
                        className="w-8 h-8 rounded-xl bg-[#F3F4F6] flex items-center justify-center text-neutral-500 hover:bg-[#FEE2E2] hover:text-[#F40F02] transition-colors shrink-0"
                      >
                        <FaTrash className="text-xs" />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
          <AppFooter />
        </main>
      </div>
    </div>
  );
}
