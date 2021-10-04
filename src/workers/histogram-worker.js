import * as Comlink from 'comlink';

async function computeLocalHistogram(sdfBuffer, proteinBuffer, dims, selectionPixels, projectionPixels) {
    // Compute local histogram.
    let bitDepth = 8;
    var hist = new Float32Array(2**bitDepth);
    var area = new Float32Array(2**bitDepth);

    var idx_in_slice = -1;
    const slice_size = selectionPixels.width*selectionPixels.height;
    for (let i = 0; i < sdfBuffer.length; ++i) {
        ++idx_in_slice;
        if (idx_in_slice >= slice_size) idx_in_slice = 0;
        
        var selection = selectionPixels.buffer[4 * idx_in_slice] / 255.0;
        if (selection < 0.5) continue;
        
        var proj = projectionPixels.buffer[4 * idx_in_slice] / 255.0;
        if (Math.abs((i / (dims[0]*dims[1]))/dims[2] - proj) > 0.05) continue;

        hist[sdfBuffer[i]] += proteinBuffer[i];
        area[sdfBuffer[i]] += 1.0;

    }

    for (let i = 0; i < hist.length; ++i) {
        hist[i] = hist[i]/area[i];
    }

    return hist;
}

Comlink.expose(computeLocalHistogram);