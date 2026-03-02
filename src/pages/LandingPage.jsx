import { useState, useEffect, useRef } from 'react'

// ─── Scroll animation hook ─────────────────────────────────────
function useInView() {
  const ref = useRef(null)
  const [inView, setInView] = useState(false)
  useEffect(() => {
    const obs = new IntersectionObserver(
      ([e]) => { if (e.isIntersecting) { setInView(true); obs.disconnect() } },
      { threshold: 0.12 }
    )
    if (ref.current) obs.observe(ref.current)
    return () => obs.disconnect()
  }, [])
  return [ref, inView]
}

// ─── App mockup (hero) ─────────────────────────────────────────
function AppMockup() {
  return (
    <div style={mock.card}>
      {/* Entry header */}
      <div style={mock.entryHeader}>
        <div>
          <div style={mock.dateLabel}>Monday, March 2, 2026</div>
          <div style={mock.logbookName}>Work Journal</div>
        </div>
        <span style={mock.energyBadge}>🟢 High energy</span>
      </div>

      {/* Stats row */}
      <div style={mock.statsRow}>
        {['9:00 – 17:30', '8.5h worked', 'Remote'].map((s, i) => (
          <span key={i} style={mock.stat}>{s}</span>
        ))}
      </div>

      {/* Field */}
      <div style={mock.field}>
        <div style={mock.fieldLabel}>What I worked on</div>
        <div style={mock.fieldValue}>Deployed the new auth flow and fixed the session expiry bug. Reviewed two PRs from the team.</div>
      </div>

      <div style={mock.field}>
        <div style={mock.fieldLabel}>What I learned</div>
        <div style={mock.fieldValue}>JWT refresh tokens behave differently across browsers when third-party cookies are blocked.</div>
      </div>

      {/* AI bubble */}
      <div style={mock.aiBubble}>
        <span style={mock.aiIcon}>✦</span>
        <div>
          <div style={mock.aiLabel}>AI Insight</div>
          <div style={mock.aiText}>You've had high energy 4 of the last 5 Mondays. Your most productive sessions start before 9:30 am.</div>
        </div>
      </div>
    </div>
  )
}

const mock = {
  card: {
    background: '#1c1c25',
    border: '1px solid rgba(255,255,255,0.08)',
    borderRadius: '16px',
    padding: '24px',
    width: '100%',
    maxWidth: '420px',
    boxShadow: '0 40px 100px rgba(0,0,0,0.6), 0 0 0 1px rgba(255,255,255,0.04)',
    animation: 'floatCard 4s ease-in-out infinite',
  },
  entryHeader: { display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '14px' },
  dateLabel: { fontSize: '12px', color: '#4e4c5a', marginBottom: '2px' },
  logbookName: { fontSize: '15px', fontWeight: 600, color: '#f0ede8' },
  energyBadge: { fontSize: '11px', background: 'rgba(74,222,128,0.1)', color: '#4ade80', border: '1px solid rgba(74,222,128,0.2)', borderRadius: '99px', padding: '3px 10px', whiteSpace: 'nowrap' },
  statsRow: { display: 'flex', gap: '6px', marginBottom: '16px', flexWrap: 'wrap' },
  stat: { fontSize: '12px', background: '#16161c', border: '1px solid rgba(255,255,255,0.07)', borderRadius: '8px', padding: '5px 10px', color: '#8a8599' },
  field: { marginBottom: '14px' },
  fieldLabel: { fontSize: '11px', fontWeight: 500, letterSpacing: '0.05em', textTransform: 'uppercase', color: '#4e4c5a', marginBottom: '5px' },
  fieldValue: { fontSize: '13px', color: '#f0ede8', lineHeight: 1.65 },
  aiBubble: { display: 'flex', gap: '10px', alignItems: 'flex-start', background: 'rgba(240,192,96,0.07)', border: '1px solid rgba(240,192,96,0.15)', borderRadius: '10px', padding: '14px', marginTop: '6px' },
  aiIcon: { color: '#f0c060', fontSize: '14px', flexShrink: 0, marginTop: '1px' },
  aiLabel: { fontSize: '11px', fontWeight: 500, letterSpacing: '0.05em', textTransform: 'uppercase', color: '#f0c060', marginBottom: '5px', opacity: 0.8 },
  aiText: { fontSize: '13px', color: '#f0ede8', lineHeight: 1.6 },
}

// ─── Feature card ──────────────────────────────────────────────
function FeatureCard({ icon, title, desc, pro, delay }) {
  const [ref, inView] = useInView()
  const [hovered, setHovered] = useState(false)
  return (
    <div
      ref={ref}
      style={{
        ...feat.card,
        ...(hovered ? feat.cardHover : {}),
        opacity: inView ? 1 : 0,
        transform: inView ? 'translateY(0)' : 'translateY(24px)',
        transition: `opacity 0.5s ease ${delay}ms, transform 0.5s ease ${delay}ms, background 0.15s ease, border-color 0.15s ease`,
      }}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
    >
      <div style={feat.iconWrap}>{icon}</div>
      <div style={feat.title}>
        {title}
        {pro && <span style={feat.proBadge}>Pro</span>}
      </div>
      <div style={feat.desc}>{desc}</div>
    </div>
  )
}

const feat = {
  card: { background: '#1c1c25', border: '1px solid rgba(255,255,255,0.07)', borderRadius: '14px', padding: '24px', cursor: 'default' },
  cardHover: { background: '#20202a', borderColor: 'rgba(240,192,96,0.2)' },
  iconWrap: { fontSize: '22px', marginBottom: '14px' },
  title: { fontSize: '16px', fontWeight: 600, color: '#f0ede8', marginBottom: '8px', display: 'flex', alignItems: 'center', gap: '8px' },
  proBadge: { fontSize: '10px', fontWeight: 600, letterSpacing: '0.06em', textTransform: 'uppercase', background: 'rgba(240,192,96,0.12)', color: '#f0c060', border: '1px solid rgba(240,192,96,0.25)', borderRadius: '99px', padding: '2px 8px' },
  desc: { fontSize: '14px', color: '#8a8599', lineHeight: 1.65 },
}

// ─── Step ──────────────────────────────────────────────────────
function Step({ number, title, desc, delay }) {
  const [ref, inView] = useInView()
  return (
    <div
      ref={ref}
      style={{
        ...step.root,
        opacity: inView ? 1 : 0,
        transform: inView ? 'translateY(0)' : 'translateY(20px)',
        transition: `opacity 0.5s ease ${delay}ms, transform 0.5s ease ${delay}ms`,
      }}
    >
      <div style={step.number}>{number}</div>
      <div style={step.title}>{title}</div>
      <div style={step.desc}>{desc}</div>
    </div>
  )
}

const step = {
  root: { display: 'flex', flexDirection: 'column', alignItems: 'center', textAlign: 'center', padding: '0 16px' },
  number: { width: '44px', height: '44px', borderRadius: '50%', background: 'rgba(240,192,96,0.1)', border: '1px solid rgba(240,192,96,0.25)', color: '#f0c060', fontFamily: "'Playfair Display', serif", fontSize: '18px', fontWeight: 700, display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: '16px' },
  title: { fontSize: '17px', fontWeight: 600, color: '#f0ede8', marginBottom: '10px' },
  desc: { fontSize: '14px', color: '#8a8599', lineHeight: 1.7, maxWidth: '240px' },
}

// ─── Pricing card ──────────────────────────────────────────────
function PricingCard({ tier, price, perMonth, features, cta, highlight, onCta, delay }) {
  const [ref, inView] = useInView()
  return (
    <div
      ref={ref}
      style={{
        ...pricing.card,
        ...(highlight ? pricing.cardHighlight : {}),
        opacity: inView ? 1 : 0,
        transform: inView ? 'translateY(0)' : 'translateY(24px)',
        transition: `opacity 0.5s ease ${delay}ms, transform 0.5s ease ${delay}ms`,
      }}
    >
      {highlight && <div style={pricing.popularBadge}>Most popular</div>}
      <div style={pricing.tier}>{tier}</div>
      <div style={pricing.priceRow}>
        <span style={pricing.price}>{price}</span>
        {perMonth && <span style={pricing.per}>/mo</span>}
      </div>
      <div style={pricing.features}>
        {features.map((f, i) => (
          <div key={i} style={pricing.feature}>
            <span style={{ ...pricing.check, color: highlight ? '#f0c060' : '#4ade80' }}>✓</span>
            <span style={pricing.featureText}>{f}</span>
          </div>
        ))}
      </div>
      <button
        className={highlight ? 'btn btn-primary' : 'btn btn-secondary'}
        style={{ width: '100%', height: '44px', fontSize: '15px', fontWeight: 600 }}
        onClick={onCta}
      >
        {cta}
      </button>
    </div>
  )
}

const pricing = {
  card: { background: '#1c1c25', border: '1px solid rgba(255,255,255,0.07)', borderRadius: '16px', padding: '32px 28px', flex: 1, minWidth: '260px', maxWidth: '340px', position: 'relative' },
  cardHighlight: { border: '1px solid rgba(240,192,96,0.3)', background: '#1e1e28' },
  popularBadge: { position: 'absolute', top: '-13px', left: '50%', transform: 'translateX(-50%)', background: '#f0c060', color: '#0f0f13', fontSize: '11px', fontWeight: 700, letterSpacing: '0.06em', textTransform: 'uppercase', borderRadius: '99px', padding: '3px 14px', whiteSpace: 'nowrap' },
  tier: { fontSize: '13px', fontWeight: 600, letterSpacing: '0.06em', textTransform: 'uppercase', color: '#8a8599', marginBottom: '12px' },
  priceRow: { display: 'flex', alignItems: 'baseline', gap: '4px', marginBottom: '24px' },
  price: { fontFamily: "'Playfair Display', serif", fontSize: '36px', fontWeight: 700, color: '#f0ede8', letterSpacing: '-0.02em' },
  per: { fontSize: '15px', color: '#8a8599' },
  features: { display: 'flex', flexDirection: 'column', gap: '12px', marginBottom: '28px' },
  feature: { display: 'flex', alignItems: 'flex-start', gap: '10px' },
  check: { fontSize: '13px', flexShrink: 0, marginTop: '2px' },
  featureText: { fontSize: '14px', color: '#8a8599', lineHeight: 1.5 },
}

// ─── Main component ────────────────────────────────────────────
export default function LandingPage({ onGetStarted }) {
  const [scrolled, setScrolled] = useState(false)
  const [heroRef, heroInView]   = useInView()
  const [aiRef, aiInView]       = useInView()
  const [ctaRef, ctaInView]     = useInView()

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 40)
    window.addEventListener('scroll', onScroll, { passive: true })
    return () => window.removeEventListener('scroll', onScroll)
  }, [])

  const scrollTo = (id) => {
    document.getElementById(id)?.scrollIntoView({ behavior: 'smooth' })
  }

  return (
    <div style={{ background: '#0f0f13', minHeight: '100vh', color: '#f0ede8', fontFamily: "'DM Sans', system-ui, sans-serif" }}>

      {/* ── Keyframes injected once ── */}
      <style>{`
        @keyframes floatCard {
          0%, 100% { transform: translateY(0px); }
          50% { transform: translateY(-10px); }
        }
        @keyframes fadeInUp {
          from { opacity: 0; transform: translateY(20px); }
          to   { opacity: 1; transform: translateY(0); }
        }
        @keyframes gradientShift {
          0%, 100% { opacity: 0.5; }
          50% { opacity: 1; }
        }
        .landing-nav-link {
          background: none; border: none; color: #8a8599; font-size: 14px;
          cursor: pointer; font-family: inherit; padding: 6px 4px;
          transition: color 0.15s ease;
        }
        .landing-nav-link:hover { color: #f0ede8; }
        .landing-feature-card:hover { border-color: rgba(240,192,96,0.2) !important; }
      `}</style>

      {/* ─── Navbar ─── */}
      <nav style={{
        position: 'fixed', top: 0, left: 0, right: 0, zIndex: 100,
        padding: '0 24px',
        background: scrolled ? 'rgba(15,15,19,0.92)' : 'transparent',
        borderBottom: scrolled ? '1px solid rgba(255,255,255,0.06)' : '1px solid transparent',
        backdropFilter: scrolled ? 'blur(12px)' : 'none',
        transition: 'background 0.3s ease, border-color 0.3s ease, backdrop-filter 0.3s ease',
      }}>
        <div style={{ maxWidth: '1100px', margin: '0 auto', height: '64px', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <span style={{ fontFamily: "'Playfair Display', serif", fontSize: '20px', color: '#f0c060', letterSpacing: '-0.01em', fontWeight: 700 }}>
            LogBook
          </span>
          <div style={{ display: 'flex', alignItems: 'center', gap: '28px' }}>
            <div style={{ display: 'flex', gap: '4px' }} className="nav-links-desktop">
              {[['Features', 'features'], ['How it works', 'how'], ['Pricing', 'pricing']].map(([label, id]) => (
                <button key={id} className="landing-nav-link" onClick={() => scrollTo(id)}>{label}</button>
              ))}
            </div>
            <div style={{ display: 'flex', gap: '8px' }}>
              <button
                className="btn btn-secondary"
                style={{ fontSize: '14px', padding: '8px 18px', height: '36px' }}
                onClick={onGetStarted}
              >
                Sign in
              </button>
              <button
                className="btn btn-primary"
                style={{ fontSize: '14px', padding: '8px 18px', height: '36px' }}
                onClick={onGetStarted}
              >
                Get started
              </button>
            </div>
          </div>
        </div>
      </nav>

      {/* ─── Hero ─── */}
      <section style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', padding: '100px 24px 80px', position: 'relative', overflow: 'hidden' }}>
        {/* Background glow */}
        <div style={{ position: 'absolute', width: '800px', height: '800px', borderRadius: '50%', background: 'radial-gradient(circle, rgba(240,192,96,0.055) 0%, transparent 65%)', top: '50%', left: '40%', transform: 'translate(-50%,-50%)', pointerEvents: 'none', animation: 'gradientShift 5s ease-in-out infinite' }} />

        <div style={{ maxWidth: '1100px', margin: '0 auto', display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '64px', alignItems: 'center', width: '100%' }}>

          {/* Left */}
          <div ref={heroRef} style={{ animation: 'fadeInUp 0.6s ease both' }}>
            <div style={{ display: 'inline-flex', alignItems: 'center', gap: '8px', background: 'rgba(240,192,96,0.1)', border: '1px solid rgba(240,192,96,0.2)', borderRadius: '99px', padding: '5px 14px', fontSize: '12px', fontWeight: 500, color: '#f0c060', letterSpacing: '0.04em', textTransform: 'uppercase', marginBottom: '28px' }}>
              <span style={{ width: '6px', height: '6px', borderRadius: '50%', background: '#f0c060', display: 'inline-block' }} />
              Work journal for professionals
            </div>

            <h1 style={{ fontFamily: "'Playfair Display', serif", fontSize: 'clamp(40px, 5vw, 62px)', fontWeight: 700, color: '#f0ede8', lineHeight: 1.1, letterSpacing: '-0.03em', marginBottom: '20px' }}>
              Your work,<br />
              <span style={{ color: '#f0c060' }}>documented.</span>
            </h1>

            <p style={{ fontSize: '17px', color: '#8a8599', lineHeight: 1.7, marginBottom: '36px', maxWidth: '480px' }}>
              Log every work day, track your energy and progress, and let AI surface the patterns you'd never notice alone.
            </p>

            <div style={{ display: 'flex', gap: '12px', flexWrap: 'wrap' }}>
              <button
                className="btn btn-primary"
                style={{ fontSize: '16px', padding: '13px 28px', height: 'auto' }}
                onClick={onGetStarted}
              >
                Get started free →
              </button>
              <button
                className="btn btn-secondary"
                style={{ fontSize: '16px', padding: '13px 28px', height: 'auto' }}
                onClick={() => scrollTo('features')}
              >
                See features
              </button>
            </div>

            <p style={{ marginTop: '20px', fontSize: '13px', color: '#4e4c5a' }}>
              Free forever · No credit card required
            </p>
          </div>

          {/* Right — mockup */}
          <div style={{ display: 'flex', justifyContent: 'center', animation: 'fadeInUp 0.6s ease 0.15s both' }}>
            <AppMockup />
          </div>
        </div>
      </section>

      {/* ─── Features ─── */}
      <section id="features" style={{ padding: '100px 24px' }}>
        <div style={{ maxWidth: '1100px', margin: '0 auto' }}>
          <div style={{ textAlign: 'center', marginBottom: '56px' }}>
            <p style={{ fontSize: '12px', fontWeight: 600, letterSpacing: '0.08em', textTransform: 'uppercase', color: '#f0c060', marginBottom: '12px' }}>Features</p>
            <h2 style={{ fontFamily: "'Playfair Display', serif", fontSize: 'clamp(28px, 4vw, 42px)', fontWeight: 700, color: '#f0ede8', letterSpacing: '-0.02em', lineHeight: 1.2 }}>
              Everything you need to<br />track your work
            </h2>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: '16px' }}>
            <FeatureCard delay={0}   icon="📝" title="Daily Work Logs"  desc="Log your hours, energy level, location, and what you worked on each day. Fully customisable fields." />
            <FeatureCard delay={80}  icon="📄" title="PDF Export"       desc="Every entry generates a beautiful PDF automatically, ready to share with managers or keep for your records." />
            <FeatureCard delay={160} icon="✦"  title="AI Insights" pro  desc="Ask your work journal anything. Spot energy patterns, recurring blockers, and skill growth over time." />
            <FeatureCard delay={240} icon="☁️" title="OneDrive Sync"    desc="Save your PDFs directly to OneDrive automatically. Your records, always accessible." />
          </div>
        </div>
      </section>

      {/* ─── How it works ─── */}
      <section id="how" style={{ padding: '100px 24px', borderTop: '1px solid rgba(255,255,255,0.05)' }}>
        <div style={{ maxWidth: '900px', margin: '0 auto' }}>
          <div style={{ textAlign: 'center', marginBottom: '64px' }}>
            <p style={{ fontSize: '12px', fontWeight: 600, letterSpacing: '0.08em', textTransform: 'uppercase', color: '#f0c060', marginBottom: '12px' }}>How it works</p>
            <h2 style={{ fontFamily: "'Playfair Display', serif", fontSize: 'clamp(28px, 4vw, 42px)', fontWeight: 700, color: '#f0ede8', letterSpacing: '-0.02em' }}>
              Simple by design
            </h2>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '32px', position: 'relative' }}>
            {/* Connector lines */}
            <div style={{ position: 'absolute', top: '22px', left: 'calc(16.5% + 22px)', right: 'calc(16.5% + 22px)', height: '1px', background: 'linear-gradient(to right, rgba(240,192,96,0.2), rgba(240,192,96,0.2))', pointerEvents: 'none' }} />
            <Step delay={0}   number="1" title="Create your logbook"   desc="Set up in 30 seconds. Choose your fields, name your logbook, and you're ready to go." />
            <Step delay={100} number="2" title="Log your work day"     desc="Fill in each day's entry in 2 minutes — time, energy, highlights, and blockers." />
            <Step delay={200} number="3" title="Review and reflect"    desc="Browse your history, export PDFs, and let the AI surface what matters most." />
          </div>
        </div>
      </section>

      {/* ─── AI section ─── */}
      <section ref={aiRef} style={{ padding: '100px 24px', borderTop: '1px solid rgba(255,255,255,0.05)', position: 'relative', overflow: 'hidden' }}>
        <div style={{ position: 'absolute', inset: 0, background: 'radial-gradient(ellipse at 50% 100%, rgba(240,192,96,0.06) 0%, transparent 60%)', pointerEvents: 'none' }} />

        <div style={{ maxWidth: '900px', margin: '0 auto', display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '64px', alignItems: 'center', position: 'relative' }}>

          {/* AI chat mockup */}
          <div style={{ opacity: aiInView ? 1 : 0, transform: aiInView ? 'translateY(0)' : 'translateY(24px)', transition: 'all 0.6s ease' }}>
            <div style={{ background: '#1c1c25', border: '1px solid rgba(240,192,96,0.15)', borderRadius: '16px', padding: '20px', boxShadow: '0 24px 60px rgba(0,0,0,0.4)' }}>
              {[
                { role: 'user', text: 'What patterns do you see in my energy levels?' },
                { role: 'ai',   text: 'Your energy is consistently high on Mondays and Tuesdays, then dips mid-week. Your best work happens before 11am — 80% of your "high energy" entries start before then.' },
                { role: 'user', text: 'What blockers keep coming up?' },
                { role: 'ai',   text: 'Meeting overload appears in 6 of your last 10 entries. You\'ve also flagged unclear requirements 4 times this month — mostly on sprint kick-offs.' },
              ].map((msg, i) => (
                <div key={i} style={{ display: 'flex', justifyContent: msg.role === 'user' ? 'flex-end' : 'flex-start', marginBottom: '12px' }}>
                  {msg.role === 'ai' && (
                    <div style={{ width: '26px', height: '26px', borderRadius: '50%', background: 'rgba(240,192,96,0.1)', border: '1px solid rgba(240,192,96,0.2)', color: '#f0c060', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '11px', flexShrink: 0, marginRight: '8px', marginTop: '2px' }}>✦</div>
                  )}
                  <div style={{ maxWidth: '80%', background: msg.role === 'user' ? 'rgba(240,192,96,0.1)' : '#16161c', border: `1px solid ${msg.role === 'user' ? 'rgba(240,192,96,0.15)' : 'rgba(255,255,255,0.06)'}`, borderRadius: msg.role === 'user' ? '12px 0 12px 12px' : '0 12px 12px 12px', padding: '10px 14px', fontSize: '13px', color: '#f0ede8', lineHeight: 1.6 }}>
                    {msg.text}
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Text */}
          <div style={{ opacity: aiInView ? 1 : 0, transform: aiInView ? 'translateY(0)' : 'translateY(24px)', transition: 'all 0.6s ease 0.15s' }}>
            <div style={{ display: 'inline-flex', alignItems: 'center', gap: '8px', background: 'rgba(240,192,96,0.1)', border: '1px solid rgba(240,192,96,0.2)', borderRadius: '99px', padding: '5px 14px', fontSize: '11px', fontWeight: 600, color: '#f0c060', letterSpacing: '0.05em', textTransform: 'uppercase', marginBottom: '20px' }}>
              ✦ Pro feature
            </div>
            <h2 style={{ fontFamily: "'Playfair Display', serif", fontSize: 'clamp(26px, 3.5vw, 38px)', fontWeight: 700, color: '#f0ede8', letterSpacing: '-0.02em', lineHeight: 1.2, marginBottom: '16px' }}>
              Your journal,<br />now with a brain.
            </h2>
            <p style={{ fontSize: '15px', color: '#8a8599', lineHeight: 1.7, marginBottom: '28px' }}>
              The AI has read every entry you've ever written. Ask it anything — patterns, blockers, your best days, what to focus on tomorrow.
            </p>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', marginBottom: '28px' }}>
              {['Pattern detection across all your entries', 'Energy and productivity trend analysis', 'Blocker and recurring challenge spotting', 'Personalised focus suggestions'].map((f, i) => (
                <div key={i} style={{ display: 'flex', alignItems: 'center', gap: '10px', fontSize: '14px', color: '#8a8599' }}>
                  <span style={{ color: '#f0c060' }}>✓</span> {f}
                </div>
              ))}
            </div>
            <button className="btn btn-primary" style={{ fontSize: '15px', padding: '12px 24px', height: 'auto' }} onClick={onGetStarted}>
              Try it free →
            </button>
          </div>
        </div>
      </section>

      {/* ─── Pricing ─── */}
      <section id="pricing" style={{ padding: '100px 24px', borderTop: '1px solid rgba(255,255,255,0.05)' }}>
        <div style={{ maxWidth: '780px', margin: '0 auto' }}>
          <div style={{ textAlign: 'center', marginBottom: '56px' }}>
            <p style={{ fontSize: '12px', fontWeight: 600, letterSpacing: '0.08em', textTransform: 'uppercase', color: '#f0c060', marginBottom: '12px' }}>Pricing</p>
            <h2 style={{ fontFamily: "'Playfair Display', serif", fontSize: 'clamp(28px, 4vw, 42px)', fontWeight: 700, color: '#f0ede8', letterSpacing: '-0.02em' }}>
              Start free, upgrade when ready
            </h2>
          </div>

          <div style={{ display: 'flex', gap: '20px', justifyContent: 'center', flexWrap: 'wrap' }}>
            <PricingCard
              delay={0}
              tier="Free"
              price="€0"
              features={[
                'Unlimited entries',
                'PDF export for every entry',
                'Multiple logbooks',
                'OneDrive sync',
                'Custom fields',
              ]}
              cta="Get started free"
              onCta={onGetStarted}
            />
            <PricingCard
              delay={120}
              tier="Pro"
              price="€4.99"
              perMonth
              highlight
              features={[
                'Everything in Free',
                'AI Chat with your full logbook',
                'Pattern & energy trend detection',
                'Blocker and growth insights',
                'Cancel any time',
              ]}
              cta="Upgrade to Pro →"
              onCta={onGetStarted}
            />
          </div>
        </div>
      </section>

      {/* ─── Final CTA ─── */}
      <section style={{ padding: '100px 24px', borderTop: '1px solid rgba(255,255,255,0.05)', position: 'relative', overflow: 'hidden' }}>
        <div style={{ position: 'absolute', inset: 0, background: 'radial-gradient(ellipse at 50% 50%, rgba(240,192,96,0.05) 0%, transparent 65%)', pointerEvents: 'none' }} />
        <div
          ref={ctaRef}
          style={{ maxWidth: '600px', margin: '0 auto', textAlign: 'center', position: 'relative', opacity: ctaInView ? 1 : 0, transform: ctaInView ? 'translateY(0)' : 'translateY(24px)', transition: 'all 0.6s ease' }}
        >
          <h2 style={{ fontFamily: "'Playfair Display', serif", fontSize: 'clamp(30px, 4vw, 48px)', fontWeight: 700, color: '#f0ede8', letterSpacing: '-0.02em', lineHeight: 1.2, marginBottom: '16px' }}>
            Start documenting<br />your work today.
          </h2>
          <p style={{ fontSize: '16px', color: '#8a8599', lineHeight: 1.7, marginBottom: '36px' }}>
            Join professionals who use LogBook to track their progress, stay accountable, and grow their careers.
          </p>
          <button
            className="btn btn-primary"
            style={{ fontSize: '17px', padding: '15px 36px', height: 'auto' }}
            onClick={onGetStarted}
          >
            Get started free →
          </button>
          <p style={{ marginTop: '16px', fontSize: '13px', color: '#4e4c5a' }}>Free forever · No credit card required</p>
        </div>
      </section>

      {/* ─── Footer ─── */}
      <footer style={{ borderTop: '1px solid rgba(255,255,255,0.05)', padding: '32px 24px' }}>
        <div style={{ maxWidth: '1100px', margin: '0 auto', display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '16px' }}>
          <span style={{ fontFamily: "'Playfair Display', serif", fontSize: '18px', color: '#f0c060', letterSpacing: '-0.01em' }}>LogBook</span>
          <div style={{ display: 'flex', gap: '24px', alignItems: 'center' }}>
            <a href="/privacy" style={{ fontSize: '13px', color: '#4e4c5a', textDecoration: 'none' }}>Privacy Policy</a>
            <span style={{ fontSize: '13px', color: '#4e4c5a' }}>© 2026 BookLogger</span>
          </div>
        </div>
      </footer>

    </div>
  )
}
