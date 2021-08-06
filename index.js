import * as Renderer from "./src/js/modules/renderer.js"
import LabeledProgressBar from "./src/js/modules/util/labelled-progress-bar.js"
import { simd } from "./src/js/modules/3rdparty/wasm-feature-detect.js"

var tiffWorker = new Worker('src/js/workers/decode-worker.js');
//var octreeWorker = new Worker('src/js/workers/octree-worker.js');

var modalLoadVolume = new bootstrap.Modal(document.getElementById('modal-load-volume'), {});
var modalLoadCompartment = new bootstrap.Modal(document.getElementById('modal-load-compartment'), {});

function loadProteinData() {
    let progressDecode = new LabeledProgressBar(document.getElementById('volume-progress-decode'), "Decode TIFF...");
    let progressLoad = new LabeledProgressBar(document.getElementById('volume-progress-load'), "Load TIFF...");
    chooseFile().then((file) => { modalLoadVolume.show(); return openTiff(file, progressLoad); })
                    .then((buffer) => { return decodeTiff(buffer, 8, progressDecode) })
                        .then((data) => { Renderer.setProteinData(data.buffer, [data.width, data.height, data.depth]); })
                        .then(() => { modalLoadVolume.hide(); })
                    .catch((err) => { progressDecode.setError(err) })
                .catch((err) => {progressLoad.setError(err) })
}

function loadCompartmentData() {
    let progressDecode = new LabeledProgressBar(document.getElementById('compartment-progress-decode'), "Decode TIFF...");
    let progressLoad = new LabeledProgressBar(document.getElementById('compartment-progress-load'), "Load TIFF...");
    //let progressOctree = new LabeledProgressBar(document.getElementById('compartment-progress-octree'), "Create Octree...");
    let progressVoronoi = new LabeledProgressBar(document.getElementById('compartment-progress-voronoi'), "Generate Distance Field...");
    chooseFile().then((file) => { modalLoadCompartment.show(); return openTiff(file, progressLoad); })
                .then((buffer) => { return decodeTiff(buffer, 8, progressDecode) })
                    .then((data) => { return createVoronoi(data.buffer, data.width, data.height, data.depth, progressVoronoi) })
                        .then((data) => { Renderer.setDistanceFieldData(data.buffers, [data.width, data.height, data.depth]); })
                        .then(() => { modalLoadCompartment.hide(); })
                    .catch((err) => { progressVoronoi.setError(err) })
                .catch((err) => { progressOpenTiff.setError(err) })
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
                resolve({"buffer": new Uint8Array(e.data[1]), "width": e.data[2], "height": e.data[3], "depth": e.data[4]});

            } else if (e.data[0] == "error") {
                reject(e.data[1]);
            }
        }

        tiffWorker.postMessage([buffer, bits], [buffer]);
    });
}

var sdfProgress = 0.0;
function createVoronoi(buffer, width, height, depth, progressBar) {
    var voxels = new Uint8Array(buffer);
    const reducer = (accumulator, currentValue) => Math.max(accumulator, currentValue);
    var numCompartments = voxels.reduce(reducer);
    for (var i = 1; i <= numCompartments; i++) {
        var ele = document.createElement("a");
        ele.classList = "dropdown-item";
        ele.href = "#";
        ele.innerText = "Compartment " + i;
        ele.setAttribute('data-id' , i); 
        document.getElementById("dropdownCompartmentsMenu").appendChild(ele);
    }

    return new Promise(function (resolve, reject) {
        var completion = 0;
        var buffers = new Array(numCompartments);
        for (var i = 0; i < numCompartments; i++) {
            var jumpfloodWorker = new Worker('src/js/workers/jumpflood-worker.js');
            jumpfloodWorker.onmessage = function(e) {
                if (e.data[0] == 'complete') {
                    var returnBuf = new Uint8Array(buffer.byteLength);
                    returnBuf.set(new Uint8Array(e.data[1]), 0);
                    buffers[e.data[2]-1] = returnBuf; // TODO: Why is this needed??
                    completion += 1;
                    if (completion == numCompartments) {
                        resolve({"buffers": buffers, "width": width, "height": height, "depth": depth});
                    }
                } else if (e.data[0] == 'progress') {
                    sdfProgress += e.data[1] / numCompartments;
                    progressBar.setProgress(sdfProgress * 100.0);
                }
            }
            jumpfloodWorker.postMessage([buffer, 0, depth, i+1]); // *Do NOT Transfer*
        }
    })
}

/*
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
}*/

$(document).ready(function () {
    $('#dropdownCompartmentsMenu').on('click', 'a', function(){
        $("#dropdownCompartments").html($(this).html());
        var idx = $(this).data('id')-1;
        Renderer.setCompartmentIndex(idx)
    });

    $('#checkDisplayCompartment').change(function() {
        Renderer.setDisplayCompartment(this.checked);
    });

    $('#checkDisplayProtein').change(function() {
        Renderer.setDisplayProtein(this.checked);
    });

    $('#rangeIsovalue').on('input change', function() {
        Renderer.setIsovalue(this.value);
    });

    $('#deleteSelection').click(function() {
        Renderer.deleteSelection();
    });

    $('#loadCompartmentData').click(loadCompartmentData);
    $('#loadProteinData').click(loadProteinData);
});

simd().then(simdSupported => {
  if (!simdSupported) {
    alert("SIMD is not supported by your browser!");
  }
});

window.onload = () => {
    'use strict';
  
    if ('serviceWorker' in navigator) {
      navigator.serviceWorker
               .register('./sw.js');
    }
}