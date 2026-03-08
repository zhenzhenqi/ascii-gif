import { parseGIF, decompressFrames } from 'gifuct-js';
import GIF from 'gif.js';
import { ascii } from './ascii.js';

(function () {
	const fileInput = document.getElementById('fileInput');
	const filterSelect = document.getElementById('filterSelect');
	const resultContainer = document.getElementById('result');
	const status = document.getElementById('status');
	const processBtn = document.getElementById('processBtn');

	// REUSE: Define canvases once, outside the loop
	const smallCanvas = document.createElement('canvas');
	const tempCanvas = document.createElement('canvas');

	const renderAsciiToCanvas = (text, canvas, width, height) => {
		const ctx = canvas.getContext('2d');
		const lines = text.trim().split('\n');
		const lineHeight = height / lines.length;

		ctx.fillStyle = "white";
		ctx.fillRect(0, 0, width, height);
		ctx.fillStyle = "black";
		// Use a dynamic font size to ensure the text fills the allocated space
		ctx.font = `${lineHeight}px monospace`;
		ctx.textBaseline = "top";
		lines.forEach((line, i) => ctx.fillText(line, 0, i * lineHeight));
	};

	const processGIF = async () => {
		const file = fileInput.files[0];
		if (!file) return alert("Please select a GIF first.");

		resultContainer.innerText = "";
		status.innerText = "Processing frames...";
		const reader = new FileReader();

		reader.onload = async (e) => {
			const gif = parseGIF(e.target.result);
			const frames = decompressFrames(gif, true);
			const asciiFrames = [];

			// Increase maxWidth for higher resolution; the density ramp will handle the detail
			const maxWidth = 200;

			for (const frame of frames) {
				const scale = maxWidth / frame.dims.width;
				const newWidth = maxWidth;
				const newHeight = Math.floor(frame.dims.height * scale);

				// Setup reuse canvases
				smallCanvas.width = newWidth;
				smallCanvas.height = newHeight;
				tempCanvas.width = frame.dims.width;
				tempCanvas.height = frame.dims.height;

				const tempCtx = tempCanvas.getContext('2d');
				tempCtx.putImageData(new ImageData(new Uint8ClampedArray(frame.patch), frame.dims.width, frame.dims.height), 0, 0);

				smallCanvas.getContext('2d').drawImage(tempCanvas, 0, 0, newWidth, newHeight);

				// Run the density-based converter
				ascii.fromCanvas(smallCanvas, {
					contrast: 150,
					callback: (res) => asciiFrames.push({
						text: res,
						delay: frame.delay,
						width: newWidth,
						height: newHeight
					})
				});
			}

			status.innerText = "Generation complete!";
			playAnimation(asciiFrames);
			createDownloadableGIF(asciiFrames);
		};
		reader.readAsArrayBuffer(file);
	};

	let animationId = null;

	const playAnimation = (frames) => {
		// 1. Cancel the previous loop if it exists
		if (animationId) cancelAnimationFrame(animationId);

		let i = 0;
		const animate = () => {
			resultContainer.innerText = frames[i].text;

			// 2. Store the current animation ID so we can cancel it later
			animationId = setTimeout(() => {
				i = (i + 1) % frames.length;
				animationId = requestAnimationFrame(animate);
			}, frames[i].delay * 10);
		};
		animate();
	};

	const createDownloadableGIF = (asciiFrames) => {
		const gif = new GIF({ workers: 2, quality: 10, workerScript: '/gif.worker.js' });

		// REUSE: Use one local canvas for the encoder
		const encoderCanvas = document.createElement('canvas');

		asciiFrames.forEach(f => {
			encoderCanvas.width = f.width;
			encoderCanvas.height = f.height;
			renderAsciiToCanvas(f.text, encoderCanvas, f.width, f.height);
			gif.addFrame(encoderCanvas, { delay: f.delay * 10 });
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