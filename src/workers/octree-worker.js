onmessage = function(e) {
    importScripts('octree.js');
    Module.onRuntimeInitialized = () => {
        var buffer = e.data[0];
        var pixelData = new Uint8Array(buffer);
        var ptr = Module._malloc(pixelData.byteLength);
        Module.HEAPU8.set(pixelData, ptr);
        buffer = undefined;
        e.data[0] = undefined;
        var nodes = Module._create_octree(ptr, 2048, 2028, 150, 2048);
        postMessage(['complete', nodes]);
    }
}