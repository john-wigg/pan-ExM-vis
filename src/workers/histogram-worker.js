import * as Comlink from 'comlink';
import histogramWasm from "./histogram.wasm";
import Histogram from "./histogram.js";

async function computeLocalHistogram(sdfBuffer, proteinBuffer, dims, selectionPixels, projectionPixels) {
    const wasm = await fetch("../../" + histogramWasm);
    const buffer = await wasm.arrayBuffer();
    const Module = await Histogram({
      wasmBinary: buffer
    });

    const result = Module.local_histogram(sdfBuffer, proteinBuffer, selectionPixels.buffer, dims[0], dims[1], dims[2]);

    // We need to copy the view that lives in emscripten to make it accessible.
    const copy = result.slice();
    return copy;
}

Comlink.expose(computeLocalHistogram);