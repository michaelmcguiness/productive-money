"use client";

import { useState, useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import { ComparisonTable, CompoundingChart, PathToTarget, LiveDashboard, MarketDataProvider, useMarketData, ShareFab, SubscribeBox } from "./components";
const NAV_LINKS = [
  { label: "Thesis", href: "#thesis" },
  { label: "Dashboard", href: "#dashboard" },
  { label: "FAQ", href: "#faq" },
  { label: "About", href: "#about" },
];
const FAQ_DATA = [
  {
    q: "Isn't staking yield just inflation?",
    a: "If the protocol issues new ETH to pay stakers, isn't that just dilution? Two things make this wrong. First, Ethereum's burn mechanism destroys ETH with every transaction — when usage is high enough, burns exceed issuance and total supply shrinks, similar to funding share buybacks with profits. Second, a meaningful portion of staking yield is funded by transaction fees, similar to funding dividends with profits. And unlike a corporation or central bank, ETH issuance is capped by the protocol at 1.5% and cannot be changed by any individual, board, or committee."
  },
  {
    q: "Why not just buy the S&P 500?",
    a: "Because the S&P 500 is not money. Every dollar of S&P 500 value is a claim on a counterparty — a corporation that can go bankrupt, a broker that can fail, a clearinghouse that can freeze your shares. ETH is a bearer instrument: whoever holds it, owns it. It is self-custodied, censorship-resistant, dependent on no corporation, broker, or government — and it compounds. The S&P 500 is a wonderful productive asset, but it is not money. ETH is both."
  },
  {
    q: "Why not Solana, Cardano, or another L1?",
    a: "For an asset to function as money, it must be credibly neutral — no single party, government, or coalition can alter its monetary policy. Ethereum has over 900,000 validators operated by tens of thousands of independent entities across dozens of countries. No other smart contract platform comes close. Beyond decentralization, Ethereum has self-reinforcing network effects: over 65% of tokenized real-world assets, the deepest DeFi liquidity, and more developers than every other chain combined. Institutions tokenize on Ethereum because that's where the liquidity is, and the liquidity is there because that's where institutions tokenize. In the last 10 years, no competitor has come close."
  },
  {
    q: "What about Ethereum's scaling challenges?",
    a: <>Ethereum{"'"}s L1 is scaling much faster than most observers expected. The gas limit has already doubled in 2025, with a credible roadmap to triple throughput roughly every year {"\u2014"} targeting 10,000+ transactions per second via real-time zkEVM proving by the end of the decade. Meanwhile, L2s like Base, Arbitrum, and Robinhood{"'"}s chain have found product-market fit with institutions that want Ethereum{"'"}s security and liquidity while customizing for compliance and operational control. Critically, L1 scaling doesn{"'"}t compete with L2s {"\u2014"} it makes them cheaper and more useful by reducing settlement and data availability costs. Every L2 transaction still requires ETH for gas and still posts data to Ethereum for settlement, so the scaling roadmap amplifies rather than dilutes ETH{"'"}s monetary properties. For the full analysis, see <a href="https://x.com/Etherealize_io/status/2032091862513684661" target="_blank" rel="noopener noreferrer" style={{ color: "var(--gold-deep)", textDecoration: "underline" }}>Etherealize{"'"}s breakdown of Ethereum{"'"}s scaling strategy</a>.</>,
  },
  {
    q: "How is staking yield different from a bond?",
    a: "A bond is a loan to a counterparty. If the counterparty defaults, you lose your principal. Staking is not lending — there is no borrower. You lock ETH into the protocol's consensus mechanism and earn yield from the network itself. The ETH remains yours. The risk is protocol risk (slashing, bugs), not counterparty risk. This distinction is the core of the productive money thesis."
  },
    {
    q: "What are the principal risks to the thesis?",
    a: "Three. Regulatory: governments could restrict DeFi activity or staking. Competitive: a superior smart contract platform could emerge, though none has in ten years. Technical: a critical protocol bug could undermine confidence. The paper does not claim the repricing is inevitable — it claims the repricing is logically consistent given the monetary properties of ETH, and that the direction of travel favors productive money over dead capital."
  }

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

function Flywheel() {
  const cx = 260, cy = 210;
  const R = 160;
  const centerR = 96;
  const nodeR = 40;
  const gap = 8;
  const bow = 22;
  const nodes = [
    { angle: 0,   lines: ["Usage"] },
    { angle: 72,  lines: ["Burn +", "Yield"] },
    { angle: 144, lines: ["Monetary", "Premium"] },
    { angle: 216, lines: ["Security", "Budget"] },
    { angle: 288, lines: ["Adoption"] },
  ];
  const center = (angle) => {
    const rad = (angle - 90) * Math.PI / 180;
    return [cx + R * Math.cos(rad), cy + R * Math.sin(rad)];
  };
  const perimArrows = nodes.map((n, i) => {
    const next = nodes[(i + 1) % nodes.length];
    const [x1, y1] = center(n.angle);
    const [x2, y2] = center(next.angle);
    let dx = x2 - x1, dy = y2 - y1;
    const dist = Math.hypot(dx, dy);
    dx /= dist; dy /= dist;
    const startX = x1 + dx * (nodeR + gap);
    const startY = y1 + dy * (nodeR + gap);
    const endX = x2 - dx * (nodeR + gap);
    const endY = y2 - dy * (nodeR + gap);
    const mx = (startX + endX) / 2;
    const my = (startY + endY) / 2;
    let nx = mx - cx, ny = my - cy;
    const nm = Math.hypot(nx, ny) || 1;
    nx /= nm; ny /= nm;
    const cxB = mx + nx * bow;
    const cyB = my + ny * bow;
    return `M ${startX.toFixed(1)} ${startY.toFixed(1)} Q ${cxB.toFixed(1)} ${cyB.toFixed(1)} ${endX.toFixed(1)} ${endY.toFixed(1)}`;
  });
  return (
    <div style={{ margin: "48px auto 32px", maxWidth: 520 }}>
      <svg viewBox="0 0 520 390" style={{ width: "100%", display: "block" }}
        aria-label="Productive money flywheel: Usage, Burn and yield, Monetary premium, Security budget, Adoption">
        <defs>
          <marker id="fw-arrow" viewBox="0 0 16 16" refX="13" refY="8"
            markerUnits="userSpaceOnUse" markerWidth="16" markerHeight="16" orient="auto">
            <path d="M0,0 L16,8 L0,16 L5,8 z" fill="#C2A45B" />
          </marker>
        </defs>
        {perimArrows.map((d, i) => (
          <path key={`p${i}`} d={d} fill="none" stroke="#C2A45B" strokeWidth="3"
            strokeLinecap="round" markerEnd="url(#fw-arrow)" />
        ))}
        <circle cx={cx} cy={cy} r={centerR} fill="#C2A45B" />
        <text x={cx} y={cy - 15}
          fontSize="30" fontFamily="'Cormorant Garamond', serif"
          fontWeight="500" fill="#F5F2EC" textAnchor="middle" dominantBaseline="middle">
          Productive
        </text>
        <text x={cx} y={cy + 15}
          fontSize="30" fontFamily="'Cormorant Garamond', serif"
          fontWeight="500" fill="#F5F2EC" textAnchor="middle" dominantBaseline="middle">
          Money
        </text>
        {nodes.map((n, i) => {
          const [nx, ny] = center(n.angle);
          const lines = n.lines;
          return (
            <g key={i}>
              <circle cx={nx} cy={ny} r={nodeR}
                fill="#F5F2EC" stroke="#C2A45B" strokeWidth="1.25" />
              {lines.length === 1 ? (
                <text x={nx} y={ny}
                  fontSize="13" fontFamily="'DM Sans', sans-serif"
                  fontWeight="500" fill="#29251F"
                  textAnchor="middle" dominantBaseline="middle">
                  {lines[0]}
                </text>
              ) : (
                <>
                  <text x={nx} y={ny - 8}
                    fontSize="13" fontFamily="'DM Sans', sans-serif"
                    fontWeight="500" fill="#29251F"
                    textAnchor="middle" dominantBaseline="middle">
                    {lines[0]}
                  </text>
                  <text x={nx} y={ny + 8}
                    fontSize="13" fontFamily="'DM Sans', sans-serif"
                    fontWeight="500" fill="#29251F"
                    textAnchor="middle" dominantBaseline="middle">
                    {lines[1]}
                  </text>
                </>
              )}
            </g>
          );
        })}
      </svg>
    </div>
  );
}

function ThesisParagraph({ onReadMore }) {
  const ctx = useMarketData();
  const d = ctx?.data;
  const combined = d ? fmtT(d.combinedTarget) : "~$28.7T";
  const ethSupply = d ? fmtSupply(d.ethSupply) : "~121 million";
  const implied = d ? fmtP(d.impliedPrice) : "~$237,706";
  const ethPrice = d ? fmtP(d.ethPrice) : "~$1,981";
  return (
    <section className="pm-section" id="thesis">
      <div className="pm-label">Executive Summary</div>
      <div className="pm-label-rule" />
      <h2 className="pm-heading">The Productive Money Thesis</h2>
      <div className="pm-body pm-thesis-body">
        <p>
          <strong>{"Gold and Bitcoin don\u2019t compound."}</strong>
          {" Warren Buffett never held gold. His objection was not about scarcity\u2014he acknowledged gold was scarce. His objection was that scarcity without productivity is economically sterile: \u201CIf you own one ounce of gold for an eternity, you will still own one ounce at its end.\u201D The same criticism applies to Bitcoin."}
        </p>
        <p>
          <strong>{"ETH is the first monetary asset that compounds without counterparty risk."}</strong>
          {" For all of human history, you had to choose: hold money (stable, unproductive) or invest it into productive assets (risky, wealth-generating). The two categories were mutually exclusive. Ethereum dissolves this distinction\u2014you lock capital into the protocol\u2019s consensus mechanism and earn yield generated by the network itself."}
        </p>
        <p>
          <strong>{"ETH is better money than gold and Bitcoin by every other measure."}</strong>
          {" Its supply growth is capped at 1.5% by the protocol and offset by a burn mechanism that can make it deflationary. It can be transferred anywhere on Earth in seconds, stored in a memorized twelve-word phrase, and carried across any border beyond the reach of any government. And its proof-of-stake consensus mechanism is more secure and durable than Bitcoin\u2019s proof-of-work."}
        </p>
        <p>
          <strong>{"The combined monetary premium of gold and Bitcoin is approximately "}{combined}{"."}</strong>
          {" If ETH captured that premium\u2014distributed across roughly "}{ethSupply}{" ETH in circulation\u2014the implied price per ETH would be approximately "}{implied}{". Today it trades around "}{ethPrice}{"."}
        </p>
        <p>
          <strong>{"Productive money will outcompete dead capital."}</strong>
          {" Over a long enough time horizon, productive assets outperform unproductive ones, because productive assets compound. The only question is how long it takes the rest of the world to figure that out."}
        </p>
      </div>
      <div style={{ marginTop: "48px" }}>
        <button className="pm-btn-primary" onClick={onReadMore}>Read the Report</button>
      </div>
    </section>
  );
}

export default function ProductiveMoney() {
  const router = useRouter();
  const [menuOpen, setMenuOpen] = useState(false);
  const [activeSection, setActiveSection] = useState("hero");
  const [expandedFaq, setExpandedFaq] = useState(null);

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
    <div style={{ fontFamily: "'DM Sans', sans-serif", background: "var(--cream)", color: "var(--ink)", minHeight: "100vh" }}>
      <style>{`
        * { margin: 0; padding: 0; box-sizing: border-box; }
        ::selection { background: rgba(194,164,91,0.35); color: var(--ink); }
        .pm-nav {
          position: fixed; top: 0; left: 0; right: 0; z-index: 100;
          background: rgba(245, 242, 236, 0.9);
          backdrop-filter: blur(18px) saturate(1.1);
          border-bottom: 1px solid var(--hairline);
        }
        .pm-nav-inner {
          max-width: 1200px; margin: 0 auto; padding: 0 32px;
          height: 68px; display: flex; align-items: center; justify-content: space-between;
        }
        .pm-nav-brand {
          display: flex; align-items: baseline; gap: 10px;
          cursor: pointer; line-height: 1;
        }
        .pm-nav-brand-text {
          font-family: 'Cormorant Garamond', serif;
          font-size: 23px; font-weight: 600; color: var(--ink);
          letter-spacing: -0.2px;
        }
        .pm-nav-brand-sub {
          font-family: 'DM Sans', sans-serif;
          font-size: 11px; font-weight: 500; letter-spacing: 1.8px;
          text-transform: uppercase; color: #7a7a7a;
          position: relative; top: -1px;
        }
        .pm-nav-links { display: flex; gap: 30px; align-items: center; }
        .pm-nav-link {
          font-family: 'DM Sans', sans-serif;
          font-size: 12px; font-weight: 500; letter-spacing: 1.2px;
          text-transform: uppercase; color: var(--muted-warmer);
          background: none; border: none; cursor: pointer; transition: color 0.2s;
        }
        .pm-nav-link:hover, .pm-nav-link.active { color: var(--gold); }
        .pm-nav-cta {
          font-family: 'DM Sans', sans-serif;
          font-size: 11px; font-weight: 600; letter-spacing: 1.4px;
          text-transform: uppercase;
          color: var(--cream); background: var(--ink); border: 1px solid var(--ink);
          padding: 10px 22px; cursor: pointer; transition: all 0.2s;
        }
        .pm-nav-cta:hover { background: var(--gold); border-color: var(--gold); color: var(--ink); }
        .pm-mobile-btn {
          display: none; background: none; border: none;
          color: var(--ink); font-size: 22px; cursor: pointer;
        }
        @media (max-width: 900px) {
          .pm-nav-links { display: none; }
          .pm-mobile-btn { display: block; }
          .pm-nav-links.open {
            display: flex; flex-direction: column; align-items: flex-start;
            position: absolute; top: 68px; left: 0; right: 0;
            background: var(--cream); padding: 24px 32px;
            gap: 18px; border-bottom: 1px solid var(--hairline);
          }
        }
        .pm-hero {
          min-height: calc(100vh - 68px);
          display: flex;
          flex-direction: column;
          align-items: center;
          text-align: center;
          max-width: 760px; margin: 0 auto;
          padding: 120px 48px 100px;
          background: var(--cream);
        }
        .pm-hero-title { overflow-wrap: break-word; word-break: normal; max-width: 16ch; }
        .pm-hero-cover-wrap {
          display: flex; justify-content: center;
          margin: 20px 0 48px;
          width: 100%;
        }
        .pm-hero-cover {
          width: 100%; max-width: 360px; height: auto; display: block;
          opacity: 0; animation: fadeUp 0.8s ease 0.4s forwards;
        }
        .pm-hero-overline {
          font-family: 'DM Sans', sans-serif;
          font-size: clamp(10px, 2.6vw, 11px);
          font-weight: 600; letter-spacing: 3px;
          text-transform: uppercase; color: var(--gold);
          margin-bottom: 36px;
          opacity: 0; animation: fadeUp 0.7s ease 0.1s forwards;
        }
        .pm-hero-title {
          font-family: 'Cormorant Garamond', serif;
          font-size: clamp(34px, 8vw, 84px);
          font-weight: 500; line-height: 1.05; letter-spacing: -0.8px;
          color: var(--ink); margin: 0 auto;
          opacity: 0; animation: fadeUp 0.7s ease 0.25s forwards;
        }
        .pm-hero-title-accent {
          font-family: 'Cormorant Garamond', serif;
          font-style: italic; font-weight: 500;
          color: var(--gold);
        }
        .pm-hero-quote {
          font-family: 'DM Sans', sans-serif;
          font-size: clamp(16px, 2vw, 19px);
          font-style: normal; font-weight: 400; line-height: 1.55;
          color: var(--ink-soft);
          max-width: 640px;
          margin: 0 auto 40px;
          opacity: 0; animation: fadeUp 0.7s ease 0.55s forwards;
        }
        .pm-hero-ctas {
          display: flex; gap: 16px; flex-wrap: wrap; justify-content: center;
          opacity: 0; animation: fadeUp 0.7s ease 0.7s forwards;
        }
        @media (max-width: 900px) {
          .pm-hero {
            padding: 104px 20px 72px;
            min-height: 0;
          }
          .pm-hero-cover { max-width: 240px; }
          .pm-hero-cover-wrap { margin: 12px 0 36px; }
          .pm-hero-quote { max-width: none; }
          .pm-hero-ctas { width: 100%; }
          .pm-hero-ctas .pm-btn-primary,
          .pm-hero-ctas .pm-btn-ghost {
            width: 100%; text-align: center; min-height: 52px;
            display: inline-flex; align-items: center; justify-content: center;
          }
        }
        .pm-chart-section {
          max-width: 1120px; margin: 0 auto;
          padding: 80px 48px 120px;
        }
        @media (max-width: 900px) {
          .pm-chart-section { padding: 32px 16px 64px; }
        }
        .pm-btn-primary {
          font-family: 'DM Sans', sans-serif;
          font-size: 11px; font-weight: 600; letter-spacing: 1.6px;
          text-transform: uppercase;
          color: var(--cream); background: var(--ink); border: 1px solid var(--ink);
          padding: 16px 36px; min-height: 48px;
          display: inline-flex; align-items: center; justify-content: center;
          cursor: pointer; transition: all 0.25s;
        }
        .pm-btn-primary:hover { background: var(--gold); border-color: var(--gold); color: var(--ink); }
        .pm-btn-ghost {
          font-family: 'DM Sans', sans-serif;
          font-size: 11px; font-weight: 600; letter-spacing: 1.6px;
          text-transform: uppercase;
          color: var(--ink); background: transparent;
          border: 1px solid var(--ink); padding: 16px 36px; min-height: 48px;
          display: inline-flex; align-items: center; justify-content: center;
          cursor: pointer; transition: all 0.25s;
        }
        .pm-btn-ghost:hover { border-color: var(--gold); color: var(--gold); }
        .pm-section { max-width: 720px; margin: 0 auto; padding: 130px 32px; }
        .pm-section-wide { max-width: 1080px; margin: 0 auto; padding: 130px 32px; }
        @media (max-width: 640px) {
          .pm-section { padding: 72px 20px; }
          .pm-section-wide { padding: 72px 16px; }
          .pm-body { max-width: none; font-size: 16px; line-height: 1.68; }
          .pm-body .pm-body-closer { max-width: none; font-size: 20px; }
          .pm-body .pm-body-kicker { font-size: 22px; }
        }
        .pm-section-dark {
          background: var(--ink); color: var(--cream-on-dark);
        }
        .pm-section-dark .pm-heading { color: var(--cream-on-dark); }
        .pm-section-dark .pm-body,
        .pm-section-dark .pm-body p { color: var(--cream-on-dark); }
        .pm-label {
          font-family: 'DM Sans', sans-serif;
          font-size: 14px; font-weight: 600; letter-spacing: 3px;
          text-transform: uppercase; color: var(--gold);
          margin-bottom: 14px; position: relative; display: block;
        }
        .pm-label-rule {
          width: 40px; height: 1px; background: var(--gold);
          margin-bottom: 28px;
        }
        .pm-heading {
          font-family: 'Cormorant Garamond', serif;
          font-size: clamp(32px, 6.4vw, 52px);
          font-weight: 500; line-height: 1.14; letter-spacing: -0.5px;
          color: var(--ink); margin-bottom: 32px;
          max-width: 18ch;
        }
        .pm-heading-xl {
          font-size: clamp(38px, 7.2vw, 72px);
          line-height: 1.08; letter-spacing: -1px;
          max-width: 16ch;
        }
        @media (max-width: 640px) {
          .pm-heading, .pm-heading-xl { max-width: none; }
          .pm-comparison-header { margin-bottom: 36px; }
          .pm-comparison-intro { font-size: 16px; }
        }
        .pm-heading em, .pm-heading .pm-italic-gold {
          font-style: normal; color: inherit; font-weight: 500;
        }
        .pm-quiet-link {
          color: inherit; text-decoration: none;
          border-bottom: none;
          transition: text-decoration-color 0.2s;
        }
        .pm-quiet-link:hover {
          text-decoration: underline;
          text-decoration-thickness: 1px;
          text-underline-offset: 3px;
        }
        .pm-heading.pm-heading-plain {
          font-style: normal; color: var(--ink); font-weight: 500;
        }
        .pm-about-body {
          font-size: 17px; line-height: 1.58;
          color: #242018; max-width: 67ch;
        }
        .pm-about-body p { margin-bottom: 22px; }
        .pm-flywheel-caption {
          font-family: 'DM Sans', sans-serif;
          font-size: 15px; line-height: 1.6;
          color: #242018; max-width: 60ch;
          margin: 0 auto;
          text-align: center;
        }
        @media (max-width: 640px) {
          .pm-about-body { font-size: 16px; }
          .pm-flywheel-caption { font-size: 14px; text-align: left; }
        }
        .pm-comparison-header {
          max-width: 760px; margin: 0 auto 56px;
        }
        .pm-comparison-header .pm-heading-xl { margin-bottom: 28px; }
        .pm-comparison-intro {
          font-family: 'DM Sans', sans-serif;
          font-size: 17px; line-height: 1.65;
          color: var(--ink-soft); max-width: 62ch;
        }
        .pm-body {
          font-family: 'DM Sans', sans-serif;
          font-size: 17px; line-height: 1.72; color: var(--ink-soft);
          max-width: 60ch;
        }
        .pm-body p { margin-bottom: 22px; }
        .pm-body strong { color: var(--ink); font-weight: 600; }
        .pm-body .pm-body-kicker {
          font-family: 'Cormorant Garamond', serif;
          font-size: 26px; font-weight: 500; font-style: italic;
          color: var(--ink); line-height: 1.3;
          margin-top: -6px; margin-bottom: 32px;
        }
        .pm-body .pm-body-closer {
          font-family: 'Cormorant Garamond', serif;
          font-size: 22px; font-weight: 500; font-style: italic;
          color: var(--ink); line-height: 1.45;
          margin-top: 16px; margin-bottom: 0;
          padding-top: 28px; border-top: 1px solid var(--hairline);
          max-width: 52ch;
        }
        .pm-section-dark .pm-body strong { color: var(--cream-on-dark); }
        .pm-accent-text { color: var(--gold-deep); font-weight: 600; font-style: italic; font-family: 'Cormorant Garamond', serif; font-size: 1.08em; }
        .pm-section-dark .pm-accent-text { color: var(--gold-bright); }
        .pm-pullquote {
          position: relative;
          padding: 48px 0 24px; margin: 56px 0;
          font-family: 'Cormorant Garamond', serif;
          font-size: 26px; font-style: italic; line-height: 1.5;
          color: var(--ink); font-weight: 500;
        }
        .pm-pullquote::before {
          content: '\\201C'; position: absolute; top: -18px; left: -8px;
          font-family: 'Cormorant Garamond', serif;
          font-size: 96px; line-height: 1; color: var(--gold);
          font-style: normal;
        }
        .pm-divider { max-width: 1080px; margin: 0 auto; padding: 0 32px; }
        .pm-divider-line { height: 1px; background: var(--hairline); }
        .pm-section-dark + .pm-divider .pm-divider-line { background: var(--hairline-dark); }
        .pm-metrics-grid {
          display: grid; grid-template-columns: repeat(auto-fill, minmax(150px, 1fr));
          gap: 1px; background: var(--hairline); margin-top: 40px;
          border: 1px solid var(--hairline);
        }
        .pm-metric { background: var(--cream); padding: 28px 18px; text-align: center; }
        .pm-metric-label {
          font-family: 'DM Sans', sans-serif;
          font-size: 10px; font-weight: 600; letter-spacing: 1.6px;
          text-transform: uppercase; color: var(--gold); margin-bottom: 14px;
        }
        .pm-metric-value {
          font-family: 'Cormorant Garamond', serif; font-size: 26px; font-weight: 600;
          color: var(--ink); letter-spacing: -0.5px;
        }
        .pm-faq-list { margin-top: 40px; }
        .pm-faq-item { border-bottom: 1px solid var(--hairline); }
        .pm-faq-q {
          display: flex; align-items: center; justify-content: space-between;
          padding: 26px 0; cursor: pointer; background: none; border: none;
          width: 100%; text-align: left; color: var(--ink);
          font-family: 'Cormorant Garamond', serif; font-size: 22px; font-weight: 500;
          transition: color 0.2s;
        }
        .pm-faq-q:hover { color: var(--gold); }
        .pm-faq-toggle {
          font-family: 'DM Sans', sans-serif; font-size: 22px; font-weight: 300;
          color: var(--gold); flex-shrink: 0; margin-left: 20px; transition: transform 0.25s;
        }
        .pm-faq-a {
          padding: 0 0 28px; font-size: 16px; line-height: 1.72;
          color: var(--ink-soft); max-width: 65ch;
          font-family: 'DM Sans', sans-serif;
        }
        .pm-ai-section {
          background: var(--cream-alt);
          border-top: 1px solid var(--hairline);
          border-bottom: 1px solid var(--hairline);
        }
        .pm-sub-box { max-width: 520px; margin: 40px auto 0; text-align: center; }
        .pm-sub-row {
          display: flex; gap: 0; margin-top: 24px;
          border: 1px solid var(--ink);
        }
        .pm-sub-input {
          flex: 1; font-family: 'DM Sans', sans-serif; font-size: 14px;
          padding: 15px 18px; background: var(--cream);
          border: none; color: var(--ink); outline: none;
        }
        .pm-sub-input::placeholder { color: var(--muted-warm); }
        .pm-sub-btn {
          font-family: 'DM Sans', sans-serif; font-size: 11px; font-weight: 600;
          letter-spacing: 1.4px; text-transform: uppercase;
          color: var(--cream); background: var(--ink);
          border: none; padding: 15px 24px;
          cursor: pointer; transition: all 0.2s; white-space: nowrap;
        }
        .pm-sub-btn:hover { background: var(--gold); color: var(--ink); }
        .pm-sub-note { font-size: 12px; color: var(--muted-warm); margin-top: 14px; }
        .pm-footer {
          max-width: 1080px; margin: 0 auto; padding: 56px 32px;
          display: flex; justify-content: space-between; align-items: center;
          flex-wrap: wrap; gap: 20px;
        }
        .pm-footer-left { font-size: 11px; letter-spacing: 1px; text-transform: uppercase; color: var(--muted-warm); }
        .pm-footer-links { display: flex; gap: 24px; }
        .pm-footer-link {
          font-size: 11px; letter-spacing: 1px; text-transform: uppercase;
          color: var(--muted-warm); background: none;
          border: none; cursor: pointer; transition: color 0.2s;
        }
        .pm-footer-link:hover { color: var(--gold); }
        .pm-closing {
          background: var(--ink); padding: 140px 32px 100px; text-align: center;
        }
        .pm-closing-inner { max-width: 640px; margin: 0 auto; }
        .pm-closing-line {
          font-family: 'Cormorant Garamond', serif;
          font-size: clamp(20px, 2.2vw, 24px); font-style: italic;
          color: var(--cream-on-dark); line-height: 1.55;
          margin-bottom: 18px; font-weight: 400;
        }
        .pm-closing-rule {
          width: 80px; height: 1px; background: var(--gold);
          margin: 40px auto;
        }
        .pm-closing-tag {
          font-family: 'DM Sans', sans-serif;
          font-size: 11px; font-weight: 500; letter-spacing: 3px;
          text-transform: uppercase; color: var(--gold);
          line-height: 1.9;
        }
        @keyframes fadeUp {
          from { opacity: 0; transform: translateY(20px); }
          to { opacity: 1; transform: translateY(0); }
        }
        @media (prefers-reduced-motion: reduce) {
          .pm-hero-overline, .pm-hero-title, .pm-hero-quote, .pm-hero-ctas, .pm-hero-cover {
            opacity: 1 !important; animation: none !important;
          }
        }
        a[target="_blank"]:hover { text-decoration: underline !important; }
        ::-webkit-scrollbar { width: 6px; }
        ::-webkit-scrollbar-track { background: var(--cream-alt); }
        ::-webkit-scrollbar-thumb { background: rgba(194,164,91,0.4); border-radius: 3px; }
        @media (max-width: 640px) {
          .pm-metrics-grid { grid-template-columns: repeat(2, 1fr); }
          .pm-sub-row { flex-direction: column; }
          .pm-footer { flex-direction: column; text-align: center; }
          .pm-closing { padding: 80px 20px 64px; }
        }
      `}</style>
      {/* NAV */}
      <nav className="pm-nav">
        <div className="pm-nav-inner">
          <div className="pm-nav-brand" onClick={() => scrollTo("hero")}>
            <span className="pm-nav-brand-text">Productive Money</span>
            <span className="pm-nav-brand-sub">{" \u2014 "}<a href="https://www.etherealize.io" target="_blank" rel="noopener noreferrer" style={{ color: "inherit", textDecoration: "none" }}>Etherealize</a></span>
          </div>
          <div className={`pm-nav-links ${menuOpen ? 'open' : ''}`}>
            {NAV_LINKS.map(l => (
              <button key={l.label}
                className={`pm-nav-link ${activeSection === l.href.slice(1) ? 'active' : ''}`}
                onClick={() => scrollTo(l.href.slice(1))}
              >{l.label}</button>
            ))}
            <a className="pm-nav-cta" href="/productivemoney.pdf" target="_blank" rel="noopener noreferrer" style={{ textDecoration: "none", display: "inline-block" }}>Read the Report</a>
          </div>
          <button className="pm-mobile-btn" onClick={() => setMenuOpen(!menuOpen)}>
            {menuOpen ? "\u2715" : "\u2630"}
          </button>
        </div>
      </nav>
      {/* HERO */}
      <section className="pm-hero" id="hero">
        <div className="pm-hero-overline">
          <a href="https://www.etherealize.io" target="_blank" rel="noopener noreferrer" style={{ color: "inherit", textDecoration: "none" }}>Etherealize Research</a>
          {" · April 2026"}
        </div>
        <h1 className="pm-hero-title">
          Ethereum and the Era of <span className="pm-hero-title-accent">Productive Money</span>
        </h1>
        <div className="pm-hero-cover-wrap">
          <picture>
            <source srcSet="/cover.webp" type="image/webp" />
            <img
              className="pm-hero-cover"
              src="/cover.jpg"
              width="900"
              height="1074"
              alt="Ethereum diamond with green sprout and golden roots — Productive Money cover"
              fetchPriority="high"
              decoding="async"
            />
          </picture>
        </div>
        <p className="pm-hero-quote">
          The case for ETH as a superior monetary good{"\u2014"}and how, if it captures the monetary premium currently held by gold and bitcoin, the implied long-term price could exceed $250,000 per token.
        </p>
        <div className="pm-hero-ctas">
          <a className="pm-btn-primary" href="/productivemoney.pdf" target="_blank" rel="noopener noreferrer" style={{ textDecoration: "none", display: "inline-block" }}>Read the Report</a>
        </div>
      </section>

      {/* PATH-TO-TARGET CHART */}
      <section className="pm-chart-section">
        <PathToTarget />
      </section>
      <div className="pm-divider"><div className="pm-divider-line" /></div>
      {/* EXEC SUMMARY */}
      <ThesisParagraph onReadMore={() => window.open("/productivemoney.pdf", "_blank", "noopener,noreferrer")} />
      <div className="pm-divider"><div className="pm-divider-line" /></div>
      {/* MENGER COMPARISON MATRIX */}
      <section className="pm-section-wide" id="comparison">
        <div className="pm-comparison-header">
          <div className="pm-label">Monetary Attributes</div>
          <div className="pm-label-rule" />
          <h2 className="pm-heading pm-heading-xl">ETH vs. Gold vs. <em>Bitcoin</em></h2>
          <p className="pm-comparison-intro">
            In 1892, Carl Menger argued that money emerges from goods that excel across a composite of attributes{"\u2014"}scarcity, fungibility, durability, censorship resistance, and others. ETH wins on every measure that matters, and concedes the one that time itself will resolve.
          </p>
        </div>
        <ComparisonTable />
      </section>
      <div className="pm-divider"><div className="pm-divider-line" /></div>
      {/* COMPOUNDING VISUALIZATION */}
      <section className="pm-section-wide" id="compounding">
        <div className="pm-label">The Core Insight</div>
        <div className="pm-label-rule" />
        <h2 className="pm-heading">Dead Capital vs. <em>Productive Money</em></h2>
        <p style={{ fontSize: "14px", color: "var(--muted-warmer)", lineHeight: 1.6, marginBottom: "32px", fontFamily: "'DM Sans', sans-serif" }}>
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
        <div className="pm-label-rule" />
        <h2 className="pm-heading">Objections & <em>Responses</em></h2>
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
        <div className="pm-label-rule" />
        <h2 className="pm-heading pm-heading-plain">Why Productive Money?</h2>
        <div className="pm-body pm-about-body">
          <p>
            {"Bitcoin has \u201Cdigital gold.\u201D Two words, universally understood. Ethereum has ultrasound money, world computer, digital oil, programmable money\u2014a new metaphor every six months, each competing with the last. Ask an outsider what ETH is and the Ethereum community gives six answers. Bitcoin gives one."}
          </p>
          <p>
            {"Productive money resolves this. The store-of-value camp says ETH is money. The utility camp says ETH derives its value from usage. Both are right, and both are incomplete, because they describe the same mechanism from different ends. Ethereum\u2019s utility strengthens ETH\u2019s monetary properties: transactions burn supply, staking generates yield, and collateral demand grows with the asset base secured on-chain. ETH\u2019s monetary premium strengthens the network\u2019s utility: under proof of stake, a more valuable ETH funds a larger security budget, which lets Ethereum secure more assets, which attracts institutional adoption, which drives usage. Each side compounds the other. Productive money is the Schelling point where the two converge."}
          </p>
          <Flywheel />
        </div>
      </section>
      <div className="pm-divider"><div className="pm-divider-line" /></div>
      {/* AI SECTION */}
      <section className="pm-ai-section" id="ai">
        <div className="pm-section">
          <div className="pm-label">Read More</div>
          <div className="pm-label-rule" />
          <h2 className="pm-heading">Productive Money in the <em>Exponential Age</em></h2>
          <div className="pm-body">
            <p>
              If AI represents the most significant technological shift since electricity, then the question of where AI agents store and transfer value is central. AI agents cannot open bank accounts. They cannot pass KYC. But they can hold ETH. They can stake it. They can transact permissionlessly, 24 hours a day.
            </p>
            <p>
              {"As autonomous economic agents proliferate, the demand for programmable, self-custodied money will grow in proportion to their intelligence. Productive money is not just a thesis about human economic behavior\u2014it is a thesis about machine economic behavior. "}
              <a href="https://x.com/Etherealize_io/status/2042284300029345910" target="_blank" rel="noopener noreferrer" className="pm-accent-text">Read the full essay.</a>
            </p>
          </div>
        </div>
      </section>
      {/* SUBSCRIBE */}
      <section className="pm-section" id="subscribe">
        <SubscribeBox />
      </section>
      {/* CLOSING */}
      <section className="pm-closing">
        <div className="pm-closing-inner">
          <p className="pm-closing-line">If you own one ounce of gold for an eternity, you will still own one ounce at its end.</p>
          <p className="pm-closing-line">If you own one bitcoin for an eternity, you will still own one bitcoin at its end.</p>
          <p className="pm-closing-line">If you stake one ETH for an eternity, you will own considerably more ETH at its end.</p>
          <div className="pm-closing-rule" />
          <p className="pm-closing-tag">Every prior path to that outcome<br/>required surrendering your money to a counterparty.<br/>ETH is the first money that compounds<br/>while it remains in your hands.</p>
        </div>
      </section>
      {/* ABOUT ETHEREALIZE */}
      <section className="pm-section" id="about-etherealize">
        <h2 className="pm-heading pm-heading-plain">About Etherealize</h2>
        <div className="pm-body pm-about-body">
          <p>
            Etherealize is building the next generation of financial infrastructure on Ethereum{"\u2014"}trading, settlement, and privacy systems designed to move trillions in assets onchain. The firm works directly with banks, asset managers, sovereigns, and hedge funds to bring Ethereum into institutional portfolios, and represents Ethereum in Washington across the Treasury, SEC, Congress, and the White House.
          </p>
          <p>
            Etherealize was co-founded by Vivek Raman and Danny Ryan. Danny Ryan was a core researcher at the Ethereum Foundation, where he led the coordination of Ethereum{"\u2019"}s transition to proof of stake.
          </p>
          <p>
            This paper was produced in collaboration with Bitmine, with Tom Lee of Fundstrat serving as an advisor.
          </p>
          <p>
            To learn more about Etherealize, visit <a className="pm-quiet-link" href="https://etherealize.com" target="_blank" rel="noopener noreferrer">etherealize.com</a>.
          </p>
        </div>
      </section>
      <ShareFab />
    </div>
    </MarketDataProvider>
  );
}
