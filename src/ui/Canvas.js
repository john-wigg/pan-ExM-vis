import React, { useRef, useEffect } from 'react'

import * as Renderer from '../renderers/renderer.js'

const Canvas = props => {
	const canvasRef = useRef(null)

	useEffect(() => {
		if (props.mainView && props.mapView) {
			Renderer.main(canvasRef.current, props.mainView, props.mapView);
		}
	}, [props.mainView, props.mapView])

	
	useEffect(() => {
		if (props.ready) {
			Renderer.setDistanceFieldData(props.sdf.buffers, props.sdf.dims);
		}
	}, [props.sdf, props.ready])
	
	
	useEffect(() => {
		if (props.ready) {
			Renderer.setProteinData(props.protein.buffer, props.protein.dims);
		}
	}, [props.protein, props.ready])

	
	useEffect(() => {
		if (props.ready) {
			Renderer.setVolumeSize(props.volumeSize);
		}
	}, [props.volumeSize, props.ready])

	useEffect(() => {
		if (props.ready) {
			Renderer.setDisplayProtein(props.displayProtein);
		}
	}, [props.displayProtein, props.ready])

	useEffect(() => {
		if (props.ready) {
			Renderer.setDisplayCompartment(props.displaySegmentation);
		}
	}, [props.displaySegmentation, props.ready])

	useEffect(() => {
		if (props.ready) {
			Renderer.setCompartmentIndex(props.compartmentIndex);
		}
	}, [props.compartmentIndex, props.ready])

	useEffect(() => {
		if (props.ready) {
			Renderer.setDebugSamples(props.debugSamples);
		}	
	}, [props.debugSamples, props.ready])

	useEffect(() => {
		if (props.ready) {
			Renderer.setUseLod(props.useLod);
		}
	}, [props.useLod, props.ready])

	useEffect(() => {
		if (props.ready) {
			Renderer.setIsovalue(props.isovalue);
		}
	}, [props.isovalue, props.ready])

	return (
		<canvas className="renderer" ref={canvasRef}/>
	);
}

export default Canvas