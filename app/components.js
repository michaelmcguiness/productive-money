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
      <path d="M127.961 0L125.166 9.5V285.168L127.961 287.958L255.923 212.32L127.961 0Z" fill="rgba(130,148,252,0.6)" />
      <path d="M127.962 0L0 212.32L127.962 287.958V154.158V0Z" fill="rgba(130,148,252,0.9)" />
      <path d="M127.961 312.187L126.386 314.106V412.306L127.961 416.905L255.999 236.587L127.961 312.187Z" fill="rgba(130,148,252,0.6)" />
      <path d="M127.962 416.905V312.187L0 236.587L127.962 416.905Z" fill="rgba(130,148,252,0.9)" />
      <path d="M127.961 287.958L255.921 212.32L127.961 154.159V287.958Z" fill="rgba(80,100,200,0.7)" />
      <path d="M0.001 212.32L127.961 287.958V154.159L0.001 212.32Z" fill="rgba(130,148,252,0.5)" />
    </svg>
  );
}

const COMPARISON_DATA = [
  { attr: "Scarcity", gold: "\u25D0", btc: "\u25CF", eth: "\u25CF", note: "ETH issuance capped at 1.5% annually; burn can make deflationary" },
  { attr: "Fungibility", gold: "\u25CF", btc: "\u25D0", eth: "\u25D0", note: "ZK privacy pools give ETH a path forward" },
  { attr: "Divisibility", gold: "\u25D0", btc: "\u25CF", eth: "\u25CF", note: "18 decimal places" },
  { attr: "Portability", gold: "\u25CB", btc: "\u25CF", eth: "\u25CF", note: "Settles globally in seconds" },
  { attr: "Durability", gold: "\u25CF", btc: "\u25D0", eth: "\u25CF", note: "Proof-of-stake is more secure than proof-of-work" },
  { attr: "Verifiability", gold: "\u25D0", btc: "\u25CF", eth: "\u25CF", note: "Fully auditable on-chain" },
  { attr: "Censorship Resistance", gold: "\u25CB", btc: "\u25D0", eth: "\u25CF", note: "Forced inclusion guarantees" },
  { attr: "Low Carrying Cost", gold: "\u25CB", btc: "\u25D0", eth: "\u25CF", note: "Negative carrying cost via staking" },
  { attr: "Productive / Compounds", gold: "\u25CB", btc: "\u25CB", eth: "\u25CF", note: "~3.2% yield, no counterparty" },
];

function ratingColor(value, baseColor) {
  if (value === "\u25CF") return baseColor;
  if (value === "\u25D0") {
    if (baseColor === "#c9a84c") return "rgba(201,168,76,0.5)";
    if (baseColor === "#f7931a") return "rgba(247,147,26,0.5)";
    return "rgba(130,148,252,0.5)";
  }
  if (baseColor === "#c9a84c") return "rgba(201,168,76,0.2)";
  if (baseColor === "#f7931a") return "rgba(247,147,26,0.2)";
  return "rgba(130,148,252,0.2)";
}

export function ComparisonTable() {
  return (
    <div style={{
      background: "#0d0e20", borderRadius: "8px", overflow: "hidden",
      border: "1px solid rgba(130,148,252,0.08)"
    }}>
      <table style={{ width: "100%", borderCollapse: "collapse", fontSize: "14px" }}>
        <thead>
          <tr style={{ borderBottom: "1px solid rgba(130,148,252,0.12)" }}>
            <th style={{ padding: "18px 20px", textAlign: "left", fontWeight: 500, color: "#6b6c88", fontSize: "11px", letterSpacing: "1.5px", textTransform: "uppercase" }}>Attribute</th>
            <th style={{ padding: "18px 20px", textAlign: "center", fontWeight: 500, color: "#c9a84c", fontSize: "11px", letterSpacing: "1.5px", textTransform: "uppercase" }}>Gold</th>
            <th style={{ padding: "18px 20px", textAlign: "center", fontWeight: 500, color: "#f7931a", fontSize: "11px", letterSpacing: "1.5px", textTransform: "uppercase" }}>Bitcoin</th>
            <th style={{ padding: "18px 20px", textAlign: "center", fontWeight: 500, color: "#8294fc", fontSize: "11px", letterSpacing: "1.5px", textTransform: "uppercase" }}>ETH</th>
          </tr>
        </thead>
        <tbody>
          {COMPARISON_DATA.map((row, i) => (
            <tr key={i} style={{ borderBottom: "1px solid rgba(130,148,252,0.06)" }}>
              <td style={{ padding: "14px 20px" }}>
                <div style={{ color: "#e4e4ef", fontWeight: 500, marginBottom: "2px" }}>{row.attr}</div>
                <div style={{ color: "#6b6c88", fontSize: "12px" }}>{row.note}</div>
              </td>
              <td style={{ padding: "14px 20px", textAlign: "center", fontSize: "18px", color: ratingColor(row.gold, "#c9a84c") }}>{row.gold}</td>
              <td style={{ padding: "14px 20px", textAlign: "center", fontSize: "18px", color: ratingColor(row.btc, "#f7931a") }}>{row.btc}</td>
              <td style={{ padding: "14px 20px", textAlign: "center", fontSize: "18px", color: ratingColor(row.eth, "#8294fc") }}>{row.eth}</td>
            </tr>
          ))}
        </tbody>
      </table>
      <div style={{ padding: "14px 20px", fontSize: "11px", color: "#6b6c88", display: "flex", gap: "20px", borderTop: "1px solid rgba(130,148,252,0.06)" }}>
        <span>{"\u25CF"} Superior</span>
        <span>{"\u25D0"} Adequate</span>
        <span>{"\u25CB"} Weak</span>
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
    <div ref={chartRef} style={{
      background: "#0d0e20", borderRadius: "8px", overflow: "hidden",
      border: "1px solid rgba(130,148,252,0.08)", padding: "32px 16px 20px"
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
            <stop offset="0%" stopColor="rgba(130,148,252,0.15)" />
            <stop offset="100%" stopColor="rgba(130,148,252,0)" />
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
        <g clipPath={`url(#${clipId})`}>
          <path d={ethArea} fill={`url(#${gradId})`} />
          <path d={flatPath} fill="none" stroke="#c9a84c" strokeWidth="2" strokeDasharray="6,4" />
          <path d={flatPath} fill="none" stroke="#f7931a" strokeWidth="2" strokeDasharray="6,4" />
          <path d={ethPath} fill="none" stroke="#8294fc" strokeWidth="2.5" filter={`url(#${glowId})`} />
        </g>
        {animated && !done && (
          <g>
            <circle cx={labelX} cy={labelY} r="4"
              fill="#8294fc" filter={`url(#${glowId})`} />
            <rect x={labelX - 52} y={labelY - 32}
              width="104" height="24" rx="4" fill="rgba(5,5,16,0.92)"
              stroke="rgba(130,148,252,0.25)" strokeWidth="1" />
            <text x={labelX} y={labelY - 16}
              fill="#a0b0ff" fontSize="11" fontFamily="'JetBrains Mono', monospace"
              textAnchor="middle" fontWeight="500">
              Yr {currentYearInt}: {currentValDisplay} ETH
            </text>
          </g>
        )}
        {done && (
          <circle cx={xScale(YEARS)} cy={yScale(ethData[YEARS])} r="4"
            fill="#8294fc" filter={`url(#${glowId})`} />
        )}
        <text x={W - PAD.right + 10} y={yScale(100) - 12}
          fill="#c9a84c" fontSize="11" fontFamily="'JetBrains Mono', monospace"
          style={{ opacity: animated ? 1 : 0, transition: "opacity 0.5s ease 0.3s" }}>
          Gold
        </text>
        <text x={W - PAD.right + 10} y={yScale(100) + 4}
          fill="#c9a84c" fontSize="10" fontFamily="'JetBrains Mono', monospace"
          style={{ opacity: animated ? 1 : 0, transition: "opacity 0.5s ease 0.3s" }}>
          100 oz
        </text>
        <text x={W - PAD.right + 10} y={yScale(100) + 22}
          fill="#f7931a" fontSize="11" fontFamily="'JetBrains Mono', monospace"
          style={{ opacity: animated ? 1 : 0, transition: "opacity 0.5s ease 0.3s" }}>
          Bitcoin
        </text>
        <text x={W - PAD.right + 10} y={yScale(100) + 36}
          fill="#f7931a" fontSize="10" fontFamily="'JetBrains Mono', monospace"
          style={{ opacity: animated ? 1 : 0, transition: "opacity 0.5s ease 0.3s" }}>
          100 BTC
        </text>
        <text x={W - PAD.right + 10} y={yScale(ethData[YEARS]) - 6}
          fill="#8294fc" fontSize="11" fontFamily="'JetBrains Mono', monospace"
          fontWeight="600"
          style={{ opacity: done ? 1 : 0, transition: "opacity 0.5s ease" }}>
          ETH
        </text>
        <text x={W - PAD.right + 10} y={yScale(ethData[YEARS]) + 8}
          fill="#8294fc" fontSize="10" fontFamily="'JetBrains Mono', monospace"
          style={{ opacity: done ? 1 : 0, transition: "opacity 0.5s ease" }}>
          {ethData[YEARS].toFixed(0)} ETH
        </text>
        {done && hoverYear !== null && (
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
              Yr {hoverYear}: {Math.round(ethData[hoverYear])} ETH
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
          <span style={{ fontSize: "12px", color: "#6b6c88" }}>Gold (0% yield)</span>
        </div>
        <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
          <div style={{ width: "16px", height: "2px", background: "#f7931a" }} />
          <span style={{ fontSize: "12px", color: "#6b6c88" }}>Bitcoin (0% yield)</span>
        </div>
        <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
          <div style={{ width: "16px", height: "2px", background: "#8294fc" }} />
          <span style={{ fontSize: "12px", color: "#6b6c88" }}>ETH staked (3.2% compound)</span>
        </div>
      </div>
      <div style={{
        textAlign: "center", marginTop: "12px",
        fontFamily: "'EB Garamond', serif", fontSize: "14px", fontStyle: "italic", color: "#6b6c88"
      }}>
        Assumes 3.2% staking yield compounded annually. No counterparty risk. Net ETH supply has been flat-to-deflationary since the Merge due to EIP-1559 fee burns. Hover for details.
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
  const combinedTag = fmtTag(combinedParityPrice);

  const milestones = [
    { price: ethPrice, label: "Today", tag: fmtTag(ethPrice), mcap: fmtMcap(ethMcap), color: "#5a5b78" },
    { price: btcParityPrice, label: "Bitcoin parity", tag: fmtTag(btcParityPrice), mcap: fmtMcap(ethMcap + btcMcap), color: "#f7931a" },
    { price: goldParityPrice, label: "Gold parity", tag: fmtTag(goldParityPrice), mcap: fmtMcap(ethMcap + goldMonetaryPremium), color: "#c9a84c" },
    { price: combinedParityPrice, label: "Gold + Bitcoin", tag: fmtTag(combinedParityPrice), mcap: fmtMcap(ethMcap + goldMonetaryPremium + btcMcap), color: "#8294fc" },
  ];

  const W = 760;
  const H = 420;
  const PAD = { top: 60, right: 24, bottom: 50, left: 90 };
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
    <div ref={ref} style={{
      background: "#0d0e20", borderRadius: "8px", overflow: "hidden",
      border: "1px solid rgba(130,148,252,0.08)", padding: "24px 8px 12px",
    }}>
      <div style={{ textAlign: "center", marginBottom: "4px", padding: "0 16px" }}>
        <div style={{
          fontSize: "10px", fontWeight: 600, letterSpacing: "3px",
          textTransform: "uppercase", color: "#8294fc", marginBottom: "10px",
          fontFamily: "'Inter', sans-serif",
        }}>
          Ethereum and the era of productive money
        </div>
        <div style={{
          fontSize: "20px", fontWeight: 700, letterSpacing: "-0.3px",
          fontFamily: "'Inter', sans-serif",
        }}>
          <span style={{ color: "#fff" }}>The Path to </span>
          <span style={{
            background: "linear-gradient(135deg, #8294fc, #b8c4ff)",
            WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent",
            backgroundClip: "text",
          }}>{combinedTag} ETH</span>
        </div>
      </div>
      {loading ? (
        <div style={{ textAlign: "center", padding: "120px 0", color: "#6b6c88", fontSize: "14px", fontFamily: "'Inter', sans-serif" }}>
          Loading live data{"\u2026"}
        </div>
      ) : (
      <svg viewBox={`0 0 ${W} ${H}`} style={{ width: "100%", height: "auto", display: "block" }}
        onMouseLeave={() => setHoveredIdx(null)}>
        <defs>
          <linearGradient id={pathGradId} x1="0" y1="0" x2="1" y2="0">
            <stop offset="0%" stopColor="#5a5b78" />
            <stop offset="30%" stopColor="#f7931a" />
            <stop offset="85%" stopColor="#c9a84c" />
            <stop offset="100%" stopColor="#8294fc" />
          </linearGradient>
          <linearGradient id={areaGradId} x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="rgba(130,148,252,0.12)" />
            <stop offset="100%" stopColor="rgba(130,148,252,0)" />
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
              stroke="rgba(130,148,252,0.05)" strokeWidth="1" />
            <text x={PAD.left - 14} y={yScale(p) + 4}
              fill="#3a3b50" fontSize="10" fontFamily="'JetBrains Mono', monospace"
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
      )}
      <div style={{
        textAlign: "center", padding: "8px 20px 4px",
        fontFamily: "'EB Garamond', serif", fontSize: "13px", fontStyle: "italic", color: "#6b6c88",
        lineHeight: 1.6,
      }}>
        Gold monetary premium estimated at 90% of total market capitalization, with the remainder attributable to industrial and decorative utility. Bitcoin{"'"}s entire market cap is treated as monetary premium. All milestone prices include ETH{"'"}s current market cap as the base. Data from CoinGecko, updates every 10 minutes.
        {lastUpdated && (
          <span style={{ display: "block", marginTop: "4px", fontSize: "11px", color: "#5a5b78" }}>
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
    <div className="ld-root" style={{ fontFamily: "'Inter', sans-serif", maxWidth: 1100, margin: "0 auto" }}>
      <style>{`
        .ld-hero-card { padding: 44px 40px 40px; }
        .ld-price-row { display: flex; align-items: stretch; justify-content: center; gap: 0; max-width: 720px; margin: 0 auto 36px; }
        .ld-price-cell { flex: 1; padding: 24px 20px; text-align: center; }
        .ld-price-val { font-family: 'JetBrains Mono', monospace; font-size: 30px; font-weight: 600; }
        .ld-headline-pct { font-family: 'JetBrains Mono', monospace; font-size: 48px; font-weight: 700; color: #a0b0ff; letter-spacing: -1px; }
        .ld-upside-cell { padding: 24px 28px; text-align: center; display: flex; flex-direction: column; justify-content: center; }
        .ld-arrow { display: flex; align-items: center; padding: 0 4px; color: #6b6c88; }
        .ld-sep { width: 1px; background: rgba(130,148,252,0.1); margin: 12px 0; }
        .ld-grid { display: grid; grid-template-columns: repeat(4, 1fr); gap: 1px; background: rgba(130,148,252,0.08); border-radius: 8px; overflow: hidden; }
        .ld-grid-cell { background: #0d0e20; padding: 24px 20px; }
        .ld-grid-label { font-size: 11px; font-weight: 500; letter-spacing: 1.2px; text-transform: uppercase; color: #6b6c88; margin-bottom: 12px; }
        .ld-grid-val { font-family: 'JetBrains Mono', monospace; font-size: 22px; font-weight: 500; margin-bottom: 4px; }
        .ld-grid-sub { font-size: 12px; color: #6b6c88; line-height: 1.4; }
        .ld-label { font-size: 11px; font-weight: 500; letter-spacing: 1.5px; text-transform: uppercase; color: #6b6c88; margin-bottom: 10px; }
        .ld-progress-label { font-size: 12px; }
        .ld-footer { text-align: center; font-size: 12px; color: #3a3b50; margin-top: 12px; line-height: 1.6; }
        .ld-section-sub { font-size: 14px; color: #6b6c88; margin-bottom: 32px; line-height: 1.5; }
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
      <div style={{ fontSize: "12px", fontWeight: 600, letterSpacing: "3px", textTransform: "uppercase", color: "#8294fc", marginBottom: "12px" }}>
        Live Dashboard
      </div>
      <div className="ld-section-sub">
        Live data showing where ETH stands today relative to the monetary premium it could absorb.
      </div>

      {/* ─── HERO CARD ─── */}
      <div className="ld-hero-card" style={{
        background: "#0d0e20", borderRadius: "12px",
        border: "1px solid rgba(130,148,252,0.1)",
        marginBottom: "16px",
        position: "relative", overflow: "hidden",
      }}>
        {/* Glow */}
        <div style={{
          position: "absolute", top: "-50%", left: "50%", transform: "translateX(-50%)",
          width: "700px", height: "500px",
          background: "radial-gradient(ellipse, rgba(130,148,252,0.04), transparent 70%)",
          pointerEvents: "none",
        }} />

        {/* Headline percentage */}
        <div style={{ textAlign: "center", marginBottom: "36px", position: "relative" }}>
          <div style={{ fontSize: "14px", color: "#6b6c88", marginBottom: "4px", lineHeight: 1.5 }}>
            ETH has captured
          </div>
          <span className="ld-headline-pct">
            {d ? pct.toFixed(2) + "%" : "\u2014"}
          </span>
          <div style={{ fontSize: "14px", color: "#6b6c88", marginTop: "4px" }}>
            of the combined monetary premium of gold and Bitcoin
          </div>
        </div>

        {/* Price comparison row */}
        <div className="ld-price-row" style={{
          background: "rgba(130,148,252,0.04)",
          borderRadius: "8px", border: "1px solid rgba(130,148,252,0.06)",
          overflow: "hidden",
        }}>
          <div className="ld-price-cell">
            <div className="ld-label">ETH Today</div>
            <div className="ld-price-val" style={{ color: "#e4e4ef" }}>
              {d ? fmtPrice(d.ethPrice) : "\u2014"}
            </div>
          </div>
          <div className="ld-arrow">
            <svg width="32" height="16" viewBox="0 0 32 16" fill="none">
              <path d="M0 8H28M28 8L22 2M28 8L22 14" stroke="#6b6c88" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
          </div>
          <div className="ld-price-cell">
            <div className="ld-label">Implied at Parity</div>
            <div className="ld-price-val" style={{ color: "#a0b0ff" }}>
              {d ? fmtPrice(d.impliedPrice) : "\u2014"}
            </div>
          </div>
          <div className="ld-sep" />
          <div className="ld-upside-cell">
            <div className="ld-label">Upside</div>
            <div className="ld-price-val" style={{ fontWeight: 700, color: "#4ade80" }}>
              {d ? upside + "x" : "\u2014"}
            </div>
          </div>
        </div>

        {/* Progress visualization */}
        <div style={{ maxWidth: "640px", margin: "0 auto" }}>
          <div className="ld-progress-label" style={{ display: "flex", justifyContent: "space-between", marginBottom: "8px" }}>
            <span style={{ color: "#6b6c88" }}>$0</span>
            <span style={{ color: "#6b6c88" }}>Target: {d ? fmt(d.combinedTarget) : "\u2014"}</span>
          </div>
          <div style={{ position: "relative", height: "28px" }}>
            <div style={{
              position: "absolute", top: "10px", left: 0, right: 0, height: "8px",
              background: "rgba(130,148,252,0.06)", borderRadius: "4px",
            }} />
            <div style={{
              position: "absolute", top: "10px", left: 0, height: "8px", borderRadius: "4px",
              width: animate && d ? `${Math.max(pct, 0.8)}%` : "0%",
              background: "linear-gradient(90deg, #8294fc, #a0b0ff)",
              boxShadow: "0 0 16px rgba(130,148,252,0.5), 0 0 4px rgba(130,148,252,0.8)",
              transition: "width 1.5s cubic-bezier(0.16, 1, 0.3, 1) 0.3s",
            }} />
            <div style={{
              position: "absolute", top: "6px",
              left: animate && d ? `${Math.max(pct, 0.8)}%` : "0%",
              width: "16px", height: "16px", borderRadius: "50%",
              background: "#a0b0ff",
              boxShadow: "0 0 12px rgba(130,148,252,0.6), 0 0 4px rgba(160,176,255,0.9)",
              transform: "translateX(-8px)",
              transition: "left 1.5s cubic-bezier(0.16, 1, 0.3, 1) 0.3s",
            }} />
          </div>
          <div className="ld-progress-label" style={{ display: "flex", justifyContent: "space-between", marginTop: "6px" }}>
            <span style={{ color: "#8294fc" }}>
              ETH: {d ? fmt(d.ethMcap) : "\u2014"} ({d ? pct.toFixed(2) : "0"}%)
            </span>
            <span style={{ color: "#6b6c88" }}>
              {d ? (100 - pct).toFixed(1) : "100"}% remaining
            </span>
          </div>
        </div>
      </div>

      {/* ─── METRICS GRID ─── */}
      <div className="ld-grid">
        {(d ? [
          { label: "Gold Monetary Premium", value: fmt(d.goldMonetaryPremium), sub: "~90% of total gold market cap", color: "#c9a84c" },
          { label: "Bitcoin Monetary Premium", value: fmt(d.btcMcap), sub: `100% of market cap (${fmtPrice(d.btcPrice)} / BTC)`, color: "#f7931a" },
          { label: "ETH Market Cap", value: fmt(d.ethMcap), sub: `${pct.toFixed(2)}% of target`, color: "#8294fc" },
          { label: "Combined Target", value: fmt(d.combinedTarget), sub: "Gold premium + Bitcoin + ETH", color: "#a0b0ff" },
          { label: "Staking Yield", value: d.stakingYield.toFixed(1) + "%", sub: "No counterparty risk", color: "#4ade80" },
          { label: "Supply Staked", value: d.pctStaked.toFixed(1) + "%", sub: `~${(d.ethStakedAmount / 1e6).toFixed(1)}M ETH locked`, color: "#e4e4ef" },
          { label: "DeFi TVL", value: d.tvl ? fmt(d.tvl) : "\u2014", sub: `~${d.defiMarketShare || "54"}% of all DeFi across all chains`, color: "#e4e4ef" },
          { label: "Supply Equilibrium", value: (d.supplyEquilibrium / 1e6).toFixed(1) + "M", sub: "Long-term supply converges, not inflates", color: "#e4e4ef" },
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
                <div style={{ height: "10px", width: "50%", background: "rgba(130,148,252,0.06)", borderRadius: "3px", marginBottom: "14px" }} />
                <div style={{ height: "22px", width: "70%", background: "rgba(130,148,252,0.08)", borderRadius: "4px" }} />
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

const SHARE_TEXT = "\u201CEthereum and the Era of Productive Money\u201D - Why ETH is better money than gold and Bitcoin by every measure.\n\nRead the new whitepaper from @Etherealize_io & @BitMNR explaining their $300,000 per ETH price target.";

export function ShareFab() {
  const [visible, setVisible] = useState(false);
  const [open, setOpen] = useState(false);
  const [copied, setCopied] = useState(false);
  const fabRef = useRef(null);

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

  const shareX = () => {
    window.open(
      `https://x.com/intent/tweet?text=${encodeURIComponent(SHARE_TEXT)}&url=${encodeURIComponent(url)}`,
      "_blank", "noopener,noreferrer"
    );
    setOpen(false);
  };

  const shareLinkedIn = () => {
    const linkedInUrl = `https://www.linkedin.com/feed/?shareActive=true&text=${encodeURIComponent(
      "\u201CEthereum and the Era of Productive Money\u201D \u2014 Why ETH is better money than gold and Bitcoin by every measure.\n\nRead the new whitepaper from Etherealize and Bitmine explaining their $300,000 per ETH price target.\n\n" + url
    )}`;
    window.open(linkedInUrl, "_blank", "noopener,noreferrer");
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
          background: rgba(130,148,252,0.15); backdrop-filter: blur(12px);
          border: 1px solid rgba(130,148,252,0.25);
          color: #a0b0ff; cursor: pointer;
          display: flex; align-items: center; justify-content: center;
          transition: all 0.2s ease;
          box-shadow: 0 4px 20px rgba(0,0,0,0.3);
        }
        .share-fab-btn:hover { background: rgba(130,148,252,0.25); transform: scale(1.05); }
        .share-pop { display: flex; flex-direction: column; gap: 0; overflow: hidden; }
        .share-opt {
          display: flex; align-items: center; gap: 10px;
          padding: 12px 16px; background: none; border: none;
          color: #e4e4ef; font-family: 'Inter', sans-serif; font-size: 13px;
          cursor: pointer; transition: background 0.15s; text-align: left; width: 100%;
        }
        .share-opt:hover { background: rgba(130,148,252,0.08); }
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
          background: "rgba(13,14,32,0.95)", backdropFilter: "blur(16px)",
          border: "1px solid rgba(130,148,252,0.15)", borderRadius: "10px",
          minWidth: "210px",
          boxShadow: "0 8px 32px rgba(0,0,0,0.4)",
          animation: "sharePopIn 0.2s ease",
        }}>
          <div style={{
            padding: "10px 16px 6px", fontSize: "10px", fontWeight: 600,
            letterSpacing: "1.5px", textTransform: "uppercase", color: "#6b6c88",
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
