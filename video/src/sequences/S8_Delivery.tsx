import React from "react";
import { AbsoluteFill, interpolate, spring, useCurrentFrame, useVideoConfig } from "remotion";
import { C, FONTS, hexA } from "../theme";
import { Mono } from "../components/hud/primitives";
import { Grid } from "../components/Effects";
import { useFade, ramp } from "../util/anim";

const DOCS = [
  { title: "Inspection Report", sub: "MBIS · draft, signed-ready", icon: "doc" },
  { title: "3D Defect Map", sub: "geo-located · mm-measured", icon: "map" },
  { title: "Building-Health Record", sub: "time-series · risk score", icon: "pulse" },
];

const RECIPIENTS = [
  { k: "Registered Inspector", v: "verifies & signs" },
  { k: "Owner / OC", v: "compliance report" },
  { k: "Insurer · Bank", v: "risk-data layer" },
];

export const S8_Delivery: React.FC = () => {
  const frame = useCurrentFrame();
  const { durationInFrames, fps } = useVideoConfig();
  const fade = useFade(durationInFrames, 12, 16);

  const headerP = ramp(frame, 6, 28);
  const deliveredP = spring({ frame: frame - 150, fps, config: { damping: 12, mass: 0.7 } });
  const beamP = ramp(frame, 70, 110);

  return (
    <AbsoluteFill style={{ background: `radial-gradient(120% 100% at 50% 30%, #0a141c, ${C.bgDeep})`, opacity: fade }}>
      <Grid opacity={0.06} size={80} />

      {/* header */}
      <div style={{ position: "absolute", top: 120, left: 0, right: 0, textAlign: "center", opacity: headerP }}>
        <Mono size={14} color={C.cyan} spacing={5}>FACADIA · OUTPUT</Mono>
        <h2 style={{ fontFamily: FONTS.display, fontWeight: 700, fontSize: 40, color: C.textHi, margin: "10px 0 0" }}>
          Generated, signed-ready, <span style={{ color: C.cyan }}>delivered.</span>
        </h2>
      </div>

      {/* document cards */}
      <div style={{ position: "absolute", top: 300, left: 0, right: 0, display: "flex", justifyContent: "center", gap: 30 }}>
        {DOCS.map((d, i) => {
          const sp = spring({ frame: frame - (24 + i * 10), fps, config: { damping: 15, mass: 0.7 } });
          const checked = frame > 70 + i * 8;
          return (
            <div
              key={i}
              style={{
                width: 300,
                opacity: sp,
                transform: `translateY(${(1 - sp) * 30}px)`,
                background: hexA("#0b1620", 0.9),
                border: `1px solid ${hexA(C.cyan, 0.3)}`,
                borderRadius: 14,
                padding: 24,
                boxShadow: `0 20px 60px ${hexA("#000", 0.5)}`,
              }}
            >
              <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 16 }}>
                <Icon kind={d.icon} />
                <Check on={checked} />
              </div>
              <div style={{ fontFamily: FONTS.display, fontWeight: 700, fontSize: 22, color: C.textHi }}>{d.title}</div>
              <Mono size={12} dim spacing={1} glowPx={0} style={{ display: "block", marginTop: 6 }}>{d.sub}</Mono>
              {/* faux content lines */}
              <div style={{ marginTop: 16, display: "flex", flexDirection: "column", gap: 7 }}>
                {[0.9, 0.7, 0.8, 0.5].map((w, j) => (
                  <div key={j} style={{ height: 5, width: `${w * 100}%`, borderRadius: 3, background: hexA(C.cyan, 0.14) }} />
                ))}
              </div>
            </div>
          );
        })}
      </div>

      {/* transmit beam */}
      <div style={{ position: "absolute", top: 590, left: 0, right: 0, display: "flex", justifyContent: "center" }}>
        <div style={{ width: 760, height: 2, background: `linear-gradient(90deg, transparent, ${hexA(C.cyan, 0.6)}, transparent)`, opacity: beamP, position: "relative" }}>
          <div style={{ position: "absolute", left: `${beamP * 100}%`, top: -3, width: 60, height: 8, marginLeft: -60, background: `linear-gradient(90deg, transparent, ${C.cyanBright})`, filter: `drop-shadow(0 0 8px ${C.cyan})` }} />
        </div>
      </div>

      {/* recipients */}
      <div style={{ position: "absolute", bottom: 180, left: 0, right: 0, display: "flex", justifyContent: "center", gap: 24 }}>
        {RECIPIENTS.map((r, i) => {
          const a = ramp(frame, 96 + i * 12, 116 + i * 12);
          return (
            <div key={i} style={{ display: "flex", alignItems: "center", gap: 12, padding: "12px 20px", borderRadius: 10, background: hexA(C.cyan, 0.06 * a), border: `1px solid ${hexA(C.cyan, 0.4 * a)}`, opacity: 0.3 + 0.7 * a }}>
              <Check on={a > 0.6} small />
              <div>
                <div style={{ fontFamily: FONTS.display, fontWeight: 600, fontSize: 17, color: C.textHi }}>{r.k}</div>
                <Mono size={11} dim spacing={1} glowPx={0}>{r.v}</Mono>
              </div>
            </div>
          );
        })}
      </div>

      {/* DELIVERED stamp */}
      <div style={{ position: "absolute", bottom: 96, left: 0, right: 0, display: "flex", justifyContent: "center", opacity: Math.min(1, deliveredP), transform: `scale(${0.9 + Math.min(1, deliveredP) * 0.1})` }}>
        <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
          <Check on big />
          <span style={{ fontFamily: FONTS.mono, fontWeight: 700, fontSize: 22, letterSpacing: 6, color: C.cyan, textShadow: `0 0 16px ${hexA(C.cyan, 0.7)}` }}>ALL DOCUMENTS DELIVERED</span>
        </div>
      </div>
    </AbsoluteFill>
  );
};

const Check: React.FC<{ on?: boolean; small?: boolean; big?: boolean }> = ({ on, small, big }) => {
  const s = big ? 30 : small ? 18 : 24;
  return (
    <svg width={s} height={s} viewBox="0 0 24 24" fill="none" style={{ opacity: on ? 1 : 0.18, transition: "opacity 0.2s" }}>
      <circle cx="12" cy="12" r="11" stroke={C.cyan} strokeWidth="1.5" fill={on ? hexA(C.cyan, 0.15) : "none"} />
      <path d="M7 12.5 L10.5 16 L17 8.5" stroke={C.cyan} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ filter: on ? `drop-shadow(0 0 4px ${C.cyan})` : "none" }} />
    </svg>
  );
};

const Icon: React.FC<{ kind: string }> = ({ kind }) => {
  const c = C.cyan;
  if (kind === "map")
    return (
      <svg width="30" height="30" viewBox="0 0 24 24" fill="none">
        <path d="M12 21s7-5.6 7-11a7 7 0 1 0-14 0c0 5.4 7 11 7 11Z" stroke={c} strokeWidth="1.6" />
        <circle cx="12" cy="10" r="2.4" fill={c} />
      </svg>
    );
  if (kind === "pulse")
    return (
      <svg width="30" height="30" viewBox="0 0 24 24" fill="none">
        <path d="M2 12h4l2.5-6 4 13 3-9 2 2h4.5" stroke={c} strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" />
      </svg>
    );
  return (
    <svg width="30" height="30" viewBox="0 0 24 24" fill="none">
      <path d="M6 2h8l4 4v16H6V2Z" stroke={c} strokeWidth="1.6" strokeLinejoin="round" />
      <path d="M14 2v4h4M9 12h6M9 16h6" stroke={c} strokeWidth="1.4" strokeLinecap="round" />
    </svg>
  );
};
