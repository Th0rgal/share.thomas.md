/** Pure geometric SVG helpers for expressive flow diagrams:
 *  - sankeyRibbon: smooth cubic-Bezier area path of exact conservation thickness
 *  - arcLoop: smooth under/over feedback loop ribbon for regeneration & recycling
 *  - taperedStream: organic stream path whose thickness varies continuously */

export function sankeyRibbon(
  x0: number,
  y0Top: number,
  y0Bot: number,
  x1: number,
  y1Top: number,
  y1Bot: number,
  tension = 0.46,
): string {
  const dx = (x1 - x0) * tension;
  const cx0 = x0 + dx;
  const cx1 = x1 - dx;
  return [
    `M ${x0.toFixed(1)} ${y0Top.toFixed(1)}`,
    `C ${cx0.toFixed(1)} ${y0Top.toFixed(1)}, ${cx1.toFixed(1)} ${y1Top.toFixed(1)}, ${x1.toFixed(1)} ${y1Top.toFixed(1)}`,
    `L ${x1.toFixed(1)} ${y1Bot.toFixed(1)}`,
    `C ${cx1.toFixed(1)} ${y1Bot.toFixed(1)}, ${cx0.toFixed(1)} ${y0Bot.toFixed(1)}, ${x0.toFixed(1)} ${y0Bot.toFixed(1)}`,
    "Z",
  ].join(" ");
}

/** Curved return arc (e.g. regeneration loop sweeping over the top or under the bottom). */
export function feedbackRibbon(
  xFrom: number,
  yFrom: number,
  xTo: number,
  yTo: number,
  archY: number,
  thickness: number,
): string {
  const r = thickness / 2;
  const midX = (xFrom + xTo) / 2;
  const sign = archY < Math.min(yFrom, yTo) ? -1 : 1;
  const outerArch = archY + sign * r;
  const innerArch = archY - sign * r;
  return [
    `M ${xFrom.toFixed(1)} ${(yFrom - r).toFixed(1)}`,
    `C ${xFrom.toFixed(1)} ${outerArch.toFixed(1)}, ${midX.toFixed(1)} ${outerArch.toFixed(1)}, ${midX.toFixed(1)} ${outerArch.toFixed(1)}`,
    `C ${midX.toFixed(1)} ${outerArch.toFixed(1)}, ${xTo.toFixed(1)} ${outerArch.toFixed(1)}, ${xTo.toFixed(1)} ${(yTo - r).toFixed(1)}`,
    `L ${xTo.toFixed(1)} ${(yTo + r).toFixed(1)}`,
    `C ${xTo.toFixed(1)} ${innerArch.toFixed(1)}, ${midX.toFixed(1)} ${innerArch.toFixed(1)}, ${midX.toFixed(1)} ${innerArch.toFixed(1)}`,
    `C ${midX.toFixed(1)} ${innerArch.toFixed(1)}, ${xFrom.toFixed(1)} ${innerArch.toFixed(1)}, ${xFrom.toFixed(1)} ${(yFrom + r).toFixed(1)}`,
    "Z",
  ].join(" ");
}

/** Organic tapered bezier ribbon between two arbitrary 2D points & normal directions. */
export function organicTube(
  x0: number,
  y0: number,
  w0: number,
  cx0: number,
  cy0: number,
  cx1: number,
  cy1: number,
  x1: number,
  y1: number,
  w1: number,
): string {
  // Compute perpendicular offsets at start and end from tangent vectors
  const tx0 = cx0 - x0 || 1;
  const ty0 = cy0 - y0;
  const len0 = Math.hypot(tx0, ty0) || 1;
  const nx0 = (-ty0 / len0) * (w0 / 2);
  const ny0 = (tx0 / len0) * (w0 / 2);

  const tx1 = x1 - cx1 || 1;
  const ty1 = y1 - cy1;
  const len1 = Math.hypot(tx1, ty1) || 1;
  const nx1 = (-ty1 / len1) * (w1 / 2);
  const ny1 = (tx1 / len1) * (w1 / 2);

  const mnx = (nx0 + nx1) * 0.5;
  const mny = (ny0 + ny1) * 0.5;

  return [
    `M ${(x0 + nx0).toFixed(1)} ${(y0 + ny0).toFixed(1)}`,
    `C ${(cx0 + mnx).toFixed(1)} ${(cy0 + mny).toFixed(1)}, ${(cx1 + mnx).toFixed(1)} ${(cy1 + mny).toFixed(1)}, ${(x1 + nx1).toFixed(1)} ${(y1 + ny1).toFixed(1)}`,
    `L ${(x1 - nx1).toFixed(1)} ${(y1 - ny1).toFixed(1)}`,
    `C ${(cx1 - mnx).toFixed(1)} ${(cy1 - mny).toFixed(1)}, ${(cx0 - mnx).toFixed(1)} ${(cy0 - mny).toFixed(1)}, ${(x0 - nx0).toFixed(1)} ${(y0 - ny0).toFixed(1)}`,
    "Z",
  ].join(" ");
}

export function centerCurve(
  x0: number,
  y0: number,
  cx0: number,
  cy0: number,
  cx1: number,
  cy1: number,
  x1: number,
  y1: number,
): string {
  return `M ${x0.toFixed(1)} ${y0.toFixed(1)} C ${cx0.toFixed(1)} ${cy0.toFixed(1)}, ${cx1.toFixed(1)} ${cy1.toFixed(1)}, ${x1.toFixed(1)} ${y1.toFixed(1)}`;
}
