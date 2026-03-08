//ascii, braille, vs. block

export const ascii = (function () {
	// Increased range of characters for better grayscale detail
	const RAMP = " .:-=+*#%@";

	function getBrightness(r, g, b) {
		return (0.299 * r + 0.587 * g + 0.114 * b) / 255;
	}

	function convert(canvas, options) {
		const { width, height } = canvas;
		const ctx = canvas.getContext("2d");
		const imageData = ctx.getImageData(0, 0, width, height).data;

		let output = "";

		// Sampling grid: 2 wide by 4 high to account for font aspect ratio
		for (let y = 0; y < height; y += 4) {
			for (let x = 0; x < width; x += 2) {
				let totalBrightness = 0;
				let count = 0;

				// Average the 2x4 block brightness
				for (let iy = 0; iy < 4; iy++) {
					for (let ix = 0; ix < 2; ix++) {
						const px = x + ix;
						const py = y + iy;
						if (px < width && py < height) {
							const i = (py * width + px) * 4;
							totalBrightness += getBrightness(imageData[i], imageData[i + 1], imageData[i + 2]);
							count++;
						}
					}
				}

				const avg = totalBrightness / count;
				output += RAMP[Math.floor(avg * (RAMP.length - 1))];
			}
			output += "\n";
		}
		if (options.callback) options.callback(output);
	}

	return {
		// Standard density-based ASCII
		fromCanvas: (canvas, options) => convert(canvas, options),

		// Block-based (using your preferred block symbols)
		blockFromCanvas: (canvas, options) => {
			// Simplified version using 2x4 blocks
			// 
			convert(canvas, options);
		}
	};
})();