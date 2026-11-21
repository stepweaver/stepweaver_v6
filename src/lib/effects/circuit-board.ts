import { COLOR_PALETTES, spritePalette, type SpriteColor } from '$lib/effects/background-constants';
import { circuitDim } from '$lib/effects/lambda-motion';
import type { ThemeId } from '$lib/theme/themes';

export type Rng = () => number;

type Point = { x: number; y: number };

type CircuitNode = {
	x: number;
	y: number;
	edges: number[];
	flash: number;
	flashColor?: SpriteColor;
};

type CircuitEdge = {
	from: number;
	to: number;
	pts: Point[];
	len: number;
};

type Sprite = {
	eIdx: number;
	t: number;
	speed: number;
	forward: boolean;
	size: number;
	brightness: number;
	trail: Point[];
	trailMax: number;
	pulse: number;
	color: SpriteColor;
};

export type CircuitBoard = {
	width: number;
	height: number;
	cell: number;
	mobile: boolean;
	nodes: CircuitNode[];
	edges: CircuitEdge[];
	sprites: Sprite[];
};

function makeTrace(a: Point, b: Point, random: Rng): Point[] {
	const pts: Point[] = [{ x: a.x, y: a.y }];
	const roll = random();
	if (roll < 0.3) {
		pts.push({ x: b.x, y: a.y });
	} else if (roll < 0.6) {
		pts.push({ x: a.x, y: b.y });
	} else if (random() > 0.5) {
		const midX = a.x + (b.x - a.x) * (0.3 + random() * 0.4);
		pts.push({ x: midX, y: a.y });
		pts.push({ x: midX, y: b.y });
	} else {
		const midY = a.y + (b.y - a.y) * (0.3 + random() * 0.4);
		pts.push({ x: a.x, y: midY });
		pts.push({ x: b.x, y: midY });
	}
	pts.push({ x: b.x, y: b.y });
	return pts;
}

function pathLen(pts: Point[]): number {
	let length = 0;
	for (let i = 1; i < pts.length; i++) {
		const previous = pts[i - 1];
		const point = pts[i];
		if (!previous || !point) continue;
		const dx = point.x - previous.x;
		const dy = point.y - previous.y;
		length += Math.sqrt(dx * dx + dy * dy);
	}
	return length || 1;
}

function posOnPath(pts: Point[], len: number, t: number): Point {
	const last = pts[pts.length - 1] ?? { x: 0, y: 0 };
	const target = Math.max(0, Math.min(1, t)) * len;
	let acc = 0;
	for (let i = 1; i < pts.length; i++) {
		const previous = pts[i - 1];
		const point = pts[i];
		if (!previous || !point) continue;
		const dx = point.x - previous.x;
		const dy = point.y - previous.y;
		const seg = Math.sqrt(dx * dx + dy * dy);
		if (acc + seg >= target && seg > 0) {
			const f = (target - acc) / seg;
			return { x: previous.x + dx * f, y: previous.y + dy * f };
		}
		acc += seg;
	}
	return { x: last.x, y: last.y };
}

function pickEdge(edges: number[], random: Rng): number {
	return edges[Math.floor(random() * edges.length)] ?? edges[0] ?? 0;
}

function newSprite(edgeCount: number, palette: SpriteColor[], random: Rng): Sprite {
	const eIdx = Math.floor(random() * edgeCount);
	const forward = random() > 0.5;
	const color = palette[Math.floor(random() * palette.length)] ?? palette[0];
	if (!color) {
		throw new Error('Circuit sprite palette is empty');
	}
	return {
		eIdx,
		t: forward ? 0 : 1,
		speed: 0.0015 + random() * 0.005,
		forward,
		size: 1.4 + random() * 1.6,
		brightness: 0.65 + random() * 0.35,
		trail: [],
		trailMax: 8 + Math.floor(random() * 10),
		pulse: random() * Math.PI * 2,
		color
	};
}

export function createCircuitBoard(
	width: number,
	height: number,
	theme: ThemeId,
	random: Rng
): CircuitBoard {
	const mobile = width < 768;
	const cell = mobile ? 100 + Math.floor(random() * 30) : 70 + Math.floor(random() * 20);
	const cols = Math.ceil(width / cell) + 2;
	const rows = Math.ceil(height / cell) + 2;
	const fillRate = mobile ? 0.55 : 0.7;
	const nodes: CircuitNode[] = [];

	for (let r = -1; r < rows; r++) {
		for (let c = -1; c < cols; c++) {
			if (random() > fillRate) continue;
			nodes.push({
				x: c * cell + (random() - 0.5) * cell * 0.55,
				y: r * cell + (random() - 0.5) * cell * 0.55,
				edges: [],
				flash: 0
			});
		}
	}

	const edges: CircuitEdge[] = [];
	const edgeSet = new Set<string>();
	const maxDist = cell * 2.2;

	for (let i = 0; i < nodes.length; i++) {
		const origin = nodes[i];
		if (!origin) continue;
		const candidates: { j: number; d: number }[] = [];
		for (let j = i + 1; j < nodes.length; j++) {
			const other = nodes[j];
			if (!other) continue;
			const dx = other.x - origin.x;
			const dy = other.y - origin.y;
			const d = Math.sqrt(dx * dx + dy * dy);
			if (d < maxDist && d > 25) candidates.push({ j, d });
		}
		candidates.sort((a, b) => a.d - b.d);

		let added = 0;
		for (const { j } of candidates) {
			if (added >= (mobile ? 3 : 5)) break;
			const key = `${i}-${j}`;
			if (edgeSet.has(key)) continue;
			const destination = nodes[j];
			if (!destination) continue;
			const maxConn = mobile ? 4 : 6;
			if (origin.edges.length >= maxConn || destination.edges.length >= maxConn) continue;
			edgeSet.add(key);
			const pts = makeTrace(origin, destination, random);
			const eIdx = edges.length;
			edges.push({ from: i, to: j, pts, len: pathLen(pts) });
			origin.edges.push(eIdx);
			destination.edges.push(eIdx);
			added++;
		}
	}

	const sprites: Sprite[] = [];
	if (edges.length > 0) {
		const palette = spritePalette(theme);
		const spriteRatio = mobile ? 0.35 : 0.5;
		const count = Math.max(8, Math.min(mobile ? 30 : 80, Math.floor(edges.length * spriteRatio)));
		for (let i = 0; i < count; i++) sprites.push(newSprite(edges.length, palette, random));
	}

	return { width, height, cell, mobile, nodes, edges, sprites };
}

export function circuitGeometry(board: CircuitBoard): string {
	const nodes = board.nodes.map((node) => `${node.x},${node.y}`).join(';');
	const edges = board.edges
		.map(
			(edge) =>
				`${edge.from}-${edge.to}:${edge.pts.map((point) => `${point.x},${point.y}`).join('|')}`
		)
		.join(';');
	return `${board.width}x${board.height}#${nodes}#${edges}`;
}

export function spriteStartEdges(board: CircuitBoard): number[] {
	return board.sprites.map((sprite) => sprite.eIdx);
}

/** Move packets along the current edges. Does not create a new board. */
export function advanceSprites(board: CircuitBoard, random: Rng = Math.random): void {
	for (const sprite of board.sprites) {
		const edge = board.edges[sprite.eIdx];
		if (!edge) continue;
		sprite.t += sprite.forward ? sprite.speed : -sprite.speed;
		sprite.pulse += 0.07;
		const pos = posOnPath(edge.pts, edge.len, sprite.t);
		sprite.trail.push({ x: pos.x, y: pos.y });
		if (sprite.trail.length > sprite.trailMax) sprite.trail.shift();

		if (sprite.t >= 1 || sprite.t <= 0) {
			const nodeIdx = sprite.t >= 1 ? edge.to : edge.from;
			const node = board.nodes[nodeIdx];
			if (node && node.edges.length > 0) {
				node.flash = 25;
				node.flashColor = sprite.color;
				const others = node.edges.filter((edgeIndex) => edgeIndex !== sprite.eIdx);
				const nextEIdx =
					others.length > 0 ? pickEdge(others, random) : pickEdge(node.edges, random);
				const next = board.edges[nextEIdx];
				if (next) {
					sprite.eIdx = nextEIdx;
					if (next.from === nodeIdx) {
						sprite.forward = true;
						sprite.t = 0;
					} else {
						sprite.forward = false;
						sprite.t = 1;
					}
				}
			}
			sprite.trail = [];
		}
	}
}

export function renderCircuitFrame(
	ctx: CanvasRenderingContext2D,
	board: CircuitBoard,
	theme: ThemeId,
	advance: boolean
): void {
	ctx.clearRect(0, 0, board.width, board.height);
	const dim = circuitDim(theme);
	const palette = COLOR_PALETTES[theme] ?? COLOR_PALETTES.dark;
	const circuit = palette[0] ?? [0, 255, 0];
	const cr = circuit[0] ?? 0;
	const cg = circuit[1] ?? 255;
	const cb = circuit[2] ?? 0;

	ctx.lineCap = 'square';
	ctx.lineJoin = 'miter';
	for (const edge of board.edges) {
		const start = edge.pts[0];
		if (!start) continue;
		ctx.beginPath();
		ctx.moveTo(start.x, start.y);
		for (let i = 1; i < edge.pts.length; i++) {
			const point = edge.pts[i];
			if (!point) continue;
			ctx.lineTo(point.x, point.y);
		}
		ctx.strokeStyle = `rgba(${cr},${cg},${cb},${0.09 * dim})`;
		ctx.lineWidth = 1.2;
		ctx.stroke();
	}

	for (const node of board.nodes) {
		if (node.edges.length === 0) continue;
		let flashA = 0;
		if (node.flash > 0) {
			flashA = node.flash / 25;
			if (advance) node.flash -= 1;
		}
		const s = 1.5;
		ctx.fillStyle = `rgba(${cr},${cg},${cb},${(0.1 + flashA * 0.4) * dim})`;
		ctx.fillRect(node.x - s, node.y - s, s * 2, s * 2);
		if (flashA > 0.05) {
			const flash = node.flashColor ?? { r: cr, g: cg, b: cb };
			ctx.shadowBlur = 12;
			ctx.shadowColor = `rgba(${flash.r},${flash.g},${flash.b},${flashA * 0.45 * dim})`;
			ctx.beginPath();
			ctx.arc(node.x, node.y, 4 + flashA * 4, 0, Math.PI * 2);
			ctx.fillStyle = `rgba(${flash.r},${flash.g},${flash.b},${flashA * 0.2 * dim})`;
			ctx.fill();
			ctx.shadowBlur = 0;
		}
	}

	if (advance) advanceSprites(board);

	for (const sprite of board.sprites) {
		const edge = board.edges[sprite.eIdx];
		if (!edge) continue;
		const pos = posOnPath(edge.pts, edge.len, sprite.t);
		const color = sprite.color;
		for (let i = 0; i < sprite.trail.length; i++) {
			const point = sprite.trail[i];
			if (!point) continue;
			const fade = (i + 1) / sprite.trail.length;
			ctx.beginPath();
			ctx.arc(point.x, point.y, sprite.size * fade * 0.7, 0, Math.PI * 2);
			ctx.fillStyle = `rgba(${color.r},${color.g},${color.b},${fade * 0.5 * sprite.brightness * dim})`;
			ctx.fill();
		}

		const pulseSize = 1 + Math.sin(sprite.pulse) * 0.12;
		const size = sprite.size * pulseSize;
		ctx.shadowBlur = 10;
		ctx.shadowColor = `rgba(${color.r},${color.g},${color.b},${0.5 * sprite.brightness * dim})`;
		ctx.beginPath();
		ctx.arc(pos.x, pos.y, size, 0, Math.PI * 2);
		ctx.fillStyle = `rgba(${color.hr},${color.hg},${color.hb},${0.95 * sprite.brightness * dim})`;
		ctx.fill();
		ctx.shadowBlur = 0;
		ctx.beginPath();
		ctx.arc(pos.x, pos.y, size * 3, 0, Math.PI * 2);
		ctx.fillStyle = `rgba(${color.r},${color.g},${color.b},${0.08 * sprite.brightness * dim})`;
		ctx.fill();
	}
}
