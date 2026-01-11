"use client";

import React, { useMemo } from "react";
import {
  ResponsiveContainer,
  ScatterChart,
  Scatter,
  XAxis,
  YAxis,
  ZAxis,
  Tooltip,
  CartesianGrid,
  Label,
} from "recharts";

type HeatmapPoint = {
  day: number; // 0=Mon ... 6=Sun
  hour: number; // 0..23
  value: number; // any scale
};

interface EngagementHeatmapProps {
  type: "linkedin" | "instagram";
}

const DAYS = ["Mon", "Tues", "Wed", "Thurs", "Fri", "Sat", "Sun"];

// SproutSocial-ish blue ramp for LinkedIn
function rampBlue(t: number) {
  const stops = [
    { t: 0.0, c: [234, 242, 255] }, // very light
    { t: 0.35, c: [164, 205, 255] }, // light
    { t: 0.7, c: [58, 133, 255] }, // medium
    { t: 1.0, c: [8, 50, 120] }, // dark
  ];

  const clamp01 = (x: number) => Math.max(0, Math.min(1, x));
  const lerp = (a: number, b: number, u: number) => a + (b - a) * u;

  const tt = clamp01(t);
  const hi = stops.findIndex((s) => s.t >= tt);
  if (hi <= 0) {
    const [r, g, b] = stops[0].c;
    return `rgb(${r},${g},${b})`;
  }

  const lo = hi - 1;
  const t0 = stops[lo].t;
  const t1 = stops[hi].t;
  const u = (tt - t0) / (t1 - t0);
  const c0 = stops[lo].c;
  const c1 = stops[hi].c;
  const r = Math.round(lerp(c0[0], c1[0], u));
  const g = Math.round(lerp(c0[1], c1[1], u));
  const b = Math.round(lerp(c0[2], c1[2], u));
  return `rgb(${r},${g},${b})`;
}

// Red ramp for Instagram
function rampRed(t: number) {
  const stops = [
    { t: 0.0, c: [255, 240, 240] }, // very light pink
    { t: 0.35, c: [255, 200, 200] }, // light pink
    { t: 0.7, c: [255, 100, 100] }, // medium red
    { t: 1.0, c: [180, 20, 20] }, // dark red
  ];

  const clamp01 = (x: number) => Math.max(0, Math.min(1, x));
  const lerp = (a: number, b: number, u: number) => a + (b - a) * u;

  const tt = clamp01(t);
  const hi = stops.findIndex((s) => s.t >= tt);
  if (hi <= 0) {
    const [r, g, b] = stops[0].c;
    return `rgb(${r},${g},${b})`;
  }

  const lo = hi - 1;
  const t0 = stops[lo].t;
  const t1 = stops[hi].t;
  const u = (tt - t0) / (t1 - t0);
  const c0 = stops[lo].c;
  const c1 = stops[hi].c;
  const r = Math.round(lerp(c0[0], c1[0], u));
  const g = Math.round(lerp(c0[1], c1[1], u));
  const b = Math.round(lerp(c0[2], c1[2], u));
  return `rgb(${r},${g},${b})`;
}

function formatHourTick(h: number) {
  // 0..23 => 12,1,2...11,12,1...11 with AM/PM markers below
  const hr12 = ((h + 11) % 12) + 1;
  return `${hr12}`;
}

function hourBandLabel(h: number) {
  // show AM on the left side of 0-11 range and PM on the left side of 12-23 range
  if (h === 0) return "AM";
  if (h === 12) return "PM";
  return "";
}

export default function EngagementHeatmap({ type }: EngagementHeatmapProps) {
  // Generate engagement data - LinkedIn: highest Tue/Wed/Thu 9AM-1PM
  // Instagram: highest Mon-Thu 1PM-9PM
  const getEngagement = (day: number, hour: number): number => {
    if (type === "linkedin") {
      if (day >= 5) return 0.15; // Weekend - very low
      if (day >= 1 && day <= 3) {
        // Tue, Wed, Thu
        if (hour >= 9 && hour <= 13) return 0.95; // Peak: 9AM-1PM
        if (hour >= 8 && hour <= 15) return 0.75; // High: 8AM-3PM
        if (hour >= 6 && hour <= 17) return 0.5; // Medium: 6AM-5PM
      } else {
        // Mon, Fri
        if (hour >= 9 && hour <= 13) return 0.7; // Good: 9AM-1PM
        if (hour >= 8 && hour <= 15) return 0.55; // Medium: 8AM-3PM
        if (hour >= 6 && hour <= 17) return 0.35; // Low-medium: 6AM-5PM
      }
      return 0.2; // Off hours
    } else {
      // Instagram pattern: highest Mon-Thu 1PM-9PM
      if (day >= 5) return 0.2; // Weekend - low
      if (day >= 0 && day <= 3) {
        // Mon, Tue, Wed, Thu
        if (hour >= 13 && hour <= 21) return 0.95; // Peak: 1PM-9PM
        if (hour >= 12 && hour <= 22) return 0.75; // High: 12PM-10PM
        if (hour >= 10 && hour <= 23) return 0.5; // Medium: 10AM-11PM
      } else {
        // Fri
        if (hour >= 13 && hour <= 20) return 0.7; // Good: 1PM-8PM
        if (hour >= 12 && hour <= 21) return 0.55; // Medium: 12PM-9PM
      }
      return 0.25; // Off hours
    }
  };

  // Generate data points
  const data: HeatmapPoint[] = useMemo(() => {
    const points: HeatmapPoint[] = [];
    for (let d = 0; d < 7; d++) {
      for (let h = 0; h < 24; h++) {
        points.push({
          day: d,
          hour: h,
          value: getEngagement(d, h),
        });
      }
    }
    return points;
  }, [type]);

  const { vMin, vMax } = useMemo(() => {
    const vals = data.map((d) => d.value);
    const mn = vals.length ? Math.min(...vals) : 0;
    const mx = vals.length ? Math.max(...vals) : 1;
    return { vMin: mn, vMax: mx };
  }, [data]);

  const norm = (v: number) => {
    if (vMax <= vMin) return 0;
    return (v - vMin) / (vMax - vMin);
  };

  // Custom cell renderer for Scatter points
  const renderCell = (props: any) => {
    const { cx, cy, payload } = props;
    const cellSize = 16;
    const pad = 1;
    const t = norm(payload.value);
    const fill = type === "linkedin" ? rampBlue(t) : rampRed(t);

    // Square cell centered at (cx, cy)
    return (
      <rect
        x={cx - cellSize / 2 + pad / 2}
        y={cy - cellSize / 2 + pad / 2}
        width={cellSize - pad}
        height={cellSize - pad}
        rx={1}
        ry={1}
        fill={fill}
        stroke="rgba(255,255,255,0.05)"
      />
    );
  };

  const tooltipContent = ({ active, payload }: any) => {
    if (!active || !payload?.length) return null;
    const p = payload[0].payload as HeatmapPoint;
    const day = DAYS[p.day] ?? `Day ${p.day}`;
    const h = p.hour;
    const hr12 = ((h + 11) % 12) + 1;
    const ampm = h < 12 ? "AM" : "PM";

    return (
      <div className="rounded-md border border-white/20 bg-slate-900 px-3 py-2 text-xs shadow-lg">
        <div className="font-semibold text-white">{day}</div>
        <div className="text-slate-300">
          {hr12}:00 {ampm}
        </div>
        <div className="mt-1 text-slate-300">
          Engagement:{" "}
          <span className="font-semibold text-white">
            {Math.round(p.value * 100)}%
          </span>
        </div>
      </div>
    );
  };

  return (
    <div className="w-full my-6">
      <div className="text-sm text-slate-400 mb-3">
        {type === "linkedin" ? "LinkedIn" : "Instagram"} Global Engagement (by
        sproutsocial)
      </div>

      <div style={{ width: "100%", height: 260 }}>
        <ResponsiveContainer>
          <ScatterChart margin={{ top: 10, right: 18, bottom: 38, left: 52 }}>
            <CartesianGrid stroke="rgba(255,255,255,0.05)" vertical={false} />

            <XAxis
              type="number"
              dataKey="hour"
              domain={[-0.5, 23.5]}
              ticks={[
                0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15, 16, 17,
                18, 19, 20, 21, 22, 23,
              ]}
              axisLine={{ stroke: "rgba(255,255,255,0.1)" }}
              tickLine={false}
              interval={0}
              height={28}
              tick={(props: any) => {
                const { x, y, payload } = props;
                const hour = payload.value;
                return (
                  <g transform={`translate(${x},${y})`}>
                    <text
                      x={0}
                      y={0}
                      dy={16}
                      textAnchor="middle"
                      fill="rgba(255,255,255,0.5)"
                      fontSize={10}
                    >
                      {formatHourTick(hour)}
                    </text>
                    {hour === 6 && (
                      <text
                        x={0}
                        y={0}
                        dy={36}
                        textAnchor="middle"
                        fill="rgba(148,163,184,1)"
                        fontSize={10}
                      >
                        AM
                      </text>
                    )}
                    {hour === 18 && (
                      <text
                        x={0}
                        y={0}
                        dy={36}
                        textAnchor="middle"
                        fill="rgba(148,163,184,1)"
                        fontSize={10}
                      >
                        PM
                      </text>
                    )}
                  </g>
                );
              }}
            />

            <YAxis
              type="number"
              dataKey="day"
              domain={[-0.5, 6.5]}
              ticks={[0, 1, 2, 3, 4, 5, 6]}
              tickFormatter={(d) => DAYS[d] ?? String(d)}
              tick={{ fontSize: 11, fill: "rgba(255,255,255,0.7)" }}
              axisLine={false}
              tickLine={false}
              width={48}
            />

            {/* ZAxis required for Scatter sizing, but we render custom rects */}
            <ZAxis type="number" dataKey="value" range={[0, 0]} />

            <Tooltip cursor={false} content={tooltipContent} />

            <Scatter data={data} shape={renderCell} />
          </ScatterChart>
        </ResponsiveContainer>
      </div>

      {/* Legend */}
      <div className="mt-4 flex items-center gap-3">
        <span className="text-xs text-slate-400">Lowest Engagement</span>
        <div className="h-2 flex-1 rounded-sm overflow-hidden border border-white/10">
          <div
            className="h-full"
            style={{
              background:
                type === "linkedin"
                  ? "linear-gradient(90deg, rgb(234,242,255) 0%, rgb(164,205,255) 35%, rgb(58,133,255) 70%, rgb(8,50,120) 100%)"
                  : "linear-gradient(90deg, rgb(255,240,240) 0%, rgb(255,200,200) 35%, rgb(255,100,100) 70%, rgb(180,20,20) 100%)",
            }}
          />
        </div>
        <span className="text-xs text-slate-400">Highest Engagement</span>
      </div>
    </div>
  );
}
