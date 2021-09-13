// "Abstract" class for the volume renderer.

class VolumeRenderer {
	constructor(renderer, dom) { };

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
}

export { VolumeRenderer };