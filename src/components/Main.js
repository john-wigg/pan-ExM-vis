import React, { Component } from 'react'

import Import from './Import'
import Toolbar from './Toolbar';
import Sidebar from './Sidebar';
import Overlay from './Overlay';
import Views from './Views';
import Canvas from './Canvas'

import Button from 'react-bootstrap/Button';

import * as Comlink from 'comlink';

class Main extends Component {
	constructor(props) {
		super(props);

		this.state = {
			fullscreen: false,
			showSidebar: false,
			showImport: false,
			voxelSize: [0, 0, 0],
			volumeDims: [0, 0, 0],
			sdf: [],
			protein: "",
			curvature: "",
			ready: false,
			compartmentIndex: 0,
			displaySegmentation: true,
			displayProtein: true,
			isovalue: 0,
			heatmap: [],
			heatarea: [],
			heataxes: [[0, 0], [0, 0]],
			localHeatmap: [],
			localHeatarea: [],
			debugSamples: false,
			useLod: true,
			mainView: "",
			mapView: "",

			projectionPixels: [],
			selectionPixels: []
		}
		
		this.handleShowImport = this.handleShowImport.bind(this);
		this.handleToggleFullscreen = this.handleToggleFullscreen.bind(this);
		this.handleToggleSidebar = this.handleToggleSidebar.bind(this);
		this.handleAbortImport = this.handleAbortImport.bind(this);
		this.handleCompleteImport = this.handleCompleteImport.bind(this);
		this.handleCompartmentSelection = this.handleCompartmentSelection.bind(this);
		this.handleDisplaySegmentation = this.handleDisplaySegmentation.bind(this);
		this.handleDisplayProtein = this.handleDisplayProtein.bind(this);
		this.handleDebugSamples = this.handleDebugSamples.bind(this);
		this.handleUseLod = this.handleUseLod.bind(this);
		this.handleIsovalue = this.handleIsovalue.bind(this);
		this.handleMainView = this.handleMainView.bind(this);
		this.handleMapView = this.handleMapView.bind(this);
		this.handleProjectionUpdated = this.handleProjectionUpdated.bind(this);
		this.handleSelectionDone = this.handleSelectionDone.bind(this);

		this.computeLocalHistogram = this.computeLocalHistogram.bind(this);
	}

	handleShowImport() {
		this.setState({
			showImport: true
		});
	}

	handleAbortImport() {
		this.setState({
			showImport: false
		});
	}

	handleMapView(dom) {
		this.setState({
			mapView: dom
		})
	}

	handleMainView(dom) {
		this.setState({
			mainView: dom
		})
	}

	handleCompleteImport(sdf, proteinBuffers, curv, bufferDims, voxelSize, heatmap, heatarea) {
		this.setState({
			sdf: sdf,
			protein: proteinBuffers,
			volumeDims: bufferDims,
			curvature: curv,
			voxelSize: voxelSize,
			showImport: false,
			ready: true,
			heatmap: heatmap,
			heatarea: heatarea,
			heataxes: [[sdf[0].min, sdf[0].max], [curv.min, curv.max]]
		})
	}

	handleToggleFullscreen() {
		if (!this.state.fullscreen) {
			let elem = document.documentElement;
			if (elem.requestFullscreen) {
				elem.requestFullscreen();
			} else if (elem.webkitRequestFullscreen) {
				elem.webkitRequestFullscreen();
			} else if (elem.msRequestFullscreen) {
				elem.msRequestFullscreen();
			}
		} else {
			if (document.exitFullscreen) {
				document.exitFullscreen();
			} else if (document.webkitExitFullscreen) {
				document.webkitExitFullscreen();
			} else if (document.msExitFullscreen) {
				document.msExitFullscreen();
			}
		}

		this.setState({
			fullscreen: !this.state.fullscreen
		})
	}

	handleToggleSidebar() {
		this.setState({
			showSidebar: !this.state.showSidebar
		})
	}

	handleCompartmentSelection(index) {
		this.setState({
			compartmentIndex: index
		})
	}

	handleDisplaySegmentation(value) {
		this.setState({
			displaySegmentation: value
		})
	}

	handleDisplayProtein(value) {
		this.setState({
			displayProtein: value
		})
	}

	handleDebugSamples(value) {
		this.setState({
			debugSamples: value
		})
	}

	handleUseLod(value) {
		this.setState({
			useLod: value
		})
	}

	handleIsovalue(value) {
		let isovalue = value / 100.0 * (this.state.sdf[0].max - this.state.sdf[0].min) + this.state.sdf[0].min;
		this.setState({
			isovalue: isovalue
		})
	}

	async computeLocalHistogram(selectionPixels, projectionPixels) {
		if (selectionPixels.buffer && projectionPixels.buffer) {
			const worker = new Worker('../workers/local-heatmap-worker.js', {
				name: 'local-heatmap-worker',
				type: 'module'
			  });
			const compute = Comlink.wrap(worker);
			let res = await compute(this.state.sdf[0].data, this.state.curvature.data, this.state.protein[0], this.state.volumeDims, selectionPixels, projectionPixels);
			worker.terminate();

			const countFlat = Array.from(res.slice(0, 256*256));
			const count = [];
			while(countFlat.length) count.push(countFlat.splice(0, 256));

			const areaFlat = Array.from(res.slice(256*256));
			const area = [];
			while(areaFlat.length) area.push(areaFlat.splice(0, 256));
			
			this.setState({
				localHeatmap: count,
				localHeatarea: area
			})
		}
	}

	handleProjectionUpdated(projectionPixels) {
		this.setState({
			projectionPixels: projectionPixels
		})
	}

	handleSelectionDone(selectionPixels) {
		console.log("SELECTION DONE")
		this.setState({
			selectionPixels: selectionPixels
		})
		this.computeLocalHistogram(selectionPixels, this.state.projectionPixels);
	}

	render() {
		let volumeSize = [
			this.state.volumeDims[0] * this.state.voxelSize[0],
			this.state.volumeDims[1] * this.state.voxelSize[1],
			this.state.volumeDims[2] * this.state.voxelSize[2]
		]

		return (
			<>
				<div className="background"></div>
				<Import
					show={this.state.showImport}
					onAbort={this.handleAbortImport}
					onComplete={this.handleCompleteImport}
				/>
				{!this.state.ready && 
				    <div className="d-flex justify-content-center align-items-center" style={{position: "absolute", height: "100%", width: "100%"}}>
						<Button
							variant="primary"
							size="lg"
							onClick={this.handleShowImport}
						>
							<i className="bi-plus-square"></i>&nbsp;&nbsp;Import Data
						</Button>
					</div>
				}
				{ this.state.ready &&
				<>
				<Canvas
					mainView={this.state.mainView}
					mapView={this.state.mapView}
					volumeDims={this.state.volumeDims}
					sdf={this.state.sdf}
					protein={this.state.protein}
					curvature={this.state.curvature}
					volumeSize={volumeSize}
					displayProtein={this.state.displayProtein}
					displaySegmentation={this.state.displaySegmentation}
					compartmentIndex={this.state.compartmentIndex}
					ready={this.state.ready}
					debugSamples={this.state.debugSamples}
					useLod={this.state.useLod}
					isovalue={this.state.isovalue}
					onProjectionUpdated={this.handleProjectionUpdated}
					onSelectionDone={this.handleSelectionDone}
				/>
				<Overlay>
					<Toolbar
						fullscreen={this.state.fullscreen}
						onImportData={this.handleShowImport}
						onToggleFullscreen={this.handleToggleFullscreen}
						onToggleSidebar={this.handleToggleSidebar}
					/>
					<Sidebar
						open={this.state.showSidebar}
						numCompartments={this.state.sdf.length}
						onCompartmentSelection={this.handleCompartmentSelection}
						selection={this.state.compartmentIndex}
						onDisplaySegmentation={this.handleDisplaySegmentation}
						onDisplayProtein={this.handleDisplayProtein}
						onDebugSamples={this.handleDebugSamples}
						onUseLod={this.handleUseLod}
						onIsovalue={this.handleIsovalue}
						displayProtein={this.state.displayProtein}
						displaySegmentation={this.state.displaySegmentation}
					/>
				</Overlay>
				<Views
					heataxes={this.state.heataxes}
					heatmap={Array.from(this.state.heatmap)}
					heatarea={Array.from(this.state.heatarea)}
					localHeatmap={Array.from(this.state.localHeatmap)}
					localHeatarea={Array.from(this.state.localHeatarea)}
					onMainView={this.handleMainView}
					onMapView={this.handleMapView}
				/>
				</>
				}
			</>
		)
	}
}

export default Main