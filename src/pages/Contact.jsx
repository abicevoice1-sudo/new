import { motion } from 'framer-motion';
import { useState } from 'react';
import Layout from '../layouts/LandingLayout';
import { Mail, Phone, MapPin, Clock, Send } from 'lucide-react';

const CONTACT_METHODS = [
  { icon: Mail, title: 'Email Support', desc: 'Get help within hours', links: [
    { label: 'support@shiarishta.com', href: 'mailto:support@shiarishta.com' },
    { label: 'info@shiarishta.com', href: 'mailto:info@shiarishta.com' },
  ]},
  { icon: Phone, title: 'Phone Support', desc: 'Mon–Fri, 9 AM – 6 PM EST', links: [
    { label: '+1 (555) 123-4567', href: 'tel:+15551234567' },
  ]},
  { icon: MapPin, title: 'Headquarters', desc: 'Serving communities worldwide', links: [
    { label: 'Ann Arbor, MI, United States', href: 'https://maps.google.com/?q=Ann+Arbor,+MI+USA' },
  ]},
  { icon: Clock, title: 'Response Time', desc: 'We aim to reply fast', links: [
    { label: 'Urgent matters — 1–2 hours', href: 'mailto:support@shiarishta.com' },
    { label: 'General questions — 4–8 hours', href: 'mailto:support@shiarishta.com' },
    { label: 'Detailed feedback — 24 hours', href: 'mailto:support@shiarishta.com' },
  ]},
];

export default function Contact() {
  const [formData, setFormData] = useState({ name: '', email: '', subject: '', message: '' });
  const [submissionError, setSubmissionError] = useState('');

  const handleChange = (e) => setFormData(prev => ({ ...prev, [e.target.name]: e.target.value }));

  const handleSubmit = (e) => {
    e.preventDefault();
    setSubmissionError('Message not sent. Online contact delivery is unavailable. Your draft has been kept on this page; copy it before leaving or reloading.');
  };

  const inputCls = 'w-full px-4 py-3 rounded-xl border border-line/30 bg-elevated text-sm text-ink placeholder:text-muted focus:outline-none focus:ring-2 focus:ring-primary/25 focus:border-primary transition-all';

  return (
    <Layout>
      <main className="max-w-6xl mx-auto px-4 sm:px-6 py-10 sm:py-14">
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="text-center mb-12">
          <span className="text-xs font-bold uppercase tracking-widest text-primary">We're here for you</span>
          <h1 className="text-3xl sm:text-4xl font-bold text-ink mt-2">Get in Touch</h1>
          <p className="text-muted mt-2 max-w-xl mx-auto">Have a question about privacy, need help with your profile, or want to share feedback? Our team listens.</p>
        </motion.div>

        <div className="grid lg:grid-cols-[1fr_1.2fr] gap-10">
          <div className="space-y-4">
            {CONTACT_METHODS.map((m, i) => (
              <motion.div key={m.title} initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: i * 0.07 }}
                className="flex items-start gap-4 p-5 rounded-2xl border border-line/20 bg-elevated hover:shadow-sm transition-all">
                <span className="w-11 h-11 rounded-xl bg-primary/10 flex items-center justify-center flex-shrink-0"><m.icon className="w-5 h-5 text-primary" /></span>
                <div>
                  <h3 className="font-semibold text-ink text-sm">{m.title}</h3>
                  <p className="text-xs text-muted mt-0.5 mb-1.5">{m.desc}</p>
                  {m.links.map(l => <a key={l.label} href={l.href} className="block text-xs text-primary hover:underline">{l.label}</a>)}
                </div>
              </motion.div>
            ))}
          </div>

          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }}
            className="bg-elevated rounded-2xl border border-line/20 shadow-sm p-6 sm:p-8">
              <form onSubmit={handleSubmit} className="space-y-4" aria-describedby="contact-unavailable">
                <h2 className="text-xl font-bold text-ink mb-1">Contact form unavailable</h2>
                <p id="contact-unavailable" role="status" className="text-sm text-muted mb-4">Online message delivery is not connected. This form cannot send messages or request support. Drafts stay on this page only; copy your text before leaving or reloading.</p>
                {submissionError && <p role="alert" className="text-sm text-ink">{submissionError}</p>}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label htmlFor="contactName" className="text-xs font-semibold text-muted mb-1 block">Full Name *</label>
                    <input id="contactName" name="name" value={formData.name} onChange={handleChange} required placeholder="Your name" className={inputCls} />
                  </div>
                  <div>
                    <label htmlFor="contactEmail" className="text-xs font-semibold text-muted mb-1 block">Email *</label>
                    <input id="contactEmail" name="email" type="email" value={formData.email} onChange={handleChange} required placeholder="you@email.com" className={inputCls} />
                  </div>
                </div>
                <div>
                  <label htmlFor="contactSubject" className="text-xs font-semibold text-muted mb-1 block">Subject *</label>
                  <input id="contactSubject" name="subject" value={formData.subject} onChange={handleChange} required placeholder="How can we help?" className={inputCls} />
                </div>
                <div>
                  <label htmlFor="contactMessage" className="text-xs font-semibold text-muted mb-1 block">Message *</label>
                  <textarea id="contactMessage" name="message" value={formData.message} onChange={handleChange} required rows={5} placeholder="Tell us more..." className={`${inputCls} resize-none`} />
                </div>
                <button type="submit" disabled aria-describedby="contact-unavailable" className="button primary px-8 py-3 font-semibold flex items-center gap-2 disabled:opacity-60">
                  <Send className="w-4 h-4" /> Sending unavailable
                </button>
              </form>
          </motion.div>
        </div>
      </main>
    </Layout>
  );
}
