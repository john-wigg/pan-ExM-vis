import * as UTIF from 'utif';

import * as Comlink from 'comlink';

class Tiff {
    constructor() {
        this.buffer = null;
        this.pixels = new Uint8Array();
        this.width = 0;
        this.height = 0;
        this.depth = 0;
        this.bits = 0;
    }

    async open(file) {
        let buffer = await (() => {
            return new Promise(function(resolve, reject) {
                var reader = new FileReader();
                reader.readAsArrayBuffer(file)
            
                reader.onload = readerEvent => {
                    resolve(readerEvent.target.result);
                }
        
                reader.onerror = _readerEvent => {
                    reject(reader.error);
                }
        
                reader.onabort = _readerEvent => {
                    reject("FileReader was aborted!");
                }
            });
        })();

        let ifd = UTIF.decode(buffer);
        if (Object.keys(ifd[0]).length === 0) {
            throw new Error("Could not decode TIFF file!");
        }

        let properties = (({ t256, t257, t258, t277 }) => ({ t256, t257, t258, t277 }))(ifd[0]);

        if (properties.t277[0] !== 1) {
            throw new Error("Only grayscale images are supported.");
        }
    
        if (properties.t258[0] !== 8) {
            throw new Error("Only images with bit depth 8 are supported.");
        }
    
        for (var i = 0; i < ifd.length; ++i) {
            let sliceProperties = (({ t256, t257, t258, t277 }) => ({ t256, t257, t258, t277 }))(ifd[i]);
    
            if (JSON.stringify(properties) !== JSON.stringify(sliceProperties)) {
                throw new Error("Slice " + i + " has incorrect dimensions or pixel depth.");
            }
        }

        this.buffer = buffer;
        this.width = properties.t256[0];
        this.height = properties.t257[0];
        this.depth = ifd.length;
        this.bits = properties.t258[0];
    };

    async decode(onError, onProgress) {
        const worker = new Worker('./workers/tiff-worker.js', {
            name: 'tiff-worker',
            type: 'module'
          });
        const decodeTiffBuffer = Comlink.wrap(worker);
        this.pixels = await decodeTiffBuffer(this.buffer, Comlink.proxy(onError), Comlink.proxy(onProgress));
        worker.terminate();
    };
}

export { Tiff };