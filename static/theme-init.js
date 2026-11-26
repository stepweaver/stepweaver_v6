(function () {
	try {
		var theme =
			localStorage.getItem('stepweaver-appearance') ||
			localStorage.getItem('stepweaver-color-scheme');
		var allowed = {
			dark: 1,
			light: 1,
			monochrome: 1,
			'monochrome-inverted': 1,
			vintage: 1,
			apple: 1,
			c64: 1,
			amber: 1,
			synthwave: 1,
			dracula: 1,
			solarized: 1,
			nord: 1,
			cobalt: 1,
			skynet: 1
		};
		if (!theme || !allowed[theme]) theme = 'dark';
		document.documentElement.setAttribute('data-theme', theme);
	} catch {
		document.documentElement.setAttribute('data-theme', 'dark');
	}
})();
