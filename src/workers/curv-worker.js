import * as Comlink from 'comlink';
import curvWasm from "./curv.wasm";
import Curv from "./curv.js";

async function curvature(sdfBuffer, dims, voxelSize, onProgress) {
    const wasm = await fetch("../../" + curvWasm);
    const buffer = await wasm.arrayBuffer();
    const Module = await Curv({
      wasmBinary: buffer
    });

    const result = Module.curvature(sdfBuffer, dims[0], dims[1], dims[2], parseFloat(voxelSize.x), parseFloat(voxelSize.y), parseFloat(voxelSize.z), 3.0, -5.0, 20.0, onProgress);

    // We need to copy the view that lives in emscripten to make it accessible.
    const copy = result.slice();
    return copy;
}

Comlink.expose(curvature);