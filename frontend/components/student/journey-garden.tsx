function Tree({ x, y, scale = 1 }: { x: number; y: number; scale?: number }) {
  const s = scale;
  return (
    <g transform={`translate(${x} ${y}) scale(${s})`} aria-hidden>
      <rect x="-3" y="8" width="6" height="18" rx="1.5" fill="#6b4a32" />
      <circle cx="0" cy="2" r="14" fill="#5f8d4e" />
      <circle cx="-8" cy="8" r="10" fill="#6f9a58" />
      <circle cx="8" cy="8" r="10" fill="#4f7c40" />
    </g>
  );
}

function Bush({ x, y, scale = 1 }: { x: number; y: number; scale?: number }) {
  return (
    <g transform={`translate(${x} ${y}) scale(${scale})`} aria-hidden>
      <ellipse cx="0" cy="4" rx="18" ry="10" fill="#5c8a49" />
      <ellipse cx="-10" cy="2" rx="10" ry="8" fill="#6f9a58" />
      <ellipse cx="11" cy="3" rx="9" ry="7" fill="#4e7a3e" />
    </g>
  );
}

function Flower({ x, y, color }: { x: number; y: number; color: string }) {
  return (
    <g transform={`translate(${x} ${y})`} aria-hidden>
      <circle cx="0" cy="-2" r="2.2" fill={color} />
      <circle cx="2.1" cy="0" r="2.2" fill={color} />
      <circle cx="-2.1" cy="0" r="2.2" fill={color} />
      <circle cx="1.2" cy="2.1" r="2.2" fill={color} />
      <circle cx="-1.2" cy="2.1" r="2.2" fill={color} />
      <circle cx="0" cy="0.4" r="1.5" fill="#c9a227" />
    </g>
  );
}

function Butterfly({ x, y }: { x: number; y: number }) {
  return (
    <g transform={`translate(${x} ${y})`} aria-hidden>
      <ellipse cx="-4" cy="0" rx="4.5" ry="3" fill="#ec1975" opacity="0.55" />
      <ellipse cx="4" cy="0" rx="4.5" ry="3" fill="#8c3d7a" opacity="0.5" />
      <rect x="-0.6" y="-3" width="1.2" height="6" rx="0.6" fill="#1a1630" />
    </g>
  );
}

function Cloud({ x, y, scale = 1 }: { x: number; y: number; scale?: number }) {
  return (
    <g transform={`translate(${x} ${y}) scale(${scale})`} fill="#f7fbff" opacity="0.85" aria-hidden>
      <circle cx="0" cy="0" r="12" />
      <circle cx="14" cy="2" r="10" />
      <circle cx="-12" cy="4" r="8" />
    </g>
  );
}

function Swing({ x, y }: { x: number; y: number }) {
  return (
    <g transform={`translate(${x} ${y})`} aria-hidden>
      <path d="M0 0 L0 28 M22 0 L22 28" stroke="#6b4a32" strokeWidth="2.5" />
      <path d="M-4 0 H26" stroke="#6b4a32" strokeWidth="3" strokeLinecap="round" />
      <rect x="4" y="26" width="14" height="4" rx="1" fill="#c9a227" />
    </g>
  );
}

function Slide({ x, y }: { x: number; y: number }) {
  return (
    <g transform={`translate(${x} ${y})`} aria-hidden>
      <path d="M0 4 H10 L34 32 H18 Z" fill="#8c3d7a" opacity="0.45" />
      <rect x="0" y="0" width="10" height="8" rx="1" fill="#8c3d7a" opacity="0.55" />
    </g>
  );
}

export function JourneyGarden({
  vb,
  uid,
  nodes,
}: {
  vb: { w: number; h: number };
  uid: string;
  nodes: { x: number; y: number }[];
}) {
  const far = (x: number, y: number, min = 70) => nodes.every((n) => Math.hypot(n.x - x, n.y - y) > min);
  const wide = vb.w > 500;
  const flowers: { x: number; y: number; color: string }[] = [];
  const spots = wide
    ? [
        [40, vb.h * 0.72, "#ec1975"],
        [70, vb.h * 0.8, "#c9a227"],
        [110, vb.h * 0.76, "#8c3d7a"],
        [vb.w - 50, vb.h * 0.7, "#ec1975"],
        [vb.w - 90, vb.h * 0.82, "#c9a227"],
        [vb.w * 0.28, vb.h * 0.88, "#8c3d7a"],
        [vb.w * 0.62, vb.h * 0.9, "#ec1975"],
        [vb.w * 0.48, vb.h * 0.14, "#c9a227"],
      ]
    : [
        [28, vb.h * 0.18, "#ec1975"],
        [vb.w - 30, vb.h * 0.32, "#c9a227"],
        [32, vb.h * 0.62, "#8c3d7a"],
        [vb.w - 36, vb.h * 0.78, "#ec1975"],
        [vb.w * 0.5, vb.h * 0.94, "#c9a227"],
      ];
  for (const [x, y, color] of spots) {
    if (typeof x === "number" && typeof y === "number" && typeof color === "string" && far(x, y, 64)) {
      flowers.push({ x, y, color });
    }
  }

  return (
    <g pointerEvents="none" aria-hidden>
      <defs>
        <linearGradient id={`${uid}-meadow`} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#c5dff0" />
          <stop offset="22%" stopColor="#d5ebc4" />
          <stop offset="55%" stopColor="#b7d48a" />
          <stop offset="100%" stopColor="#8fb86a" />
        </linearGradient>
      </defs>
      <rect width={vb.w} height={vb.h} fill={`url(#${uid}-meadow)`} />
      <ellipse cx={vb.w * 0.5} cy={vb.h * 0.42} rx={vb.w * 0.62} ry={vb.h * 0.28} fill="#c3dc98" opacity="0.45" />
      <ellipse cx={vb.w * 0.2} cy={vb.h * 0.7} rx={vb.w * 0.4} ry={vb.h * 0.28} fill="#9fc46f" opacity="0.5" />
      <ellipse cx={vb.w * 0.8} cy={vb.h * 0.74} rx={vb.w * 0.42} ry={vb.h * 0.3} fill="#8fb86a" opacity="0.55" />
      <path
        d={`M0 ${vb.h * 0.34} C ${vb.w * 0.25} ${vb.h * 0.28}, ${vb.w * 0.5} ${vb.h * 0.4}, ${vb.w} ${vb.h * 0.32} V ${vb.h} H0 Z`}
        fill="#a8cb78"
        opacity="0.35"
      />
      <Cloud x={wide ? 90 : 50} y={36} scale={wide ? 1 : 0.7} />
      <Cloud x={wide ? vb.w - 140 : vb.w - 70} y={28} scale={wide ? 0.85 : 0.6} />
      {wide ? <Cloud x={vb.w * 0.45} y={22} scale={0.55} /> : null}
      {far(36, vb.h - 40, 80) ? <Tree x={36} y={vb.h - 48} scale={wide ? 1.1 : 0.85} /> : null}
      {far(vb.w - 40, vb.h - 36, 80) ? <Tree x={vb.w - 40} y={vb.h - 44} scale={wide ? 1 : 0.8} /> : null}
      {wide && far(vb.w * 0.18, 70, 90) ? <Tree x={vb.w * 0.16} y={78} scale={0.7} /> : null}
      {far(58, vb.h - 28, 70) ? <Bush x={58} y={vb.h - 22} /> : null}
      {far(vb.w - 70, vb.h - 24, 70) ? <Bush x={vb.w - 70} y={vb.h - 20} scale={0.9} /> : null}
      {wide && far(90, vb.h - 70, 90) ? <Swing x={72} y={vb.h - 92} /> : null}
      {wide && far(vb.w - 90, vb.h * 0.22, 90) ? <Slide x={vb.w - 120} y={vb.h * 0.16} /> : null}
      {flowers.map((f, i) => (
        <Flower key={i} {...f} />
      ))}
      {wide && far(vb.w * 0.38, 48, 80) ? <Butterfly x={vb.w * 0.38} y={48} /> : null}
      {far(vb.w * 0.72, vb.h * 0.2, 80) ? <Butterfly x={vb.w * 0.72} y={vb.h * 0.18} /> : null}
      {wide && far(vb.w * 0.22, vb.h * 0.5, 80) ? <Butterfly x={vb.w * 0.2} y={vb.h * 0.48} /> : null}
    </g>
  );
}
