import React, { useRef, useEffect } from 'react'

import * as Renderer from '../renderers/renderer.js'

const Canvas = props => {
	const canvasRef = useRef(null)

	useEffect(() => {
		Renderer.setOnProjectionUpdated(props.onProjectionUpdated);
	}, [props.onProjectionUpdated])

	useEffect(() => {
		Renderer.setOnSelectionDone(props.onSelectionDone);
	}, [props.onSelectionDone])
	
	useEffect(() => {
		if (props.ready && props.mainView && props.mapView) {
			Renderer.main(canvasRef.current, props.mainView, props.mapView);
		}
	}, [props.mainView, props.mapView, props.ready])

	
	useEffect(() => {
		if (props.ready && props.mainView && props.mapView) {
			Renderer.setDistanceFieldData(props.sdf, props.volumeDims);
		}
	}, [props.sdf, props.mainView, props.mapView, props.ready, props.volumeDims])
	
	
	useEffect(() => {
		if (props.ready && props.mainView && props.mapView) {
			Renderer.setProteinData(props.protein, props.volumeDims);
		}
	}, [props.protein, props.mainView, props.mapView, props.ready, props.volumeDims])

	useEffect(() => {
		if (props.ready && props.mainView && props.mapView) {
			Renderer.setCurvatureData(props.curvature, props.volumeDims);
		}
	}, [props.curvature, props.mainView, props.mapView, props.ready, props.volumeDims])

	
	useEffect(() => {
		if (props.ready && props.mainView && props.mapView) {
			Renderer.setVolumeSize(props.volumeSize);
		}
	}, [props.volumeSize, props.mainView, props.mapView, props.ready])

	useEffect(() => {
		if (props.ready && props.mainView && props.mapView) {
			Renderer.setDisplayProtein(props.displayProtein);
		}
	}, [props.displayProtein, props.mainView, props.mapView, props.ready])

	useEffect(() => {
		if (props.ready && props.mainView && props.mapView) {
			Renderer.setDisplayCompartment(props.displaySegmentation);
		}
	}, [props.displaySegmentation, props.mainView, props.mapView, props.ready])

	useEffect(() => {
		if (props.ready && props.mainView && props.mapView) {
			Renderer.setCompartmentIndex(props.compartmentIndex);
		}
	}, [props.compartmentIndex, props.mainView, props.mapView, props.ready])

	useEffect(() => {
		if (props.ready && props.mainView && props.mapView) {
			Renderer.setDebugSamples(props.debugSamples);
		}	
	}, [props.debugSamples, props.mainView, props.mapView, props.ready])

	useEffect(() => {
		if (props.ready && props.mainView && props.mapView) {
			Renderer.setUseLod(props.useLod);
		}
	}, [props.useLod, props.mainView, props.mapView, props.ready])

	useEffect(() => {
		if (props.ready && props.mainView && props.mapView) {
			Renderer.setIsovalue(props.isovalue);
		}
	}, [props.isovalue, props.mainView, props.mapView, props.ready])

	return (
		<canvas className="renderer" ref={canvasRef}/>
	);
}

export default Canvas