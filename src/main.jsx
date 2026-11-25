import React, { useState } from 'react';
import { createRoot } from 'react-dom/client';
import { ArrowUpRight, ChevronDown, Menu, X, Sparkles, Send, CalendarDays, Play, Check, Instagram, Facebook, MessageCircle } from 'lucide-react';
import './styles.css';

const projects = [
  { title: 'The Ivory Residence', meta: '3 BHK · Bengaluru', category: 'Apartments', image: 'https://images.unsplash.com/photo-1600607687920-4e2a09cf159d?auto=format&fit=crop&w=1200&q=85' },
  { title: 'Quiet Geometry', meta: 'Modern Kitchen · Mumbai', category: 'Kitchens', image: 'https://images.unsplash.com/photo-1600566753086-00f18fb6b3ea?auto=format&fit=crop&w=1200&q=85' },
  { title: 'The Sandstone Villa', meta: 'Luxury Villa · Hyderabad', category: 'Villas', image: 'https://images.unsplash.com/photo-1616486338812-3dadae4b4ace?auto=format&fit=crop&w=1200&q=85' },
  { title: 'A Study in Warmth', meta: '2 BHK · Chennai', category: 'Apartments', image: 'https://images.unsplash.com/photo-1618220179428-22790b461013?auto=format&fit=crop&w=1200&q=85' },
];
const services = ['Complete Home Interiors', 'Modular Kitchens', 'Living & Dining', 'Bedrooms & Wardrobes', 'Lighting & False Ceiling', 'Customised Furniture'];

function App() {
  const [menuOpen, setMenuOpen] = useState(false);
  const [projectFilter, setProjectFilter] = useState('All');
  const [chatOpen, setChatOpen] = useState(false);
  const [message, setMessage] = useState('');
  const [sent, setSent] = useState(false);
  const filtered = projectFilter === 'All' ? projects : projects.filter(p => p.category === projectFilter);

  const scrollTo = (id) => { document.getElementById(id)?.scrollIntoView({ behavior: 'smooth' }); setMenuOpen(false); };

  return <div className="site-shell">
    <header className="nav-wrap">
      <nav className="nav container">
        <button className="wordmark" onClick={() => scrollTo('top')} aria-label="My First Home Interiors home"><span className="mark">MFH</span><span>MY FIRST HOME<small>INTERIORS</small></span></button>
        <div className={`nav-links ${menuOpen ? 'is-open' : ''}`}>
          <button onClick={() => scrollTo('about')}>About</button><button onClick={() => scrollTo('services')}>Services</button><button onClick={() => scrollTo('projects')}>Projects</button><button onClick={() => scrollTo('studio')}>AI Design Studio</button><button onClick={() => scrollTo('contact')}>Contact</button>
        </div>
        <button className="nav-cta" onClick={() => scrollTo('contact')}>Book a consultation <ArrowUpRight size={16}/></button>
        <button className="menu-btn" onClick={() => setMenuOpen(!menuOpen)} aria-label="Toggle menu">{menuOpen ? <X/> : <Menu/>}</button>
      </nav>
    </header>

    <main id="top">
      <section className="hero">
        <div className="hero-image" />
        <div className="hero-overlay" />
        <div className="hero-content container">
          <p className="eyebrow light">DESIGNING EMOTION · DELIVERING ELEGANCE</p>
          <h1>Your dream home,<br/><em>designed around you.</em></h1>
          <p className="hero-copy">Thoughtful interiors for the way you live, made with enduring materials and a distinctly personal point of view.</p>
          <div className="hero-actions"><button className="button gold" onClick={() => scrollTo('projects')}>Explore our work <ArrowUpRight size={17}/></button><button className="text-button light" onClick={() => scrollTo('studio')}><span className="play"><Play size={12} fill="currentColor"/></span> Meet the AI Design Studio</button></div>
        </div>
        <div className="hero-note">Scroll to discover <span>↓</span></div>
      </section>

      <section className="intro section container" id="about"><div className="intro-label">01 / OUR APPROACH</div><div><h2>Rooms that feel like<br/><em>you.</em></h2><p className="lead">A home is more than what you see. It is the morning light on your favourite chair, the way your kitchen gathers everyone, the quiet of a room that finally feels right.</p><p>We bring considered design, honest materials and meticulous execution together to create spaces that are as comfortable as they are beautiful.</p><button className="underlined" onClick={() => scrollTo('contact')}>Our story <ArrowUpRight size={16}/></button></div></section>

      <section className="services section" id="services"><div className="container"><div className="section-top"><div><p className="eyebrow">WHAT WE DO</p><h2>Every detail,<br/><em>considered.</em></h2></div><p className="section-intro">From a single room to a complete home, our team works across every layer of your interior.</p></div><div className="service-grid">{services.map((service, i) => <button className="service-item" key={service} onClick={() => scrollTo('contact')}><span>0{i + 1}</span><strong>{service}</strong><ArrowUpRight size={18}/></button>)}</div></div></section>

      <section className="projects section container" id="projects"><div className="section-top"><div><p className="eyebrow">SELECTED PROJECTS</p><h2>Made for living.</h2></div><button className="underlined">View all projects <ArrowUpRight size={16}/></button></div><div className="filters">{['All', 'Apartments', 'Villas', 'Kitchens'].map(filter => <button className={projectFilter === filter ? 'active' : ''} onClick={() => setProjectFilter(filter)} key={filter}>{filter}</button>)}</div><div className="project-grid">{filtered.map((project, i) => <article className={`project-card card-${i}`} key={project.title}><div className="project-image"><img src={project.image} alt={project.title}/><button className="circle-arrow" aria-label={`Open ${project.title}`}><ArrowUpRight size={18}/></button></div><p>{project.meta}</p><h3>{project.title}</h3></article>)}</div></section>

      <section className="studio section" id="studio"><div className="container studio-layout"><div className="studio-copy"><p className="eyebrow gold-text">THE SIGNATURE EXPERIENCE</p><h2>Meet your<br/><em>design partner.</em></h2><p>Upload a photograph of your room and tell us how you want to feel in it. Our AI Design Studio creates five considered directions, grounded in your space, your taste and our design expertise.</p><div className="studio-points"><span><Check size={15}/> Five personalised concepts</span><span><Check size={15}/> Catalogue-aware recommendations</span><span><Check size={15}/> A clear path to your designer</span></div><button className="button ivory" onClick={() => setChatOpen(true)}>Start designing <Sparkles size={17}/></button></div><div className="studio-visual"><div className="studio-photo"/><div className="floating-prompt"><span className="sparkle"><Sparkles size={15}/></span><div><small>AI DESIGN STUDIO</small><strong>What would you change<br/>about your room?</strong></div><ArrowUpRight size={17}/></div></div></div></section>

      <section className="quote section container"><p className="eyebrow">THE MFH PROMISE</p><blockquote>“Luxury is not about more.<br/><em>It is about meaning.”</em></blockquote><div className="quote-line"/></section>
      <section className="contact section" id="contact"><div className="container contact-layout"><div><p className="eyebrow">LET'S MAKE A HOME</p><h2>Begin with a<br/><em>conversation.</em></h2><p>Tell us a little about your space. Our design team will be in touch within one working day.</p><div className="contact-details"><span><MessageCircle size={18}/> WhatsApp us</span><span><CalendarDays size={18}/> Book a free consultation</span></div></div><form className="enquiry-form" onSubmit={e => { e.preventDefault(); setSent(true); }}><label>Your name<input required placeholder="How should we call you?"/></label><label>Email address<input required type="email" placeholder="you@email.com"/></label><label>Tell us about your project<textarea required placeholder="A 2 BHK in Bengaluru, a new kitchen..."/></label><button className="button gold" type="submit">{sent ? 'Thank you — we’ll be in touch' : 'Send enquiry'} <ArrowUpRight size={17}/></button></form></div></section>
    </main>
    <footer><div className="container footer-top"><div className="wordmark footer-mark"><span className="mark">MFH</span><span>MY FIRST HOME<small>INTERIORS</small></span></div><p>Designing emotion and<br/>delivering elegance.</p><div className="socials"><Instagram size={18}/><Facebook size={18}/></div></div><div className="container footer-bottom"><span>© 2026 My First Home Interiors</span><span>Made for the life you live.</span></div></footer>
    <button className="chat-launcher" onClick={() => setChatOpen(true)} aria-label="Open AI Design Studio"><Sparkles size={21}/><span>AI Design Studio</span></button>
    {chatOpen && <div className="chat-panel"><div className="chat-head"><div><small>MY FIRST HOME</small><strong>AI Design Studio</strong></div><button onClick={() => setChatOpen(false)} aria-label="Close chat"><X size={18}/></button></div><div className="chat-body"><div className="bot-message">Hello. I’m your design partner. Which room are we imagining today?</div><div className="quick-options"><button>Living room</button><button>Bedroom</button><button>Kitchen</button><button>Upload a room</button></div>{sent && <div className="bot-message">Thank you. A designer will follow up shortly.</div>}</div><form className="chat-input" onSubmit={e => { e.preventDefault(); if (message) { setSent(true); setMessage(''); } }}><input value={message} onChange={e => setMessage(e.target.value)} placeholder="Ask about your space..."/><button aria-label="Send message"><Send size={17}/></button></form></div>}
  </div>;
}

createRoot(document.getElementById('root')).render(<App />);
