import { describe, expect, it } from 'vitest';
import { consoleViewportFrame } from './viewport';

describe('console viewport', () => {
	it('sizes the shell to the visual viewport and shifts it when the keyboard moves the view', () => {
		expect(consoleViewportFrame({ height: 480, offsetTop: 320 })).toEqual({
			height: '480px',
			offset: '320px',
			shifted: true
		});
		expect(consoleViewportFrame({ height: 900, offsetTop: 0 })?.shifted).toBe(false);
		expect(consoleViewportFrame({ height: 0, offsetTop: 0 })).toBeNull();
	});
});
