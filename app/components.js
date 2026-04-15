"use client";

import { useState, useEffect, useRef, createContext, useContext } from "react";

// ── Shared market data context ──────────────────────────────────────
const GOLD_OZ_ABOVE_GROUND = 6.7e9;
const GOLD_MONETARY_RATIO = 0.9;
const CACHE_KEY = "pm_market_data";
const CACHE_TTL = 10 * 60 * 1000;

const FALLBACKS = {
  ethPrice: 2034, ethMcap: 245e9, ethChange: 0,
  btcPrice: 69000, btcMcap: 1.4e12,
  goldSpot: 4500, goldMcap: 4500 * GOLD_OZ_ABOVE_GROUND,
  ethSupply: 120.7e6,
  tvl: null, totalTvl: null, defiMarketShare: "~54",
  supplyGrowthRate: null,
  stakingYield: 3.2, pctStaked: 28.5,
  ethStakedAmount: 34.2e6, supplyEquilibrium: 124.1e6,
};

function computeDerived(raw) {
  const merged = { ...FALLBACKS, ...raw };
  const goldMonetaryPremium = merged.goldMcap * GOLD_MONETARY_RATIO;
  const ethSupply = merged.ethMcap / merged.ethPrice;
  const combinedTarget = merged.ethMcap + goldMonetaryPremium + merged.btcMcap;
  const impliedPrice = combinedTarget / ethSupply;
  const upsideMultiple = impliedPrice / merged.ethPrice;
  const percentOfTarget = (merged.ethMcap / combinedTarget) * 100;
  const btcParityPrice = (merged.ethMcap + merged.btcMcap) / ethSupply;
  const goldParityPrice = (merged.ethMcap + goldMonetaryPremium) / ethSupply;
  const combinedParityPrice = (merged.ethMcap + goldMonetaryPremium + merged.btcMcap) / ethSupply;
  return {
    ...merged, goldMonetaryPremium, ethSupply, combinedTarget,
    impliedPrice, upsideMultiple, percentOfTarget,
    btcParityPrice, goldParityPrice, combinedParityPrice,
  };
}

const MarketDataCtx = createContext(null);

export function MarketDataProvider({ children }) {
  const [data, setData] = useState(null);
  const [error, setError] = useState(false);
  const [lastUpdated, setLastUpdated] = useState(null);
  const [isLive, setIsLive] = useState(false);

  useEffect(() => {
    let cancelled = false;
    async function fetchData() {
      try {
        const cached = typeof sessionStorage !== "undefined" ? sessionStorage.getItem(CACHE_KEY) : null;
        if (cached) {
          const parsed = JSON.parse(cached);
          if (Date.now() - parsed.ts < CACHE_TTL) {
            if (!cancelled) {
              setData(computeDerived(parsed.raw));
              setLastUpdated(new Date(parsed.ts));
              setIsLive(true);
            }
            return;
          }
        }
        const results = await Promise.allSettled([
          fetch("https://api.coingecko.com/api/v3/simple/price?ids=ethereum,bitcoin,tether-gold&vs_currencies=usd&include_market_cap=true&include_24hr_change=true").then(r => r.json()),
          fetch("https://api.llama.fi/v2/chains").then(r => r.json()),
          fetch("https://ultrasound.money/api/v2/fees/gauge-rates").then(r => r.json()),
        ]);
        if (cancelled) return;
        const cg = results[0].status === "fulfilled" ? results[0].value : null;
        const tvlData = results[1].status === "fulfilled" ? results[1].value : null;
        const gauge = results[2].status === "fulfilled" ? results[2].value : null;
        if (!cg?.ethereum) { if (!cancelled) setError(true); return; }
        const ethTvl = tvlData ? tvlData.find(c => c.name === "Ethereum") : null;
        const totalTvl = tvlData ? tvlData.reduce((s, c) => s + (c.tvl || 0), 0) : null;
        const goldSpot = cg["tether-gold"]?.usd || FALLBACKS.goldSpot;
        const d7 = gauge?.d7 || {};
        const raw = {
          ethPrice: cg.ethereum.usd,
          ethMcap: cg.ethereum.usd_market_cap,
          ethChange: cg.ethereum.usd_24h_change || 0,
          btcPrice: cg.bitcoin.usd,
          btcMcap: cg.bitcoin.usd_market_cap,
          goldSpot,
          goldMcap: goldSpot * GOLD_OZ_ABOVE_GROUND,
          tvl: ethTvl ? ethTvl.tvl : null,
          totalTvl,
          defiMarketShare: ethTvl && totalTvl ? (ethTvl.tvl / totalTvl * 100).toFixed(0) : FALLBACKS.defiMarketShare,
          supplyGrowthRate: d7.supply_growth_rate_yearly != null ? d7.supply_growth_rate_yearly * 100 : null,
          stakingYield: FALLBACKS.stakingYield,
          pctStaked: FALLBACKS.pctStaked,
          ethStakedAmount: FALLBACKS.ethStakedAmount,
          supplyEquilibrium: FALLBACKS.supplyEquilibrium,
        };
        if (typeof sessionStorage !== "undefined") {
          sessionStorage.setItem(CACHE_KEY, JSON.stringify({ raw, ts: Date.now() }));
        }
        if (!cancelled) {
          setData(computeDerived(raw));
          setLastUpdated(new Date());
          setIsLive(true);
        }
      } catch {
        if (!cancelled) setError(true);
      }
    }
    fetchData();
    const interval = setInterval(fetchData, CACHE_TTL);
    return () => { cancelled = true; clearInterval(interval); };
  }, []);

  return (
    <MarketDataCtx.Provider value={{ data, error, lastUpdated, isLive, fallbacks: computeDerived(FALLBACKS) }}>
      {children}
    </MarketDataCtx.Provider>
  );
}

export function useMarketData() {
  return useContext(MarketDataCtx);
}

export function EthDiamond({ size = 32 }) {
  return (
    <svg width={size} height={size * 1.63} viewBox="0 0 256 417" fill="none">
      <path d="M127.961 0L125.166 9.5V285.168L127.961 287.958L255.923 212.32L127.961 0Z" fill="#29251F" fillOpacity="0.55" />
      <path d="M127.962 0L0 212.32L127.962 287.958V154.158V0Z" fill="#29251F" fillOpacity="0.9" />
      <path d="M127.961 312.187L126.386 314.106V412.306L127.961 416.905L255.999 236.587L127.961 312.187Z" fill="#29251F" fillOpacity="0.55" />
      <path d="M127.962 416.905V312.187L0 236.587L127.962 416.905Z" fill="#29251F" fillOpacity="0.9" />
      <path d="M127.961 287.958L255.921 212.32L127.961 154.159V287.958Z" fill="#C2A45B" fillOpacity="0.95" />
      <path d="M0.001 212.32L127.961 287.958V154.159L0.001 212.32Z" fill="#29251F" fillOpacity="0.72" />
    </svg>
  );
}

const COMPARISON_DATA = [
  { attr: "Scarcity", gold: "\u25D0", btc: "\u25CF", eth: "\u25CF", note: "Issuance capped at 1.5%; burn can make deflationary" },
  { attr: "Fungibility", gold: "\u25CF", btc: "\u25D0", eth: "\u25CF", note: "ZK privacy pools close the gap with gold" },
  { attr: "Divisibility", gold: "\u25D0", btc: "\u25CF", eth: "\u25CF", note: "18 decimal places" },
  { attr: "Portability", gold: "\u25CB", btc: "\u25CF", eth: "\u25CF", note: "Settles globally in seconds" },
  { attr: "Durability", gold: "\u25CF", btc: "\u25D0", eth: "\u25CF", note: "Proof-of-stake is more secure than proof-of-work" },
  { attr: "Verifiability", gold: "\u25D0", btc: "\u25CF", eth: "\u25CF", note: "Fully auditable on-chain" },
  { attr: "Censorship Resistance", gold: "\u25CB", btc: "\u25D0", eth: "\u25CF", note: "Forced inclusion guarantees" },
  { attr: "Established History", gold: "\u25CF", btc: "\u25D0", eth: "\u25CB", note: "~3,000 years (gold) vs. 10 years (ETH)" },
  { attr: "Low Carrying Cost", gold: "\u25CB", btc: "\u25D0", eth: "\u25CF", note: "Negative carrying cost via staking" },
  { attr: "Productive / Compounds", gold: "\u25CB", btc: "\u25CB", eth: "\u25CF", note: "2\u20134% staking yield, no counterparty risk", highlight: true },
];

const COL_COLOR = { gold: "#C2A45B", btc: "#C2A45B", eth: "#8EA4C2" };
function ratingColor(value, col) {
  return COL_COLOR[col] || "#C2A45B";
}

function RatingDot({ value, col, size = 20 }) {
  const color = COL_COLOR[col] || "#C2A45B";
  const cx = size / 2, cy = size / 2;
  const sw = 1.6;
  const r = size / 2 - sw / 2 - 0.5;
  const common = { width: size, height: size, viewBox: `0 0 ${size} ${size}`, style: { display: "inline-block", verticalAlign: "middle" }, "aria-hidden": true };
  if (value === "\u25CF") {
    return (
      <svg {...common}>
        <circle cx={cx} cy={cy} r={r + sw / 2} fill={color} />
      </svg>
    );
  }
  if (value === "\u25D0") {
    return (
      <svg {...common}>
        <circle cx={cx} cy={cy} r={r} fill="none" stroke={color} strokeWidth={sw} />
        <path d={`M ${cx} ${cy - r} A ${r} ${r} 0 0 0 ${cx} ${cy + r} Z`} fill={color} />
      </svg>
    );
  }
  return (
    <svg {...common}>
      <circle cx={cx} cy={cy} r={r} fill="none" stroke={color} strokeWidth={sw} />
    </svg>
  );
}

const RATING_LABEL = {
  "\u25CF": "Superior",
  "\u25D0": "Adequate",
  "\u25CB": "Weak",
};

export function ComparisonTable() {
  return (
    <div className="cmp-root">
      <style>{`
        .cmp-root {
          background: #29251F;
          border: 1px solid rgba(194,164,91,0.15);
          overflow: hidden;
        }
        .cmp-table { width: 100%; border-collapse: collapse; font-size: 14px; }
        .cmp-table thead th {
          padding: 20px 22px; font-family: 'DM Sans', sans-serif;
          font-weight: 600; color: #A89F93; font-size: 11px;
          letter-spacing: 2px; text-transform: uppercase;
          border-bottom: 1px solid rgba(194,164,91,0.22);
        }
        .cmp-table thead th.attr-col { text-align: left; color: #8A8075; letter-spacing: 1.5px; }
        .cmp-table thead th.val-col { text-align: center; }
        .cmp-table tbody tr { border-bottom: 1px solid rgba(194,164,91,0.12); }
        .cmp-table tbody tr:last-child { border-bottom: none; }
        .cmp-table tbody tr.row-highlight { background: rgba(237,230,214,0.035); }
        .cmp-table td { padding: 16px 22px; }
        .cmp-table .attr-cell .attr-name {
          font-family: 'DM Sans', sans-serif;
          color: #EDE6D6; font-weight: 500; font-size: 15px; margin-bottom: 3px;
        }
        .cmp-table .attr-cell .attr-note {
          font-family: 'DM Sans', sans-serif;
          color: #8A8075; font-size: 12px; line-height: 1.4;
        }
        .cmp-table .val-cell { text-align: center; line-height: 0; }
        .cmp-legend {
          display: flex; gap: 28px; padding: 18px 22px;
          border-top: 1px solid rgba(194,164,91,0.18);
          font-family: 'DM Sans', sans-serif;
          font-size: 13px; color: #A89F93;
        }
        .cmp-legend span { display: inline-flex; align-items: center; gap: 10px; }
        .cmp-cards { display: none; padding: 8px 0; }
        .cmp-card {
          padding: 20px 22px;
          border-bottom: 1px solid rgba(194,164,91,0.12);
        }
        .cmp-card:last-child { border-bottom: none; }
        .cmp-card-highlight { background: rgba(237,230,214,0.035); }
        .cmp-card .attr-name {
          font-family: 'DM Sans', sans-serif;
          color: #EDE6D6; font-weight: 500; font-size: 16px; margin-bottom: 4px;
        }
        .cmp-card .attr-note {
          font-family: 'DM Sans', sans-serif;
          color: #8A8075; font-size: 12px; line-height: 1.45; margin-bottom: 16px;
        }
        .cmp-card .card-row {
          display: grid; grid-template-columns: 90px 1fr auto;
          align-items: center; gap: 12px;
          padding: 8px 0;
          border-top: 1px solid rgba(194,164,91,0.08);
        }
        .cmp-card .card-row:first-of-type { border-top: none; padding-top: 0; }
        .cmp-card .card-row .card-asset {
          font-family: 'DM Sans', sans-serif;
          font-size: 11px; font-weight: 600; letter-spacing: 2px;
          text-transform: uppercase; color: #A89F93;
        }
        .cmp-card .card-row .card-dot { line-height: 0; text-align: right; }
        .cmp-card .card-row .card-rating {
          font-family: 'DM Sans', sans-serif; font-size: 12px; color: #A89F93;
          text-align: right;
        }
        @media (max-width: 768px) {
          .cmp-table { display: none; }
          .cmp-cards { display: block; }
          .cmp-legend { padding: 16px 20px 18px; gap: 18px; flex-wrap: wrap; font-size: 12px; }
          .cmp-card { padding: 18px 18px 14px; }
        }
      `}</style>
      <table className="cmp-table">
        <thead>
          <tr>
            <th className="attr-col">Attribute</th>
            <th className="val-col">Gold</th>
            <th className="val-col">Bitcoin</th>
            <th className="val-col">ETH</th>
          </tr>
        </thead>
        <tbody>
          {COMPARISON_DATA.map((row, i) => (
            <tr key={i} className={row.highlight ? "row-highlight" : undefined}>
              <td className="attr-cell">
                <div className="attr-name">{row.attr}</div>
                <div className="attr-note">{row.note}</div>
              </td>
              <td className="val-cell"><RatingDot value={row.gold} col="gold" /></td>
              <td className="val-cell"><RatingDot value={row.btc} col="btc" /></td>
              <td className="val-cell"><RatingDot value={row.eth} col="eth" /></td>
            </tr>
          ))}
        </tbody>
      </table>
      <div className="cmp-cards">
        {COMPARISON_DATA.map((row, i) => (
          <div key={i} className={`cmp-card${row.highlight ? " cmp-card-highlight" : ""}`}>
            <div className="attr-name">{row.attr}</div>
            <div className="attr-note">{row.note}</div>
            {[["Gold", row.gold, "gold"], ["Bitcoin", row.btc, "btc"], ["ETH", row.eth, "eth"]].map(([asset, v, col]) => (
              <div key={asset} className="card-row">
                <span className="card-asset">{asset}</span>
                <span className="card-rating">{RATING_LABEL[v]}</span>
                <span className="card-dot"><RatingDot value={v} col={col} size={18} /></span>
              </div>
            ))}
          </div>
        ))}
      </div>
      <div className="cmp-legend">
        <span><RatingDot value={"\u25CF"} col="gold" size={16} />Superior</span>
        <span><RatingDot value={"\u25D0"} col="gold" size={16} />Adequate</span>
        <span><RatingDot value={"\u25CB"} col="gold" size={16} />Weak</span>
      </div>
    </div>
  );
}

export function CompoundingChart({ id = "" }) {
  const chartRef = useRef(null);
  const [animated, setAnimated] = useState(false);
  const [progress, setProgress] = useState(0);
  const [done, setDone] = useState(false);
  const [hoverYear, setHoverYear] = useState(null);
  const startTimeRef = useRef(null);
  const DURATION = 5000;
  useEffect(() => {
    const observer = new IntersectionObserver(
      ([entry]) => { if (entry.isIntersecting && !animated) setAnimated(true); },
      { threshold: 0.3 }
    );
    if (chartRef.current) observer.observe(chartRef.current);
    return () => observer.disconnect();
  }, [animated]);
  useEffect(() => {
    if (!animated) return;
    let raf;
    const tick = (ts) => {
      if (!startTimeRef.current) startTimeRef.current = ts;
      const elapsed = ts - startTimeRef.current;
      const t = Math.min(elapsed / DURATION, 1);
      const eased = 1 - Math.pow(1 - t, 3);
      setProgress(eased);
      if (t < 1) { raf = requestAnimationFrame(tick); }
      else { setDone(true); }
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
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
  const yTicks = [];
  for (let v = 0; v <= yMax; v += 50) yTicks.push(v);
  const xTicks = [0, 5, 10, 15, 20, 25, 30];
  const gradId = `ethAreaGrad${id}`;
  const glowId = `glow${id}`;
  const clipId = `reveal${id}`;
  const clipX = PAD.left + progress * plotW;
  const currentYear = progress * YEARS;
  const currentYearInt = Math.min(Math.round(currentYear), YEARS);
  const currentVal = 100 * Math.pow(1 + RATE, currentYear);
  const currentValDisplay = Math.round(currentVal);
  const labelX = PAD.left + (currentYear / YEARS) * plotW;
  const labelY = yScale(currentVal);
  return (
    <div>
    <div ref={chartRef} style={{
      background: "#29251F", borderRadius: "8px", overflow: "hidden",
      border: "1px solid rgba(194,164,91,0.15)", padding: "32px 16px 20px"
    }}>
      <svg
        viewBox={`0 0 ${W} ${H}`}
        style={{ width: "100%", height: "auto", display: "block" }}
        onMouseMove={(e) => {
          if (!done) return;
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
          <linearGradient id={gradId} x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="rgba(194,164,91,0.22)" />
            <stop offset="100%" stopColor="rgba(194,164,91,0)" />
          </linearGradient>
          <filter id={glowId}>
            <feGaussianBlur stdDeviation="3" result="blur" />
            <feMerge><feMergeNode in="blur" /><feMergeNode in="SourceGraphic" /></feMerge>
          </filter>
          <clipPath id={clipId}>
            <rect x="0" y="0" width={animated ? clipX : 0} height={H} />
          </clipPath>
        </defs>
        {yTicks.map(v => (
          <line key={v} x1={PAD.left} x2={W - PAD.right}
            y1={yScale(v)} y2={yScale(v)}
            stroke="rgba(194,164,91,0.12)" strokeWidth="1" />
        ))}
        {yTicks.map(v => (
          <text key={v} x={PAD.left - 12} y={yScale(v) + 4}
            fill="#A89F93" fontSize="11" fontFamily="'JetBrains Mono', monospace"
            textAnchor="end">{v}</text>
        ))}
        {xTicks.map(yr => (
          <text key={yr} x={xScale(yr)} y={H - PAD.bottom + 24}
            fill="#A89F93" fontSize="11" fontFamily="'JetBrains Mono', monospace"
            textAnchor="middle">Yr {yr}</text>
        ))}
        <g clipPath={`url(#${clipId})`}>
          <path d={ethArea} fill={`url(#${gradId})`} />
          <path d={flatPath} fill="none" stroke="#C2A45B" strokeWidth="2" strokeDasharray="6,4" />
          <path d={flatPath} fill="none" stroke="#B8743A" strokeWidth="2" strokeDasharray="6,4" />
          <path d={ethPath} fill="none" stroke="#C2A45B" strokeWidth="2.5" filter={`url(#${glowId})`} />
        </g>
        {animated && !done && (
          <g>
            <circle cx={labelX} cy={labelY} r="4"
              fill="#C2A45B" filter={`url(#${glowId})`} />
            <rect x={labelX - 52} y={labelY - 32}
              width="104" height="24" rx="4" fill="rgba(41,37,31,0.95)"
              stroke="rgba(194,164,91,0.35)" strokeWidth="1" />
            <text x={labelX} y={labelY - 16}
              fill="#D4B775" fontSize="11" fontFamily="'JetBrains Mono', monospace"
              textAnchor="middle" fontWeight="500">
              Yr {currentYearInt}: {currentValDisplay} ETH
            </text>
          </g>
        )}
        {done && (
          <circle cx={xScale(YEARS)} cy={yScale(ethData[YEARS])} r="4"
            fill="#C2A45B" filter={`url(#${glowId})`} />
        )}
        <text x={W - PAD.right + 10} y={yScale(100) - 12}
          fill="#C2A45B" fontSize="11" fontFamily="'JetBrains Mono', monospace"
          style={{ opacity: animated ? 1 : 0, transition: "opacity 0.5s ease 0.3s" }}>
          Gold
        </text>
        <text x={W - PAD.right + 10} y={yScale(100) + 4}
          fill="#C2A45B" fontSize="10" fontFamily="'JetBrains Mono', monospace"
          style={{ opacity: animated ? 1 : 0, transition: "opacity 0.5s ease 0.3s" }}>
          100 oz
        </text>
        <text x={W - PAD.right + 10} y={yScale(100) + 22}
          fill="#B8743A" fontSize="11" fontFamily="'JetBrains Mono', monospace"
          style={{ opacity: animated ? 1 : 0, transition: "opacity 0.5s ease 0.3s" }}>
          Bitcoin
        </text>
        <text x={W - PAD.right + 10} y={yScale(100) + 36}
          fill="#B8743A" fontSize="10" fontFamily="'JetBrains Mono', monospace"
          style={{ opacity: animated ? 1 : 0, transition: "opacity 0.5s ease 0.3s" }}>
          100 BTC
        </text>
        <text x={W - PAD.right + 10} y={yScale(ethData[YEARS]) - 6}
          fill="#C2A45B" fontSize="11" fontFamily="'JetBrains Mono', monospace"
          fontWeight="600"
          style={{ opacity: done ? 1 : 0, transition: "opacity 0.5s ease" }}>
          ETH
        </text>
        <text x={W - PAD.right + 10} y={yScale(ethData[YEARS]) + 8}
          fill="#C2A45B" fontSize="10" fontFamily="'JetBrains Mono', monospace"
          style={{ opacity: done ? 1 : 0, transition: "opacity 0.5s ease" }}>
          {ethData[YEARS].toFixed(0)} ETH
        </text>
        {done && hoverYear !== null && (
          <>
            <line x1={xScale(hoverYear)} x2={xScale(hoverYear)}
              y1={PAD.top} y2={H - PAD.bottom}
              stroke="rgba(194,164,91,0.3)" strokeWidth="1" strokeDasharray="4,3" />
            <circle cx={xScale(hoverYear)} cy={yScale(ethData[hoverYear])}
              r="4" fill="#C2A45B" stroke="#29251F" strokeWidth="2" />
            <circle cx={xScale(hoverYear)} cy={yScale(100)}
              r="3" fill="#C2A45B" stroke="#29251F" strokeWidth="2" />
            <rect x={xScale(hoverYear) - 52} y={yScale(ethData[hoverYear]) - 32}
              width="104" height="24" rx="4" fill="rgba(41,37,31,0.94)"
              stroke="rgba(194,164,91,0.3)" strokeWidth="1" />
            <text x={xScale(hoverYear)} y={yScale(ethData[hoverYear]) - 16}
              fill="#D4B775" fontSize="11" fontFamily="'JetBrains Mono', monospace"
              textAnchor="middle" fontWeight="500">
              Yr {hoverYear}: {Math.round(ethData[hoverYear])} ETH
            </text>
          </>
        )}
      </svg>
      <div style={{
        display: "flex", justifyContent: "center", gap: "32px", flexWrap: "wrap",
        marginTop: "16px", paddingTop: "16px",
        borderTop: "1px solid rgba(194,164,91,0.12)"
      }}>
        <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
          <div style={{ width: "16px", height: "2px", background: "#C2A45B" }} />
          <span style={{ fontSize: "12px", color: "#8A8075" }}>Gold (0% yield)</span>
        </div>
        <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
          <div style={{ width: "16px", height: "2px", background: "#B8743A" }} />
          <span style={{ fontSize: "12px", color: "#8A8075" }}>Bitcoin (0% yield)</span>
        </div>
        <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
          <div style={{ width: "16px", height: "2px", background: "#C2A45B" }} />
          <span style={{ fontSize: "12px", color: "#8A8075" }}>ETH staked (3.2% compound)</span>
        </div>
      </div>
    </div>
      <div style={{
        textAlign: "left", padding: "20px 4px 4px",
        fontFamily: "'DM Sans', sans-serif", fontSize: "14px", color: "var(--muted-warmer)",
        lineHeight: 1.65,
        maxWidth: "680px", margin: "0 auto",
      }}>
        Assumes 3.2% staking yield compounded annually. No counterparty risk. Net ETH supply has been flat-to-deflationary since the Merge due to EIP-1559 fee burns.
      </div>
    </div>
  );
}

function fmtTag(n) {
  if (n >= 1e6) return "$" + (n / 1e6).toFixed(0) + "M";
  if (n >= 1e3) return "$" + Math.round(n).toLocaleString();
  return "$" + Math.round(n);
}
function fmtMcap(n) {
  if (n >= 1e12) return "$" + (n / 1e12).toFixed(1) + "T";
  if (n >= 1e9) return "$" + (n / 1e9).toFixed(0) + "B";
  return "$" + (n / 1e6).toFixed(0) + "M";
}

export function PathToTarget({ id = "" }) {
  const ctx = useMarketData();
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

  const src = ctx?.data || ctx?.fallbacks || computeDerived(FALLBACKS);
  const loading = ctx ? !ctx.data && !ctx.error : false;
  const lastUpdated = ctx?.lastUpdated;
  const isLive = ctx?.isLive || false;
  const { ethPrice, ethMcap, ethSupply, btcMcap, goldMonetaryPremium,
    btcParityPrice, goldParityPrice, combinedParityPrice } = src;
  const milestones = [
    { price: ethPrice, label: "Today", labelShort: "Today", tag: fmtTag(ethPrice), mcap: fmtMcap(ethMcap), color: "#A89F93" },
    { price: btcParityPrice, label: "Bitcoin parity", labelShort: "BTC parity", tag: fmtTag(btcParityPrice), mcap: fmtMcap(ethMcap + btcMcap), color: "#B8743A" },
    { price: goldParityPrice, label: "Gold parity", labelShort: "Gold parity", tag: fmtTag(goldParityPrice), mcap: fmtMcap(ethMcap + goldMonetaryPremium), color: "#C2A45B" },
    { price: combinedParityPrice, label: "Gold + Bitcoin", labelShort: "Gold + BTC", tag: fmtTag(combinedParityPrice), mcap: fmtMcap(ethMcap + goldMonetaryPremium + btcMcap), color: "#C2A45B" },
  ];

  const W = 760;
  const H = 420;
  const PAD = { top: 60, right: 80, bottom: 30, left: 90 };
  const plotW = W - PAD.left - PAD.right;
  const plotH = H - PAD.top - PAD.bottom;
  const logMin = Math.log10(Math.max(ethPrice * 0.7, 500));
  const logMax = Math.log10(combinedParityPrice * 1.3);
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
  const bottomY = yScale(Math.pow(10, logMin));
  const areaPath = linePath + ` L${points[points.length-1].x},${bottomY} L${points[0].x},${bottomY} Z`;
  const pathLength = 1400;
  const yLabelCandidates = [1000, 2000, 5000, 10000, 20000, 50000, 100000, 200000, 300000, 500000];
  const yLabels = yLabelCandidates.filter(p => p >= Math.pow(10, logMin) && p <= Math.pow(10, logMax));
  const pathGradId = `pathGrad${id}`;
  const areaGradId = `areaGrad${id}`;
  const dotGlowId = `dotGlow${id}`;
  const lineGlowId = `lineGlow${id}`;
  return (
    <div ref={ref}>
    <div style={{
      background: "#29251F", borderRadius: "8px", overflow: "hidden",
      border: "1px solid rgba(194,164,91,0.15)",
      padding: "clamp(16px, 4vw, 28px) clamp(8px, 2vw, 16px) 20px",
      maxWidth: "100%",
    }}>
      <div style={{ textAlign: "center", marginBottom: "14px", padding: "16px 12px 10px" }}>
        <div style={{
          fontSize: "clamp(28px, 5.6vw, 40px)",
          fontWeight: 500, letterSpacing: "-0.5px", lineHeight: 1.15,
          fontFamily: "'Cormorant Garamond', serif",
        }}>
          <span style={{ color: "#EDE6D6" }}>The Path to </span>
          <span style={{ color: "#C2A45B", fontStyle: "italic" }}>$250,000 ETH</span>
        </div>
      </div>
      {loading ? (
        <div style={{ textAlign: "center", padding: "120px 0", color: "#8A8075", fontSize: "14px", fontFamily: "'DM Sans', sans-serif" }}>
          Loading live data{"\u2026"}
        </div>
      ) : (
      <>
      <div className="ptt-svg-view">
      <svg viewBox={`0 0 ${W} ${H}`} style={{ width: "100%", height: "auto", display: "block" }}
        onMouseLeave={() => setHoveredIdx(null)}>
        <defs>
          <linearGradient id={pathGradId} x1="0" y1="0" x2="1" y2="0">
            <stop offset="0%" stopColor="#A89F93" />
            <stop offset="30%" stopColor="#B8743A" />
            <stop offset="85%" stopColor="#C2A45B" />
            <stop offset="100%" stopColor="#C2A45B" />
          </linearGradient>
          <linearGradient id={areaGradId} x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="rgba(194,164,91,0.11)" />
            <stop offset="100%" stopColor="rgba(194,164,91,0)" />
          </linearGradient>
          <filter id={dotGlowId}>
            <feGaussianBlur stdDeviation="4" result="blur" />
            <feMerge><feMergeNode in="blur" /><feMergeNode in="SourceGraphic" /></feMerge>
          </filter>
          <filter id={lineGlowId}>
            <feGaussianBlur stdDeviation="2.5" result="blur" />
            <feMerge><feMergeNode in="blur" /><feMergeNode in="SourceGraphic" /></feMerge>
          </filter>
        </defs>
        {yLabels.map(p => (
          <g key={p}>
            <line x1={PAD.left} x2={W - PAD.right}
              y1={yScale(p)} y2={yScale(p)}
              stroke="rgba(237,230,214,0.13)" strokeWidth="1" />
            <text x={PAD.left - 14} y={yScale(p) + 4}
              fill="#A89F93" fontSize="10" fontFamily="'JetBrains Mono', monospace"
              textAnchor="end">
              {p >= 1000 ? `$${(p/1000).toFixed(0)}K` : `$${p}`}
            </text>
          </g>
        ))}
        <path d={areaPath} fill={`url(#${areaGradId})`}
          style={{ opacity: visible ? 1 : 0, transition: "opacity 0.8s ease 1s" }} />
        <path d={linePath} fill="none" stroke={`url(#${pathGradId})`} strokeWidth="3"
          filter={`url(#${lineGlowId})`}
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
          const labelAbove = i % 2 === 0;
          const xOffset = i === 0 ? 40 : 0;
          const cx = x + xOffset;
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
                filter={isLast ? `url(#${dotGlowId})` : undefined}
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
                  x={cx - (isLast ? 56 : 46)} y={labelAbove ? y - 44 : y + 14}
                  width={isLast ? 112 : 92} height={isLast ? 28 : 24}
                  rx="4" fill="rgba(41,37,31,0.94)"
                  stroke={isHovered ? m.color : "rgba(194,164,91,0.22)"}
                  strokeWidth="1"
                />
                <text x={cx} y={labelAbove ? y - 27 : y + 31}
                  fill={isLast ? "#D4B775" : "#EDE6D6"}
                  fontSize={isLast ? "14" : "12"} fontWeight={isLast ? "600" : "500"}
                  fontFamily="'JetBrains Mono', monospace"
                  textAnchor="middle">
                  {m.tag}
                </text>
                <text x={cx} y={labelAbove ? y - 52 : y + 48}
                  fill={m.color} fontSize="9" fontWeight="500"
                  fontFamily="'DM Sans', sans-serif"
                  textAnchor="middle" letterSpacing="1"
                  style={{ textTransform: "uppercase" }}>
                  {m.label}
                </text>
              </g>
              {isHovered && (
                <g>
                  <rect x={cx - 60} y={y + (labelAbove ? 14 : -44)}
                    width="120" height="22" rx="4"
                    fill="rgba(41,37,31,0.95)" stroke="rgba(194,164,91,0.3)" strokeWidth="1" />
                  <text x={cx} y={y + (labelAbove ? 29 : -29)}
                    fill="#B8AFA1" fontSize="10"
                    fontFamily="'JetBrains Mono', monospace"
                    textAnchor="middle">
                    MCap: {m.mcap}
                  </text>
                </g>
              )}
            </g>
          );
        })}
      </svg>
      <div className={`ptt-xaxis ptt-${id || "root"}`}>
        {milestones.map((m, i) => {
          const pct = (xScale(i) / W) * 100;
          const shift = i === 0 ? "-10%" : i === milestones.length - 1 ? "-85%" : "-50%";
          return (
            <div key={i} className="ptt-xlabel" style={{ left: `${pct}%`, transform: `translateX(${shift})` }}>
              <span className="ptt-xlabel-full">{m.label}</span>
              <span className="ptt-xlabel-short">{m.labelShort}</span>
            </div>
          );
        })}
      </div>
      </div>
      <div className="ptt-list-view">
        {milestones.map((m, i) => {
          const isLast = i === milestones.length - 1;
          return (
            <div key={i} className={`ptt-row${isLast ? " ptt-row-target" : ""}`}>
              <div className="ptt-row-label">{m.label}</div>
              <div className="ptt-row-price" style={{ color: isLast ? "#D4B775" : "#EDE6D6" }}>{m.tag}</div>
              <div className="ptt-row-mcap">MCap {m.mcap}</div>
            </div>
          );
        })}
      </div>
      <style>{`
        .ptt-svg-view { display: block; }
        .ptt-list-view { display: none; }
        .ptt-xaxis {
          position: relative;
          height: 22px;
          margin: 0 0 4px;
          font-family: 'DM Sans', sans-serif;
        }
        .ptt-xlabel {
          position: absolute;
          top: 0;
          font-size: 11px;
          font-weight: 500;
          letter-spacing: 1.2px;
          text-transform: uppercase;
          color: #A89F93;
          white-space: nowrap;
        }
        .ptt-xlabel-short { display: none; }
        @media (max-width: 640px) {
          .ptt-svg-view { display: none; }
          .ptt-list-view {
            display: flex; flex-direction: column;
            gap: 1px; padding: 4px 4px 8px;
            background: rgba(194,164,91,0.12);
            border-radius: 6px;
          }
          .ptt-row {
            display: grid;
            grid-template-columns: 1fr auto;
            grid-template-rows: auto auto;
            column-gap: 16px; row-gap: 2px;
            padding: 18px 18px;
            background: #29251F;
            align-items: baseline;
          }
          .ptt-row:first-child { border-radius: 6px 6px 0 0; }
          .ptt-row:last-child  { border-radius: 0 0 6px 6px; }
          .ptt-row-target {
            background: linear-gradient(90deg, rgba(194,164,91,0.12), rgba(194,164,91,0.06));
          }
          .ptt-row-label {
            grid-column: 1; grid-row: 1;
            font-family: 'DM Sans', sans-serif;
            font-size: 10px; font-weight: 600;
            letter-spacing: 1.6px; text-transform: uppercase;
            color: #A89F93;
          }
          .ptt-row-mcap {
            grid-column: 1; grid-row: 2;
            font-family: 'DM Sans', sans-serif;
            font-size: 12px; color: #8A8075;
          }
          .ptt-row-price {
            grid-column: 2; grid-row: 1 / span 2;
            font-family: 'Cormorant Garamond', serif;
            font-size: 26px; font-weight: 500;
            font-style: italic;
            letter-spacing: -0.3px;
            align-self: center;
          }
        }
      `}</style>
      </>
      )}
    </div>
      <div style={{
        textAlign: "left", padding: "20px 4px 4px",
        fontFamily: "'DM Sans', sans-serif", fontSize: "14px", color: "var(--muted-warmer)",
        lineHeight: 1.65,
        maxWidth: "680px", margin: "0 auto",
      }}>
        Gold monetary premium estimated at 90% of total market capitalization, with the remainder attributable to industrial and decorative utility. Bitcoin{"'"}s entire market cap is treated as monetary premium. All milestone prices include ETH{"'"}s current market cap as the base. Data from CoinGecko, updates every 10 minutes.
        {lastUpdated && (
          <span style={{ display: "block", marginTop: "10px", fontSize: "13px", color: "var(--muted-warm)", letterSpacing: "0.3px" }}>
            {isLive ? "Live" : "Fallback"} · Last updated {lastUpdated.toLocaleTimeString()}
          </span>
        )}
      </div>
    </div>
  );
}

function fmt(n, decimals = 0) {
  if (n == null) return "\u2014";
  if (n >= 1e12) return "$" + (n / 1e12).toFixed(decimals > 0 ? decimals : 1) + "T";
  if (n >= 1e9) return "$" + (n / 1e9).toFixed(decimals > 0 ? decimals : 1) + "B";
  if (n >= 1e6) return "$" + (n / 1e6).toFixed(decimals > 0 ? decimals : 1) + "M";
  return "$" + n.toLocaleString(undefined, { maximumFractionDigits: decimals });
}
function fmtPrice(n) { return "$" + Math.round(n).toLocaleString(); }

export function LiveDashboard() {
  const ctx = useMarketData();
  const d = ctx?.data || null;
  const error = ctx?.error || false;
  const [animate, setAnimate] = useState(false);
  useEffect(() => { setTimeout(() => setAnimate(true), 200); }, []);

  const pct = d ? d.percentOfTarget : 0;
  const upside = d ? Math.round(d.upsideMultiple) : 0;

  return (
    <div className="ld-root" style={{ fontFamily: "'DM Sans', sans-serif", maxWidth: 1100, margin: "0 auto" }}>
      <style>{`
        .ld-hero-card { padding: 44px 40px 40px; }
        .ld-price-row { display: flex; align-items: stretch; justify-content: center; gap: 0; max-width: 720px; margin: 0 auto 36px; }
        .ld-price-cell { flex: 1; padding: 24px 20px; text-align: center; }
        .ld-price-val { font-family: 'JetBrains Mono', monospace; font-size: 30px; font-weight: 600; }
        .ld-headline-pct { font-family: 'JetBrains Mono', monospace; font-size: 48px; font-weight: 700; color: #D4B775; letter-spacing: -1px; }
        .ld-upside-cell { padding: 24px 28px; text-align: center; display: flex; flex-direction: column; justify-content: center; }
        .ld-arrow { display: flex; align-items: center; padding: 0 4px; color: #8A8075; }
        .ld-sep { width: 1px; background: rgba(194,164,91,0.1); margin: 12px 0; }
        .ld-grid { display: grid; grid-template-columns: repeat(4, 1fr); gap: 1px; background: rgba(194,164,91,0.15); border-radius: 8px; overflow: hidden; }
        .ld-grid-cell { background: #29251F; padding: 24px 20px; }
        .ld-grid-label { font-size: 11px; font-weight: 500; letter-spacing: 1.2px; text-transform: uppercase; color: #8A8075; margin-bottom: 12px; }
        .ld-grid-val { font-family: 'JetBrains Mono', monospace; font-size: 22px; font-weight: 500; margin-bottom: 4px; }
        .ld-grid-sub { font-size: 12px; color: #8A8075; line-height: 1.4; }
        .ld-label { font-size: 11px; font-weight: 500; letter-spacing: 1.5px; text-transform: uppercase; color: #8A8075; margin-bottom: 10px; }
        .ld-progress-label { font-size: 12px; }
        .ld-footer { text-align: center; font-size: 12px; color: #3a3b50; margin-top: 12px; line-height: 1.6; }
        .ld-section-sub { font-size: 14px; color: #8A8075; margin-bottom: 32px; line-height: 1.5; }
        @media (max-width: 768px) {
          .ld-hero-card { padding: 32px 20px 28px; }
          .ld-headline-pct { font-size: 36px; }
          .ld-price-row { flex-direction: column; align-items: center; }
          .ld-price-cell { padding: 16px 16px; }
          .ld-price-val { font-size: 24px; }
          .ld-arrow { transform: rotate(90deg); padding: 4px 0; }
          .ld-sep { width: 80%; height: 1px; margin: 0 auto; }
          .ld-upside-cell { padding: 16px 16px; }
          .ld-grid { grid-template-columns: repeat(2, 1fr); }
          .ld-grid-cell { padding: 20px 16px; }
          .ld-grid-val { font-size: 18px; }
          .ld-grid-sub { font-size: 12px; }
          .ld-grid-label { font-size: 11px; }
          .ld-label { font-size: 11px; }
          .ld-progress-label { font-size: 12px; }
          .ld-footer { font-size: 12px; }
          .ld-section-sub { font-size: 14px; }
        }
        @media (max-width: 480px) {
          .ld-hero-card { padding: 24px 16px 24px; }
          .ld-headline-pct { font-size: 30px; }
          .ld-price-val { font-size: 22px; }
          .ld-grid { grid-template-columns: 1fr 1fr; }
          .ld-grid-val { font-size: 16px; }
        }
      `}</style>
      {/* Section label */}
      <div style={{ fontSize: "12px", fontWeight: 600, letterSpacing: "3px", textTransform: "uppercase", color: "#C2A45B", marginBottom: "12px" }}>
        Live Dashboard
      </div>
      <div className="ld-section-sub">
        Live data showing where ETH stands today relative to the monetary premium it could absorb.
      </div>

      {/* ─── HERO CARD ─── */}
      <div className="ld-hero-card" style={{
        background: "#29251F", borderRadius: "12px",
        border: "1px solid rgba(194,164,91,0.1)",
        marginBottom: "16px",
        position: "relative", overflow: "hidden",
      }}>
        {/* Glow */}
        <div style={{
          position: "absolute", top: "-50%", left: "50%", transform: "translateX(-50%)",
          width: "700px", height: "500px",
          background: "radial-gradient(ellipse, rgba(194,164,91,0.08), transparent 70%)",
          pointerEvents: "none",
        }} />

        {/* Headline percentage */}
        <div style={{ textAlign: "center", marginBottom: "36px", position: "relative" }}>
          <div style={{ fontSize: "14px", color: "#8A8075", marginBottom: "4px", lineHeight: 1.5 }}>
            ETH has captured
          </div>
          <span className="ld-headline-pct">
            {d ? pct.toFixed(2) + "%" : "\u2014"}
          </span>
          <div style={{ fontSize: "14px", color: "#8A8075", marginTop: "4px" }}>
            of the combined monetary premium of gold and Bitcoin
          </div>
        </div>

        {/* Price comparison row */}
        <div className="ld-price-row" style={{
          background: "rgba(194,164,91,0.08)",
          borderRadius: "8px", border: "1px solid rgba(194,164,91,0.12)",
          overflow: "hidden",
        }}>
          <div className="ld-price-cell">
            <div className="ld-label">ETH Today</div>
            <div className="ld-price-val" style={{ color: "#EDE6D6" }}>
              {d ? fmtPrice(d.ethPrice) : "\u2014"}
            </div>
          </div>
          <div className="ld-arrow">
            <svg width="40" height="20" viewBox="0 0 40 20" fill="none" aria-hidden="true">
              <path d="M2 10 H34 M26 3 L34 10 L26 17" stroke="#D4B775" strokeWidth="2.75" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
          </div>
          <div className="ld-price-cell">
            <div className="ld-label">Implied at Parity</div>
            <div className="ld-price-val" style={{ color: "#D4B775" }}>
              {d ? fmtPrice(d.impliedPrice) : "\u2014"}
            </div>
          </div>
          <div className="ld-sep" />
          <div className="ld-upside-cell">
            <div className="ld-label">Upside</div>
            <div className="ld-price-val" style={{ fontWeight: 700, color: "#D4B775" }}>
              {d ? upside + "x" : "\u2014"}
            </div>
          </div>
        </div>

        {/* Progress visualization */}
        <div style={{ maxWidth: "640px", margin: "0 auto" }}>
          <div className="ld-progress-label" style={{ display: "flex", justifyContent: "flex-end", marginBottom: "8px" }}>
            <span style={{ color: "#8A8075" }}>Target: {d ? fmt(d.combinedTarget) : "\u2014"}</span>
          </div>
          <div style={{ position: "relative", height: "28px" }}>
            <div style={{
              position: "absolute", top: "10px", left: 0, right: 0, height: "8px",
              background: "rgba(194,164,91,0.12)", borderRadius: "4px",
            }} />
            <div style={{
              position: "absolute", top: "10px", left: 0, height: "8px", borderRadius: "4px",
              width: animate && d ? `${Math.max(pct, 0.8)}%` : "0%",
              background: "linear-gradient(90deg, #C2A45B, #D4B775)",
              boxShadow: "0 0 16px rgba(194,164,91,0.55), 0 0 4px rgba(194,164,91,0.85)",
              transition: "width 1.5s cubic-bezier(0.16, 1, 0.3, 1) 0.3s",
            }} />
            <div style={{
              position: "absolute", top: "6px",
              left: animate && d ? `${Math.max(pct, 0.8)}%` : "0%",
              width: "16px", height: "16px", borderRadius: "50%",
              background: "#D4B775",
              boxShadow: "0 0 12px rgba(194,164,91,0.65), 0 0 4px rgba(160,176,255,0.9)",
              transform: "translateX(-8px)",
              transition: "left 1.5s cubic-bezier(0.16, 1, 0.3, 1) 0.3s",
            }} />
          </div>
          <div className="ld-progress-label" style={{ display: "flex", justifyContent: "space-between", marginTop: "6px" }}>
            <span style={{ color: "#C2A45B" }}>
              ETH: {d ? fmt(d.ethMcap) : "\u2014"} ({d ? pct.toFixed(2) : "0"}%)
            </span>
            <span style={{ color: "#8A8075" }}>
              {d ? (100 - pct).toFixed(1) : "100"}% remaining
            </span>
          </div>
        </div>
      </div>

      {/* ─── METRICS GRID ─── */}
      <div className="ld-grid">
        {(d ? [
          { label: "Gold Monetary Premium", value: fmt(d.goldMonetaryPremium), sub: "~90% of total gold market cap", color: "#C2A45B" },
          { label: "Bitcoin Monetary Premium", value: fmt(d.btcMcap), sub: `100% of market cap (${fmtPrice(d.btcPrice)} / BTC)`, color: "#B8743A" },
          { label: "ETH Market Cap", value: fmt(d.ethMcap), sub: `${pct.toFixed(2)}% of target`, color: "#C2A45B" },
          { label: "Combined Target", value: fmt(d.combinedTarget), sub: "Gold premium + Bitcoin + ETH", color: "#D4B775" },
          { label: "Staking Yield", value: d.stakingYield.toFixed(1) + "%", sub: "No counterparty risk", color: "#D4B775" },
          { label: "Supply Staked", value: d.pctStaked.toFixed(1) + "%", sub: `~${(d.ethStakedAmount / 1e6).toFixed(1)}M ETH locked`, color: "#EDE6D6" },
          { label: "DeFi TVL", value: d.tvl ? fmt(d.tvl) : "\u2014", sub: `~${d.defiMarketShare || "54"}% of all DeFi across all chains`, color: "#EDE6D6" },
          { label: "Supply Equilibrium", value: (d.supplyEquilibrium / 1e6).toFixed(1) + "M", sub: "Long-term supply converges, not inflates", color: "#EDE6D6" },
        ] : Array(8).fill(null)).map((m, i) => (
          <div key={i} className="ld-grid-cell">
            {m ? (
              <>
                <div className="ld-grid-label">{m.label}</div>
                <div className="ld-grid-val" style={{ color: m.color }}>{m.value}</div>
                <div className="ld-grid-sub">{m.sub}</div>
              </>
            ) : (
              <>
                <div style={{ height: "10px", width: "50%", background: "rgba(194,164,91,0.12)", borderRadius: "3px", marginBottom: "14px" }} />
                <div style={{ height: "22px", width: "70%", background: "rgba(194,164,91,0.15)", borderRadius: "4px" }} />
              </>
            )}
          </div>
        ))}
      </div>

      {/* ─── FOOTER ─── */}
      <div className="ld-footer">
        {error ? (
          <div>Unable to load live data</div>
        ) : d ? (
          <>
            <div>Live data · CoinGecko · DefiLlama · ultrasound.money · Updates every 10 min</div>
            <div style={{ marginTop: "2px" }}>
              Price targets use current circulating supply. Long-term supply projected to converge to ~{(d.supplyEquilibrium / 1e6).toFixed(1)}M ETH at equilibrium.
            </div>
            <div style={{ marginTop: "2px" }}>
              Gold monetary premium = spot price {"\u00D7"} 6.7B oz above-ground {"\u00D7"} 90%. Bitcoin{"'"}s entire market cap treated as monetary premium.
            </div>
          </>
        ) : (
          <div>Loading live data{"\u2026"}</div>
        )}
      </div>
    </div>
  );
}

export function ShareFab() {
  const ctx = useMarketData();
  const [visible, setVisible] = useState(false);
  const [open, setOpen] = useState(false);
  const [copied, setCopied] = useState(false);
  const fabRef = useRef(null);
  const priceTarget = ctx?.data ? "$" + Math.round(ctx.data.combinedParityPrice).toLocaleString() : "$300,000";

  useEffect(() => {
    const handleScroll = () => {
      setVisible(window.scrollY > window.innerHeight * 0.1);
    };
    window.addEventListener("scroll", handleScroll, { passive: true });
    handleScroll();
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  useEffect(() => {
    if (!open) return;
    const handleClick = (e) => {
      if (fabRef.current && !fabRef.current.contains(e.target)) setOpen(false);
    };
    document.addEventListener("mousedown", handleClick);
    return () => document.removeEventListener("mousedown", handleClick);
  }, [open]);

  const url = typeof window !== "undefined" ? window.location.href : "";

  const copyLink = async () => {
    try {
      await navigator.clipboard.writeText(url);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch { /* fallback */ }
  };

  const xText = `\u201CEthereum and the Era of Productive Money\u201D - Why ETH is better money than gold and Bitcoin by every measure.\n\nRead the new report from @Etherealize_io explaining their ${priceTarget} per ETH price target.`;

  const shareX = () => {
    window.open(
      `https://x.com/intent/tweet?text=${encodeURIComponent(xText)}&url=${encodeURIComponent(url)}`,
      "_blank", "noopener,noreferrer"
    );
    setOpen(false);
  };

  const liText = `\u201CEthereum and the Era of Productive Money\u201D \u2014 Why ETH is better money than gold and Bitcoin by every measure.\n\nRead the new report from @Etherealize explaining their ${priceTarget} per ETH price target.\n\n${url}`;

  const shareLinkedIn = () => {
    window.open(
      `https://www.linkedin.com/feed/?shareActive=true&text=${encodeURIComponent(liText)}`,
      "_blank", "noopener,noreferrer"
    );
    setOpen(false);
  };

  return (
    <div ref={fabRef} style={{
      position: "fixed", bottom: "28px", right: "28px", zIndex: 200,
      opacity: visible ? 1 : 0, pointerEvents: visible ? "auto" : "none",
      transform: visible ? "translateY(0)" : "translateY(16px)",
      transition: "opacity 0.3s ease, transform 0.3s ease",
    }}>
      <style>{`
        .share-fab-btn {
          width: 52px; height: 52px; border-radius: 50%;
          background: #29251F; backdrop-filter: blur(12px);
          border: 1px solid #29251F;
          color: #C2A45B; cursor: pointer;
          display: flex; align-items: center; justify-content: center;
          transition: all 0.2s ease;
          box-shadow: 0 4px 20px rgba(0,0,0,0.3);
        }
        .share-fab-btn:hover { background: rgba(194,164,91,0.35); transform: scale(1.05); }
        .share-pop { display: flex; flex-direction: column; gap: 0; overflow: hidden; }
        .share-opt {
          display: flex; align-items: center; gap: 10px;
          padding: 12px 16px; background: none; border: none;
          color: #EDE6D6; font-family: 'DM Sans', sans-serif; font-size: 13px;
          cursor: pointer; transition: background 0.15s; text-align: left; width: 100%;
        }
        .share-opt:hover { background: rgba(194,164,91,0.15); }
        .share-opt svg { flex-shrink: 0; }
        @keyframes sharePopIn {
          from { opacity: 0; transform: translateY(8px) scale(0.95); }
          to { opacity: 1; transform: translateY(0) scale(1); }
        }
        @media (max-width: 600px) {
          .share-fab-btn { width: 46px; height: 46px; }
        }
      `}</style>

      {open && (
        <div style={{
          position: "absolute", bottom: "62px", right: 0,
          background: "rgba(41,37,31,0.97)", backdropFilter: "blur(16px)",
          border: "1px solid rgba(194,164,91,0.22)", borderRadius: "10px",
          minWidth: "210px",
          boxShadow: "0 8px 32px rgba(0,0,0,0.4)",
          animation: "sharePopIn 0.2s ease",
        }}>
          <div style={{
            padding: "10px 16px 6px", fontSize: "10px", fontWeight: 600,
            letterSpacing: "1.5px", textTransform: "uppercase", color: "#8A8075",
          }}>
            Share this report
          </div>
          <div className="share-pop">
            <button className="share-opt" onClick={copyLink}>
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <rect x="9" y="9" width="13" height="13" rx="2" ry="2" /><path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1" />
              </svg>
              {copied ? <span style={{ color: "#4ade80", fontWeight: 500 }}>Copied!</span> : "Copy link"}
            </button>
            <button className="share-opt" onClick={shareX}>
              <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
                <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z" />
              </svg>
              Share on X
            </button>
            <button className="share-opt" onClick={shareLinkedIn}>
              <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
                <path d="M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433a2.062 2.062 0 0 1-2.063-2.065 2.064 2.064 0 1 1 2.063 2.065zm1.782 13.019H3.555V9h3.564v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.222 0h.003z" />
              </svg>
              Share on LinkedIn
            </button>
          </div>
        </div>
      )}

      <button className="share-fab-btn" onClick={() => setOpen(!open)} aria-label="Share">
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <circle cx="18" cy="5" r="3" /><circle cx="6" cy="12" r="3" /><circle cx="18" cy="19" r="3" />
          <line x1="8.59" y1="13.51" x2="15.42" y2="17.49" /><line x1="15.41" y1="6.51" x2="8.59" y2="10.49" />
        </svg>
      </button>
    </div>
  );
}

export function SubscribeBox() {
  const [email, setEmail] = useState("");
  const handleSubscribe = (e) => {
    if (e && typeof e.preventDefault === "function") e.preventDefault();
    const trimmed = email.trim();
    const url = trimmed
      ? `https://etherealizeinc.substack.com/subscribe?email=${encodeURIComponent(trimmed)}`
      : "https://etherealizeinc.substack.com/";
    window.open(url, "_blank", "noopener,noreferrer");
  };
  return (
    <div style={{ textAlign: "center" }}>
      <style>{`
        .sub-box { max-width: 520px; margin: 0 auto; }
        .sub-row { display: flex; gap: 0; margin-top: 24px; border-radius: 4px; overflow: hidden; }
        .sub-row { border: 1px solid #29251F; }
        .sub-input {
          flex: 1; font-family: 'DM Sans', sans-serif; font-size: 14px;
          padding: 15px 18px; background: transparent;
          border: none; color: #29251F; outline: none;
        }
        .sub-input::placeholder { color: #8A8075; }
        .sub-btn {
          font-family: 'DM Sans', sans-serif; font-size: 11px; font-weight: 600;
          letter-spacing: 1.4px; text-transform: uppercase;
          color: #F5F2EC; background: #29251F;
          border: none; padding: 15px 24px;
          cursor: pointer; transition: all 0.2s; white-space: nowrap;
        }
        .sub-btn:hover { background: #C2A45B; color: #29251F; }
        @media (max-width: 600px) {
          .sub-row { flex-direction: column; }
        }
      `}</style>
      <div style={{
        fontFamily: "'DM Sans', sans-serif",
        fontSize: "11px", fontWeight: 600, letterSpacing: "3px",
        textTransform: "uppercase", color: "#C2A45B", marginBottom: "10px",
      }}>Stay Updated</div>
      <div style={{ width: "40px", height: "1px", background: "#C2A45B", margin: "0 auto 28px" }} />
      <div style={{
        fontFamily: "'Cormorant Garamond', serif",
        fontSize: "36px", fontWeight: 500, color: "#29251F", marginBottom: "20px",
        letterSpacing: "-0.3px", lineHeight: 1.15,
      }}>Subscribe for <em style={{ color: "#C2A45B" }}>Updates</em></div>
      <div className="sub-box">
        <p style={{ fontSize: "16px", color: "#6B6257", lineHeight: 1.65, fontFamily: "'DM Sans', sans-serif" }}>
          The research you need to understand Ethereum and the future of finance from the Etherealize team.
        </p>
        <form className="sub-row" onSubmit={handleSubscribe}>
          <input type="email" className="sub-input" placeholder="you@example.com"
            value={email} onChange={e => setEmail(e.target.value)} />
          <button type="submit" className="sub-btn">Subscribe</button>
        </form>
        <div style={{ fontSize: "13px", color: "#8A8075", marginTop: "14px" }}>
          Powered by Substack · No spam, unsubscribe anytime
        </div>
      </div>
    </div>
  );
}

export function SiteFooter() {
  return (
    <footer className="site-footer">
      <style>{`
        .site-footer {
          max-width: 720px;
          margin: 0 auto;
          padding: 96px 32px 64px;
          font-family: 'DM Sans', sans-serif;
          font-size: 13px;
          line-height: 1.7;
          color: var(--muted-warmer);
          border-top: 1px solid var(--hairline);
          margin-top: 40px;
        }
        .site-footer-block { margin-bottom: 18px; }
        .site-footer-title {
          color: var(--ink-soft);
          font-weight: 500;
        }
        .site-footer a {
          color: var(--muted-warmer);
          text-decoration: none;
          border-bottom: 1px solid var(--hairline);
          transition: color 0.2s, border-color 0.2s;
        }
        .site-footer a:hover { color: var(--gold-deep); border-color: var(--gold-deep); }
        .site-footer-disclosures {
          margin: 22px 0;
          color: var(--muted-warm);
        }
        .site-footer-disclosures-label {
          font-weight: 500;
          color: var(--ink-soft);
          margin-bottom: 8px;
        }
        .site-footer-disclosures-body {
          max-width: 65ch;
          font-size: 13px;
          line-height: 1.7;
          color: var(--muted-warm);
        }
        .site-footer-copy {
          margin-top: 20px;
          font-size: 12px;
          color: var(--muted-warm);
        }
        .site-footer-copy .site-footer-brand {
          color: inherit;
          text-decoration: none;
          border-bottom: none;
        }
        .site-footer-copy .site-footer-brand:hover {
          text-decoration: underline;
          text-decoration-thickness: 1px;
          text-underline-offset: 3px;
        }
        @media (max-width: 600px) {
          .site-footer { padding: 72px 20px 56px; }
        }
      `}</style>
      <div className="site-footer-disclosures">
        <div className="site-footer-disclosures-label">Disclaimer</div>
        <div className="site-footer-disclosures-body">
          This report is for informational purposes only and does not constitute investment advice, a solicitation, or a recommendation to buy or sell any asset. The views expressed are those of Etherealize Research and do not represent the views of any affiliated organization. Cryptocurrency investments involve substantial risk, including the possible loss of principal. Past performance is not indicative of future results. Readers should conduct their own research and consult with qualified financial advisors before making investment decisions. Etherealize and its affiliates may hold positions in the assets discussed.
        </div>
      </div>
      <div className="site-footer-copy">
        {"\u00A9"} 2026 <a href="https://etherealize.com" target="_blank" rel="noopener noreferrer" className="site-footer-brand">Etherealize</a>. All rights reserved.
      </div>
    </footer>
  );
}
