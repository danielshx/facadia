import React from "react";
import { AbsoluteFill, Img, interpolate, staticFile } from "remotion";
import { C, FONTS, hexA, SEVERITY_COLORS } from "../theme";
import { DEFECT } from "../data/config";
import { Mono, Pill } from "./hud/primitives";
import { HealthScore } from "./hud/HealthScore";
import { typed } from "../util/anim";

/** The auto-drafted inspection dashboard: heatmap + defect list + report + score. */
export const Dashboard: React.FC<{ frame: number }> = ({ frame }) => {
  const f = frame;
  return (
    <AbsoluteFill style={{ background: `radial-gradient(120% 100% at 50% 0%, #0a131b, ${C.bgDeep})`, padding: 70, fontFamily: FONTS.body }}>
      {/* window chrome */}
      <div style={{ display: "flex", alignItems: "center", gap: 14, marginBottom: 22, opacity: appear(f, 0) }}>
        <Logo />
        <span style={{ fontFamily: FONTS.display, fontWeight: 700, fontSize: 22, color: C.textHi, letterSpacing: 2 }}>FACADIA</span>
        <Mono size={13} dim spacing={2} glowPx={0}>/ MBIS INSPECTION · {DEFECT.building.name}</Mono>
        <div style={{ flex: 1 }} />
        <Pill color={C.cyan} size={12}>HONG KONG · MBIS</Pill>
        <Pill color={C.cyan} size={12}>DRAFT</Pill>
        <Pill color={C.amber} size={12}>AWAITING RI SIGN-OFF</Pill>
      </div>

      <div style={{ display: "flex", gap: 26, height: 820 }}>
        {/* LEFT — façade heatmap */}
        <Panel style={{ flex: 1.3, padding: 0, overflow: "hidden", opacity: appear(f, 6) }}>
          <div style={{ position: "relative", width: "100%", height: "100%" }}>
            <Img src={staticFile("dash_facade.jpg")} style={{ width: "100%", height: "100%", objectFit: "cover", filter: "saturate(0.7) brightness(0.6) contrast(1.05)" }} />
            <AbsoluteFill style={{ background: `linear-gradient(180deg, transparent 0%, ${hexA(C.bgDeep, 0.6)} 100%)` }} />
            {/* heatmap dots */}
            {DEFECT.defects.map((d, i) => {
              const a = appear(f, 18 + i * 4);
              const col = SEVERITY_COLORS[d.severity - 1];
              const r = 8 + d.severity * 3;
              return (
                <div key={i} style={{ position: "absolute", left: `${d.x * 100}%`, top: `${d.y * 100}%`, transform: "translate(-50%,-50%)", opacity: a }}>
                  <div style={{ width: r * 2, height: r * 2, borderRadius: "50%", background: hexA(col, 0.25), border: `2px solid ${col}`, boxShadow: `0 0 ${r}px ${hexA(col, 0.8)}`, display: "flex", alignItems: "center", justifyContent: "center" }}>
                    <div style={{ width: 5, height: 5, borderRadius: "50%", background: col }} />
                  </div>
                </div>
              );
            })}
            <div style={{ position: "absolute", left: 18, top: 16, display: "flex", gap: 8, alignItems: "center" }}>
              <Mono size={12} color={C.cyan} spacing={2}>DEFECT HEATMAP</Mono>
              <Mono size={12} dim glowPx={0}>· {DEFECT.defects.length} FLAGGED</Mono>
            </div>
          </div>
        </Panel>

        {/* MIDDLE — defect list */}
        <Panel style={{ flex: 1, opacity: appear(f, 10) }}>
          <Mono size={12} color={C.cyan} spacing={2}>DETECTED DEFECTS</Mono>
          <div style={{ marginTop: 16, display: "flex", flexDirection: "column", gap: 9 }}>
            {DEFECT.defects.map((d, i) => {
              const a = appear(f, 26 + i * 5);
              const col = SEVERITY_COLORS[d.severity - 1];
              return (
                <div key={i} style={{ display: "flex", alignItems: "center", gap: 12, padding: "10px 12px", borderRadius: 8, background: hexA(C.white, 0.03), border: `1px solid ${hexA(col, 0.25)}`, opacity: a, transform: `translateX(${(1 - a) * 20}px)` }}>
                  <div style={{ width: 4, height: 30, borderRadius: 2, background: col, boxShadow: `0 0 8px ${col}` }} />
                  <div style={{ flex: 1 }}>
                    <div style={{ fontFamily: FONTS.body, fontSize: 17, color: C.textHi, fontWeight: 500 }}>{d.class}</div>
                    <Mono size={10} dim spacing={1} glowPx={0}>{`x${d.x.toFixed(2)} · y${d.y.toFixed(2)}`}</Mono>
                  </div>
                  <div style={{ fontFamily: FONTS.mono, fontSize: 13, color: col, border: `1px solid ${hexA(col, 0.5)}`, borderRadius: 4, padding: "3px 8px" }}>S{d.severity}</div>
                </div>
              );
            })}
          </div>
        </Panel>

        {/* RIGHT — report + health */}
        <div style={{ flex: 1.15, display: "flex", flexDirection: "column", gap: 24 }}>
          <Panel style={{ opacity: appear(f, 14) }}>
            <Mono size={12} color={C.cyan} spacing={2}>{DEFECT.report.title.toUpperCase()}</Mono>
            <Mono size={11} dim spacing={1} glowPx={0} style={{ display: "block", marginTop: 6 }}>{DEFECT.report.ordinance}</Mono>
            <div style={{ marginTop: 14, display: "flex", flexDirection: "column", gap: 9 }}>
              {DEFECT.report.lines.map((ln, i) => {
                const start = 40 + i * 18;
                const t = typed(f, ln, start, 1.4);
                if (f < start) return <div key={i} style={{ height: 18 }} />;
                return (
                  <div key={i} style={{ display: "flex", gap: 8, fontFamily: FONTS.body, fontSize: 14.5, lineHeight: 1.45, color: i === 0 ? C.textHi : C.textMid }}>
                    <span style={{ color: C.cyan, fontFamily: FONTS.mono, fontSize: 12 }}>›</span>
                    <span>{t}</span>
                  </div>
                );
              })}
            </div>
          </Panel>
          <Panel style={{ flex: 1, display: "flex", alignItems: "center", justifyContent: "center", opacity: appear(f, 20) }}>
            <HealthScore frame={f} start={150} value={DEFECT.building.healthScore} size={260} />
          </Panel>
        </div>
      </div>
    </AbsoluteFill>
  );
};

const appear = (f: number, d: number) => interpolate(f, [d, d + 14], [0, 1], { extrapolateLeft: "clamp", extrapolateRight: "clamp" });

const Panel: React.FC<{ children: React.ReactNode; style?: React.CSSProperties }> = ({ children, style }) => (
  <div style={{ background: hexA("#0a141c", 0.7), border: `1px solid ${hexA(C.cyan, 0.18)}`, borderRadius: 14, padding: 22, backdropFilter: "blur(6px)", ...style }}>
    {children}
  </div>
);

const Logo: React.FC = () => (
  <svg width="26" height="26" viewBox="0 0 34 34" fill="none">
    <circle cx="17" cy="17" r="15" stroke={hexA(C.cyan, 0.5)} strokeWidth="1.5" />
    <circle cx="17" cy="17" r="6" stroke={C.cyan} strokeWidth="2" />
    <circle cx="17" cy="17" r="2" fill={C.cyan} />
  </svg>
);
