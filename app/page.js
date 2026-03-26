"use client";

import { useState, useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
const NAV_LINKS = [
  { label: "Thesis", href: "#thesis" },
  { label: "Dashboard", href: "#dashboard" },
  { label: "FAQ", href: "#faq" },
  { label: "About", href: "#about" },
  { label: "AI & ETH", href: "#ai" },
];
const FAQ_DATA = [
  {
    q: "Why not Solana?",
    a: "Solana optimizes for speed at the cost of decentralization. Its validator set is small and hardware requirements are high, making it structurally dependent on a narrow set of operators. For a monetary asset competing for a $36 trillion premium, the security model must be credibly neutral and resistant to capture. Solana is a fast database. Ethereum is a settlement layer."
  },
  {
    q: "Why not Cardano?",
    a: "Cardano has not produced a meaningful DeFi ecosystem. The intrinsic value floor argument depends on real economic activity generating real fees. Cardano's TVL is a rounding error relative to Ethereum's. Without the flywheel of usage → fees → burn → scarcity, the monetary premium argument has no foundation."
  },
  {
    q: "Why not XRP / Ripple?",
    a: "XRP is a centrally controlled token distributed by a corporation. It fails the most basic test of monetary credibility: permissionlessness. The XRP Ledger's consensus mechanism relies on a curated list of trusted validators. This is not money—it's a corporate payment rail with a token attached."
  },
  {
    q: "Isn't ETH just a tech stock?",
    a: "ETH is a bearer instrument—whoever holds it, owns it. It has no board of directors, no earnings calls, no CEO. It cannot be diluted by share issuance or debased by management decisions. It is programmable, self-custodied, censorship-resistant money that also generates yield. The S&P 500 is a wonderful productive asset, but it is not money. ETH is both."
  },
  {
    q: "What about Ethereum's scaling challenges?",
    a: "Ethereum's rollup-centric roadmap is already working. L2s like Arbitrum, Optimism, and Base settle on Ethereum while offering sub-cent transaction costs. L2 activity still requires ETH for gas, still generates fees that burn ETH, and still uses ETH as collateral. Scaling doesn't dilute ETH's monetary properties—it amplifies total fee generation."
  },
  {
    q: "What if governments ban DeFi?",
    a: "This is a real risk. But the U.S. has approved spot ETH ETFs with staking. BlackRock is building on Ethereum. The regulatory trajectory is toward integration, not prohibition. Even in a hostile environment, Ethereum's permissionless nature means it cannot be shut down—only pushed offshore."
  },
  {
    q: "How is staking yield different from a bond?",
    a: "A bond is a loan to a counterparty. If the counterparty defaults, you lose your principal. Staking is not lending—there is no borrower. You lock ETH into the protocol's consensus mechanism and earn yield from issuance and transaction fees. The ETH remains yours. The risk is protocol risk (slashing, bugs), not counterparty risk."
  },
];
function EthDiamond({ size = 32 }) {
  return (
    <svg width={size} height={size * 1.63} viewBox="0 0 256 417" fill="none">
      <path d="M127.961 0L125.166 9.5V285.168L127.961 287.958L255.923 212.32L127.961 0Z" fill="rgba(130,148,252,0.6)" />
      <path d="M127.962 0L0 212.32L127.962 287.958V154.158V0Z" fill="rgba(130,148,252,0.9)" />
      <path d="M127.961 312.187L126.386 314.106V412.306L127.961 416.905L255.999 236.587L127.961 312.187Z" fill="rgba(130,148,252,0.6)" />
      <path d="M127.962 416.905V312.187L0 236.587L127.962 416.905Z" fill="rgba(130,148,252,0.9)" />
      <path d="M127.961 287.958L255.921 212.32L127.961 154.159V287.958Z" fill="rgba(80,100,200,0.7)" />
      <path d="M0.001 212.32L127.961 287.958V154.159L0.001 212.32Z" fill="rgba(130,148,252,0.5)" />
    </svg>
  );
}
function CompoundingChart() {
  const chartRef = useRef(null);
  const [animated, setAnimated] = useState(false);
  const [hoverYear, setHoverYear] = useState(null);
  useEffect(() => {
    const observer = new IntersectionObserver(
      ([entry]) => { if (entry.isIntersecting && !animated) setAnimated(true); },
      { threshold: 0.3 }
    );
    if (chartRef.current) observer.observe(chartRef.current);
    return () => observer.disconnect();
  }, [animated]);
  const YEARS = 30;
  const RATE = 0.032;
  const W = 720;
  const H = 340;
  const PAD = { top: 40, right: 80, bottom: 50, left: 60 };
  const plotW = W - PAD.left - PAD.right;
  const plotH = H - PAD.top - PAD.bottom;
  const ethData = Array.from({ length: YEARS + 1 }, (_, i) => 100 * Math.pow(1 + RATE, i));
  const maxVal = ethData[YEARS];
  const yMax = Math.ceil(maxVal / 50) * 50;
  const xScale = (year) => PAD.left + (year / YEARS) * plotW;
  const yScale = (val) => PAD.top + plotH - ((val / yMax) * plotH);
  const ethPath = ethData.map((v, i) => `${i === 0 ? 'M' : 'L'}${xScale(i).toFixed(1)},${yScale(v).toFixed(1)}`).join(' ');
  const flatPath = `M${xScale(0).toFixed(1)},${yScale(100).toFixed(1)} L${xScale(YEARS).toFixed(1)},${yScale(100).toFixed(1)}`;
  const ethArea = ethPath + ` L${xScale(YEARS).toFixed(1)},${yScale(0).toFixed(1)} L${xScale(0).toFixed(1)},${yScale(0).toFixed(1)} Z`;
  const ethPathLength = 1200;
  const yTicks = [];
  for (let v = 0; v <= yMax; v += 50) yTicks.push(v);
  const xTicks = [0, 5, 10, 15, 20, 25, 30];
  return (
    <div ref={chartRef} style={{
      background: "#0d0e20", borderRadius: "8px", overflow: "hidden",
      border: "1px solid rgba(130,148,252,0.08)", padding: "32px 16px 20px"
    }}>
      <svg
        viewBox={`0 0 ${W} ${H}`}
        style={{ width: "100%", height: "auto", display: "block" }}
        onMouseMove={(e) => {
          const svg = e.currentTarget;
          const rect = svg.getBoundingClientRect();
          const svgX = ((e.clientX - rect.left) / rect.width) * W;
          const year = Math.round(((svgX - PAD.left) / plotW) * YEARS);
          if (year >= 0 && year <= YEARS) setHoverYear(year);
          else setHoverYear(null);
        }}
        onMouseLeave={() => setHoverYear(null)}
      >
        <defs>
          <linearGradient id="ethAreaGrad" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="rgba(130,148,252,0.15)" />
            <stop offset="100%" stopColor="rgba(130,148,252,0)" />
          </linearGradient>
          <filter id="glow">
            <feGaussianBlur stdDeviation="3" result="blur" />
            <feMerge><feMergeNode in="blur" /><feMergeNode in="SourceGraphic" /></feMerge>
          </filter>
        </defs>
        {yTicks.map(v => (
          <line key={v} x1={PAD.left} x2={W - PAD.right}
            y1={yScale(v)} y2={yScale(v)}
            stroke="rgba(130,148,252,0.06)" strokeWidth="1" />
        ))}
        {yTicks.map(v => (
          <text key={v} x={PAD.left - 12} y={yScale(v) + 4}
            fill="#5a5b78" fontSize="11" fontFamily="'JetBrains Mono', monospace"
            textAnchor="end">{v}</text>
        ))}
        {xTicks.map(yr => (
          <text key={yr} x={xScale(yr)} y={H - PAD.bottom + 24}
            fill="#5a5b78" fontSize="11" fontFamily="'JetBrains Mono', monospace"
            textAnchor="middle">Yr {yr}</text>
        ))}
        <path d={ethArea} fill="url(#ethAreaGrad)"
          style={{
            opacity: animated ? 1 : 0,
            transition: "opacity 1s ease 0.8s"
          }} />
        <path d={flatPath} fill="none" stroke="#c9a84c" strokeWidth="2"
          strokeDasharray={animated ? "6,4" : "0,9999"}
          style={{ transition: "stroke-dasharray 1.5s ease 0.3s" }} />
        <path d={flatPath} fill="none" stroke="#f7931a" strokeWidth="2"
          strokeDasharray={animated ? "6,4" : "0,9999"}
          style={{ transition: "stroke-dasharray 1.5s ease 0.5s" }} />
        <path d={ethPath} fill="none" stroke="#8294fc" strokeWidth="2.5"
          filter="url(#glow)"
          strokeDasharray={ethPathLength}
          strokeDashoffset={animated ? 0 : ethPathLength}
          style={{ transition: `stroke-dashoffset 2.5s ease 0.6s` }} />
        <text x={W - PAD.right + 10} y={yScale(100) - 12}
          fill="#c9a84c" fontSize="11" fontFamily="'JetBrains Mono', monospace"
          style={{ opacity: animated ? 1 : 0, transition: "opacity 0.5s ease 2s" }}>
          Gold
        </text>
        <text x={W - PAD.right + 10} y={yScale(100) + 4}
          fill="#c9a84c" fontSize="10" fontFamily="'JetBrains Mono', monospace"
          style={{ opacity: animated ? 1 : 0, transition: "opacity 0.5s ease 2s" }}>
          100 oz
        </text>
        <text x={W - PAD.right + 10} y={yScale(100) + 22}
          fill="#f7931a" fontSize="11" fontFamily="'JetBrains Mono', monospace"
          style={{ opacity: animated ? 1 : 0, transition: "opacity 0.5s ease 2.1s" }}>
          Bitcoin
        </text>
        <text x={W - PAD.right + 10} y={yScale(100) + 36}
          fill="#f7931a" fontSize="10" fontFamily="'JetBrains Mono', monospace"
          style={{ opacity: animated ? 1 : 0, transition: "opacity 0.5s ease 2.1s" }}>
          100 BTC
        </text>
        <text x={W - PAD.right + 10} y={yScale(ethData[YEARS]) - 6}
          fill="#8294fc" fontSize="11" fontFamily="'JetBrains Mono', monospace"
          fontWeight="600"
          style={{ opacity: animated ? 1 : 0, transition: "opacity 0.5s ease 2.8s" }}>
          ETH
        </text>
        <text x={W - PAD.right + 10} y={yScale(ethData[YEARS]) + 8}
          fill="#8294fc" fontSize="10" fontFamily="'JetBrains Mono', monospace"
          style={{ opacity: animated ? 1 : 0, transition: "opacity 0.5s ease 2.8s" }}>
          {ethData[YEARS].toFixed(0)} ETH
        </text>
        {hoverYear !== null && (
          <>
            <line x1={xScale(hoverYear)} x2={xScale(hoverYear)}
              y1={PAD.top} y2={H - PAD.bottom}
              stroke="rgba(130,148,252,0.2)" strokeWidth="1" strokeDasharray="4,3" />
            <circle cx={xScale(hoverYear)} cy={yScale(ethData[hoverYear])}
              r="4" fill="#8294fc" stroke="#0d0e20" strokeWidth="2" />
            <circle cx={xScale(hoverYear)} cy={yScale(100)}
              r="3" fill="#c9a84c" stroke="#0d0e20" strokeWidth="2" />
            <rect x={xScale(hoverYear) - 52} y={yScale(ethData[hoverYear]) - 32}
              width="104" height="24" rx="4" fill="rgba(5,5,16,0.9)"
              stroke="rgba(130,148,252,0.2)" strokeWidth="1" />
            <text x={xScale(hoverYear)} y={yScale(ethData[hoverYear]) - 16}
              fill="#a0b0ff" fontSize="11" fontFamily="'JetBrains Mono', monospace"
              textAnchor="middle" fontWeight="500">
              Yr {hoverYear}: {ethData[hoverYear].toFixed(1)} ETH
            </text>
          </>
        )}
      </svg>
      <div style={{
        display: "flex", justifyContent: "center", gap: "32px", flexWrap: "wrap",
        marginTop: "16px", paddingTop: "16px",
        borderTop: "1px solid rgba(130,148,252,0.06)"
      }}>
        <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
          <div style={{ width: "16px", height: "2px", background: "#c9a84c" }} />
          <span style={{ fontSize: "12px", color: "#5a5b78" }}>Gold (0% yield)</span>
        </div>
        <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
          <div style={{ width: "16px", height: "2px", background: "#f7931a" }} />
          <span style={{ fontSize: "12px", color: "#5a5b78" }}>Bitcoin (0% yield)</span>
        </div>
        <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
          <div style={{ width: "16px", height: "2px", background: "#8294fc" }} />
          <span style={{ fontSize: "12px", color: "#5a5b78" }}>ETH staked (3.2% compound)</span>
        </div>
      </div>
      <div style={{
        textAlign: "center", marginTop: "12px",
        fontFamily: "'EB Garamond', serif", fontSize: "14px", fontStyle: "italic", color: "#5a5b78"
      }}>
        Assumes 3.2% staking yield compounded annually. No counterparty risk. Hover for details.
      </div>
    </div>
  );
}
function PathToTarget() {
  const ref = useRef(null);
  const [visible, setVisible] = useState(false);
  const [hoveredIdx, setHoveredIdx] = useState(null);
  useEffect(() => {
    const observer = new IntersectionObserver(
      ([entry]) => { if (entry.isIntersecting) setVisible(true); },
      { threshold: 0.15 }
    );
    if (ref.current) observer.observe(ref.current);
    return () => observer.disconnect();
  }, []);
  const milestones = [
    { price: 2034, label: "Today", tag: "$2,034", mcap: "$245B", color: "#5a5b78", desc: "Current price" },
    { price: 11667, label: "Bitcoin parity", tag: "$11,667", mcap: "$1.4T", color: "#f7931a", desc: "Absorbs BTC premium" },
    { price: 291667, label: "Gold parity", tag: "$291,667", mcap: "$35T", color: "#c9a84c", desc: "Absorbs gold premium" },
    { price: 303333, label: "Gold + Bitcoin", tag: "$303,333", mcap: "$36.4T", color: "#8294fc", desc: "Absorbs combined premium" },
  ];
  const W = 760;
  const H = 420;
  const PAD = { top: 60, right: 24, bottom: 50, left: 90 };
  const plotW = W - PAD.left - PAD.right;
  const plotH = H - PAD.top - PAD.bottom;
  const logMin = Math.log10(1500);
  const logMax = Math.log10(400000);
  const yScale = (price) => PAD.top + plotH - ((Math.log10(price) - logMin) / (logMax - logMin)) * plotH;
  const xScale = (i) => PAD.left + ((i) / (milestones.length - 1)) * plotW;
  const points = milestones.map((m, i) => ({ x: xScale(i), y: yScale(m.price) }));
  const buildPath = (pts) => {
    let d = `M${pts[0].x},${pts[0].y}`;
    for (let i = 1; i < pts.length; i++) {
      const prev = pts[i - 1];
      const curr = pts[i];
      const cpx1 = prev.x + (curr.x - prev.x) * 0.5;
      const cpy1 = prev.y;
      const cpx2 = prev.x + (curr.x - prev.x) * 0.5;
      const cpy2 = curr.y;
      d += ` C${cpx1},${cpy1} ${cpx2},${cpy2} ${curr.x},${curr.y}`;
    }
    return d;
  };
  const linePath = buildPath(points);
  const areaPath = linePath + ` L${points[points.length-1].x},${yScale(1500)} L${points[0].x},${yScale(1500)} Z`;
  const pathLength = 1400;
  const yLabels = [2000, 5000, 10000, 50000, 100000, 300000];
  return (
    <div ref={ref} style={{
      background: "#0d0e20", borderRadius: "8px", overflow: "hidden",
      border: "1px solid rgba(130,148,252,0.08)", padding: "16px 8px 12px",
    }}>
      <svg viewBox={`0 0 ${W} ${H}`} style={{ width: "100%", height: "auto", display: "block" }}
        onMouseLeave={() => setHoveredIdx(null)}>
        <defs>
          <linearGradient id="pathGrad" x1="0" y1="0" x2="1" y2="0">
            <stop offset="0%" stopColor="#5a5b78" />
            <stop offset="30%" stopColor="#f7931a" />
            <stop offset="85%" stopColor="#c9a84c" />
            <stop offset="100%" stopColor="#8294fc" />
          </linearGradient>
          <linearGradient id="areaGrad" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="rgba(130,148,252,0.12)" />
            <stop offset="100%" stopColor="rgba(130,148,252,0)" />
          </linearGradient>
          <filter id="dotGlow">
            <feGaussianBlur stdDeviation="4" result="blur" />
            <feMerge><feMergeNode in="blur" /><feMergeNode in="SourceGraphic" /></feMerge>
          </filter>
          <filter id="lineGlow">
            <feGaussianBlur stdDeviation="2.5" result="blur" />
            <feMerge><feMergeNode in="blur" /><feMergeNode in="SourceGraphic" /></feMerge>
          </filter>
        </defs>
        {yLabels.map(p => (
          <g key={p}>
            <line x1={PAD.left} x2={W - PAD.right}
              y1={yScale(p)} y2={yScale(p)}
              stroke="rgba(130,148,252,0.05)" strokeWidth="1" />
            <text x={PAD.left - 14} y={yScale(p) + 4}
              fill="#3a3b50" fontSize="10" fontFamily="'JetBrains Mono', monospace"
              textAnchor="end">
              {p >= 1000 ? `$${(p/1000).toFixed(0)}K` : `$${p}`}
            </text>
          </g>
        ))}
        <path d={areaPath} fill="url(#areaGrad)"
          style={{ opacity: visible ? 1 : 0, transition: "opacity 0.8s ease 1s" }} />
        <path d={linePath} fill="none" stroke="url(#pathGrad)" strokeWidth="3"
          filter="url(#lineGlow)"
          strokeLinecap="round"
          strokeDasharray={pathLength}
          strokeDashoffset={visible ? 0 : pathLength}
          style={{ transition: `stroke-dashoffset 2.5s cubic-bezier(0.16, 1, 0.3, 1) 0.3s` }}
        />
        {milestones.map((m, i) => {
          const x = xScale(i);
          const y = yScale(m.price);
          const isLast = i === milestones.length - 1;
          const isHovered = hoveredIdx === i;
          const delay = 0.5 + i * 0.5;
          const labelAbove = i < 2;
          return (
            <g key={i}
              onMouseEnter={() => setHoveredIdx(i)}
              style={{ cursor: "default" }}
            >
              <line x1={x} x2={x} y1={H - PAD.bottom} y2={y}
                stroke={m.color} strokeWidth="1" strokeDasharray="3,4" opacity="0.25"
                style={{
                  opacity: visible ? 0.25 : 0,
                  transition: `opacity 0.4s ease ${delay}s`,
                }} />
              <circle cx={x} cy={y} r={isLast ? 7 : 5}
                fill={m.color}
                filter={isLast ? "url(#dotGlow)" : undefined}
                style={{
                  opacity: visible ? 1 : 0,
                  transition: `opacity 0.3s ease ${delay}s`,
                  transform: isHovered ? "scale(1.4)" : "scale(1)",
                  transformOrigin: `${x}px ${y}px`,
                  transitionProperty: "opacity, transform",
                }} />
              <circle cx={x} cy={y} r={isLast ? 7 : 5}
                fill="none" stroke={m.color} strokeWidth="1.5" opacity="0.3"
                style={{
                  opacity: visible ? 0.3 : 0,
                  transition: `opacity 0.3s ease ${delay}s`,
                  transform: isHovered ? "scale(2)" : "scale(1)",
                  transformOrigin: `${x}px ${y}px`,
                  transitionProperty: "opacity, transform",
                }} />
              <g style={{
                opacity: visible ? 1 : 0,
                transition: `opacity 0.4s ease ${delay + 0.2}s`,
              }}>
                <rect
                  x={x - (isLast ? 56 : 46)} y={labelAbove ? y - 44 : y + 14}
                  width={isLast ? 112 : 92} height={isLast ? 28 : 24}
                  rx="4" fill="rgba(5,5,16,0.9)"
                  stroke={isHovered ? m.color : "rgba(130,148,252,0.15)"}
                  strokeWidth="1"
                />
                <text x={x} y={labelAbove ? y - 27 : y + 31}
                  fill={isLast ? "#a0b0ff" : "#e4e4ef"}
                  fontSize={isLast ? "14" : "12"} fontWeight={isLast ? "600" : "500"}
                  fontFamily="'JetBrains Mono', monospace"
                  textAnchor="middle">
                  {m.tag}
                </text>
                <text x={x} y={labelAbove ? y - 52 : y + 48}
                  fill={m.color} fontSize="9" fontWeight="500"
                  fontFamily="'Inter', sans-serif"
                  textAnchor="middle" letterSpacing="1"
                  style={{ textTransform: "uppercase" }}>
                  {m.label}
                </text>
              </g>
              {isHovered && (
                <g>
                  <rect x={x - 60} y={y + (labelAbove ? 14 : -44)}
                    width="120" height="22" rx="4"
                    fill="rgba(5,5,16,0.95)" stroke="rgba(130,148,252,0.2)" strokeWidth="1" />
                  <text x={x} y={y + (labelAbove ? 29 : -29)}
                    fill="#8b8ca7" fontSize="10"
                    fontFamily="'JetBrains Mono', monospace"
                    textAnchor="middle">
                    MCap: {m.mcap}
                  </text>
                </g>
              )}
              <text x={x} y={H - PAD.bottom + 20}
                fill="#3a3b50" fontSize="10"
                fontFamily="'Inter', sans-serif" textAnchor="middle"
                style={{
                  opacity: visible ? 1 : 0,
                  transition: `opacity 0.4s ease ${delay}s`,
                }}>
                {m.label}
              </text>
            </g>
          );
        })}
      </svg>
      <div style={{
        textAlign: "center", padding: "4px 20px 8px",
        fontFamily: "'EB Garamond', serif", fontSize: "14px", fontStyle: "italic", color: "#5a5b78"
      }}>
        Not a price prediction. The arithmetic of what ETH would be worth if it captured each monetary premium. Hover for details.
      </div>
    </div>
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
          text-transform: uppercase; color: #5a5b78; margin-left: 2px;
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
        .pm-hero-title-accent {
          background: linear-gradient(135deg, #8294fc, #b8c4ff);
          -webkit-background-clip: text; -webkit-text-fill-color: transparent;
          background-clip: text;
        }
        .pm-hero-subtitle {
          font-family: 'EB Garamond', serif;
          font-size: clamp(17px, 2.2vw, 22px);
          font-weight: 400; line-height: 1.65; color: #8b8ca7;
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
          text-transform: uppercase; color: #5a5b78;
        }
        .pm-hero-brand-sep { width: 1px; height: 16px; background: rgba(130,148,252,0.2); }
        .pm-section { max-width: 780px; margin: 0 auto; padding: 120px 32px; }
        .pm-section-wide { max-width: 1100px; margin: 0 auto; padding: 120px 32px; }
        .pm-label {
          font-size: 11px; font-weight: 600; letter-spacing: 3px;
          text-transform: uppercase; color: #8294fc; margin-bottom: 20px;
        }
        .pm-heading {
          font-size: clamp(28px, 3.5vw, 42px);
          font-weight: 700; line-height: 1.2; letter-spacing: -0.5px;
          color: #fff; margin-bottom: 32px;
        }
        .pm-body {
          font-family: 'EB Garamond', serif;
          font-size: 19px; line-height: 1.78; color: #8b8ca7;
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
          font-size: 10px; font-weight: 500; letter-spacing: 1.2px;
          text-transform: uppercase; color: #5a5b78; margin-bottom: 12px;
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
          font-family: 'Inter', sans-serif; font-size: 17px; font-weight: 500;
          transition: color 0.2s;
        }
        .pm-faq-q:hover { color: #a0b0ff; }
        .pm-faq-toggle {
          font-family: 'JetBrains Mono', monospace; font-size: 20px;
          color: #8294fc; flex-shrink: 0; margin-left: 20px; transition: transform 0.25s;
        }
        .pm-faq-a {
          padding: 0 0 24px; font-size: 15px; line-height: 1.7;
          color: #8b8ca7; max-width: 700px;
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
        .pm-sub-input::placeholder { color: #5a5b78; }
        .pm-sub-input:focus { border-color: #8294fc; background: rgba(130,148,252,0.04); }
        .pm-sub-btn {
          font-family: 'Inter', sans-serif; font-size: 13px; font-weight: 600;
          color: #050510; background: #8294fc;
          border: 1px solid #8294fc; padding: 14px 24px;
          cursor: pointer; transition: all 0.2s; white-space: nowrap;
          border-radius: 0 4px 4px 0;
        }
        .pm-sub-btn:hover { background: #a0b0ff; }
        .pm-sub-note { font-size: 12px; color: #5a5b78; margin-top: 14px; }
        .pm-footer {
          max-width: 1100px; margin: 0 auto; padding: 56px 32px;
          display: flex; justify-content: space-between; align-items: center;
          flex-wrap: wrap; gap: 20px;
        }
        .pm-footer-left { font-size: 12px; color: #5a5b78; }
        .pm-footer-links { display: flex; gap: 20px; }
        .pm-footer-link {
          font-size: 12px; color: #5a5b78; background: none;
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
            <button className="pm-nav-cta">Download PDF</button>
          </div>
          <button className="pm-mobile-btn" onClick={() => setMenuOpen(!menuOpen)}>
            {menuOpen ? "\u2715" : "\u2630"}
          </button>
        </div>
      </nav>
      {/* HERO */}
      <section className="pm-hero" id="hero">
        <div className="pm-hero-overline">An Etherealize x Bitmine Research Paper</div>
        <div className="pm-hero-eth"><EthDiamond size={36} /></div>
        <h1 className="pm-hero-title">
          Ethereum and the Era of<br /><span className="pm-hero-title-accent">Productive Money</span>
        </h1>
        <p className="pm-hero-subtitle">
          {"Ether's monetary properties are superior to gold and Bitcoin. Here's the path to $300,000."}
        </p>
        <div className="pm-hero-ctas">
          <button className="pm-btn-primary" onClick={() => scrollTo("thesis")}>The Thesis</button>
          <button className="pm-btn-ghost" onClick={() => router.push("/paper")}>Read the Whitepaper</button>
          <button className="pm-btn-ghost">Download PDF</button>
        </div>
        <div className="pm-hero-brands">
          <span className="pm-hero-brand">Etherealize</span>
          <div className="pm-hero-brand-sep" />
          <span className="pm-hero-brand">Bitmine</span>
        </div>
      </section>
      <div className="pm-divider"><div className="pm-divider-line" /></div>
      {/* EXEC SUMMARY */}
      <section className="pm-section" id="thesis">
        <div className="pm-label">Executive Summary</div>
        <h2 className="pm-heading">The Thesis in One Paragraph</h2>
        <div className="pm-body">
          <p>
            {"Warren Buffett never held gold. His objection was not about scarcity\u2014he acknowledged gold was scarce. His objection was that scarcity without productivity is economically sterile: \u201CIf you own one ounce of gold for an eternity, you will still own one ounce at its end.\u201D The same criticism applies to Bitcoin. For all of human history, you had to choose: hold money (stable, unproductive) or invest it into productive assets (risky, wealth-generating). The two categories were mutually exclusive. "}
            <span className="pm-accent-text">Ethereum dissolves this distinction.</span>
            {" ETH is the first monetary asset in history\u2014with the possible exception of livestock, which lost the monetary competition precisely because it failed on every other attribute\u2014that is productive and compounds without counterparty risk. When you stake ETH, there is no borrower, no bank, no counterparty. You lock capital into the protocol\u2019s consensus mechanism and earn yield from the network itself. And ETH matches or exceeds gold and Bitcoin on every other critical monetary attribute: scarcity, fungibility, divisibility, portability, durability, and low carrying cost. The combined monetary premium of gold and Bitcoin is approximately $36 trillion. If ETH captured that premium\u2014distributed across roughly 120 million ETH in circulation\u2014the implied price per ETH would be approximately "}
            <span className="pm-accent-text">$300,000</span>
            {". Today it trades around $2,000. This paper argues that the repricing is not only possible, but logically consistent given the monetary properties of ETH."}
          </p>
        </div>
        <div style={{ marginTop: "40px", textAlign: "center" }}>
          <button className="pm-btn-primary" onClick={() => router.push("/paper")}>Read the Whitepaper</button>
        </div>
      </section>
      <div className="pm-divider"><div className="pm-divider-line" /></div>
      {/* MENGER COMPARISON MATRIX */}
      <section className="pm-section-wide" id="comparison">
        <div className="pm-label">Monetary Attributes</div>
        <h2 className="pm-heading">ETH vs. Gold vs. Bitcoin</h2>
        <p style={{ fontSize: "14px", color: "#5a5b78", lineHeight: 1.6, marginBottom: "32px" }}>
          Carl Menger argued that certain goods naturally emerge as money because they excel across a composite of attributes. Here is how ETH compares on every one.
        </p>
        <div style={{
          background: "#0d0e20", borderRadius: "8px", overflow: "hidden",
          border: "1px solid rgba(130,148,252,0.08)"
        }}>
          <table style={{ width: "100%", borderCollapse: "collapse", fontSize: "14px" }}>
            <thead>
              <tr style={{ borderBottom: "1px solid rgba(130,148,252,0.12)" }}>
                <th style={{ padding: "18px 20px", textAlign: "left", fontWeight: 500, color: "#5a5b78", fontSize: "11px", letterSpacing: "1.5px", textTransform: "uppercase" }}>Attribute</th>
                <th style={{ padding: "18px 20px", textAlign: "center", fontWeight: 500, color: "#c9a84c", fontSize: "11px", letterSpacing: "1.5px", textTransform: "uppercase" }}>Gold</th>
                <th style={{ padding: "18px 20px", textAlign: "center", fontWeight: 500, color: "#f7931a", fontSize: "11px", letterSpacing: "1.5px", textTransform: "uppercase" }}>Bitcoin</th>
                <th style={{ padding: "18px 20px", textAlign: "center", fontWeight: 500, color: "#8294fc", fontSize: "11px", letterSpacing: "1.5px", textTransform: "uppercase" }}>ETH</th>
              </tr>
            </thead>
            <tbody>
              {[
                { attr: "Scarcity", gold: "\u25D0", btc: "\u25CF", eth: "\u25CF", note: "ETH burn can make supply deflationary" },
                { attr: "Fungibility", gold: "\u25CF", btc: "\u25D0", eth: "\u25D0", note: "ZK privacy pools give ETH a path forward" },
                { attr: "Divisibility", gold: "\u25D0", btc: "\u25CF", eth: "\u25CF", note: "18 decimal places" },
                { attr: "Portability", gold: "\u25CB", btc: "\u25CF", eth: "\u25CF", note: "Settles globally in seconds" },
                { attr: "Durability", gold: "\u25CF", btc: "\u25D0", eth: "\u25CF", note: "PoS security scales with value" },
                { attr: "Verifiability", gold: "\u25D0", btc: "\u25CF", eth: "\u25CF", note: "Fully auditable on-chain" },
                { attr: "Censorship Resistance", gold: "\u25CB", btc: "\u25D0", eth: "\u25CF", note: "Forced inclusion guarantees" },
                { attr: "Low Carrying Cost", gold: "\u25CB", btc: "\u25D0", eth: "\u25CF", note: "Negative carrying cost via staking" },
                { attr: "Productive / Compounds", gold: "\u25CB", btc: "\u25CB", eth: "\u25CF", note: "~3.2% yield, no counterparty" },
              ].map((row, i) => (
                <tr key={i} style={{ borderBottom: "1px solid rgba(130,148,252,0.06)" }}>
                  <td style={{ padding: "14px 20px" }}>
                    <div style={{ color: "#e4e4ef", fontWeight: 500, marginBottom: "2px" }}>{row.attr}</div>
                    <div style={{ color: "#5a5b78", fontSize: "12px" }}>{row.note}</div>
                  </td>
                  <td style={{ padding: "14px 20px", textAlign: "center", fontSize: "18px", color: row.gold === "\u25CF" ? "#c9a84c" : row.gold === "\u25D0" ? "rgba(201,168,76,0.5)" : "rgba(201,168,76,0.2)" }}>{row.gold}</td>
                  <td style={{ padding: "14px 20px", textAlign: "center", fontSize: "18px", color: row.btc === "\u25CF" ? "#f7931a" : row.btc === "\u25D0" ? "rgba(247,147,26,0.5)" : "rgba(247,147,26,0.2)" }}>{row.btc}</td>
                  <td style={{ padding: "14px 20px", textAlign: "center", fontSize: "18px", color: row.eth === "\u25CF" ? "#8294fc" : row.eth === "\u25D0" ? "rgba(130,148,252,0.5)" : "rgba(130,148,252,0.2)" }}>{row.eth}</td>
                </tr>
              ))}
            </tbody>
          </table>
          <div style={{ padding: "14px 20px", fontSize: "11px", color: "#5a5b78", display: "flex", gap: "20px", borderTop: "1px solid rgba(130,148,252,0.06)" }}>
            <span>{"\u25CF"} Superior</span>
            <span>{"\u25D0"} Adequate</span>
            <span>{"\u25CB"} Weak</span>
          </div>
        </div>
      </section>
      <div className="pm-divider"><div className="pm-divider-line" /></div>
      {/* COMPOUNDING VISUALIZATION */}
      <section className="pm-section-wide" id="compounding">
        <div className="pm-label">The Core Insight</div>
        <h2 className="pm-heading">Dead Capital vs. Productive Money</h2>
        <p style={{ fontSize: "14px", color: "#5a5b78", lineHeight: 1.6, marginBottom: "32px" }}>
          Start with 100 units of each asset. Over 30 years, gold and Bitcoin sit there. ETH compounds.
        </p>
        <CompoundingChart />
      </section>
      <div className="pm-divider"><div className="pm-divider-line" /></div>
      {/* PATH TO $300K */}
      <section className="pm-section-wide" id="dashboard">
        <div className="pm-label">The Arithmetic</div>
        <h2 className="pm-heading">The Path to $300,000</h2>
        <p style={{ fontSize: "14px", color: "#5a5b78", lineHeight: 1.6, marginBottom: "40px" }}>
          If ETH captures the monetary premium currently held by Bitcoin, gold, or both — here is what the price implies. These are not predictions. They are statements about what the math produces if the market agrees with the thesis.
        </p>
        <PathToTarget />
        <div style={{ marginTop: "48px" }}>
          <div style={{ fontSize: "11px", fontWeight: 600, letterSpacing: "3px", textTransform: "uppercase", color: "#8294fc", marginBottom: "20px" }}>
            Key Metrics
          </div>
          <div className="pm-metrics-grid">
            {[
              { label: "ETH Price", value: "$2,034" },
              { label: "ETH Market Cap", value: "$245B" },
              { label: "Staking Yield", value: "3.2%" },
              { label: "Total ETH Staked", value: "34.2M" },
              { label: "% of Supply Staked", value: "28.5%" },
              { label: "DeFi TVL on Ethereum", value: "$52B" },
              { label: "Tokenized RWAs on ETH", value: "65%+" },
              { label: "ETH Burned (Post-Merge)", value: "4.3M" },
            ].map(m => (
              <div key={m.label} className="pm-metric">
                <div className="pm-metric-label">{m.label}</div>
                <div className="pm-metric-value">{m.value}</div>
              </div>
            ))}
          </div>
          <div style={{ fontSize: "11px", color: "#5a5b78", textAlign: "center", marginTop: "12px" }}>
            Illustrative · Live dashboard with real-time data coming soon
          </div>
        </div>
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
          color: "#5a5b78", marginTop: "28px", lineHeight: 1.65
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
  );
}
