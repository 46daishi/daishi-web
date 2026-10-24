export function hexToHslTriplet(hex: string): string {
	const value = hex.replace('#', '');
	const r = parseInt(value.slice(0, 2), 16) / 255;
	const g = parseInt(value.slice(2, 4), 16) / 255;
	const b = parseInt(value.slice(4, 6), 16) / 255;

	const max = Math.max(r, g, b);
	const min = Math.min(r, g, b);
	const delta = max - min;
	const lightness = (max + min) / 2;

	let hue = 0;
	let saturation = 0;

	if (delta !== 0) {
		saturation = lightness > 0.5 ? delta / (2 - max - min) : delta / (max + min);

		if (max === r) {
			hue = (g - b) / delta + (g < b ? 6 : 0);
		} else if (max === g) {
			hue = (b - r) / delta + 2;
		} else {
			hue = (r - g) / delta + 4;
		}

		hue *= 60;
	}

	return `${Number(hue.toFixed(1))} ${Number((saturation * 100).toFixed(1))}% ${Number((lightness * 100).toFixed(1))}%`;
}
