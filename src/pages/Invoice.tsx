import { useEffect } from 'react';
import { Link, useParams } from 'react-router-dom';
import { FaArrowLeft, FaDownload } from 'react-icons/fa6';
import DashboardHeader from '../components/DashboardHeader';
import AppFooter from '../components/AppFooter';

const invoiceItems = [
  { description: 'Director Services (3 days)', quantity: 3, rate: 45000, amount: 135000 },
  { description: 'Cinematographer Services (3 days)', quantity: 3, rate: 25000, amount: 75000 },
  { description: 'Sound Engineer Services (3 days)', quantity: 3, rate: 15000, amount: 45000 },
];

const subtotal = invoiceItems.reduce((sum, item) => sum + item.amount, 0);
const tax = subtotal * 0.18; // 18% GST
const total = subtotal + tax;

export default function Invoice() {
  const { invoiceId } = useParams<{ invoiceId: string }>();

  useEffect(() => {
    document.title = 'Invoice – Claapo';
  }, []);

  const handleDownload = () => {
    // In real app, this would generate and download PDF
    alert('Invoice PDF download started');
  };

  return (
    <div className="h-screen flex flex-col overflow-hidden bg-neutral-50 min-w-0 w-full">
      <DashboardHeader />

      <div className="flex-1 flex min-h-0 overflow-hidden">
        <main className="flex-1 flex flex-col min-h-0 min-w-0 overflow-hidden">
          <div className="flex-1 min-h-0 overflow-auto">
            <div className="max-w-4xl mx-auto px-4 sm:px-6 md:px-8 py-4 sm:py-6">
              <Link
                to="/dashboard"
                className="inline-flex items-center gap-2 text-neutral-600 hover:text-neutral-900 mb-4 text-sm"
              >
                <FaArrowLeft className="w-4 h-4" />
                Back to Dashboard
              </Link>

              <div className="mb-4 sm:mb-5">
                <div className="flex items-center justify-between mb-2">
                  <h1 className="text-xl sm:text-2xl md:text-3xl text-neutral-900 font-bold break-words">
                    Invoice #{invoiceId || 'INV-001'}
                  </h1>
                  <button
                    onClick={handleDownload}
                    className="px-4 py-2 bg-[#3678F1] text-white rounded-xl hover:bg-[#2c65d4] text-sm font-semibold flex items-center gap-2 transition-colors shadow-sm shadow-[#3678F1]/20"
                  >
                    <FaDownload className="w-3.5 h-3.5" />
                    Download PDF
                  </button>
                </div>
                <p className="text-xs sm:text-sm text-neutral-600 break-words">
                  Commercial Shoot • Jan 8-10, 2025
                </p>
              </div>

              <div className="bg-white rounded-lg border border-neutral-200 p-6 sm:p-8">
                {/* Invoice Header */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
                  <div>
                    <h3 className="font-bold text-neutral-900 mb-2">From:</h3>
                    <p className="text-sm text-neutral-700">John Director</p>
                    <p className="text-sm text-neutral-600">Director / DOP</p>
                    <p className="text-sm text-neutral-600">Mumbai, India</p>
                  </div>
                  <div>
                    <h3 className="font-bold text-neutral-900 mb-2">To:</h3>
                    <p className="text-sm text-neutral-700">Production Studios Inc.</p>
                    <p className="text-sm text-neutral-600">Ad Agency</p>
                    <p className="text-sm text-neutral-600">Mumbai, India</p>
                  </div>
                </div>

                {/* Invoice Items */}
                <div className="border-t border-neutral-200 pt-6 mb-6">
                  <table className="w-full">
                    <thead>
                      <tr className="border-b border-neutral-200">
                        <th className="text-left py-3 text-sm font-semibold text-neutral-900">Description</th>
                        <th className="text-right py-3 text-sm font-semibold text-neutral-900">Days</th>
                        <th className="text-right py-3 text-sm font-semibold text-neutral-900">Rate</th>
                        <th className="text-right py-3 text-sm font-semibold text-neutral-900">Amount</th>
                      </tr>
                    </thead>
                    <tbody>
                      {invoiceItems.map((item, idx) => (
                        <tr key={idx} className="border-b border-neutral-100">
                          <td className="py-3 text-sm text-neutral-700">{item.description}</td>
                          <td className="py-3 text-sm text-neutral-700 text-right">{item.quantity}</td>
                          <td className="py-3 text-sm text-neutral-700 text-right">₹{item.rate.toLocaleString()}</td>
                          <td className="py-3 text-sm font-semibold text-neutral-900 text-right">₹{item.amount.toLocaleString()}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>

                {/* Totals */}
                <div className="border-t border-neutral-200 pt-6">
                  <div className="flex justify-end">
                    <div className="w-full md:w-64 space-y-2">
                      <div className="flex justify-between text-sm">
                        <span className="text-neutral-600">Subtotal</span>
                        <span className="text-neutral-900 font-semibold">₹{subtotal.toLocaleString()}</span>
                      </div>
                      <div className="flex justify-between text-sm">
                        <span className="text-neutral-600">GST (18%)</span>
                        <span className="text-neutral-900 font-semibold">₹{tax.toLocaleString()}</span>
                      </div>
                      <div className="flex justify-between text-lg pt-2 border-t border-neutral-200">
                        <span className="text-neutral-900 font-bold">Total</span>
                        <span className="text-neutral-900 font-bold">₹{total.toLocaleString()}</span>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Payment Info */}
                <div className="mt-8 pt-6 border-t border-neutral-200">
                  <p className="text-xs text-neutral-600">
                    Payment due within 30 days. Please make payment to the account details provided.
                  </p>
                </div>
              </div>
            </div>
          </div>

          <AppFooter />
        </main>
      </div>
    </div>
  );
}

