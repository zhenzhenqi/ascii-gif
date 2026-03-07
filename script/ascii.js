// Author: Andrei Gheorghe (http://github.com/idevelop)
// Braille extension based on 2x2 bitmapping logic

export const ascii = (function () {
	function getPixelBrightness(data, x, y, width, contrastFactor) {
		var offset = (y * width + x) * 4;
		var r = data[offset];
		var g = data[offset + 1];
		var b = data[offset + 2];

		// Apply contrast
		r = bound(Math.floor((r - 128) * contrastFactor) + 128, [0, 255]);
		g = bound(Math.floor((g - 128) * contrastFactor) + 128, [0, 255]);
		b = bound(Math.floor((b - 128) * contrastFactor) + 128, [0, 255]);

		return (0.299 * r + 0.587 * g + 0.114 * b) / 255;
	}

	function asciiFromCanvas(canvas, options) {
		var characters = (" .,:;i1tfLCG08@").split("");
		var context = canvas.getContext("2d");
		var canvasWidth = canvas.width;
		var canvasHeight = canvas.height;
		var asciiCharacters = "";
		var contrastFactor = (259 * (options.contrast + 255)) / (255 * (259 - options.contrast));
		var imageData = context.getImageData(0, 0, canvasWidth, canvasHeight);

		for (var y = 0; y < canvasHeight; y += 2) {
			for (var x = 0; x < canvasWidth; x++) {
				var brightness = getPixelBrightness(imageData.data, x, y, canvasWidth, contrastFactor);
				var character = characters[(characters.length - 1) - Math.round(brightness * (characters.length - 1))];
				asciiCharacters += character;
			}
			asciiCharacters += "\n";
		}
		options.callback(asciiCharacters);
	}

	function brailleFromCanvas(canvas, options) {
		var context = canvas.getContext("2d");
		var canvasWidth = canvas.width;
		var canvasHeight = canvas.height;
		var brailleCharacters = "";
		var contrastFactor = (259 * (options.contrast + 255)) / (255 * (259 - options.contrast));
		var imageData = context.getImageData(0, 0, canvasWidth, canvasHeight);

		// Iterate in 2x2 blocks as per the a,b,c,d grid logic
		for (var y = 0; y < canvasHeight; y += 2) {
			for (var x = 0; x < canvasWidth; x += 2) {
				// Determine bits (1 if bright, 0 if dark)
				var a = getPixelBrightness(imageData.data, x, y, canvasWidth, contrastFactor) > 0.5 ? 1 : 0;
				var b = (x + 1 < canvasWidth) && getPixelBrightness(imageData.data, x + 1, y, canvasWidth, contrastFactor) > 0.5 ? 1 : 0;
				var c = (y + 1 < canvasHeight) && getPixelBrightness(imageData.data, x, y + 1, canvasWidth, contrastFactor) > 0.5 ? 1 : 0;
				var d = (x + 1 < canvasWidth && y + 1 < canvasHeight) && getPixelBrightness(imageData.data, x + 1, y + 1, canvasWidth, contrastFactor) > 0.5 ? 1 : 0;

				// Map bits to Braille offset (a=bit0, b=bit1, c=bit2, d=bit3)
				var code = (a << 0) | (b << 1) | (c << 2) | (d << 3);
				brailleCharacters += String.fromCharCode(0x2800 + code);
			}
			brailleCharacters += "\n";
		}
		options.callback(brailleCharacters);
	}

	function bound(value, interval) {
		return Math.max(interval[0], Math.min(interval[1], value));
	}

	return {
		fromCanvas: function (canvas, options) {
			options = options || {};
			options.contrast = (typeof options.contrast === "undefined" ? 128 : options.contrast);
			return asciiFromCanvas(canvas, options);
		},
		brailleFromCanvas: function (canvas, options) {
			options = options || {};
			options.contrast = (typeof options.contrast === "undefined" ? 128 : options.contrast);
			return brailleFromCanvas(canvas, options);
		}
	};
})();