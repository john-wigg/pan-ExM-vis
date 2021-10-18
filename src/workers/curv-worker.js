import * as Comlink from 'comlink';
import curvWasm from "./curv.wasm";
import Curv from "./curv.js";

async function curvature(sdf, dims, voxelSize, onProgress) {
    const wasm = await fetch("../../" + curvWasm);
    const buffer = await wasm.arrayBuffer();
    const Module = await Curv({
      wasmBinary: buffer
    });

    const result = Module.curvature(sdf.data, sdf.min, sdf.max, dims[0], dims[1], dims[2], parseFloat(voxelSize.x), parseFloat(voxelSize.y), parseFloat(voxelSize.z), 3.0, onProgress);

    // We need to copy the view that lives in emscripten to make it accessible.
    const copy = result.data.slice();
    return {"data": copy, "min": result.min, "max": result.max};
}

Comlink.expose(curvature);