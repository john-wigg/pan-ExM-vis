onmessage = function(e) {
    decodeTiff(e.data[0], e.data[1])
}

function decodeTiff(buffer, bits) {
    importScripts('./include/3rdparty/UTIF.js');
    let ifd = UTIF.decode(buffer);
    // TODO: Handling of misconfigured data.
    let width = ifd[0]['t256'];
    let height = ifd[0]['t257'];
    let bps = ifd[0]['t258']; // should be 16
    let pi = ifd[0]['t262']; // should be 1
    let spp = ifd[0]['t277']; // should be 1

    if (bps != bits || pi != 1 || spp != 1) {
        postMessage(["error", "TIFF file has incorrect format!"]);
        return;
    }

    var PixelArray;
    if (bps == 8) {
        PixelArray = Uint8Array;
    } else {
        PixelArray = Uint16Array;
    }

    pixels = new PixelArray(width*height*ifd.length);

    try {
        for (var i = 0; i < ifd.length; ++i) {
            if (ifd[0]['t256'] != width || ifd[0]['t257'] != height) {
                postMessage(["error", "One or more slices of the TIFF file have an incorrect format!"]);
                return;
            }
            UTIF.decodeImage(buffer, ifd[i]);
            let bytes = ifd[i].data;
            pixels.set(new PixelArray(bytes.buffer, 0, bytes.byteLength /  PixelArray.BYTES_PER_ELEMENT), width*height*i);
            let progress = (i + 1) / ifd.length * 100;
            postMessage(["progress", progress]);
        }
    } catch (err) {
        postMessage(["error", err]);
        return;
    }

    postMessage(["pixelData", pixels.buffer], [pixels.buffer]);
}