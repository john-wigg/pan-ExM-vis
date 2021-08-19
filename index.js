import * as Renderer from "./src/js/modules/renderer.js"
import LabeledProgressBar from "./src/js/modules/util/labelled-progress-bar.js"
import { simd } from "./src/js/modules/3rdparty/wasm-feature-detect.js"

$.getScript("./src/js/workers/include/3rdparty/UTIF.js")

var tiffWorker = new Worker('src/js/workers/decode-worker.js');
//var octreeWorker = new Worker('src/js/workers/octree-worker.js');

var modalLoadData = new bootstrap.Modal($('#modalImportDialog')[0]);
var modalImportProgress = new bootstrap.Modal($('#modalImportProgress')[0]);

var hists = null;
var chart = null;

async function readTiff(blob) {
    let buffer = await openTiff(blob);

    let ifd = UTIF.decode(buffer);
    let properties = (({ t256, t257, t258, t277 }) => ({ t256, t257, t258, t277 }))(ifd[0]);

    if (properties.t277 != 1) {
        throw "Only grayscale images are supported.";
    }

    if (properties.t258 != 8) {
        throw "Only images with bit depth 8 are supported.";
    }

    for (var i = 0; i < ifd.length; ++i) {
        let sliceProperties = (({ t256, t257, t258, t277 }) => ({ t256, t257, t258, t277 }))(ifd[i]);

        if (JSON.stringify(properties) !== JSON.stringify(sliceProperties)) {
            throw "Slice " + i + " has incorrect dimensions or pixel depth.";
        }
    }
    
    return { "buffer" : buffer, "width" : properties.t256[0], "height" : properties.t257[0], "depth" : ifd.length, "bits" : properties.t258[0] };
}

async function importData() {
    var proteinFile = null;
    var compartmentFile = null;
    const data = {
        protein: null,
        sdf: null
    }
    let progressDecodeProtein = new LabeledProgressBar(document.getElementById('volume-progress-decode'), "Decode Protein TIFF...");
    let progressDecodeCompartments = new LabeledProgressBar(document.getElementById('compartment-progress-decode'), "Decode Compartment TIFF...");//let progressOctree = new LabeledProgressBar(document.getElementById('compartment-progress-octree'), "Create Octree...");
    let progressVoronoi = new LabeledProgressBar(document.getElementById('compartment-progress-voronoi'), "Generate Distance Field...");

    try {
        proteinFile = await readTiff($('#selectProteinFile')[0].files[0]);
        compartmentFile = await readTiff($('#selectCompartmentFile')[0].files[0]);

        if (proteinFile.width != compartmentFile.width || proteinFile.height != compartmentFile.height || proteinFile.depth != compartmentFile.depth) {
            throw "File dimension mismatch! Please make sure the protein and the compartment files have the same dimensions.";
        }
    } catch (err) {
        $('#alertImportData').html(err);
        return;
    }

    modalLoadData.hide();
    modalImportProgress.show();

    try {
        data.protein = await decodeTiff(proteinFile.buffer, proteinFile.bits, progressDecodeProtein);
    } catch (err) {
        progressDecodeCompartments.setError(err);
        return;
    }

    try {
        const decoded = await decodeTiff(compartmentFile.buffer, compartmentFile.bits, progressDecodeCompartments)
        try {
            data.sdf = await createVoronoi(decoded.buffer, decoded.width, decoded.height, decoded.depth, progressVoronoi)
        } catch (err) {
            progressVoronoi.setError(err);
            return;
        }
    } catch (err) {
        progressDecodeCompartments.setError(err);
        return;
    }

    hists = await computeHistograms(data);
    chart = createHistogram(hists[0]);

    Renderer.setDistanceFieldData(data.sdf.buffers, [data.sdf.width, data.sdf.height, data.sdf.depth]);
    Renderer.setProteinData(data.protein.buffer, [data.protein.width, data.protein.height, data.protein.depth]);
    
    modalImportProgress.hide();
}

function openTiff(file) {
    return new Promise(function(resolve, reject) {
        var reader = new FileReader();
        reader.readAsArrayBuffer(file)
    
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
    const reducer = (accumulator, currentValue) => Math.max(accumulator, currentValue);
    var numCompartments = buffer.reduce(reducer);
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
            var danielssonWorker = new Worker('src/js/workers/danielsson-worker.js');
            danielssonWorker.onmessage = function(e) {
                if (e.data[0] == 'complete') {
                    buffers[e.data[2]-1] = (new Uint8Array(e.data[1])).slice(0);
                    completion += 1;
                    if (completion == numCompartments) {
                        progressBar.setProgress(100.0);
                        console.log(buffers);
                        resolve({"buffers": buffers, "width": width, "height": height, "depth": depth});
                    }
                } else if (e.data[0] == 'progress') {
                    sdfProgress += e.data[1] / numCompartments;
                    progressBar.setProgress(sdfProgress * 100.0);
                }
            }

            danielssonWorker.postMessage([buffer, i+1]);
        }
    })
}

function computeHistograms(data) {
    return new Promise( function (resolve, reject) {
        var histogramWorker = new Worker('src/js/workers/histogram-worker.js');
        histogramWorker.onmessage = function(e) {
            if (e.data[0] == "progress") {
                
            } else if (e.data[0] == "complete") {
                data.protein.buffer = new Uint8Array(e.data[2]);
                for (var i = 0; i < data.sdf.buffers.length; ++i) {
                    data.sdf.buffers[i] = new Uint8Array(e.data[3+i]);
                }
                resolve(e.data[1]);
            } else if (e.data[0] == "error") {
                reject(e.data[1]);
            }
        }
        
        var transfer_data = new Array();
        var msg_data = new Array();
        msg_data.push(data.protein.buffer.buffer);
        msg_data.push(data.sdf.buffers.length);
        transfer_data.push(data.protein.buffer.buffer);
        for (var i = 0; i < data.sdf.buffers.length; ++i) {
            transfer_data.push(data.sdf.buffers[i].buffer);
            msg_data.push(data.sdf.buffers[i].buffer);
        }
        histogramWorker.postMessage(msg_data, transfer_data);
    });
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
        $( document ).trigger( "eventCompartmentSelected", [idx]);
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

    $('#buttonImportData').click(importData);
    $('#buttonOpenImportDialog').click(() => { modalLoadData.show();});

    $('#buttonImportData').attr('disabled',true);
    const toggleImportButton = function(){
        if ($('#selectCompartmentFile').val() && $('#selectProteinFile').val()
            && $('#inputVolumeSizeX').val() && $('#inputVolumeSizeY').val() && $('#inputVolumeSizeZ').val()){
            $('#buttonImportData').removeAttr('disabled'); 
        }
        else {
            $('#buttonImportData').attr('disabled',true);
        }
    };

    $('#selectCompartmentFile').change(toggleImportButton);
    $('#selectProteinFile').change(toggleImportButton);
    $('#inputVolumeSizeX').on("input", toggleImportButton);
    $('#inputVolumeSizeY').on("input", toggleImportButton);
    $('#inputVolumeSizeZ').on("input", toggleImportButton);

    $( document ).on("eventCompartmentSelected", function(event, idx) {
        updateHistogram(chart, hists[idx]);
    })
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

function createHistogram(hist) {
    var ctx = document.getElementById('chart-canvas');
    ctx.width = $("#chart-view").width();
    ctx.height = $("#chart-view").height();

    var labels = new Array();
    for (var i = 0; i < 256; ++i) {
        labels.push(i / 10.0 - 5.0);
    }

    const data = {
        labels: labels,
        datasets: [{
            backgroundColor: 'rgb(255, 99, 132)',
            borderColor: 'rgb(255, 99, 132)',
            data: hist, // Leave out 1st and last element.
        }]
    };

    const config = {
        type: 'bar',
        data,
        options: {responsive: false}
    };

    var myChart = new Chart(
        document.getElementById('chart-canvas'),
        config
    );

    return myChart;
}

function updateHistogram(chart, hist) {
    var labels = new Array();
    for (var i = 0; i < 256; ++i) {
        labels.push(i / 10.0 - 5.0);
    }

    chart.data.datasets[0].labels = labels;
    chart.data.datasets[0].data = hist;
    
    chart.update();
}