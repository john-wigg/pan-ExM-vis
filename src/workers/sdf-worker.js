import * as Comlink from 'comlink';
import sdfWasm from "./sdf.wasm";
import Sdf from "./sdf.js";

async function sdf(tiff, voxelSize, target, onProgress) {
    const wasm = await fetch("../../" + sdfWasm);
    const buffer = await wasm.arrayBuffer();
    const Module = await Sdf({
      wasmBinary: buffer
    });

    const result = Module.sdf(tiff.pixels, target, tiff.width, tiff.height, tiff.depth, parseFloat(voxelSize.x), parseFloat(voxelSize.y), parseFloat(voxelSize.z), onProgress);

    // We need to copy the view that lives in emscripten to make it accessible.
    const copy = result.slice();
    return copy;
}

Comlink.expose(sdf);