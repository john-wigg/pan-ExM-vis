import React, { Component } from 'react'

import Import from './Import'
import Toolbar from './Toolbar';
import Sidebar from './Sidebar';
import Overlay from './Overlay';
import Views from './Views'

class Main extends Component {
	constructor(props) {
		super(props);

		this.state = {
			fullscreen: false,
			showSidebar: false,
			showImport: false,
			voxelSize: [0, 0, 0],
			bufferDims: [0, 0, 0],
			sdfBuffers: [],
			proteinPyramid: "",
			ready: false,
			compartmentIndex: 0,
			displaySegmentation: true,
			displayProtein: true,
			globalHistogram: [],
			labelsHistogram: [],
			localHistogram: [],
			// Debug variables
			debugSamples: false,
			useLod: true
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

	handleCompleteImport(sdfBuffers, proteinBuffer, bufferDims, voxelSize, hist, histLabels) {
		this.setState({
			sdfBuffers: sdfBuffers,
			proteinPyramid: proteinBuffer,
			bufferDims: bufferDims,
			voxelSize: voxelSize,
			showImport: false,
			ready: true,
			globalHistogram: hist,
			labelsHistogram: histLabels
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

	render() {
		let volumeSize = [
			this.state.bufferDims[0] * this.state.voxelSize[0],
			this.state.bufferDims[1] * this.state.voxelSize[1],
			this.state.bufferDims[2] * this.state.voxelSize[2]
		]

		return (
			<>
				<Import
					show={this.state.showImport}
					onAbort={this.handleAbortImport}
					onComplete={this.handleCompleteImport}
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
						numCompartments={this.state.sdfBuffers.length}
						onCompartmentSelection={this.handleCompartmentSelection}
						selection={this.state.compartmentIndex}
						onDisplaySegmentation={this.handleDisplaySegmentation}
						onDisplayProtein={this.handleDisplayProtein}
						onDebugSamples={this.handleDebugSamples}
						onUseLod={this.handleUseLod}
						displayProtein={this.state.displayProtein}
						displaySegmentation={this.state.displaySegmentation}
					/>
				</Overlay>
				<Views
					sdf={{buffers: this.state.sdfBuffers, dims: this.state.bufferDims}}
					protein={{buffer: this.state.proteinPyramid, dims: this.state.bufferDims}}
					volumeSize={volumeSize}
					displayProtein={this.state.displayProtein}
					displaySegmentation={this.state.displaySegmentation}
					isovalue={0}
					compartmentIndex={this.state.compartmentIndex}
					ready={this.state.ready}
					onClickImport={this.handleShowImport}
					localHistogram={this.state.localHistogram}
					globalHistogram={this.state.globalHistogram}
					labelsHistogram={this.state.labelsHistogram}
					debugSamples={this.state.debugSamples}
					useLod={this.state.useLod}
				/>
			</>
		)
	}
}

export default Main