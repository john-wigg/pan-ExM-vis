onmessage = function(e) {
    var proteinBuffer = new Uint8Array(e.data[0]);
    var numCompartments = e.data[1];
    var hists = new Array();
    for (var i = 0; i < numCompartments; ++i) {
        var sdfBuffer = new Uint8Array(e.data[2+i]);
        if (sdfBuffer.length != proteinBuffer.length) {
            console.error("Size mismatch between SDF and protein volumes.");
            return;
        }
        var bitDepth = 8;
        var hist = new Array(2**bitDepth);
        var A = new Array(2**bitDepth);
        for (var j = 0; j < 2**bitDepth; ++j) {
            hist[j] = 0.0;
            A[j] = 0.0;
        }
        for (var j = 0; j < sdfBuffer.length; ++j) {
            hist[sdfBuffer[j]] += proteinBuffer[j];
            A[sdfBuffer[j]] += 1.0;
        }
        for (var j = 0; j < hist.length; ++j) {
            hist[j] = hist[j]/A[j];
        }
        hists.push(hist);
    }

    var transfer_data = new Array();
    var msg_data = new Array();
    msg_data.push('complete');
    msg_data.push(hist);
    msg_data.push(proteinBuffer.buffer);
    transfer_data.push(proteinBuffer.buffer);
    for (var i = 0; i < numCompartments; ++i) {
        transfer_data.push(e.data[2+i]);
        msg_data.push(e.data[2+i]);
    }

    postMessage(msg_data, transfer_data);
}