import { useEffect, useState } from 'react';
import { FaLocationDot, FaEnvelope, FaPhone, FaLinkedin, FaInstagram, FaXTwitter } from 'react-icons/fa6';
import AppHeader from '../components/AppHeader';
import AppFooter from '../components/AppFooter';

export default function Contact() {
  useEffect(() => { document.title = 'Contact Us \u2013 Claapo'; }, []);

  const [form, setForm] = useState({ name: '', email: '', subject: '', message: '' });
  const [submitted, setSubmitted] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitted(true);
  };

  return (
    <div className="flex flex-col min-h-screen" style={{ background: '#eef5fd' }}>
      <AppHeader variant="landing" />

      {/* Hero */}
      <section className="py-16" style={{ background: 'linear-gradient(145deg, #a8c8f0 0%, #d8eaf9 60%, #eaf3fd 100%)' }}>
        <div className="max-w-4xl mx-auto px-6 text-center">
          <p className="text-xs font-bold tracking-[0.2em] text-[#3B5BDB] uppercase mb-3">Contact Us</p>
          <h1 className="text-4xl sm:text-5xl font-extrabold text-[#0f172a] mb-4 leading-tight">
            We'd love to hear from you
          </h1>
          <p className="text-base text-slate-500 max-w-lg mx-auto">
            Have a question, feedback, or partnership inquiry? Reach out and our team will get back to you within 24 hours.
          </p>
        </div>
      </section>

      {/* Content */}
      <section className="py-20 flex-1" style={{ background: 'linear-gradient(180deg, #e5f0fc 0%, #eef5fd 100%)' }}>
        <div className="max-w-5xl mx-auto px-6">
          <div className="grid grid-cols-1 lg:grid-cols-5 gap-10">

            {/* Contact Info */}
            <div className="lg:col-span-2 space-y-8">
              <div>
                <h3 className="text-lg font-bold text-slate-900 mb-5">Get in touch</h3>
                <ul className="space-y-5">
                  <li className="flex items-start gap-3">
                    <div className="w-10 h-10 rounded-xl bg-blue-100 flex items-center justify-center shrink-0 mt-0.5">
                      <FaLocationDot className="text-[#3B5BDB] text-sm" />
                    </div>
                    <div>
                      <p className="text-sm font-semibold text-slate-900">Office</p>
                      <p className="text-sm text-slate-500">Mumbai, Maharashtra, India</p>
                    </div>
                  </li>
                  <li className="flex items-start gap-3">
                    <div className="w-10 h-10 rounded-xl bg-blue-100 flex items-center justify-center shrink-0 mt-0.5">
                      <FaEnvelope className="text-[#3B5BDB] text-sm" />
                    </div>
                    <div>
                      <p className="text-sm font-semibold text-slate-900">Email</p>
                      <a href="mailto:hello@crewcall.in" className="text-sm text-[#3B5BDB] hover:underline">hello@crewcall.in</a>
                    </div>
                  </li>
                  <li className="flex items-start gap-3">
                    <div className="w-10 h-10 rounded-xl bg-blue-100 flex items-center justify-center shrink-0 mt-0.5">
                      <FaPhone className="text-[#3B5BDB] text-sm" />
                    </div>
                    <div>
                      <p className="text-sm font-semibold text-slate-900">Phone</p>
                      <a href="tel:+919876543210" className="text-sm text-[#3B5BDB] hover:underline">+91 98765 43210</a>
                    </div>
                  </li>
                </ul>
              </div>

              <div>
                <h3 className="text-lg font-bold text-slate-900 mb-4">Follow us</h3>
                <div className="flex items-center gap-3">
                  {[
                    { Icon: FaLinkedin, href: 'https://linkedin.com', label: 'LinkedIn' },
                    { Icon: FaInstagram, href: 'https://instagram.com', label: 'Instagram' },
                    { Icon: FaXTwitter, href: 'https://x.com', label: 'X / Twitter' },
                  ].map(s => (
                    <a key={s.label} href={s.href} target="_blank" rel="noopener noreferrer" aria-label={s.label} className="w-10 h-10 rounded-full bg-white border border-slate-200 flex items-center justify-center hover:border-[#3B5BDB] hover:text-[#3B5BDB] transition-colors text-slate-400">
                      <s.Icon className="text-sm" />
                    </a>
                  ))}
                </div>
              </div>
            </div>

            {/* Contact Form */}
            <div className="lg:col-span-3">
              <div className="bg-white rounded-2xl shadow-sm border border-slate-100 p-8">
                {submitted ? (
                  <div className="text-center py-12">
                    <div className="w-16 h-16 rounded-full bg-green-100 flex items-center justify-center mx-auto mb-5">
                      <FaEnvelope className="text-green-600 text-xl" />
                    </div>
                    <h3 className="text-xl font-bold text-slate-900 mb-2">Message sent!</h3>
                    <p className="text-sm text-slate-500">Thank you for reaching out. We'll get back to you within 24 hours.</p>
                  </div>
                ) : (
                  <>
                    <h3 className="text-lg font-bold text-slate-900 mb-6">Send us a message</h3>
                    <form onSubmit={handleSubmit} className="space-y-5">
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                        <div>
                          <label className="block text-sm font-medium text-slate-700 mb-1.5">Name</label>
                          <input
                            type="text" required
                            value={form.name} onChange={e => setForm(p => ({ ...p, name: e.target.value }))}
                            className="w-full rounded-xl border border-slate-200 px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-[#3B5BDB]/30 focus:border-[#3B5BDB] transition-all"
                            placeholder="Your name"
                          />
                        </div>
                        <div>
                          <label className="block text-sm font-medium text-slate-700 mb-1.5">Email</label>
                          <input
                            type="email" required
                            value={form.email} onChange={e => setForm(p => ({ ...p, email: e.target.value }))}
                            className="w-full rounded-xl border border-slate-200 px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-[#3B5BDB]/30 focus:border-[#3B5BDB] transition-all"
                            placeholder="you@example.com"
                          />
                        </div>
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-slate-700 mb-1.5">Subject</label>
                        <input
                          type="text" required
                          value={form.subject} onChange={e => setForm(p => ({ ...p, subject: e.target.value }))}
                          className="w-full rounded-xl border border-slate-200 px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-[#3B5BDB]/30 focus:border-[#3B5BDB] transition-all"
                          placeholder="What's this about?"
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-slate-700 mb-1.5">Message</label>
                        <textarea
                          required rows={5}
                          value={form.message} onChange={e => setForm(p => ({ ...p, message: e.target.value }))}
                          className="w-full rounded-xl border border-slate-200 px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-[#3B5BDB]/30 focus:border-[#3B5BDB] transition-all resize-none"
                          placeholder="Tell us more..."
                        />
                      </div>
                      <button type="submit" className="w-full rounded-xl bg-[#3B5BDB] text-white py-3 text-sm font-bold hover:bg-[#2f4ac2] transition-all shadow-lg shadow-[#3B5BDB]/20">
                        Send Message
                      </button>
                    </form>
                  </>
                )}
              </div>
            </div>
          </div>
        </div>
      </section>

      <AppFooter variant="dark" />
    </div>
  );
}
