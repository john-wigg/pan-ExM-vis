import React, { Component } from 'react'

import ImportDialog from './ImportDialog';
import ImportProgress from './ImportProgress';

import * as Comlink from 'comlink';

import { Tiff } from '../tiff';

class Import extends Component {
    constructor(props) {
        super(props);

        this.state = {
            tiffProtein: "",
            tiffSegmentation: "",
            voxelSize: "",
            proteinProgress: 0,
            segmentationProgress: 0,
            sdfProgress: 0,
            proteinError: "",
            segmentationError: "",
            sdfError: "",
            step: "dialog",
            preImportError: ""
        }

        this.handleImport = this.handleImport.bind(this);
        this.handleClose = this.handleClose.bind(this);
        this.onProteinProgress = this.onProteinProgress.bind(this);
        this.onSegmentationProgress = this.onSegmentationProgress.bind(this);
        this.onProteinError = this.onProteinError.bind(this);
        this.onSegmentationError = this.onSegmentationError.bind(this);
        this.onSdfProgress = this.onSdfProgress.bind(this);
        this.onSdfError = this.onSdfError.bind(this);
    }

    onProteinProgress(progress) {
        this.setState({
            proteinProgress: progress
        })
    }

    onSegmentationProgress(progress) {
        this.setState({
            segmentationProgress: progress
        })
    }

    onProteinError(error) {
        this.setState({
            proteinError: error
        })
    }

    onSegmentationError(error) {
        this.setState({
            segmentationError: error
        })
    }

    onSdfProgress(progress) {
        this.setState({
            sdfProgress: progress
        })
    }

    onSdfError(error) {
        this.setState({
            sdfError: error
        })
    }

    async handleImport(fileProtein, fileSegmentation, voxelSize) {
        let tiffProtein = new Tiff();
        let tiffSegmentation = new Tiff();
    
        try {
          await tiffProtein.open(fileProtein);
          await tiffSegmentation.open(fileSegmentation);
        } catch (e) {
          this.setState({
            preImportError: e.message
          });
          return;
        }
    
        if (tiffProtein.width !== tiffSegmentation.width || tiffProtein.height !== tiffSegmentation.height || tiffProtein.depth !== tiffSegmentation.depth) {
          this.setState({
            preImportError: "Please make sure the protein and the segmentation data have the same dimensions."
          });
          return;
        }

        this.setState({
            step: "import",
            voxelSize: voxelSize,
            tiffProtein: tiffProtein,
            tiffSegmentation: tiffSegmentation,
            segmentationProgress: 0,
            proteinProgress: 0,
            sdfProgress: 0,
            segmentationError: "",
            proteinError: "",
            sdfError: ""
        });
        
        // We can decode the TIFFs in parallel.
        await tiffProtein.decode(this.onProteinError, this.onProteinProgress);
        await tiffSegmentation.decode(this.onSegmentationError, this.onSegmentationProgress);
        const reducer = (accumulator, currentValue) => Math.max(accumulator, currentValue);
        var numCompartments = tiffSegmentation.pixels.reduce(reducer);

        let promises = [];
        let workers = [];
        let progress = new Array(numCompartments+1);

        for (let i = 0; i < numCompartments+1; ++i) {
            const target = i;
            const onProgress = (p) => {
                progress[target] = p * 100;
                this.onSdfProgress(progress.reduce((a, b) => a + b, 0) / (numCompartments + 1));
            }
            promises.push(new Promise(function(resolve, reject) {
                const worker = new Worker('../workers/sdf-worker.js', {
                    name: 'sdf-worker',
                    type: 'module'
                });
                workers.push(worker);
                const sdf = Comlink.wrap(worker);
                let result = sdf(tiffSegmentation, voxelSize, target, Comlink.proxy(onProgress));
                resolve(result);
            }));
        }

        //const sdfBuffers = await Promise.all(promises); // This needs too much memory for some reason?
        let sdfBuffers = [];
        for (let i = 0; i < promises.length; ++i) {
            sdfBuffers.push(await promises[i]);
        }
        for (let i = 0; i < workers.length; ++i) {
            workers[i].terminate();
        }
        this.onSdfProgress(100);

        // Compute pyramid.
        let pyramid = [];
        let w = tiffProtein.width;
        let h = tiffProtein.height;
        let d = tiffProtein.depth;

        let level0 = new Uint8Array(2*w*h*d);
        for (let i = 0; i < w; ++i) {
            for (let j = 0; j < h; ++j) {
                for (let k = 0; k < d; ++k) {
                    level0[2*(k*w*h+j*w+i)] = tiffProtein.pixels[k*w*h+j*w+i];
                    level0[2*(k*w*h+j*w+i)+1] = level0[2*(k*w*h+j*w)+i];
                }
            }
        }
        pyramid.push(level0);

        while (true) {
            let pw = w;
            let ph = h;
            let pd = d;
            w = Math.ceil(w / 2.0);
            h = Math.ceil(h / 2.0);
            d = Math.ceil(d / 2.0);

            let plevel = pyramid[pyramid.length - 1];
            let level = new Uint8Array(2*w*h*d);
            for (let pi = 0; pi < pw; ++pi) {
                for (let pj = 0; pj < ph; ++pj) {
                    for (let pk = 0; pk < pd; ++pk) {
                        let i = Math.floor(pi/2.0);
                        let j = Math.floor(pj/2.0);
                        let k = Math.floor(pk/2.0);
                        level[2*(k*w*h+j*w+i)] = Math.max(level[2*(k*w*h+j*w+i)], plevel[2*(pk*pw*ph+pj*pw+pi)]);
                        level[2*(k*w*h+j*w+i)+1] = Math.min(level[2*(k*w*h+j*w+i)+1], plevel[2*(pk*pw*ph+pj*pw+pi)+1]);
                    }
                }
            }
            pyramid.push(level);

            if (w <= 1 || h <= 1 || d <= 1) break;
        }

        // Compute global histogram.
        const bitDepth = 8;
        let hist = new Float32Array(2**bitDepth);
        let area = new Float32Array(2**bitDepth);
    
        for (let i = 0; i < sdfBuffers[0].length; ++i) {
            hist[sdfBuffers[0][i]] += tiffProtein.pixels[i];
            area[sdfBuffers[0][i]] += 1.0;
    
        }
    
        for (let i = 0; i < hist.length; ++i) {
            hist[i] = hist[i]/area[i];
        }

        let histLabels = [];
        for (let i = 0; i < 256; ++i) {
            histLabels.push(i / 10.0 - 5.0);
        }
    
        this.setState({
            step: "dialog"
        });

        this.props.onComplete(sdfBuffers, pyramid, [tiffProtein.width, tiffProtein.height, tiffProtein.depth],
                              [parseFloat(voxelSize.x), parseFloat(voxelSize.y), parseFloat(voxelSize.z)],
                              hist, histLabels);
    }

    handleClose() {
        this.props.onAbort();
    }

    render() {
        return (
            <>
                <ImportDialog
                    show={this.state.step === "dialog" && this.props.show}
                    error={this.state.preImportError}
                    onImport={this.handleImport}
                    onClose={this.handleClose}
                />
                <ImportProgress
                    show={this.state.step === "import" && this.props.show}
                    proteinProgress={this.state.proteinProgress}
                    segmentationProgress={this.state.segmentationProgress}
                    sdfProgress={this.state.sdfProgress}
                    proteinError={this.state.proteinError}
                    segmentationError={this.state.segmentationError}
                    sdfError={this.state.sdfError}
                />
            </>
        )
    }
}

export default Import