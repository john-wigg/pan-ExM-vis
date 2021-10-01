import React, { Component } from 'react'

import Import from './Import'
import Toolbar from './Toolbar';
import Sidebar from './Sidebar';
import Overlay from './Overlay';
import Views from './Views';

import Button from 'react-bootstrap/Button';

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
		this.handleIsovalue = this.handleIsovalue.bind(this);
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

	handleCompleteImport(sdfBuffers, proteinBuffers, bufferDims, voxelSize, hist, histLabels) {
		this.setState({
			sdf: {buffers: sdfBuffers, dims: bufferDims},
			protein: {buffer: proteinBuffers, dims: bufferDims},
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

	render() {
		let volumeSize = [
			this.state.sdf.dims[0] * this.state.voxelSize[0],
			this.state.sdf.dims[1] * this.state.voxelSize[1],
			this.state.sdf.dims[2] * this.state.voxelSize[2]
		]

		const display = this.state.ready ? {} : {display: "none"};
		return (
			<>
				<Import
					show={this.state.showImport}
					onAbort={this.handleAbortImport}
					onComplete={this.handleCompleteImport}
				/>
				<div className="background"></div>
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
				<div style={display}>
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
					sdf={this.state.sdf}
					protein={this.state.protein}
					volumeSize={volumeSize}
					displayProtein={this.state.displayProtein}
					displaySegmentation={this.state.displaySegmentation}
					compartmentIndex={this.state.compartmentIndex}
					ready={this.state.ready}
					onClickImport={this.handleShowImport}
					localHistogram={this.state.localHistogram}
					globalHistogram={this.state.globalHistogram}
					labelsHistogram={this.state.labelsHistogram}
					debugSamples={this.state.debugSamples}
					useLod={this.state.useLod}
					isovalue={this.state.isovalue}
				/>
				</div>
			</>
		)
	}
}

export default Main