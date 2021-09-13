import danielssonWasm from "./danielsson.wasm";
import Danielsson from "./danielsson.js";

onmessage = function(e) {
    new Promise(async resolve => {
            const wasm = await fetch(danielssonWasm);
            const buffer = await wasm.arrayBuffer();
            const _instance = await Danielsson({
              wasmBinary: buffer
            });
        
            resolve(_instance)
    }).then((Module) => {
        var buffer = e.data[0];
        var target = e.data[1];
        var width = e.data[2];
        var height = e.data[3];
        var depth = e.data[4];
        var voxelSize = e.data[5];
        var pixelData = new Uint8Array(buffer);
        var ptr = Module._malloc(pixelData.byteLength);
        Module.HEAPU8.set(pixelData, ptr);
        var returnPtr = Module._danielsson(ptr, target, width, height, depth, voxelSize[0], voxelSize[1], voxelSize[2]);
        Module._free(ptr);
        var returnBufSize = width*height*depth;
        var returnBuf = new ArrayBuffer(returnBufSize);
        new Uint8Array(returnBuf).set(Module.HEAPU8.subarray(returnPtr, returnPtr+returnBufSize));
        postMessage(['complete', returnBuf, target], [returnBuf]);
    });
}