GIF to ASCII Converter
============

A lightweight, browser-based utility that transforms animated GIFs into ASCII or Braille-based animations. Process, preview, and download your favorite GIFs as high-fidelity text-based art.


## Features

* Dual Rendering Modes: Supports both classic ASCII character mapping and high-resolution Braille ($2\times2$ bitmapping).
* Frame-by-Frame Processing: Uses gifuct-js to correctly handle GIF layer transparency and timing.
* Animated Export: Generate and download your custom ASCII/Braille animations as new, shareable GIF files.

## Libraries used

* gifuct-js: Used for robust GIF decoding and frame de-patching.
* gif.js: Used for high-quality client-side GIF encoding.
* Canvas API: Handles image downsampling, frame rendering, and pixel manipulation.

## Run server
'''npm run dev'''
