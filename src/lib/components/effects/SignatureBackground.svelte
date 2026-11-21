<script lang="ts">
	import { afterNavigate } from '$app/navigation';
	import { onMount } from 'svelte';
	import { renderCircuitFrame } from '$lib/effects/circuit-board';
	import { getDocumentScrollProgressY } from '$lib/effects/document-scroll';
	import {
		circuitOpacity,
		lambdaGlow,
		lambdaOpacity,
		lambdaPlacement,
		paletteColor
	} from '$lib/effects/lambda-motion';
	import { createSignatureSession } from '$lib/effects/signature-session';
	import { currentTheme } from '$lib/theme/apply-theme';
	import type { ThemeId } from '$lib/theme/themes';

	let circuitCanvas = $state<HTMLCanvasElement>();
	let lambdaCanvas = $state<HTMLCanvasElement>();

	let syncAfterNavigation: (() => void) | null = null;

	afterNavigate(() => {
		syncAfterNavigation?.();
	});

	onMount(() => {
		if (!circuitCanvas || !lambdaCanvas) return;
		const circuit: HTMLCanvasElement = circuitCanvas;
		const lambda: HTMLCanvasElement = lambdaCanvas;

		const session = createSignatureSession();
		const motion = window.matchMedia('(prefers-reduced-motion: reduce)');
		let theme: ThemeId = currentTheme();
		let reduced = motion.matches;
		let alive = true;
		let frame = 0;
		let scrollFrame = 0;
		let scrollQueued = false;
		let resyncA = 0;
		let resyncB = 0;
		let resyncTimer = 0;
		let original: ImageData | null = null;
		let lastColorKey = '';
		session.setTheme(theme);

		const lambdaContext = lambda.getContext('2d', { willReadFrequently: true });

		function paintLambda(force: boolean) {
			const placement = lambdaPlacement(session.progress, session.width);
			lambda.style.transform = placement.transform;
			lambda.style.opacity = String(lambdaOpacity(theme));
			lambda.style.filter = lambdaGlow(theme);
			lambda.dataset.color = paletteColor(session.progress, theme).key;
			lambda.dataset.progress = String(session.progress);
			if (!lambdaContext || !original) return;
			const color = paletteColor(session.progress, theme);
			if (!force && color.key === lastColorKey) return;
			lastColorKey = color.key;
			const image = new ImageData(
				new Uint8ClampedArray(original.data),
				original.width,
				original.height
			);
			const data = image.data;
			for (let i = 0; i < data.length; i += 4) {
				if ((data[i + 3] ?? 0) > 0) {
					data[i] = color.r;
					data[i + 1] = color.g;
					data[i + 2] = color.b;
				}
			}
			lambdaContext.putImageData(image, 0, 0);
		}

		function paintCircuit(advance: boolean) {
			const board = session.board;
			const ctx = circuit.getContext('2d');
			if (!board || !ctx) return;
			renderCircuitFrame(ctx, board, theme, advance);
		}

		function stopMotion() {
			cancelAnimationFrame(frame);
			frame = 0;
		}

		function startMotion() {
			stopMotion();
			const tick = () => {
				if (!alive) return;
				paintCircuit(true);
				if (!reduced) frame = requestAnimationFrame(tick);
			};
			tick();
		}

		function relayout() {
			session.setTheme(theme);
			const width = window.innerWidth;
			const height = window.innerHeight;
			circuit.width = width;
			circuit.height = height;
			session.apply({
				type: 'resize',
				width,
				height,
				progress: getDocumentScrollProgressY()
			});
			circuit.style.opacity = String(circuitOpacity(theme));
			circuit.dataset.boardGeneration = String(session.generation);
			circuit.dataset.motion = reduced ? 'reduced' : 'run';
			lastColorKey = '';
			paintLambda(true);
			startMotion();
		}

		function applyScroll() {
			session.apply({ type: 'scroll', progress: getDocumentScrollProgressY() });
			paintLambda(false);
		}

		function scheduleScrollResync() {
			applyScroll();
			cancelAnimationFrame(resyncA);
			cancelAnimationFrame(resyncB);
			window.clearTimeout(resyncTimer);
			resyncA = requestAnimationFrame(() => {
				applyScroll();
				resyncB = requestAnimationFrame(applyScroll);
			});
			resyncTimer = window.setTimeout(applyScroll, 120);
		}

		syncAfterNavigation = scheduleScrollResync;

		function onScroll() {
			if (scrollQueued) return;
			scrollQueued = true;
			scrollFrame = requestAnimationFrame(() => {
				scrollQueued = false;
				if (alive) applyScroll();
			});
		}

		function onResize() {
			relayout();
		}

		function onTheme() {
			const next = currentTheme();
			if (next === theme) return;
			theme = next;
			relayout();
		}

		function onMotion() {
			const next = motion.matches;
			if (next === reduced) return;
			reduced = next;
			relayout();
		}

		function onPageShow() {
			scheduleScrollResync();
			if (!reduced && frame === 0) startMotion();
			else paintCircuit(false);
		}

		const observer = new MutationObserver(onTheme);
		observer.observe(document.documentElement, {
			attributes: true,
			attributeFilter: ['data-theme']
		});
		motion.addEventListener('change', onMotion);
		window.addEventListener('resize', onResize, { passive: true });
		window.addEventListener('scroll', onScroll, { passive: true });
		window.addEventListener('pageshow', onPageShow);

		relayout();
		scheduleScrollResync();

		const image = new Image();
		image.onload = () => {
			if (!lambdaContext) return;
			lambda.width = image.width;
			lambda.height = image.height;
			lambda.hidden = false;
			lambdaContext.drawImage(image, 0, 0);
			original = lambdaContext.getImageData(0, 0, lambda.width, lambda.height);
			lastColorKey = '';
			paintLambda(true);
		};
		image.onerror = () => {
			lambda.hidden = true;
		};
		image.src = '/images/lambda_stepweaver.png';

		return () => {
			alive = false;
			syncAfterNavigation = null;
			stopMotion();
			cancelAnimationFrame(scrollFrame);
			cancelAnimationFrame(resyncA);
			cancelAnimationFrame(resyncB);
			window.clearTimeout(resyncTimer);
			observer.disconnect();
			motion.removeEventListener('change', onMotion);
			window.removeEventListener('resize', onResize);
			window.removeEventListener('scroll', onScroll);
			window.removeEventListener('pageshow', onPageShow);
		};
	});
</script>

<div class="circuit-layer" inert aria-hidden="true">
	<canvas
		bind:this={circuitCanvas}
		class="circuit-canvas"
		data-board-generation="0"
		data-motion="run"
	></canvas>
</div>

<div class="lambda-layer" inert aria-hidden="true">
	<canvas bind:this={lambdaCanvas} class="lambda-canvas" width="1024" height="1536"></canvas>
</div>

<div class="scanlines" inert aria-hidden="true"></div>

<style>
	.circuit-layer,
	.lambda-layer,
	.scanlines {
		position: fixed;
		inset: 0;
		pointer-events: none;
	}

	.circuit-layer {
		z-index: -2;
	}

	.lambda-layer {
		z-index: -1;
		display: flex;
		align-items: center;
		justify-content: flex-start;
		overflow: hidden;
	}

	.circuit-canvas {
		display: block;
		width: 100%;
		height: 100%;
	}

	.lambda-canvas {
		display: block;
		flex: none;
		max-inline-size: none;
		inline-size: auto;
		block-size: auto;
		transform-origin: center;
	}

	.scanlines {
		z-index: 9999;
		background: repeating-linear-gradient(
			0deg,
			transparent,
			transparent 2px,
			rgba(0, 0, 0, 0.03) 2px,
			rgba(0, 0, 0, 0.03) 4px
		);
	}

	@media (min-width: 768px) {
		.lambda-layer {
			justify-content: flex-end;
			padding-right: 2.5rem;
		}
	}

	@media (min-width: 1024px) {
		.lambda-layer {
			padding-right: 4rem;
		}
	}
</style>
