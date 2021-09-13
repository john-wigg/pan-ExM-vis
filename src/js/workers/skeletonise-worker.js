import skeletoniseWasm from "./skeletonise.wasm";
import Skeletonise from "./skeletonise.js";

onmessage = function(e) {
    new Promise(async resolve => {
            const wasm = await fetch(skeletoniseWasm);
            const buffer = await wasm.arrayBuffer();
            const _instance = await Skeletonise({
              wasmBinary: buffer
            });
        
            resolve(_instance)
    }).then((Module) => {
        console.log(e.data[0]);
        console.log(e.data[1]);
        console.log(e.data[2]);
        var vec = Module.skeletonise(e.data[0], e.data[1], e.data[2]);
        const vertices = new Float32Array(vec.get(0).size() * 3);

        for (var i = 0; i < vec.get(0).size(); i++) {
			vertices[3*i] = vec.get(0).get(i)[0];
			vertices[3*i+1] = vec.get(0).get(i)[1];
			vertices[3*i+2] = vec.get(0).get(i)[2];
        }
        postMessage(["complete", vertices]);
    });
}
