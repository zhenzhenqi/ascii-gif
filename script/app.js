import { parseGIF, decompressFrames } from 'gifuct-js';
import GIF from 'gif.js';
import { ascii } from './ascii.js';

(function () {
	const fileInput = document.getElementById('fileInput');
	const filterSelect = document.getElementById('filterSelect');
	const resultContainer = document.getElementById('result');
	const status = document.getElementById('status');
	const processBtn = document.getElementById('processBtn');

	// Reusable canvas for processing frames
	const canvas = document.createElement('canvas');
	const ctx = canvas.getContext('2d');

	// Helper: Draws ASCII/Braille string to canvas for the GIF encoder
	const renderAsciiToCanvas = (text, canvas, width, height) => {
		const lines = text.split('\n');
		const ctx = canvas.getContext('2d');
		ctx.fillStyle = "white";
		ctx.fillRect(0, 0, width, height);
		ctx.fillStyle = "black";
		ctx.font = "10px monospace";
		ctx.textBaseline = "top";
		lines.forEach((line, i) => ctx.fillText(line, 0, i * 10));
	};

	const processGIF = async () => {
		const file = fileInput.files[0];
		if (!file) return alert("Please select a GIF first.");

		status.innerText = "Parsing and Converting...";
		const reader = new FileReader();

		reader.onload = async (e) => {
			const gif = parseGIF(e.target.result);
			const frames = decompressFrames(gif, true);
			const asciiFrames = [];

			// 1. Convert all frames
			// Inside your processGIF reader.onload function:
			for (const frame of frames) {
				// 1. Calculate aspect ratio to maintain proportions
				const maxWidth = 100; // Adjust this for "resolution"
				const scale = maxWidth / frame.dims.width;
				const newWidth = maxWidth;
				const newHeight = Math.floor(frame.dims.height * scale);

				// 2. Create a small canvas for the actual conversion
				const smallCanvas = document.createElement('canvas');
				smallCanvas.width = newWidth;
				smallCanvas.height = newHeight;
				const smallCtx = smallCanvas.getContext('2d');

				// 3. Draw the original high-res frame into the small canvas
				// This downsampling process naturally "blurs" pixels together, 
				// which the ASCII converter interprets as shades of grey.
				const tempCanvas = document.createElement('canvas');
				tempCanvas.width = frame.dims.width;
				tempCanvas.height = frame.dims.height;
				tempCanvas.getContext('2d').putImageData(new ImageData(new Uint8ClampedArray(frame.patch), frame.dims.width, frame.dims.height), 0, 0);

				smallCtx.drawImage(tempCanvas, 0, 0, newWidth, newHeight);

				// 4. Run the converter on the tiny, downsampled canvas
				const converter = (filterSelect.value === 'braille') ? ascii.brailleFromCanvas : ascii.fromCanvas;

				converter(smallCanvas, {
					contrast: 150, // Increased contrast helps detail pop
					callback: (res) => asciiFrames.push({
						text: res,
						delay: frame.delay,
						width: newWidth, // Save these for the encoder
						height: newHeight
					})
				});
			}

			// 2. Display animation
			status.innerText = "Conversion complete! Generating download...";
			playAnimation(asciiFrames);

			// 3. Generate Downloadable GIF
			createDownloadableGIF(asciiFrames);
		};
		reader.readAsArrayBuffer(file);
	};

	const playAnimation = (frames) => {
		let i = 0;
		const animate = () => {
			resultContainer.innerText = frames[i].text;
			setTimeout(() => {
				i = (i + 1) % frames.length;
				requestAnimationFrame(animate);
			}, frames[i].delay * 10);
		};
		animate();
	};

	const createDownloadableGIF = (asciiFrames) => {
		const gif = new GIF({ workers: 2, quality: 10, workerScript: '/gif.worker.js' });

		asciiFrames.forEach(f => {
			const c = document.createElement('canvas');
			c.width = f.width; c.height = f.height;
			renderAsciiToCanvas(f.text, c, f.width, f.height);
			gif.addFrame(c, { delay: f.delay * 10 });
		});

		gif.on('finished', (blob) => {
			const a = document.createElement('a');
			a.href = URL.createObjectURL(blob);
			a.download = 'ascii-art.gif';
			a.click();
			status.innerText = "Download ready!";
		});
		gif.render();
	};

	processBtn.onclick = processGIF;
})();