import { readdir, readFile } from 'node:fs/promises';
import { join } from 'node:path';

// Registry source filenames never belong in browser code, even for public projects.
// Public UI receives explicitly selected cards from server load functions.
const records = JSON.parse(
	await readFile(new URL('../src/lib/projects/registry.json', import.meta.url), 'utf8')
);
const forbidden = records.map((record) => record.file).filter(Boolean);
const root = '.svelte-kit/output/client';
let checked = 0;
async function walk(directory) {
	for (const entry of await readdir(directory, { withFileTypes: true })) {
		const path = join(directory, entry.name);
		if (entry.isDirectory()) {
			await walk(path);
			continue;
		}
		if (!entry.name.endsWith('.js') && !entry.name.endsWith('.map')) continue;
		checked++;
		const content = await readFile(path, 'utf8');
		if (forbidden.some((marker) => content.includes(marker))) {
			throw new Error(`Project registry data found in client output: ${path}`);
		}
	}
}
await walk(root);
if (!checked) throw new Error('No client JavaScript found. Run pnpm build first.');
console.log(`Client publication boundary passed (${checked} files).`);
