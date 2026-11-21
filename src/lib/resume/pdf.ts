import { identity } from '$lib/data/identity';
import { resumeData } from '$lib/data/resume-data';

type FontName = 'F1' | 'F2';
type Line = { text: string; size: number; font: FontName; gap: number };

const PAGE_WIDTH = 612;
const PAGE_HEIGHT = 792;
const MARGIN = 54;
const BOTTOM = 54;

const REPLACEMENTS: Record<string, string> = {
	λ: 'lambda',
	'–': '-',
	'—': '-',
	'’': "'",
	'‘': "'",
	'“': '"',
	'”': '"',
	'·': '|',
	'•': '-'
};

export function pdfSafe(value: string): string {
	let text = '';
	for (const char of value) text += REPLACEMENTS[char] ?? (char.charCodeAt(0) < 128 ? char : '?');
	return text;
}

function wrap(value: string, size: number): string[] {
	const text = pdfSafe(value);
	const max = Math.max(20, Math.floor((PAGE_WIDTH - MARGIN * 2) / (size * 0.52)));
	const words = text.split(/\s+/).filter(Boolean);
	const lines: string[] = [];
	let current = '';
	for (const word of words) {
		const next = current ? `${current} ${word}` : word;
		if (next.length > max && current) {
			lines.push(current);
			current = word;
		} else {
			current = next;
		}
	}
	if (current) lines.push(current);
	return lines.length ? lines : [''];
}

function collectLines(): Line[] {
	const lines: Line[] = [
		{ text: 'DRAFT - pending editorial review', size: 11, font: 'F2', gap: 16 },
		{
			text: 'Generated from the resume page. Not a replacement for the production PDF.',
			size: 9,
			font: 'F1',
			gap: 18
		},
		{ text: resumeData.identity.title, size: 18, font: 'F2', gap: 16 },
		{ text: resumeData.identity.subtitle, size: 12, font: 'F1', gap: 14 },
		{ text: `${identity.location} | ${identity.email}`, size: 10, font: 'F1', gap: 18 },
		{ text: resumeData.summary.practice, size: 11, font: 'F1', gap: 16 },
		{ text: resumeData.summary.title, size: 13, font: 'F2', gap: 14 }
	];
	for (const item of resumeData.summary.body) {
		lines.push({ text: item, size: 10, font: 'F1', gap: 12 });
	}
	lines.push({ text: resumeData.skills.title, size: 13, font: 'F2', gap: 14 });
	for (const group of resumeData.skills.groups) {
		lines.push({ text: group.label, size: 11, font: 'F2', gap: 12 });
		lines.push({ text: group.items.join(', '), size: 10, font: 'F1', gap: 12 });
	}
	lines.push({ text: resumeData.experience.title, size: 13, font: 'F2', gap: 14 });
	for (const role of resumeData.experience.roles) {
		lines.push({ text: `${role.role}, ${role.org}`, size: 11, font: 'F2', gap: 12 });
		lines.push({ text: role.when, size: 10, font: 'F1', gap: 12 });
		for (const bullet of role.bullets) {
			lines.push({ text: `- ${bullet}`, size: 10, font: 'F1', gap: 11 });
		}
		lines.push({ text: '', size: 8, font: 'F1', gap: 8 });
	}
	lines.push({ text: resumeData.education.title, size: 13, font: 'F2', gap: 14 });
	for (const item of resumeData.education.items) {
		lines.push({ text: item, size: 10, font: 'F1', gap: 12 });
	}
	return lines;
}

function paginate(lines: Line[]): string[][] {
	const pages: string[][] = [];
	let commands: string[] = [];
	let y = PAGE_HEIGHT - MARGIN;
	const pushPage = () => {
		pages.push(commands);
		commands = [];
		y = PAGE_HEIGHT - MARGIN;
	};
	for (const line of lines) {
		const wrapped = line.text ? wrap(line.text, line.size) : [''];
		for (const part of wrapped) {
			if (y - line.size < BOTTOM) pushPage();
			const shown = part.replaceAll('\\', '\\\\').replaceAll('(', '\\(').replaceAll(')', '\\)');
			commands.push(
				`BT /${line.font} ${line.size} Tf 1 0 0 1 ${MARGIN} ${y.toFixed(2)} Tm (${shown}) Tj ET`
			);
			y -= line.gap;
		}
	}
	if (commands.length) pages.push(commands);
	return pages;
}

export function buildResumePdf(): string {
	const pages = paginate(collectLines());
	const objects: string[] = [];
	const pageIds: number[] = [];
	let nextId = 3;
	const fontRegular = nextId++;
	const fontBold = nextId++;
	const contentIds: number[] = [];
	for (const commands of pages) {
		contentIds.push(nextId);
		const stream = commands.join('\n');
		objects.push(
			`${nextId} 0 obj << /Length ${stream.length} >> stream\n${stream}\nendstream endobj\n`
		);
		nextId += 1;
		pageIds.push(nextId);
		objects.push(
			`${nextId} 0 obj << /Type /Page /Parent 2 0 R /MediaBox [0 0 ${PAGE_WIDTH} ${PAGE_HEIGHT}] /Contents ${contentIds[contentIds.length - 1]} 0 R /Resources << /Font << /F1 ${fontRegular} 0 R /F2 ${fontBold} 0 R >> >> >> endobj\n`
		);
		nextId += 1;
	}
	const catalog = `1 0 obj << /Type /Catalog /Pages 2 0 R >> endobj\n`;
	const pageTree = `2 0 obj << /Type /Pages /Count ${pageIds.length} /Kids [${pageIds.map((id) => `${id} 0 R`).join(' ')}] >> endobj\n`;
	const fonts = `${fontRegular} 0 obj << /Type /Font /Subtype /Type1 /BaseFont /Helvetica >> endobj\n${fontBold} 0 obj << /Type /Font /Subtype /Type1 /BaseFont /Helvetica-Bold >> endobj\n`;
	const body = catalog + pageTree + fonts + objects.join('');
	const header = '%PDF-1.4\n';
	let cursor = header.length + catalog.length + pageTree.length;
	const contentPositions = new Map<number, number>([
		[1, header.length],
		[2, header.length + catalog.length],
		[fontRegular, cursor],
		[fontBold, cursor + fonts.indexOf(`${fontBold} 0 obj`)]
	]);
	cursor += fonts.length;
	for (const object of objects) {
		const id = Number(object.slice(0, object.indexOf(' ')));
		contentPositions.set(id, cursor);
		cursor += object.length;
	}
	const maxId = Math.max(...contentPositions.keys());
	let xref = `xref\n0 ${maxId + 1}\n0000000000 65535 f \n`;
	for (let id = 1; id <= maxId; id += 1) {
		xref += `${String(contentPositions.get(id) ?? 0).padStart(10, '0')} 00000 n \n`;
	}
	const trailer = `${xref}trailer << /Size ${maxId + 1} /Root 1 0 R >>\nstartxref\n${cursor}\n%%EOF`;
	return header + body + trailer;
}
