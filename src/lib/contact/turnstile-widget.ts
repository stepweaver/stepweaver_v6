export type TurnstileHandle = {
	reset: () => void;
	destroy: () => void;
};

type TurnstileApi = {
	render: (
		element: HTMLElement,
		options: {
			sitekey: string;
			action: string;
			callback: (token: string) => void;
			'expired-callback': () => void;
			'error-callback': () => void;
		}
	) => string;
	reset: (widgetId: string) => void;
	remove: (widgetId: string) => void;
};

const SCRIPT = 'https://challenges.cloudflare.com/turnstile/v0/api.js?render=explicit';

function api(): TurnstileApi | undefined {
	return (window as Window & { turnstile?: TurnstileApi }).turnstile;
}

let loading: Promise<TurnstileApi | null> | null = null;

function loadTurnstile(): Promise<TurnstileApi | null> {
	const ready = api();
	if (ready) return Promise.resolve(ready);
	if (!loading) {
		loading = new Promise((resolve) => {
			const script = document.createElement('script');
			script.src = SCRIPT;
			script.async = true;
			script.onload = () => resolve(api() ?? null);
			script.onerror = () => {
				loading = null;
				resolve(null);
			};
			document.head.appendChild(script);
		});
	}
	return loading;
}

/** One shared widget loader. Tokens are single-use, so callers reset after every submit. */
export function mountTurnstile(
	element: HTMLElement,
	siteKey: string,
	onToken: (token: string) => void
): TurnstileHandle {
	let widgetId = '';
	let gone = false;
	void loadTurnstile().then((turnstile) => {
		if (!turnstile || gone) return;
		widgetId = turnstile.render(element, {
			sitekey: siteKey,
			action: 'contact',
			callback: onToken,
			'expired-callback': () => onToken(''),
			'error-callback': () => onToken('')
		});
	});
	return {
		reset() {
			onToken('');
			if (widgetId) api()?.reset(widgetId);
		},
		destroy() {
			gone = true;
			if (widgetId) api()?.remove(widgetId);
			element.replaceChildren();
		}
	};
}
