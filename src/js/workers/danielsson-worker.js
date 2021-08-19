onmessage = function(e) {
    importScripts('./danielsson.js');
    Module.onRuntimeInitialized = () => {
        var buffer = e.data[0];
        var target = e.data[1];
        var pixelData = new Uint8Array(buffer);
        var ptr = Module._malloc(pixelData.byteLength);
        Module.HEAPU8.set(pixelData, ptr);
        var returnPtr = Module._danielsson(ptr, 1024, 1024, 150, target);
        Module._free(ptr);
        var returnBufSize = 1024*1024*150;
        var returnBuf = new ArrayBuffer(returnBufSize);
        new Uint8Array(returnBuf).set(HEAPU8.subarray(returnPtr, returnPtr+returnBufSize));
        postMessage(['complete', returnBuf, target], [returnBuf]);
    }
}