export type JourneyState = "completed" | "current" | "locked";

export type JourneyMilestone = {
  id: string;
  name: string;
  /** Desktop coordinates inside viewBox 520×420 */
  desktop: { x: number; y: number };
  /** Mobile coordinates inside viewBox 360×640 */
  mobile: { x: number; y: number };
  /** Label placement relative to the node */
  desktopAnchor: "left" | "right" | "top" | "bottom";
  mobileAnchor: "left" | "right";
};

export const JOURNEY_MILESTONES: JourneyMilestone[] = [
  {
    id: "discover",
    name: "Discover Interests",
    desktop: { x: 64, y: 86 },
    mobile: { x: 188, y: 52 },
    desktopAnchor: "right",
    mobileAnchor: "left",
  },
  {
    id: "foundation",
    name: "Foundation Skills",
    desktop: { x: 214, y: 48 },
    mobile: { x: 286, y: 138 },
    desktopAnchor: "top",
    mobileAnchor: "left",
  },
  {
    id: "training",
    name: "Training Sessions",
    desktop: { x: 436, y: 102 },
    mobile: { x: 268, y: 236 },
    desktopAnchor: "left",
    mobileAnchor: "left",
  },
  {
    id: "mentorship",
    name: "Mentorship",
    desktop: { x: 372, y: 204 },
    mobile: { x: 86, y: 328 },
    desktopAnchor: "left",
    mobileAnchor: "right",
  },
  {
    id: "assignments",
    name: "Assignments",
    desktop: { x: 88, y: 258 },
    mobile: { x: 108, y: 428 },
    desktopAnchor: "right",
    mobileAnchor: "right",
  },
  {
    id: "projects",
    name: "Projects",
    desktop: { x: 156, y: 348 },
    mobile: { x: 278, y: 520 },
    desktopAnchor: "right",
    mobileAnchor: "left",
  },
  {
    id: "career",
    name: "Career Ready",
    desktop: { x: 428, y: 368 },
    mobile: { x: 196, y: 604 },
    desktopAnchor: "left",
    mobileAnchor: "right",
  },
];

export const JOURNEY_STATS = {
  xp: "1,250 XP",
  levelLabel: "Level 4 of 7",
};

export function catmullRomPath(points: { x: number; y: number }[]) {
  if (points.length < 2) return "";
  const p = [points[0], ...points, points[points.length - 1]];
  let d = `M ${points[0].x} ${points[0].y}`;
  for (let i = 1; i < p.length - 2; i += 1) {
    const p0 = p[i - 1];
    const p1 = p[i];
    const p2 = p[i + 1];
    const p3 = p[i + 2];
    const c1x = p1.x + (p2.x - p0.x) / 6;
    const c1y = p1.y + (p2.y - p0.y) / 6;
    const c2x = p2.x - (p3.x - p1.x) / 6;
    const c2y = p2.y - (p3.y - p1.y) / 6;
    d += ` C ${c1x.toFixed(1)} ${c1y.toFixed(1)}, ${c2x.toFixed(1)} ${c2y.toFixed(1)}, ${p2.x} ${p2.y}`;
  }
  return d;
}

export const DESKTOP_JOURNEY_PATH = catmullRomPath(JOURNEY_MILESTONES.map((m) => m.desktop));
export const MOBILE_JOURNEY_PATH = catmullRomPath(JOURNEY_MILESTONES.map((m) => m.mobile));
