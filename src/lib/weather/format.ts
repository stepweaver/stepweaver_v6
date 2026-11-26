export type ForecastSample = {
	at: number;
	condition: string;
	highF: number | null;
	lowF: number | null;
};

export type WeatherReport = {
	location: string;
	condition: string;
	tempF: number;
	tempC: number;
	humidity: number | null;
	windMph: number | null;
	timezoneOffsetSeconds: number | null;
	forecast: ForecastSample[];
	/** Set when a requested forecast could not be read. An omitted forecast stays unset. */
	forecastUnavailable?: boolean;
};

const WEEKDAYS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
const MONTHS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

/**
 * Local labels use one UTC offset for every sample in the report.
 * OpenWeather sends that offset on the current observation. A forecast that
 * crosses a daylight-saving transition stays on the same offset. This module
 * does not load a timezone database.
 */
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

export function formatWeatherLines(
	report: WeatherReport
): { text: string; tone: 'success' | 'lambda' | 'dimmed' }[] {
	const lines: { text: string; tone: 'success' | 'lambda' | 'dimmed' }[] = [
		{ text: `Weather: ${report.location}`, tone: 'success' },
		{ text: `  ${report.condition}`, tone: 'lambda' },
		{ text: `  ${report.tempF}°F (${report.tempC}°C)`, tone: 'lambda' },
		{ text: `  Humidity: ${measurement(report.humidity, '%')}`, tone: 'dimmed' },
		{ text: `  Wind: ${measurement(report.windMph, ' mph')}`, tone: 'dimmed' }
	];
	if (report.forecastUnavailable) {
		lines.push({ text: 'Forecast: unavailable', tone: 'dimmed' });
		return lines;
	}
	if (!report.forecast.length || report.timezoneOffsetSeconds === null) {
		if (report.forecast.length) {
			lines.push({ text: 'Forecast: local time unavailable', tone: 'dimmed' });
		}
		return lines;
	}
	lines.push({ text: '', tone: 'dimmed' });
	lines.push({ text: 'Forecast, city local time:', tone: 'success' });
	for (const day of dailyForecast(report.forecast, report.timezoneOffsetSeconds)) {
		lines.push({
			text: `  ${day.label}: ${day.condition}, ${degrees(day.highF)} / ${degrees(day.lowF)}`,
			tone: 'dimmed'
		});
	}
	return lines;
}

function measurement(value: number | null, suffix: string): string {
	return value === null ? 'unavailable' : `${value}${suffix}`;
}

function degrees(value: number | null): string {
	return value === null ? 'unavailable' : `${value}°F`;
}

function formatCityDate(unixSeconds: number, offsetSeconds: number): string {
	const shifted = new Date((unixSeconds + offsetSeconds) * 1000);
	const weekday = WEEKDAYS[shifted.getUTCDay()] ?? '';
	const month = MONTHS[shifted.getUTCMonth()] ?? '';
	return `${weekday} ${month} ${shifted.getUTCDate()}`;
}

/** One row per local calendar day, using that day's actual high and low. */
function dailyForecast(samples: ForecastSample[], offsetSeconds: number) {
	const days = new Map<
		string,
		{
			label: string;
			condition: string;
			highF: number | null;
			lowF: number | null;
			noonDistance: number;
		}
	>();
	for (const sample of samples) {
		if (!Number.isFinite(sample.at)) continue;
		const shifted = new Date((sample.at + offsetSeconds) * 1000);
		const key = `${shifted.getUTCFullYear()}-${shifted.getUTCMonth()}-${shifted.getUTCDate()}`;
		const minutes = shifted.getUTCHours() * 60 + shifted.getUTCMinutes();
		const noonDistance = Math.abs(minutes - 12 * 60);
		const existing = days.get(key);
		if (!existing) {
			days.set(key, {
				label: formatCityDate(sample.at, offsetSeconds),
				condition: sample.condition,
				highF: sample.highF,
				lowF: sample.lowF,
				noonDistance
			});
			continue;
		}
		existing.highF = extreme(existing.highF, sample.highF, Math.max);
		existing.lowF = extreme(existing.lowF, sample.lowF, Math.min);
		if (noonDistance < existing.noonDistance) {
			existing.noonDistance = noonDistance;
			existing.condition = sample.condition;
		}
	}
	return [...days.values()].slice(0, 5);
}

function extreme(
	current: number | null,
	incoming: number | null,
	pick: (left: number, right: number) => number
): number | null {
	if (incoming === null) return current;
	if (current === null) return incoming;
	return pick(current, incoming);
}
