import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { Button, PageContainer, SectionHeading, BotanicalBg } from '../components/PublicUI';
import { statsAPI } from '../api/api';

/* ── Real photos from frontend/src/assets — auto-picked and sorted 1 → 7 ──
   Vite bundles every matching file, so adding 5.jfif later appears here automatically. */
const homePhotoModules = import.meta.glob('../assets/*.{jfif,jpg,jpeg,png,webp}', { eager: true, import: 'default' });
const homePhotos = Object.keys(homePhotoModules)
  .sort((a, b) => a.localeCompare(b, undefined, { numeric: true }))
  .map((p) => homePhotoModules[p]);

/* ─── HOME ──────────────────────────────────────────── */
export const Home = () => {
  const [stats, setStats] = useState({ mealsShared: 0, activeDonors: 0, partnerNGOs: 0, volunteers: 0 });

  useEffect(() => {
    statsAPI.get()
      .then((d) => setStats(d.stats))
      .catch(() => {}); // fall back to zeros if backend is down
  }, []);

  return (
  <div>
    {/* ── Hero ── */}
    <section className="relative overflow-hidden bg-background min-h-[92vh] flex items-center">
      {/* Background wave shapes (inspired by reference image) */}
      <div className="absolute inset-0 pointer-events-none">
        {/* top-left dark teal wave */}
        <div className="absolute -top-20 -left-20 w-96 h-96 rounded-full bg-gradient-to-br from-primary to-teal opacity-10 blur-3xl"></div>
        {/* bottom teal wave */}
        <div className="absolute bottom-0 left-0 right-0 h-32 bg-gradient-to-t from-teal/10 to-transparent"></div>
        {/* botanical leaf top-left */}
        <svg className="absolute top-0 left-0 w-72 opacity-[.07]" viewBox="0 0 300 300" fill="none">
          <ellipse cx="70" cy="100" rx="60" ry="28" transform="rotate(-40 70 100)" fill="#3aada8"/>
          <ellipse cx="40" cy="170" rx="50" ry="22" transform="rotate(-60 40 170)" fill="#0d6e8a"/>
          <ellipse cx="130" cy="70"  rx="40" ry="18" transform="rotate(-20 130 70)"  fill="#3aada8"/>
          <ellipse cx="20" cy="50"   rx="30" ry="14" transform="rotate(-75 20 50)"   fill="#0d6e8a"/>
        </svg>
        {/* botanical leaf bottom-right */}
        <svg className="absolute bottom-0 right-0 w-64 opacity-[.07]" viewBox="0 0 300 300" fill="none">
          <ellipse cx="230" cy="200" rx="60" ry="28" transform="rotate(40 230 200)" fill="#3aada8"/>
          <ellipse cx="260" cy="130" rx="50" ry="22" transform="rotate(60 260 130)" fill="#0d6e8a"/>
          <ellipse cx="170" cy="230" rx="40" ry="18" transform="rotate(20 170 230)" fill="#3aada8"/>
        </svg>

        {/* Location pins (top-right, matching reference) */}
        <div className="absolute top-10 right-16 text-primary/10 text-6xl"><i className="fas fa-location-dot"></i></div>
        <div className="absolute top-32 right-8 text-teal/10 text-4xl"><i className="fas fa-location-dot"></i></div>
        <div className="absolute top-20 right-40 text-primary/8 text-3xl"><i className="fas fa-location-dot"></i></div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 w-full py-16 lg:py-0">
        <div className="grid lg:grid-cols-2 gap-16 items-center">
          {/* LEFT — Text */}
          <div className="text-left">
            <span className="inline-flex items-center gap-2 px-4 py-1.5 bg-teal/10 text-teal rounded-full text-sm font-semibold mb-6 border border-teal/20">
              <i className="fas fa-leaf text-xs"></i> Community Food Network
            </span>
            <h1 className="text-5xl lg:text-6xl font-extrabold text-gray-900 leading-tight mb-6">
              Share Food.<br/>
              <span className="gradient-text">Save Food.</span><br/>
              Serve Communities.
            </h1>
            <p className="text-lg text-gray-500 leading-relaxed mb-10 max-w-lg">
              FoodBridge connects surplus food donors with verified NGOs and volunteer drivers — turning food waste into community nourishment.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 mb-10">
              <Link to="/register/donor">
                <Button variant="primary" className="px-8 py-3.5 text-base shadow-teal">
                  <i className="fas fa-box-open mr-2"></i> Donate Food
                </Button>
              </Link>
            </div>

            {/* Mini stats row */}
            <div className="flex gap-8">
              <div>
                <div className="text-2xl font-extrabold text-primary">{stats.mealsShared.toLocaleString()}+</div>
                <div className="text-xs text-gray-500 font-medium">Meals Shared</div>
              </div>
              <div className="w-px bg-gray-200"></div>
              <div>
                <div className="text-2xl font-extrabold text-teal">{stats.partnerNGOs}+</div>
                <div className="text-xs text-gray-500 font-medium">Partner NGOs</div>
              </div>
              <div className="w-px bg-gray-200"></div>
              <div>
                <div className="text-2xl font-extrabold text-accent">{stats.volunteers}+</div>
                <div className="text-xs text-gray-500 font-medium">Volunteers</div>
              </div>
            </div>
          </div>

          {/* RIGHT — Illustration-style visual */}
          <div className="relative flex justify-center items-center">
            {/* Background circle */}
            <div className="absolute w-80 h-80 lg:w-96 lg:h-96 rounded-full bg-gradient-to-br from-teal/15 to-primary/10 blur-2xl"></div>

            {/* Smartphone mockup + food crate (inspired by reference left panel) */}
            <div className="relative z-10 flex flex-col items-center">
              {/* Phone card */}
              <div className="bg-white rounded-3xl shadow-2xl p-5 w-52 mb-4 border border-gray-100 relative">
                <div className="bg-gradient-to-br from-primary to-teal rounded-2xl h-28 flex flex-col justify-center items-center text-white mb-3">
                  <i className="fas fa-map-location-dot text-3xl mb-1"></i>
                  <p className="text-xs font-bold">Live Tracking</p>
                </div>
                <div className="space-y-2">
                  <div className="h-2 bg-teal/20 rounded-full w-full"></div>
                  <div className="h-2 bg-gray-100 rounded-full w-3/4"></div>
                  <div className="flex gap-1 mt-3">
                    <div className="flex-1 h-8 bg-primary/10 rounded-xl flex items-center justify-center text-primary text-xs font-bold">Pickup</div>
                    <i className="fas fa-arrow-right text-teal self-center text-xs"></i>
                    <div className="flex-1 h-8 bg-teal/10 rounded-xl flex items-center justify-center text-teal text-xs font-bold">Deliver</div>
                  </div>
                </div>
                {/* Location pin sticker */}
                <div className="absolute -top-3 -right-3 w-8 h-8 bg-accent rounded-full flex items-center justify-center shadow-md">
                  <i className="fas fa-location-dot text-white text-sm"></i>
                </div>
              </div>

              {/* Food crate illustration */}
              <div className="bg-white rounded-3xl shadow-xl px-5 py-4 flex items-center gap-3 border border-gray-100">
                <div className="text-3xl">🥕🥦🍅</div>
                <div>
                  <p className="text-xs font-bold text-gray-800">Fresh Donation</p>
                  <p className="text-xs text-gray-400">Ready for pickup</p>
                </div>
                <div className="ml-2 w-7 h-7 bg-teal/10 rounded-full flex items-center justify-center">
                  <i className="fas fa-check text-teal text-xs"></i>
                </div>
              </div>

              {/* Community card bottom-right */}
              <div className="absolute -bottom-8 -right-8 bg-white rounded-2xl shadow-card p-3 border border-gray-100 flex items-center gap-2">
                <div className="w-9 h-9 bg-gradient-to-br from-teal to-primary rounded-xl flex items-center justify-center">
                  <i className="fas fa-people-group text-white text-sm"></i>
                </div>
                <div>
                  <p className="text-xs font-bold text-gray-800">{stats.activeDonors} Donors</p>
                  <p className="text-xs text-teal font-medium">Active today</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Bottom teal wave */}
      <div className="absolute bottom-0 left-0 right-0">
        <svg viewBox="0 0 1440 60" className="w-full text-white fill-current" preserveAspectRatio="none">
          <path d="M0,0 C480,60 960,60 1440,0 L1440,60 L0,60 Z"/>
        </svg>
      </div>
    </section>

    {/* ── How It Works ── */}
    <section className="py-20 bg-white">
      <PageContainer>
        <SectionHeading title="How FoodBridge Works" subtitle="From surplus to community — in three simple steps." />
        <div className="grid md:grid-cols-3 gap-8 mt-4">
          {[
            { icon:'fa-box-open', color:'from-primary to-primary-dark', label:'1. Donate', desc:'Hotels, restaurants and individuals list surplus food with quantity and expiry details.' },
            { icon:'fa-hand-holding-heart', color:'from-teal to-teal-dark', label:'2. Connect', desc:'Verified nearby NGOs receive instant alerts and accept the food they need.' },
            { icon:'fa-truck-fast', color:'from-accent to-orange-500', label:'3. Deliver', desc:'Volunteer drivers pick up and deliver the food safely to the NGO destination.' },
          ].map((s,i) => (
            <div key={i} className="text-center group">
              <div className={`w-20 h-20 mx-auto rounded-3xl bg-gradient-to-br ${s.color} flex items-center justify-center mb-5 shadow-teal group-hover:scale-110 transition-transform`}>
                <i className={`fas ${s.icon} text-2xl text-white`}></i>
              </div>
              <h3 className="text-xl font-bold text-gray-900 mb-2">{s.label}</h3>
              <p className="text-gray-500 text-sm leading-relaxed max-w-xs mx-auto">{s.desc}</p>
            </div>
          ))}
        </div>
      </PageContainer>
    </section>

    {/* ── Real Food. Real People. Real Impact. (photo gallery) ── */}
    <section className="py-20 bg-white">
      <PageContainer>
        <SectionHeading
          title="Real Food. Real People. Real Impact."
          subtitle="Connecting surplus food with communities through donors, NGOs and volunteers."
        />

        {/* Hide this gallery's scrollbar only (page scrolling is unaffected) */}
        <style>{`.fb-photo-scroll{scrollbar-width:none;-ms-overflow-style:none;}.fb-photo-scroll::-webkit-scrollbar{display:none;}`}</style>

        <div
          className="fb-photo-scroll flex gap-5 sm:gap-6 overflow-x-auto snap-x snap-mandatory scroll-smooth py-1"
          style={{ WebkitOverflowScrolling: 'touch' }}
        >
          {homePhotos.map((src, i) => (
            <div
              key={i}
              className="snap-start flex-none w-[78%] sm:w-[46%] lg:w-[31%] rounded-3xl overflow-hidden shadow-card border border-gray-100/60 bg-gray-50"
            >
              <img
                src={src}
                alt={`FoodBridge community impact ${i + 1}`}
                loading="lazy"
                className="w-full h-56 sm:h-64 lg:h-72 object-cover"
              />
            </div>
          ))}
        </div>
      </PageContainer>
    </section>

    {/* ── Impact Banner ── */}
    <section className="py-14 bg-gradient-to-r from-primary to-teal text-white relative overflow-hidden">
      <div className="absolute inset-0 opacity-10">
        <svg width="100%" height="100%"><pattern id="dots" x="0" y="0" width="30" height="30" patternUnits="userSpaceOnUse"><circle cx="15" cy="15" r="2" fill="white"/></pattern><rect width="100%" height="100%" fill="url(#dots)"/></svg>
      </div>
      <div className="max-w-5xl mx-auto px-6 grid grid-cols-2 md:grid-cols-4 gap-8 text-center relative z-10">
        {[
          { val:`${stats.mealsShared.toLocaleString()}+`, label:'Meals Shared' },
          { val:stats.activeDonors, label:'Active Donors' },
          { val:stats.partnerNGOs, label:'Partner NGOs' },
          { val:stats.volunteers, label:'Volunteers' },
        ].map((s,i) => (
          <div key={i}>
            <div className="text-4xl font-extrabold mb-1">{s.val}</div>
            <div className="text-sm font-medium text-white/80">{s.label}</div>
          </div>
        ))}
      </div>
    </section>
  </div>
  );
};

/* We keep About exported so the route doesn't crash even though it's not in the nav */
export const About = () => null;
export const HowItWorks = () => null;
