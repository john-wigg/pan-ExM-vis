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
			sdf: {buffers: [], dims: [0, 0, 0]},
			protein: {buffer: [], dims: [0, 0, 0]},
			curvature: {buffer: null, dims: [0, 0, 0]},
			ready: false,
			compartmentIndex: 0,
			displaySegmentation: true,
			displayProtein: true,
			isovalue: 0,
			globalHistogram: [],
			labelsHistogram: [],
			localHistogram: [],
			// Debug variables
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
		this.handleSelectionUpdated = this.handleSelectionUpdated.bind(this);
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

	handleCompleteImport(sdfBuffers, proteinBuffers, curvBuffer, bufferDims, voxelSize, hist, histLabels) {
		this.setState({
			sdf: {buffers: sdfBuffers, dims: bufferDims},
			protein: {buffer: proteinBuffers, dims: bufferDims},
			curvature: {buffer: curvBuffer, dims: bufferDims},
			voxelSize: voxelSize,
			showImport: false,
			ready: true,
			globalHistogram: hist,
			labelsHistogram: histLabels,
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
		this.setState({
			isovalue: value
		})
	}

	async computeLocalHistogram(selectionPixels, projectionPixels) {
		if (selectionPixels.buffer && projectionPixels.buffer) {
			const worker = new Worker('../workers/histogram-worker.js', {
				name: 'histogram-worker',
				type: 'module'
			  });
			const compute = Comlink.wrap(worker);
			let hist = await compute(this.state.sdf.buffers[0], this.state.protein.buffer[0], this.state.sdf.dims, selectionPixels, projectionPixels);
			worker.terminate();

			this.setState({
				localHistogram: hist
			})
		}
	}

	handleProjectionUpdated(projectionPixels) {
		this.setState({
			projectionPixels: projectionPixels
		})
	}

	handleSelectionUpdated(selectionPixels) {
		this.setState({
			selectionPixels: selectionPixels
		})
	}

	handleSelectionDone() {
		this.computeLocalHistogram(this.state.selectionPixels, this.state.projectionPixels);
	}

	render() {
		let volumeSize = [
			this.state.sdf.dims[0] * this.state.voxelSize[0],
			this.state.sdf.dims[1] * this.state.voxelSize[1],
			this.state.sdf.dims[2] * this.state.voxelSize[2]
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
					onSelectionUpdated={this.handleSelectionUpdated}
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
						numCompartments={this.state.sdf.buffers.length}
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
					localHistogram={Array.from(this.state.localHistogram)}
					globalHistogram={Array.from(this.state.globalHistogram)}
					labelsHistogram={this.state.labelsHistogram}
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