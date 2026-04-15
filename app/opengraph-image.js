import { ImageResponse } from "next/og";

export const alt = "Ethereum and the Era of Productive Money — The Path to $300,000 ETH";
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

const GOLD_OZ = 6.7e9;
const GOLD_MONETARY_RATIO = 0.9;

function fmtPrice(n) {
  return "$" + Math.round(n).toLocaleString("en-US");
}

export default async function Image() {
  let ethPrice = 2034;
  let impliedPrice = 240000;
  let ethMcap = 245e9;
  let btcMcap = 1.4e12;
  let goldMonetaryPremium = 4500 * GOLD_OZ * GOLD_MONETARY_RATIO;

  try {
    const res = await fetch(
      "https://api.coingecko.com/api/v3/simple/price?ids=ethereum,bitcoin,tether-gold&vs_currencies=usd&include_market_cap=true",
      { next: { revalidate: 600 } }
    );
    const cg = await res.json();
    ethPrice = cg.ethereum.usd;
    ethMcap = cg.ethereum.usd_market_cap;
    btcMcap = cg.bitcoin.usd_market_cap;
    const goldSpot = cg["tether-gold"]?.usd || 4500;
    goldMonetaryPremium = goldSpot * GOLD_OZ * GOLD_MONETARY_RATIO;
    const ethSupply = ethMcap / ethPrice;
    const combinedTarget = ethMcap + goldMonetaryPremium + btcMcap;
    impliedPrice = combinedTarget / ethSupply;
  } catch {
    // use fallbacks
  }

  return new ImageResponse(
    (
      <div
        style={{
          width: "1200px",
          height: "630px",
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "center",
          background: "#F5F2EC",
          position: "relative",
        }}
      >
        {/* Subtle radial glow */}
        <div
          style={{
            display: "flex",
            position: "absolute",
            top: "-100px",
            left: "50%",
            transform: "translateX(-50%)",
            width: "800px",
            height: "600px",
            background: "radial-gradient(ellipse, rgba(194,164,91,0.1), transparent 70%)",
          }}
        />

        {/* Overline */}
        <div
          style={{
            display: "flex",
            fontSize: "14px",
            fontWeight: 600,
            letterSpacing: "4px",
            textTransform: "uppercase",
            color: "#C2A45B",
            marginBottom: "20px",
          }}
        >
          A Report By Etherealize
        </div>

        {/* ETH diamond (simple) */}
        <div
          style={{
            display: "flex",
            width: "0",
            height: "0",
            borderLeft: "18px solid transparent",
            borderRight: "18px solid transparent",
            borderBottom: "30px solid #29251F",
            marginBottom: "6px",
          }}
        />
        <div
          style={{
            display: "flex",
            width: "0",
            height: "0",
            borderLeft: "18px solid transparent",
            borderRight: "18px solid transparent",
            borderTop: "18px solid rgba(41,37,31,0.6)",
            marginBottom: "28px",
          }}
        />

        {/* Title */}
        <div
          style={{
            display: "flex",
            fontSize: "42px",
            fontWeight: 700,
            color: "#29251F",
            letterSpacing: "-1px",
            marginBottom: "8px",
          }}
        >
          Ethereum and the Era of
        </div>
        <div
          style={{
            display: "flex",
            fontSize: "52px",
            fontWeight: 700,
            color: "#C2A45B",
            letterSpacing: "-1px",
            marginBottom: "32px",
          }}
        >
          Productive Money
        </div>

        {/* Dynamic price line */}
        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: "16px",
            marginBottom: "16px",
          }}
        >
          <div
            style={{
            display: "flex",
              fontSize: "20px",
              color: "#8A8075",
            }}
          >
            The path from
          </div>
          <div
            style={{
            display: "flex",
              fontSize: "28px",
              fontWeight: 700,
              color: "#29251F",
            }}
          >
            {fmtPrice(ethPrice)}
          </div>
          <div
            style={{
            display: "flex",
              fontSize: "20px",
              color: "#8A8075",
            }}
          >
            to
          </div>
          <div
            style={{
            display: "flex",
              fontSize: "28px",
              fontWeight: 700,
              color: "#C2A45B",
            }}
          >
            {fmtPrice(impliedPrice)} ETH
          </div>
        </div>

        {/* Subtitle */}
        <div
          style={{
            display: "flex",
            fontSize: "18px",
            color: "#8A8075",
            marginTop: "8px",
          }}
        >
          Ether is better money than gold and Bitcoin by every measure.
        </div>

        {/* Bottom bar */}
        <div
          style={{
            display: "flex",
            position: "absolute",
            bottom: "0",
            left: "0",
            right: "0",
            height: "4px",
            background: "linear-gradient(90deg, #C2A45B, #D4B775, #C2A45B)",
          }}
        />
      </div>
    ),
    {
      ...size,
    }
  );
}
