onmessage = function(e) {
    importScripts('./jumpflood.js');
    Module.onRuntimeInitialized = () => {
        var buffer = e.data[0];
        var start = e.data[1];
        var stop = e.data[2];
        var target = e.data[3];
        var pixelData = new Uint8Array(buffer);
        var ptr = Module._malloc(pixelData.byteLength);
        Module.HEAPU8.set(pixelData, ptr);
        var returnPtr = Module._jfa3(ptr, 1024, 1024, 150, start, stop, target);
        Module._free(ptr);
        var returnBufSize = 1024*1024*(stop-start);
        var returnBuf = new ArrayBuffer(returnBufSize);
        new Uint8Array(returnBuf).set(HEAPU8.subarray(returnPtr, returnPtr+returnBufSize));
        postMessage(['complete', returnBuf, target], [returnBuf]);
    }
}