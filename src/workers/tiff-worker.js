import * as Comlink from 'comlink';

import * as UTIF from 'utif';

async function decodeTiffBuffer(buffer, onError, onProgress) {
    if (!buffer) {
        onError("No image buffer loaded!");
        return new Uint8Array();
    }

    let ifd = UTIF.decode(buffer);
    let width = ifd[0]['t256'][0];
    let height = ifd[0]['t257'][0];
    let bps = ifd[0]['t258'][0]; // should be bits

    // TODO: Handling of misconfigured data.
    //let pi = ifd[0]['t262']; // should be 1
    //let spp = ifd[0]['t277']; // should be 1

    let PixelArray;
    if (bps === 8) {
        PixelArray = Uint8Array;
    } else if (bps === 16) {
        PixelArray = Uint16Array;
    } else {
        onError("Only 8 bit or 16 bit TIFF files are supported!");
        return new Uint8Array();
    }

    let pixels = new PixelArray(width*height*ifd.length);

    try {
        for (var i = 0; i < ifd.length; ++i) {
            if (ifd[0]['t256'][0] !== width || ifd[0]['t257'][0] !== height) {
                throw new Error("One or more slices of the TIFF file have an incorrect format!");
            }
            UTIF.decodeImage(buffer, ifd[i]);
            let bytes = ifd[i].data;
            pixels.set(new PixelArray(bytes.buffer, 0, bytes.byteLength /  PixelArray.BYTES_PER_ELEMENT), width*height*i);
            let progress = (i + 1) / ifd.length * 100;
            onProgress(progress);
        }
    } catch (err) {
        onError(err);
        return new Uint8Array();
    }

    return pixels;
}

Comlink.expose(decodeTiffBuffer);