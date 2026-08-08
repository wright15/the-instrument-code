import {
  intervalVector,
  pcsOfMask,
  complementMask,
  setSize,
} from "./pitchSet";
import { officeColors } from "./bestiary";
import {
  dialAngle,
  dialArcPath,
  dialPoint,
  DIAL_CENTER,
  DIAL_DOT_R,
  DIAL_LABEL_R,
  DIAL_SIZE,
} from "./dialGeometry";

interface DialState {
  pcs: number[];
  mask: number;
  tint: string;
  rotation: number;
  transpose: number;
  showComplement: boolean;
}

function render(state: DialState, root: HTMLElement, caption: HTMLElement): void {
  const { pcs, mask, tint, rotation, transpose, showComplement } = state;
  const shifted = pcs.map((pc) => (pc + transpose) % 12);
  const selected = new Set(shifted);
  const vector = intervalVector(mask);
  const maxCount = Math.max(1, ...vector);
  const complement = pcsOfMask(complementMask(mask)).map((pc) => (pc + transpose) % 12);

  const labelFor = (pc: number): string => String((pc + rotation) % 12);

  const svg = document.createElementNS("http://www.w3.org/2000/svg", "svg");
  svg.setAttribute("width", "260");
  svg.setAttribute("height", "260");
  svg.setAttribute("viewBox", `0 0 ${DIAL_SIZE} ${DIAL_SIZE}`);
  svg.setAttribute("role", "img");

  const base = (x: number, y: number, r: number): SVGCircleElement => {
    const c = document.createElementNS("http://www.w3.org/2000/svg", "circle");
    c.setAttribute("cx", String(x));
    c.setAttribute("cy", String(y));
    c.setAttribute("r", String(r));
    return c;
  };

  const ring = base(DIAL_CENTER, DIAL_CENTER, DIAL_DOT_R);
  ring.setAttribute("fill", "none");
  ring.setAttribute("stroke", "#222222");
  ring.setAttribute("stroke-width", "1.5");
  svg.appendChild(ring);

  if (showComplement) {
    for (const pc of complement) {
      const { x, y } = dialPoint(pc, DIAL_DOT_R);
      const dot = base(x, y, 5);
      dot.setAttribute("fill", "none");
      dot.setAttribute("stroke", "#888888");
      dot.setAttribute("stroke-width", "1");
      dot.setAttribute("stroke-dasharray", "2 2");
      svg.appendChild(dot);
    }
  }

  for (let pc = 0; pc < 12; pc++) {
    const outer = dialPoint(pc, DIAL_DOT_R + 10);
    const inner = dialPoint(pc, DIAL_DOT_R - 12);
    const tick = document.createElementNS("http://www.w3.org/2000/svg", "line");
    tick.setAttribute("x1", String(outer.x));
    tick.setAttribute("y1", String(outer.y));
    tick.setAttribute("x2", String(inner.x));
    tick.setAttribute("y2", String(inner.y));
    tick.setAttribute("stroke", selected.has(pc) ? tint : "#333333");
    tick.setAttribute("stroke-width", "1");
    svg.appendChild(tick);
  }

  for (let index = 0; index < vector.length; index++) {
    const count = vector[index];
    const radius = 24 + index * 8;
    const sweep = (count / maxCount) * 300;
    const bandGroup = document.createElementNS("http://www.w3.org/2000/svg", "g");
    bandGroup.dataset.intervalClass = String(index + 1);
    const backing = base(DIAL_CENTER, DIAL_CENTER, radius);
    backing.setAttribute("fill", "none");
    backing.setAttribute("stroke", "#161616");
    backing.setAttribute("stroke-width", "5");
    backing.setAttribute("cursor", "pointer");
    bandGroup.appendChild(backing);
    const fullSteps = Math.floor(sweep / 30);
    for (let step = 0; step < fullSteps; step++) {
      const path = document.createElementNS("http://www.w3.org/2000/svg", "path");
      path.setAttribute("d", dialArcPath((step + rotation) % 12, radius));
      path.setAttribute("fill", "none");
      path.setAttribute("stroke", tint);
      path.setAttribute("stroke-width", "5");
      path.setAttribute("stroke-linecap", "round");
      path.setAttribute("opacity", String(0.12 + (index + 1) * 0.07));
      bandGroup.appendChild(path);
    }
    const label = document.createElementNS("http://www.w3.org/2000/svg", "text");
    label.setAttribute("x", String(DIAL_CENTER - radius * 0.72));
    label.setAttribute("y", String(DIAL_CENTER - 0.5));
    label.setAttribute("fill", "#888888");
    label.setAttribute("font-size", "5.5");
    label.setAttribute("font-family", "monospace");
    label.setAttribute("text-anchor", "middle");
    label.textContent = `ic${index + 1}·${count}`;
    bandGroup.appendChild(label);
    bandGroup.addEventListener("mouseenter", () => {
      caption.textContent = `interval class ${index + 1} · ${count} unordered pairs`;
      bandGroup.style.filter = "brightness(1.35)";
    });
    bandGroup.addEventListener("mouseleave", () => {
      caption.textContent = "";
      bandGroup.style.filter = "";
    });
    svg.appendChild(bandGroup);
  }

  for (let pc = 0; pc < 12; pc++) {
    const { x, y } = dialPoint(pc, DIAL_DOT_R);
    const active = selected.has(pc);
    const group = document.createElementNS("http://www.w3.org/2000/svg", "g");
    const dot = base(x, y, active ? 11 : 4.5);
    dot.setAttribute("fill", active ? tint : "#1a1a1a");
    dot.setAttribute("stroke", active ? "#e0e0e0" : "#222222");
    dot.setAttribute("stroke-width", active ? "1.5" : "1");
    group.appendChild(dot);
    const label = document.createElementNS("http://www.w3.org/2000/svg", "text");
    label.setAttribute("x", String(x));
    label.setAttribute("y", String(y + 3));
    label.setAttribute("fill", active ? "#0d0d0d" : "#888888");
    label.setAttribute("font-size", active ? "7" : "5.5");
    label.setAttribute("font-family", "monospace");
    label.setAttribute("text-anchor", "middle");
    label.setAttribute("font-weight", active ? "700" : "400");
    label.textContent = String(pc);
    group.appendChild(label);
    svg.appendChild(group);
  }

  for (let pc = 0; pc < 12; pc++) {
    const { x, y } = dialPoint(pc, DIAL_LABEL_R);
    const label = document.createElementNS("http://www.w3.org/2000/svg", "text");
    label.setAttribute("x", String(x));
    label.setAttribute("y", String(y + 2.5));
    label.setAttribute("fill", selected.has(pc) ? "#e0e0e0" : "#555555");
    label.setAttribute("font-size", "7");
    label.setAttribute("font-family", "monospace");
    label.setAttribute("text-anchor", "middle");
    label.textContent = labelFor(pc);
    svg.appendChild(label);
  }

  root.replaceChildren(svg);

  const stats = document.createElement("div");
  stats.className = "flex flex-col items-center gap-1 font-mono text-[10px] text-muted";
  const setLine = document.createElement("span");
  setLine.className = "text-frost/90";
  setLine.textContent = `{${shifted.slice().sort((a, b) => a - b).join(", ")}}`;
  const maskLine = document.createElement("span");
  maskLine.textContent = `mask ${mask} · ${setSize(mask)} notes`;
  const ivLine = document.createElement("span");
  ivLine.textContent = `iv [${vector.join(",")}]`;
  const shiftLine = document.createElement("span");
  shiftLine.textContent =
    state.transpose === 0
      ? ""
      : `transposed ${state.transpose > 0 ? "+" : ""}${state.transpose} st`;
  stats.append(setLine, maskLine, ivLine, shiftLine);
  root.appendChild(stats);
}

export function initDial(container: HTMLElement): void {
  const pcs = (container.dataset.pcs ?? "")
    .split(",")
    .map(Number)
    .filter((n) => Number.isFinite(n));
  const mask = Number(container.dataset.mask ?? 0);
  const office = container.dataset.office ?? "";
  const tint = officeColors[office] ?? "#8CF";

  const state: DialState = {
    pcs,
    mask,
    tint,
    rotation: 0,
    transpose: 0,
    showComplement: false,
  };

  const root = document.createElement("div");
  root.className = "flex flex-col items-center gap-2";
  const controls = document.createElement("div");
  controls.className = "flex items-center gap-1.5";

  const buttons: { label: string; title: string; action: () => void }[] = [
    {
      label: "⟲",
      title: "Rotate labels counter-clockwise",
      action: () => {
        state.rotation = (state.rotation + 1) % 12;
      },
    },
    {
      label: "⟳",
      title: "Rotate labels clockwise",
      action: () => {
        state.rotation = (state.rotation + 11) % 12;
      },
    },
    {
      label: "−1",
      title: "Transpose down one semitone",
      action: () => {
        state.transpose = (state.transpose + 11) % 12;
      },
    },
    {
      label: "+1",
      title: "Transpose up one semitone",
      action: () => {
        state.transpose = (state.transpose + 1) % 12;
      },
    },
    {
      label: "∁",
      title: "Toggle complement ring",
      action: () => {
        state.showComplement = !state.showComplement;
      },
    },
    {
      label: "↺",
      title: "Reset rotation, transpose and complement",
      action: () => {
        state.rotation = 0;
        state.transpose = 0;
        state.showComplement = false;
      },
    },
  ];

  for (const button of buttons) {
    const el = document.createElement("button");
    el.type = "button";
    el.className =
      "rounded border border-edge bg-raised px-2 py-1 text-[10px] text-muted transition-colors hover:border-accent/50 hover:text-accent";
    el.textContent = button.label;
    el.title = button.title;
    el.addEventListener("click", () => {
      button.action();
      refresh();
    });
    controls.appendChild(el);
  }

  const caption = document.createElement("p");
  caption.className = "h-4 text-center text-[10px] text-accent";

  container.replaceChildren(root);
  root.appendChild(controls);

  const dialRoot = document.createElement("div");
  root.appendChild(dialRoot);
  root.appendChild(caption);

  const refresh = () => render(state, dialRoot, caption);
  refresh();
}
