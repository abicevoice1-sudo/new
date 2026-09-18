import { motion } from 'framer-motion';
import { Link } from 'react-router-dom';
import Layout from '../layouts/LandingLayout';
import { Heart, Quote, Star, MapPin, Calendar, CheckCircle, ArrowRight } from 'lucide-react';

const STORIES = [
  {
    id: 1,
    names: 'Zainab & Ahmed',
    location: 'Chicago, IL',
    date: 'Married June 2025',
    avatar1: 'Z',
    avatar2: 'A',
    quote: 'We connected over shared values and a love for community service. The wali workflow made our families feel involved from the start. Within 3 months of joining, we knew. Alhamdulillah, we just celebrated our first anniversary.',
    highlight: 'Matched in 3 weeks',
    rating: 5,
  },
  {
    id: 2,
    names: 'Maryam & Hassan',
    location: 'London, UK',
    date: 'Married September 2025',
    avatar1: 'M',
    avatar2: 'H',
    quote: 'As a revert, I was nervous about finding someone who understood my journey. Shiarishta\'s detailed religiosity and Marja\' filters helped me find Hassan — someone who shares my values and respects my family\'s involvement.',
    highlight: 'Cross-continent match',
    rating: 5,
  },
  {
    id: 3,
    names: 'Fatima & Ali',
    location: 'Toronto, Canada',
    date: 'Married January 2026',
    avatar1: 'F',
    avatar2: 'A',
    quote: 'The chaperone mode was a game-changer. My father was part of our conversations from the beginning, which gave our families confidence. The privacy controls meant I could browse discreetly until I was ready.',
    highlight: 'Family-involved journey',
    rating: 5,
  },
  {
    id: 4,
    names: 'Ayesha & Muhammad',
    location: 'Dubai, UAE',
    date: 'Married April 2026',
    avatar1: 'A',
    avatar2: 'M',
    quote: 'We both had demanding careers and needed a platform that understood serious intentions. The AI compatibility index highlighted our shared timeline and values. We\'re grateful for the respectful, intentional space Shiarishta creates.',
    highlight: '94% compatibility',
    rating: 5,
  },
  {
    id: 5,
    names: 'Huda & Bilal',
    location: 'Sydney, Australia',
    date: 'Married July 2026',
    avatar1: 'H',
    avatar2: 'B',
    quote: 'After a divorce, I was hesitant to try again. The guardian-managed profile option let my sister help me navigate the process. Bilal and I connected over shared experiences and a commitment to building something beautiful together.',
    highlight: 'Second marriage success',
    rating: 5,
  },
  {
    id: 6,
    names: 'Sakina & Jafar',
    location: 'Mumbai, India',
    date: 'Married August 2026',
    avatar1: 'S',
    avatar2: 'J',
    quote: 'Our families had been searching for years. Shiarishta\'s detailed sect and community filters finally connected us. The platform\'s respect for our traditions while offering modern tools made all the difference.',
    highlight: 'Family-arranged + modern',
    rating: 5,
  },
];

const STATS = [
  { value: '2,400+', label: 'Marriages' },
  { value: '96%', label: 'Satisfaction rate' },
  { value: '3.2 months', label: 'Avg. to engagement' },
  { value: '45+', label: 'Countries represented' },
];

export default function SuccessStories() {
  return (
    <Layout>
      <main className="max-w-6xl mx-auto px-4 sm:px-6 py-10 sm:py-14">
        {/* Header */}
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="text-center mb-12">
          <span className="text-xs font-bold uppercase tracking-widest text-primary">Real love, real stories</span>
          <h1 className="text-3xl sm:text-5xl font-bold text-ink mt-2">Success Stories</h1>
          <p className="text-muted mt-3 max-w-xl mx-auto">Every marriage begins with a single step. Here are couples who found their match through Shiarishta.</p>
        </motion.div>

        {/* Stats */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-14">
          {STATS.map((stat, i) => (
            <motion.div key={stat.label} initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.08 }}
              className="text-center p-5 rounded-2xl bg-elevated border border-line/20">
              <div className="text-2xl font-bold text-primary">{stat.value}</div>
              <div className="text-xs text-muted mt-1">{stat.label}</div>
            </motion.div>
          ))}
        </div>

        {/* Stories grid */}
        <div className="grid md:grid-cols-2 gap-6 mb-14">
          {STORIES.map((story, i) => (
            <motion.div key={story.id} initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 + i * 0.08 }}
              className="bg-elevated rounded-2xl border border-line/20 p-6 sm:p-8 hover:shadow-md transition-all">
              <div className="flex items-center gap-3 mb-4">
                <div className="flex -space-x-2">
                  <span className="w-10 h-10 rounded-full bg-primary/15 text-primary font-bold flex items-center justify-center text-sm border-2 border-elevated">{story.avatar1}</span>
                  <span className="w-10 h-10 rounded-full bg-accent/15 text-accent font-bold flex items-center justify-center text-sm border-2 border-elevated">{story.avatar2}</span>
                </div>
                <div>
                  <h3 className="font-bold text-ink">{story.names}</h3>
                  <div className="flex items-center gap-2 text-xs text-muted">
                    <MapPin className="w-3 h-3" /> {story.location}
                  </div>
                </div>
              </div>
              <div className="flex items-center gap-1 mb-3">
                {Array.from({ length: story.rating }).map((_, idx) => (
                  <Star key={idx} className="w-4 h-4 text-amber-400 fill-amber-400" />
                ))}
              </div>
              <div className="relative mb-4">
                <Quote className="w-6 h-6 text-primary/20 absolute -top-1 -left-1" />
                <p className="text-sm text-muted leading-relaxed pl-6">{story.quote}</p>
              </div>
              <div className="flex items-center justify-between pt-4 border-t border-line/15">
                <span className="inline-flex items-center gap-1.5 text-xs font-semibold text-success bg-success/10 px-3 py-1 rounded-full">
                  <CheckCircle className="w-3.5 h-3.5" /> {story.highlight}
                </span>
                <span className="flex items-center gap-1 text-xs text-muted"><Calendar className="w-3 h-3" /> {story.date}</span>
              </div>
            </motion.div>
          ))}
        </div>

        {/* CTA */}
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.6 }}
          className="text-center bg-gradient-to-br from-primary/10 via-accent/5 to-primary/10 rounded-2xl border border-primary/15 p-8 sm:p-12">
          <Heart className="w-10 h-10 text-primary mx-auto mb-4" />
          <h2 className="text-2xl sm:text-3xl font-bold text-ink mb-3">Your story starts here</h2>
          <p className="text-muted max-w-lg mx-auto mb-6">Join thousands of Shia singles and families who found their match with intention, privacy, and faith.</p>
          <div className="flex flex-wrap justify-center gap-3">
            <Link to="/auth/register" className="button primary px-7 py-3 font-semibold inline-flex items-center gap-2">
              Create Your Profile <ArrowRight className="w-4 h-4" />
            </Link>
            <Link to="/pricing" className="button secondary px-7 py-3 font-semibold">View Plans</Link>
          </div>
        </motion.div>
      </main>
    </Layout>
  );
}
