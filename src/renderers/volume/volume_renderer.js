// "Abstract" class for the volume renderer.

class VolumeRenderer {
	// Renders the volume.
	render() { };

	setVolumeSize(width, height, depth) { };

	// Set the protein data.
	setProteinData(texture) { };

	setDistanceData(textures) { };

	setIsovalue(value) { };

	setCompartmentIndex(value) { };
	
	setDisplayCompartments(value) { };

	setDisplayProtein(value) { };

	resizeCallback() { };
	
	setSkeleton(vec) { };

	selectionUpdated() { };

	setDebugSamples(value) { };

	setUseLod(value) { };
}

export { VolumeRenderer };