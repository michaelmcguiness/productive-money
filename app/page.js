"use client";

import { useState, useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import { EthDiamond, ComparisonTable, CompoundingChart, PathToTarget, LiveDashboard, MarketDataProvider, useMarketData } from "./components";
const NAV_LINKS = [
  { label: "Thesis", href: "#thesis" },
  { label: "Dashboard", href: "#dashboard" },
  { label: "FAQ", href: "#faq" },
  { label: "About", href: "#about" },
  { label: "AI & ETH", href: "#ai" },
];
const FAQ_DATA = [
  {
    q: "Why not Solana, Cardano, or another L1?",
    a: "For an asset to function as money, it must be credibly neutral — no single party, government, or coalition can alter its monetary policy. Ethereum has over 900,000 validators operated by tens of thousands of independent entities across dozens of countries. No other smart contract platform comes close to this level of decentralization. Beyond decentralization, Ethereum has network effects that are self-reinforcing and likely insurmountable: over 65% of tokenized real-world assets, the deepest DeFi liquidity, and more developers than every other chain combined. Institutions tokenize on Ethereum because that's where the liquidity is, and the liquidity is there because that's where institutions tokenize. A competitor would need to simultaneously replicate Ethereum's decentralization, liquidity, institutional adoption, and developer ecosystem. In the last 10 years, no competitor has come close."
  },
  {
    q: "Why not buy the S&P 500?",
    a: "ETH is a bearer instrument—whoever holds it, owns it. It has no board of directors, no earnings calls, no CEO. It cannot be diluted by share issuance or debased by management decisions. It is programmable, self-custodied, censorship-resistant money that also generates yield. The S&P 500 is a wonderful productive asset, but it is not money. ETH is both."
  },
  {
    q: "What about Ethereum's scaling challenges?",
    a: <>Ethereum{"'"}s L1 is scaling much faster than most observers expected. The gas limit has already doubled in 2025, with a credible roadmap to triple throughput roughly every year {"\u2014"} targeting 10,000+ transactions per second via real-time zkEVM proving by the end of the decade. Meanwhile, L2s like Base, Arbitrum, and Robinhood{"'"}s chain have found product-market fit with institutions that want Ethereum{"'"}s security and liquidity while customizing for compliance and operational control. Critically, L1 scaling doesn{"'"}t compete with L2s {"\u2014"} it makes them cheaper and more useful by reducing settlement and data availability costs. Every L2 transaction still requires ETH for gas and still posts data to Ethereum for settlement, so the scaling roadmap amplifies rather than dilutes ETH{"'"}s monetary properties. For the full analysis, see <a href="https://x.com/Etherealize_io/status/2032091862513684661" target="_blank" rel="noopener noreferrer" style={{ color: "#8294fc", textDecoration: "underline" }}>Etherealize{"'"}s breakdown of Ethereum{"'"}s scaling strategy</a>.</>,
  },
  {
    q: "How is staking yield different from a bond?",
    a: "A bond is a loan to a counterparty. If the counterparty defaults, you lose your principal. Staking is not lending—there is no borrower. You lock ETH into the protocol's consensus mechanism and earn yield from issuance and transaction fees. The ETH remains yours. The risk is protocol risk (slashing, bugs), not counterparty risk."
  },
];
function fmtT(n) {
  if (n == null) return "\u2014";
  if (n >= 1e12) return "$" + (n / 1e12).toFixed(1) + "T";
  if (n >= 1e9) return "$" + (n / 1e9).toFixed(0) + "B";
  return "$" + Math.round(n).toLocaleString();
}
function fmtP(n) {
  if (n == null) return "\u2014";
  return "$" + Math.round(n).toLocaleString();
}
function fmtSupply(n) {
  if (n == null) return "\u2014";
  return Math.round(n / 1e6).toLocaleString() + " million";
}

function ThesisParagraph({ onReadMore }) {
  const ctx = useMarketData();
  const d = ctx?.data;
  const goldPremium = d ? fmtT(d.goldMonetaryPremium) : "~$27T";
  const btcMcap = d ? fmtT(d.btcMcap) : "~$1.4T";
  const combined = d ? fmtT(d.combinedTarget) : "~$29T";
  const ethSupply = d ? fmtSupply(d.ethSupply) : "~120 million";
  const implied = d ? fmtP(d.impliedPrice) : "~$240,000";
  const ethPrice = d ? fmtP(d.ethPrice) : "~$2,000";
  return (
    <section className="pm-section" id="thesis">
      <div className="pm-label">Executive Summary</div>
      <h2 className="pm-heading">The Thesis in One Paragraph</h2>
      <div className="pm-body">
        <p>
          {"Warren Buffett never held gold. His objection was not about scarcity\u2014he acknowledged gold was scarce. His objection was that scarcity without productivity is economically sterile: \u201CIf you own one ounce of gold for an eternity, you will still own one ounce at its end.\u201D The same criticism applies to Bitcoin. For all of human history, you had to choose: hold money (stable, unproductive) or invest it into productive assets (risky, wealth-generating). The two categories were mutually exclusive. "}
          <span className="pm-accent-text">Ethereum dissolves this distinction.</span>
          {" ETH is the first monetary asset in history that is productive and compounds without counterparty risk\u2014you lock capital into the protocol\u2019s consensus mechanism and earn yield generated by the network itself. Critically, ETH is a bearer instrument that matches or exceeds gold and Bitcoin on every important monetary attribute: scarcity, fungibility, divisibility, portability, durability, and low carrying cost. The combined monetary premium of gold and Bitcoin is approximately "}
          <span style={{ color: "#c9a84c", fontWeight: 500 }}>{goldPremium}</span>
          {" + "}
          <span style={{ color: "#f7931a", fontWeight: 500 }}>{btcMcap}</span>
          {" = "}
          <span style={{ fontWeight: 600, color: "#e4e4ef" }}>{combined}</span>
          {". If ETH captured that premium\u2014distributed across roughly "}
          {ethSupply}
          {" ETH in circulation\u2014the implied price per ETH would be approximately "}
          <span className="pm-accent-text">{implied}</span>
          {". Today it trades around "}
          <span className="pm-accent-text">{ethPrice}</span>
          {". This report argues that the repricing is not only possible, but logically consistent given the monetary properties of ETH."}
        </p>
      </div>
      <div style={{ marginTop: "40px", textAlign: "center" }}>
        <button className="pm-btn-primary" onClick={onReadMore}>Read the Whitepaper</button>
      </div>
    </section>
  );
}

export default function ProductiveMoney() {
  const router = useRouter();
  const [menuOpen, setMenuOpen] = useState(false);
  const [activeSection, setActiveSection] = useState("hero");
  const [expandedFaq, setExpandedFaq] = useState(null);
  const [email, setEmail] = useState("");
  useEffect(() => {
    const handleScroll = () => {
      const sectionIds = ["hero","thesis","dashboard","faq","about","ai","subscribe"];
      const sections = sectionIds.map(id => {
        const el = document.getElementById(id);
        return el ? { id, top: el.getBoundingClientRect().top } : null;
      }).filter(Boolean);
      const current = sections.filter(s => s.top <= 250).pop();
      if (current) setActiveSection(current.id);
    };
    window.addEventListener("scroll", handleScroll, { passive: true });
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);
  const scrollTo = (id) => {
    document.getElementById(id)?.scrollIntoView({ behavior: "smooth" });
    setMenuOpen(false);
  };
  return (
    <MarketDataProvider>
    <div style={{ fontFamily: "'Inter', sans-serif", background: "#050510", color: "#e4e4ef", minHeight: "100vh" }}>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700&family=EB+Garamond:ital,wght@0,400;0,500;0,600;0,700;1,400;1,500&family=JetBrains+Mono:wght@300;400&display=swap');
        * { margin: 0; padding: 0; box-sizing: border-box; }
        ::selection { background: rgba(130, 148, 252, 0.3); color: #fff; }
        .pm-nav {
          position: fixed; top: 0; left: 0; right: 0; z-index: 100;
          background: rgba(5, 5, 16, 0.88);
          backdrop-filter: blur(24px) saturate(1.2);
          border-bottom: 1px solid rgba(130, 148, 252, 0.08);
        }
        .pm-nav-inner {
          max-width: 1200px; margin: 0 auto; padding: 0 32px;
          height: 64px; display: flex; align-items: center; justify-content: space-between;
        }
        .pm-nav-brand { display: flex; align-items: center; gap: 10px; cursor: pointer; }
        .pm-nav-brand-text { font-size: 14px; font-weight: 600; letter-spacing: 0.5px; color: #fff; }
        .pm-nav-brand-sub {
          font-size: 10px; font-weight: 400; letter-spacing: 2px;
          text-transform: uppercase; color: #6b6c88; margin-left: 2px;
        }
        .pm-nav-links { display: flex; gap: 28px; align-items: center; }
        .pm-nav-link {
          font-size: 13px; font-weight: 400; color: #8b8ca7;
          background: none; border: none; cursor: pointer; transition: color 0.2s;
        }
        .pm-nav-link:hover, .pm-nav-link.active { color: #a0b0ff; }
        .pm-nav-cta {
          font-size: 12px; font-weight: 600; letter-spacing: 0.8px;
          color: #050510; background: #8294fc; border: none;
          padding: 8px 20px; border-radius: 4px; cursor: pointer; transition: all 0.2s;
        }
        .pm-nav-cta:hover { background: #a0b0ff; }
        .pm-mobile-btn {
          display: none; background: none; border: none;
          color: #8294fc; font-size: 22px; cursor: pointer;
        }
        @media (max-width: 900px) {
          .pm-nav-links { display: none; }
          .pm-mobile-btn { display: block; }
          .pm-nav-links.open {
            display: flex; flex-direction: column;
            position: absolute; top: 64px; left: 0; right: 0;
            background: rgba(5, 5, 16, 0.98); padding: 24px 32px;
            gap: 16px; border-bottom: 1px solid rgba(130, 148, 252, 0.08);
          }
        }
        .pm-hero {
          min-height: 100vh; display: flex; flex-direction: column;
          justify-content: center; align-items: center; text-align: center;
          padding: 120px 32px 80px; position: relative; overflow: hidden;
        }
        .pm-hero::before {
          content: ''; position: absolute; top: -20%; left: 50%; transform: translateX(-50%);
          width: 800px; height: 800px;
          background: radial-gradient(circle, rgba(130,148,252,0.06) 0%, rgba(130,148,252,0.02) 40%, transparent 70%);
          pointer-events: none;
        }
        .pm-hero::after {
          content: ''; position: absolute; bottom: -10%; left: 30%;
          width: 600px; height: 600px;
          background: radial-gradient(circle, rgba(100,120,220,0.04) 0%, transparent 60%);
          pointer-events: none;
        }
        .pm-hero-overline {
          font-size: 11px; font-weight: 500; letter-spacing: 4px;
          text-transform: uppercase; color: #8294fc;
          margin-bottom: 48px; position: relative;
          opacity: 0; animation: fadeUp 0.7s ease 0.1s forwards;
        }
        .pm-hero-eth {
          margin-bottom: 36px;
          opacity: 0; animation: fadeUp 0.7s ease 0.2s forwards;
          filter: drop-shadow(0 0 40px rgba(130,148,252,0.3));
        }
        .pm-hero-title {
          font-size: clamp(44px, 7vw, 84px);
          font-weight: 700; line-height: 1.05; letter-spacing: -2px;
          color: #fff; opacity: 0; animation: fadeUp 0.7s ease 0.35s forwards;
        }
        .pm-hero-title-break { display: none; }
        @media (min-width: 601px) {
          .pm-hero-title-break { display: block; }
        }
        .pm-hero-title-accent {
          background: linear-gradient(135deg, #8294fc, #b8c4ff);
          -webkit-background-clip: text; -webkit-text-fill-color: transparent;
          background-clip: text;
        }
        .pm-hero-subtitle {
          font-family: 'EB Garamond', serif;
          font-size: clamp(17px, 2.2vw, 22px);
          font-weight: 400; line-height: 1.65; color: #9b9cb5;
          max-width: 640px; margin: 36px auto 48px;
          opacity: 0; animation: fadeUp 0.7s ease 0.5s forwards;
        }
        .pm-hero-ctas {
          display: flex; gap: 16px; flex-wrap: wrap; justify-content: center;
          opacity: 0; animation: fadeUp 0.7s ease 0.65s forwards;
        }
        .pm-btn-primary {
          font-family: 'Inter', sans-serif;
          font-size: 14px; font-weight: 600; letter-spacing: 0.5px;
          color: #050510; background: #8294fc; border: none;
          padding: 14px 36px; border-radius: 4px; cursor: pointer; transition: all 0.25s;
        }
        .pm-btn-primary:hover { background: #a0b0ff; transform: translateY(-1px); box-shadow: 0 8px 32px rgba(130,148,252,0.25); }
        .pm-btn-ghost {
          font-family: 'Inter', sans-serif;
          font-size: 14px; font-weight: 500; letter-spacing: 0.5px;
          color: #8294fc; background: transparent;
          border: 1px solid rgba(130,148,252,0.25); padding: 13px 36px;
          border-radius: 4px; cursor: pointer; transition: all 0.25s;
        }
        .pm-btn-ghost:hover { border-color: #8294fc; background: rgba(130,148,252,0.06); }
        .pm-hero-brands {
          margin-top: 56px; display: flex; align-items: center; gap: 16px;
          opacity: 0; animation: fadeUp 0.7s ease 0.8s forwards;
        }
        .pm-hero-brand {
          font-size: 11px; font-weight: 500; letter-spacing: 3px;
          text-transform: uppercase; color: #6b6c88;
        }
        .pm-hero-brand-sep { width: 1px; height: 16px; background: rgba(130,148,252,0.2); }
        .pm-section { max-width: 780px; margin: 0 auto; padding: 120px 32px; }
        .pm-section-wide { max-width: 1100px; margin: 0 auto; padding: 120px 32px; }
        .pm-label {
          font-size: 12px; font-weight: 600; letter-spacing: 3px;
          text-transform: uppercase; color: #8294fc; margin-bottom: 20px;
        }
        .pm-heading {
          font-size: clamp(28px, 3.5vw, 42px);
          font-weight: 700; line-height: 1.2; letter-spacing: -0.5px;
          color: #fff; margin-bottom: 32px;
        }
        .pm-body {
          font-family: 'EB Garamond', serif;
          font-size: 20px; line-height: 1.78; color: #9b9cb5;
        }
        .pm-body p { margin-bottom: 24px; }
        .pm-accent-text { color: #a0b0ff; font-weight: 500; }
        .pm-pullquote {
          border-left: 2px solid #8294fc;
          padding: 24px 0 24px 28px; margin: 48px 0;
          font-family: 'EB Garamond', serif;
          font-size: 22px; font-style: italic; line-height: 1.55; color: #e4e4ef;
        }
        .pm-divider { max-width: 1100px; margin: 0 auto; padding: 0 32px; }
        .pm-divider-line {
          height: 1px;
          background: linear-gradient(90deg, transparent, rgba(130,148,252,0.15), transparent);
        }
        .pm-metrics-grid {
          display: grid; grid-template-columns: repeat(auto-fill, minmax(150px, 1fr));
          gap: 1px; background: rgba(130,148,252,0.08); margin-top: 40px;
          border-radius: 8px; overflow: hidden;
        }
        .pm-metric { background: #0d0e20; padding: 24px 16px; text-align: center; }
        .pm-metric-label {
          font-size: 11px; font-weight: 500; letter-spacing: 1.2px;
          text-transform: uppercase; color: #6b6c88; margin-bottom: 12px;
        }
        .pm-metric-value {
          font-family: 'JetBrains Mono', monospace; font-size: 20px;
          color: #a0b0ff; letter-spacing: -0.5px;
        }
        .pm-faq-list { margin-top: 40px; }
        .pm-faq-item { border-bottom: 1px solid rgba(130,148,252,0.08); }
        .pm-faq-q {
          display: flex; align-items: center; justify-content: space-between;
          padding: 24px 0; cursor: pointer; background: none; border: none;
          width: 100%; text-align: left; color: #e4e4ef;
          font-family: 'Inter', sans-serif; font-size: 18px; font-weight: 500;
          transition: color 0.2s;
        }
        .pm-faq-q:hover { color: #a0b0ff; }
        .pm-faq-toggle {
          font-family: 'JetBrains Mono', monospace; font-size: 20px;
          color: #8294fc; flex-shrink: 0; margin-left: 20px; transition: transform 0.25s;
        }
        .pm-faq-a {
          padding: 0 0 24px; font-size: 16px; line-height: 1.7;
          color: #9b9cb5; max-width: 700px;
        }
        .pm-ai-section {
          background: linear-gradient(180deg, rgba(130,148,252,0.03) 0%, #050510 100%);
          border-top: 1px solid rgba(130,148,252,0.08);
          border-bottom: 1px solid rgba(130,148,252,0.08);
        }
        .pm-sub-box { max-width: 520px; margin: 40px auto 0; text-align: center; }
        .pm-sub-row {
          display: flex; gap: 0; margin-top: 24px; border-radius: 4px; overflow: hidden;
        }
        .pm-sub-input {
          flex: 1; font-family: 'Inter', sans-serif; font-size: 14px;
          padding: 14px 18px; background: #0d0e20;
          border: 1px solid rgba(130,148,252,0.08); border-right: none;
          color: #e4e4ef; outline: none; border-radius: 4px 0 0 4px;
        }
        .pm-sub-input::placeholder { color: #6b6c88; }
        .pm-sub-input:focus { border-color: #8294fc; background: rgba(130,148,252,0.04); }
        .pm-sub-btn {
          font-family: 'Inter', sans-serif; font-size: 13px; font-weight: 600;
          color: #050510; background: #8294fc;
          border: 1px solid #8294fc; padding: 14px 24px;
          cursor: pointer; transition: all 0.2s; white-space: nowrap;
          border-radius: 0 4px 4px 0;
        }
        .pm-sub-btn:hover { background: #a0b0ff; }
        .pm-sub-note { font-size: 13px; color: #6b6c88; margin-top: 14px; }
        .pm-footer {
          max-width: 1100px; margin: 0 auto; padding: 56px 32px;
          display: flex; justify-content: space-between; align-items: center;
          flex-wrap: wrap; gap: 20px;
        }
        .pm-footer-left { font-size: 12px; color: #6b6c88; }
        .pm-footer-links { display: flex; gap: 20px; }
        .pm-footer-link {
          font-size: 12px; color: #6b6c88; background: none;
          border: none; cursor: pointer; transition: color 0.2s;
        }
        .pm-footer-link:hover { color: #8294fc; }
        @keyframes fadeUp {
          from { opacity: 0; transform: translateY(20px); }
          to { opacity: 1; transform: translateY(0); }
        }
        ::-webkit-scrollbar { width: 5px; }
        ::-webkit-scrollbar-track { background: #050510; }
        ::-webkit-scrollbar-thumb { background: rgba(130,148,252,0.2); border-radius: 3px; }
        @media (max-width: 600px) {
          .pm-hero { padding: 100px 20px 60px; }
          .pm-section, .pm-section-wide { padding: 80px 20px; }
          .pm-metrics-grid { grid-template-columns: repeat(2, 1fr); }
          .pm-hero-ctas { flex-direction: column; width: 100%; }
          .pm-btn-primary, .pm-btn-ghost { width: 100%; text-align: center; }
          .pm-sub-row { flex-direction: column; }
          .pm-sub-input { border-right: 1px solid rgba(130,148,252,0.08); border-bottom: none; border-radius: 4px 4px 0 0; }
          .pm-sub-btn { border-radius: 0 0 4px 4px; }
          .pm-chart-bars { gap: 20px; }
          .pm-chart-bar { width: 40px; }
          .pm-footer { flex-direction: column; text-align: center; }
        }
      `}</style>
      {/* NAV */}
      <nav className="pm-nav">
        <div className="pm-nav-inner">
          <div className="pm-nav-brand" onClick={() => scrollTo("hero")}>
            <EthDiamond size={14} />
            <div>
              <span className="pm-nav-brand-text">Productive Money</span>
              <span className="pm-nav-brand-sub"> — Etherealize</span>
            </div>
          </div>
          <div className={`pm-nav-links ${menuOpen ? 'open' : ''}`}>
            {NAV_LINKS.map(l => (
              <button key={l.label}
                className={`pm-nav-link ${activeSection === l.href.slice(1) ? 'active' : ''}`}
                onClick={() => scrollTo(l.href.slice(1))}
              >{l.label}</button>
            ))}
            <button className="pm-nav-cta" onClick={() => router.push("/paper")}>Read the Whitepaper</button>
          </div>
          <button className="pm-mobile-btn" onClick={() => setMenuOpen(!menuOpen)}>
            {menuOpen ? "\u2715" : "\u2630"}
          </button>
        </div>
      </nav>
      {/* HERO */}
      <section className="pm-hero" id="hero">
        <div className="pm-hero-overline">A Whitepaper By<br />Etherealize x Bitmine</div>
        <div className="pm-hero-eth"><EthDiamond size={36} /></div>
        <h1 className="pm-hero-title">
          Ethereum and the Era of{" "}<span className="pm-hero-title-break" /><span className="pm-hero-title-accent">Productive Money</span>
        </h1>
        <p className="pm-hero-subtitle">
          {"Why ETH is better money than gold and Bitcoin by every measure."}
        </p>
        <div className="pm-hero-ctas">
          <button className="pm-btn-primary" onClick={() => scrollTo("thesis")}>The Thesis</button>
          <button className="pm-btn-ghost" onClick={() => router.push("/paper")}>Read the Whitepaper</button>
          <button className="pm-btn-ghost">Download PDF</button>
        </div>

        <div style={{
          width: "100%", maxWidth: "820px", marginTop: "56px", position: "relative",
          opacity: 0, animation: "fadeUp 0.7s ease 0.95s forwards",
        }}>
          <PathToTarget />
        </div>
      </section>
      <div className="pm-divider"><div className="pm-divider-line" /></div>
      {/* EXEC SUMMARY */}
      <ThesisParagraph onReadMore={() => router.push("/paper")} />
      <div className="pm-divider"><div className="pm-divider-line" /></div>
      {/* MENGER COMPARISON MATRIX */}
      <section className="pm-section-wide" id="comparison">
        <div className="pm-label">Monetary Attributes</div>
        <h2 className="pm-heading">ETH vs. Gold vs. Bitcoin</h2>
        <p style={{ fontSize: "14px", color: "#6b6c88", lineHeight: 1.6, marginBottom: "32px" }}>
          Carl Menger argued that certain goods naturally emerge as money because they excel across a composite of attributes. Here is how ETH compares on every one.
        </p>
        <ComparisonTable />
      </section>
      <div className="pm-divider"><div className="pm-divider-line" /></div>
      {/* COMPOUNDING VISUALIZATION */}
      <section className="pm-section-wide" id="compounding">
        <div className="pm-label">The Core Insight</div>
        <h2 className="pm-heading">Dead Capital vs. Productive Money</h2>
        <p style={{ fontSize: "14px", color: "#6b6c88", lineHeight: 1.6, marginBottom: "32px" }}>
          Start with 100 units of each asset. Over 30 years, gold and Bitcoin sit there. ETH compounds.
        </p>
        <CompoundingChart />
      </section>
      <div className="pm-divider"><div className="pm-divider-line" /></div>
      {/* DASHBOARD */}
      <section className="pm-section-wide" id="dashboard">
        <LiveDashboard />
      </section>
      <div className="pm-divider"><div className="pm-divider-line" /></div>
      {/* FAQ */}
      <section className="pm-section" id="faq">
        <div className="pm-label">Frequently Asked Questions</div>
        <h2 className="pm-heading">Objections & Responses</h2>
        <div className="pm-faq-list">
          {FAQ_DATA.map((faq, i) => (
            <div key={i} className="pm-faq-item">
              <button className="pm-faq-q" onClick={() => setExpandedFaq(expandedFaq === i ? null : i)}>
                <span>{faq.q}</span>
                <span className="pm-faq-toggle" style={{ transform: expandedFaq === i ? "rotate(45deg)" : "rotate(0)" }}>+</span>
              </button>
              {expandedFaq === i && <div className="pm-faq-a">{faq.a}</div>}
            </div>
          ))}
        </div>
      </section>
      <div className="pm-divider"><div className="pm-divider-line" /></div>
      {/* ABOUT */}
      <section className="pm-section" id="about">
        <div className="pm-label">About This Paper</div>
        <h2 className="pm-heading">{"Why \u201CProductive Money\u201D?"}</h2>
        <div className="pm-body">
          <p>
            {"The Ethereum community has a narrative problem. Bitcoin has \u201Cdigital gold\u201D\u2014two words everyone understands. Ethereum has ultrasound money, world computer, digital oil, programmable money, the internet bond. The community changes the metaphor every six months, and each competes with the last."}
          </p>
          <p>
            <span className="pm-accent-text">{"\u201CProductive money\u201D"}</span>
            {" is the Schelling point\u2014the focal narrative the entire community can converge on. For the money camp: ETH is better money because it compounds. For the utility camp: the monetary premium is what your utility creates. For institutions: ETH is a bearer asset that compounds."}
          </p>
          <p>
            {"This paper is a joint publication of "}
            <span className="pm-accent-text">Etherealize</span>
            {" and "}
            <span className="pm-accent-text">Bitmine</span>
            {". Its purpose is to give the Ethereum community a shared language for explaining what they own and why\u2014and to give institutional allocators a framework for underwriting the thesis."}
          </p>
        </div>
      </section>
      <div className="pm-divider"><div className="pm-divider-line" /></div>
      {/* AI SECTION */}
      <section className="pm-ai-section" id="ai">
        <div className="pm-section">
          <div className="pm-label">Coming Soon</div>
          <h2 className="pm-heading">Productive Money in the Exponential Age</h2>
          <div className="pm-body">
            <p>
              If AI represents the most significant technological shift since electricity, then the question of where AI agents store and transfer value is central. AI agents cannot open bank accounts. They cannot pass KYC. But they can hold ETH. They can stake it. They can transact permissionlessly, 24 hours a day.
            </p>
            <p>
              {"As autonomous economic agents proliferate, the demand for programmable, self-custodied money will grow in proportion to their intelligence. Productive money is not just a thesis about human economic behavior\u2014it is a thesis about machine economic behavior. "}
              <span className="pm-accent-text">Full essay forthcoming.</span>
            </p>
          </div>
        </div>
      </section>
      {/* SUBSCRIBE */}
      <section className="pm-section" id="subscribe" style={{ textAlign: "center" }}>
        <div className="pm-label" style={{ display: "flex", justifyContent: "center" }}>Stay Updated</div>
        <h2 className="pm-heading">Subscribe for Updates</h2>
        <div className="pm-sub-box">
          <p style={{ fontSize: "15px", color: "#8b8ca7", lineHeight: 1.65 }}>
            New chapters, dashboard updates, and research from the Productive Money thesis.
          </p>
          <div className="pm-sub-row">
            <input type="email" className="pm-sub-input" placeholder="you@example.com"
              value={email} onChange={e => setEmail(e.target.value)} />
            <button className="pm-sub-btn">Subscribe</button>
          </div>
          <div className="pm-sub-note">Powered by Substack · No spam, unsubscribe anytime</div>
        </div>
      </section>
      {/* CLOSING */}
      <div style={{ textAlign: "center", padding: "64px 32px 32px", maxWidth: "560px", margin: "0 auto" }}>
        <EthDiamond size={20} />
        <p style={{
          fontFamily: "'EB Garamond', serif", fontSize: "18px", fontStyle: "italic",
          color: "#6b6c88", marginTop: "28px", lineHeight: 1.65
        }}>
          Every prior path to that outcome required surrendering your money to a counterparty. ETH is the first money that compounds while it remains in your hands.
        </p>
      </div>
      <div className="pm-divider"><div className="pm-divider-line" /></div>
      <footer className="pm-footer">
        <div className="pm-footer-left">{"\u00A9"} 2026 Etherealize x Bitmine</div>
        <div className="pm-footer-links">
          <button className="pm-footer-link" onClick={() => scrollTo("thesis")}>Thesis</button>
          <button className="pm-footer-link" onClick={() => scrollTo("dashboard")}>Dashboard</button>
          <button className="pm-footer-link" onClick={() => scrollTo("faq")}>FAQ</button>
          <button className="pm-footer-link" onClick={() => scrollTo("about")}>About</button>
        </div>
      </footer>
    </div>
    </MarketDataProvider>
  );
}
