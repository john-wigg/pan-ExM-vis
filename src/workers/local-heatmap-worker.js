import * as Comlink from 'comlink';
import localHeatmapWasm from "./local_heatmap.wasm";
import LocalHeatmap from "./local_heatmap.js";

async function computeLocalHeatmap(sdfBuffer, curvBuffer, proteinBuffer, dims, selectionPixels) {
    const wasm = await fetch("../../" + localHeatmapWasm);
    const buffer = await wasm.arrayBuffer();
    const Module = await LocalHeatmap({
      wasmBinary: buffer
    });

    const result = Module.local_heatmap(sdfBuffer, curvBuffer, proteinBuffer, selectionPixels.buffer, dims[0], dims[1], dims[2]);

    // We need to copy the view that lives in emscripten to make it accessible.
    const copy = result.slice();

    return copy;
}

Comlink.expose(computeLocalHeatmap);