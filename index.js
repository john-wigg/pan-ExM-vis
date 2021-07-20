var tiffWorker = new Worker('src/workers/decode-worker.js');
var octreeWorker = new Worker('src/workers/octree-worker.js');
var jumpfloodWorker = new Worker('src/workers/jumpflood-worker.js');
var jumpfloodWorker2 = new Worker('src/workers/jumpflood-worker.js');
var jumpfloodWorker3 = new Worker('src/workers/jumpflood-worker.js');
var jumpfloodWorker4 = new Worker('src/workers/jumpflood-worker.js');

var modalLoadVolume = new bootstrap.Modal(document.getElementById('modal-load-volume'), {});
var modalLoadCompartment = new bootstrap.Modal(document.getElementById('modal-load-compartment'), {});

function loadVolumeData() {
    let progressDecode = new LabeledProgressBar(document.getElementById('volume-progress-decode'), "Decode TIFF...");
    let progressLoad = new LabeledProgressBar(document.getElementById('volume-progress-load'), "Load TIFF...");
    chooseFile().then((file) => { modalLoadVolume.show(); return openTiff(file, progressLoad); })
                .then((buffer) => { return decodeTiff(buffer, 16, progressDecode) }, (err) => {progressLoad.setError(err) })
                .then((buffer) => { createVolumeTex(buffer, [1024, 1024, 150]); }, (err) => { progressDecode.setError(err) });
}

function loadCompartmentData() {
    let progressDecode = new LabeledProgressBar(document.getElementById('compartment-progress-decode'), "Decode TIFF...");
    let progressLoad = new LabeledProgressBar(document.getElementById('compartment-progress-load'), "Load TIFF...");
    let progressOctree = new LabeledProgressBar(document.getElementById('compartment-progress-octree'), "Create Octree...");
    let progressVoronoi = new LabeledProgressBar(document.getElementById('compartment-progress-voronoi'), "Create Voronoi...");
    chooseFile().then((file) => { modalLoadCompartment.show(); return openTiff(file, progressLoad); })
                .then((buffer) => { return decodeTiff(buffer, 8, progressDecode) }, (err) => { progressOpenTiff.setError(err) })
                .then((buffer) => { return createVoronoi(buffer, progressVoronoi) }, (err) => { progressVoronoi.setError(err) })
                .then((buffer) => { createSdfTex(buffer, [1024, 1024, 150]); }, (err) => { progressVoronoi.setError(err) });
                //.then((buffer) => { return createOctree(buffer, progressOctree) }, (err) => { progressDecode.setError(err) })
}

function chooseFile() {
    return new Promise(function (resolve, reject) {
        var input = document.createElement('input');
        input.type = 'file';
    
        input.onchange = e => {
            resolve(e.target.files[0]);
        }
    
        input.click();
    })
}

function openTiff(file, progressBar) {
    return new Promise(function(resolve, reject) {
        var reader = new FileReader();
        reader.readAsArrayBuffer(file)
    
        reader.onprogress = readerEvent => {
            let progress = readerEvent.loaded / readerEvent.total * 100
            progressBar.setProgress(progress);
        }
    
        reader.onload = readerEvent => {
            resolve(readerEvent.target.result);
        }

        reader.onerror = readerEvent => {
            reject(reader.error);
        }

        reader.onabort = readerEvent => {
            reject("FileReader was aborted!");
        }
    });
}

function decodeTiff(buffer, bits, progressBar) {
    return new Promise( function (resolve, reject) {
        tiffWorker.onmessage = function(e) {
            if (e.data[0] == "progress") {
                let progress = e.data[1];
                progressBar.setProgress(progress);
            } else if (e.data[0] == "pixelData") {
                resolve(e.data[1]);

            } else if (e.data[0] == "error") {
                reject(e.data[1]);
            }
        }

        tiffWorker.postMessage([buffer, bits], [buffer]);
    });
}

var sdfProgress = 0.0;
function createVoronoi(buffer, progressBar) {
    return new Promise(function (resolve, reject) {
        var completion = 0;
        var returnBuf = new Uint8Array(buffer.byteLength);
        jumpfloodWorker.onmessage = function(e) {
            if (e.data[0] == 'complete') {
                returnBuf.set(new Uint8Array(e.data[1]), 0);
                completion += 1;
                if (completion == 2) {
                    resolve(returnBuf.buffer);
                }
            } else if (e.data[0] == 'progress') {
                sdfProgress += e.data[1];
                progressBar.setProgress(sdfProgress * 100.0);
            }
        }
        jumpfloodWorker.postMessage([buffer, 0, 75]); // *Do NOT Transfer*


        jumpfloodWorker2.onmessage = function(e) {
            if (e.data[0] == 'complete') {
                returnBuf.set(new Uint8Array(e.data[1]), 1024*1024*75);
                completion += 1;
                if (completion == 2) {
                    resolve(returnBuf.buffer);
                }
            } else if (e.data[0] == 'progress') {
                sdfProgress += e.data[1];
                progressBar.setProgress(sdfProgress * 100.0);
            }
        }
        jumpfloodWorker2.postMessage([buffer, 75, 150], [buffer]);
    })
}


function createOctree(buffer, progressBar) {
    return new Promise(function (resolve, reject) {
        octreeWorker.onmessage = function(e) {
            if (e.data[0] == 'complete') {
                console.log("Octree storage size (MB): ", e.data[1] / 1000 / 1000);
                progressBar.setProgress(100.0);
                resolve(e.data[1]);
            } else if (e.data[0] == 'progress') {
                progressBar.setProgress(e.data[1] * 100.0);
            }
        }
        octreeWorker.postMessage([buffer], [buffer]); // *Transfer*
    });
}