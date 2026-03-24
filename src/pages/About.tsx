import { Link } from 'react-router-dom';
import { useEffect } from 'react';
import { FaVideo, FaUsers, FaTruck, FaArrowRight, FaBullseye, FaLightbulb, FaHandshake } from 'react-icons/fa6';
import AppHeader from '../components/AppHeader';
import AppFooter from '../components/AppFooter';

export default function About() {
  useEffect(() => { document.title = 'About Us \u2013 Claapo'; }, []);

  return (
    <div className="flex flex-col min-h-screen" style={{ background: '#eef5fd' }}>
      <AppHeader variant="landing" />

      {/* Hero */}
      <section className="py-20" style={{ background: 'linear-gradient(145deg, #a8c8f0 0%, #d8eaf9 60%, #eaf3fd 100%)' }}>
        <div className="max-w-4xl mx-auto px-6 text-center">
          <p className="text-xs font-bold tracking-[0.2em] text-[#3B5BDB] uppercase mb-3">About Us</p>
          <h1 className="text-4xl sm:text-5xl font-extrabold text-[#0f172a] mb-6 leading-tight">
            We're building the future of<br />film production management
          </h1>
          <p className="text-base text-slate-500 max-w-2xl mx-auto leading-relaxed">
            Claapo was born from a simple frustration: why is hiring film crew still done through WhatsApp groups and spreadsheets?
            We set out to build a platform that brings structure, transparency, and efficiency to the entire production workflow.
          </p>
        </div>
      </section>

      {/* Mission, Vision, Values */}
      <section className="py-20" style={{ background: 'linear-gradient(180deg, #e5f0fc 0%, #eef5fd 100%)' }}>
        <div className="max-w-5xl mx-auto px-6">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {[
              { Icon: FaBullseye, title: 'Our Mission', color: 'bg-blue-100', iconColor: 'text-[#3B5BDB]', desc: 'To eliminate the chaos from film production by providing a unified platform where every stakeholder — from directors to grip boys — can collaborate efficiently.' },
              { Icon: FaLightbulb, title: 'Our Vision', color: 'bg-amber-100', iconColor: 'text-amber-600', desc: 'A world where every production runs on time, on budget, and without the stress. Where talent is discovered on merit and payments flow seamlessly.' },
              { Icon: FaHandshake, title: 'Our Values', color: 'bg-emerald-100', iconColor: 'text-emerald-600', desc: 'Transparency in every transaction. Respect for every role on set. Innovation that serves real workflows. Security that protects your data and livelihood.' },
            ].map(item => (
              <div key={item.title} className="bg-white rounded-2xl shadow-sm border border-slate-100 p-8">
                <div className={`w-12 h-12 rounded-2xl ${item.color} flex items-center justify-center mb-5`}>
                  <item.Icon className={`${item.iconColor} text-xl`} />
                </div>
                <h3 className="text-xl font-bold text-slate-900 mb-3">{item.title}</h3>
                <p className="text-sm text-slate-500 leading-relaxed">{item.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Who we serve */}
      <section className="py-20" style={{ background: 'linear-gradient(180deg, #eef5fd 0%, #e8f2fb 100%)' }}>
        <div className="max-w-5xl mx-auto px-6">
          <div className="text-center mb-14">
            <h2 className="text-3xl font-bold text-[#0f172a] mb-4">Who we serve</h2>
            <p className="text-sm text-slate-500 max-w-md mx-auto">Claapo connects every stakeholder in the production ecosystem.</p>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {[
              { Icon: FaUsers, title: 'Freelance Crew', desc: 'DOPs, editors, gaffers, makeup artists, sound engineers, and 20+ other roles. Get discovered, manage your calendar, and get paid professionally.', link: '/register/individual', cta: 'Join as Freelancer' },
              { Icon: FaVideo, title: 'Production Houses', desc: 'Ad agencies, film studios, OTT production teams. Search verified talent, manage projects, and run productions without the chaos.', link: '/register/company', cta: 'Get Company Access' },
              { Icon: FaTruck, title: 'Vendors & Rental Houses', desc: 'Equipment, lighting, transport, and catering providers. List your inventory, manage rentals, and reach the entire production ecosystem.', link: '/register/vendor', cta: 'List Your Equipment' },
            ].map(item => (
              <div key={item.title} className="bg-white rounded-2xl shadow-sm border border-slate-100 p-8 flex flex-col">
                <div className="w-12 h-12 rounded-2xl bg-blue-50 flex items-center justify-center mb-5">
                  <item.Icon className="text-[#3B5BDB] text-lg" />
                </div>
                <h3 className="text-lg font-bold text-slate-900 mb-3">{item.title}</h3>
                <p className="text-sm text-slate-500 leading-relaxed mb-6 flex-1">{item.desc}</p>
                <Link to={item.link} className="inline-flex items-center gap-1.5 text-sm font-semibold text-[#3B5BDB] hover:underline">
                  {item.cta} <FaArrowRight className="text-xs" />
                </Link>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="py-6 pb-24" style={{ background: 'linear-gradient(180deg, #e8f2fb 0%, #eef5fd 100%)' }}>
        <div className="max-w-3xl mx-auto px-6">
          <div className="rounded-3xl p-14 text-center" style={{ background: 'linear-gradient(135deg, #3B5BDB 0%, #4B6CF7 100%)' }}>
            <h2 className="text-3xl font-bold text-white mb-4">Want to work with us?</h2>
            <p className="text-sm text-blue-100 mb-8">We're always looking for passionate people who care about the film industry.</p>
            <Link to="/contact" className="inline-flex items-center gap-2 rounded-xl bg-white text-[#3B5BDB] px-8 py-3.5 text-sm font-bold hover:bg-blue-50 transition-all shadow-md">
              Get in Touch <FaArrowRight className="text-xs" />
            </Link>
          </div>
        </div>
      </section>

      <AppFooter variant="dark" />
    </div>
  );
}
