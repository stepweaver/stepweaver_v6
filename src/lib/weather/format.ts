export type ForecastSample = {
	at: number;
	condition: string;
	highF: number;
	lowF: number;
};

export type WeatherReport = {
	location: string;
	condition: string;
	tempF: number;
	tempC: number;
	humidity: number;
	windMph: number;
	timezoneOffsetSeconds: number;
	forecast: ForecastSample[];
};

const WEEKDAYS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
const MONTHS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

export function formatCityTime(unixSeconds: number, offsetSeconds: number): string {
	const shifted = new Date((unixSeconds + offsetSeconds) * 1000);
	const hour24 = shifted.getUTCHours();
	const hour = hour24 % 12 || 12;
	const minutes = String(shifted.getUTCMinutes()).padStart(2, '0');
	const suffix = hour24 >= 12 ? 'PM' : 'AM';
	const weekday = WEEKDAYS[shifted.getUTCDay()] ?? '';
	const month = MONTHS[shifted.getUTCMonth()] ?? '';
	return `${weekday} ${month} ${shifted.getUTCDate()}, ${hour}:${minutes} ${suffix}`;
}

export function formatWeatherLines(report: WeatherReport): { text: string; tone: 'success' | 'lambda' | 'dimmed' }[] {
	const lines: { text: string; tone: 'success' | 'lambda' | 'dimmed' }[] = [
		{ text: `Weather: ${report.location}`, tone: 'success' },
		{ text: `  ${report.condition}`, tone: 'lambda' },
		{ text: `  ${report.tempF}°F (${report.tempC}°C)`, tone: 'lambda' },
		{ text: `  Humidity: ${report.humidity}%`, tone: 'dimmed' },
		{ text: `  Wind: ${report.windMph} mph`, tone: 'dimmed' }
	];
	if (!report.forecast.length) return lines;
	lines.push({ text: '', tone: 'dimmed' });
	lines.push({ text: 'Forecast, city local time:', tone: 'success' });
	for (const day of firstLocalDays(report.forecast, report.timezoneOffsetSeconds)) {
		lines.push({
			text: `  ${day.label}: ${day.condition}, ${day.highF}°F / ${day.lowF}°F`,
			tone: 'dimmed'
		});
	}
	return lines;
}

function firstLocalDays(samples: ForecastSample[], offsetSeconds: number) {
	const seen = new Set<string>();
	const rows: { label: string; condition: string; highF: number; lowF: number }[] = [];
	for (const sample of samples) {
		const shifted = new Date((sample.at + offsetSeconds) * 1000);
		const key = `${shifted.getUTCFullYear()}-${shifted.getUTCMonth()}-${shifted.getUTCDate()}`;
		if (seen.has(key)) continue;
		seen.add(key);
		rows.push({
			label: formatCityTime(sample.at, offsetSeconds),
			condition: sample.condition,
			highF: sample.highF,
			lowF: sample.lowF
		});
		if (rows.length === 5) break;
	}
	return rows;
}
