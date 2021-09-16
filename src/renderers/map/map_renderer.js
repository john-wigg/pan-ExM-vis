import * as THREE from 'three';

class MapRenderer {
    dom;
    renderer;

    camera;

    sceneSelection;
    materialSelection;

	sceneProjection;
	materialProjection;

	sceneMap;
	materialMap;

	volumeTexture;
	sdfTextures;

	renderTargetSelection;
	renderTargetProjection;

	projectionDirty;
	selectionDirty;

	constructor(renderer, dom, onSelectionUpdated) {
		this.dom = dom;
		this.renderer = renderer;

		this.onSelectionUpdated = onSelectionUpdated;

        this.materialProjection = new THREE.ShaderMaterial({
			vertexShader: require('./shaders/mip_vert.glsl'),
			fragmentShader: require('./shaders/mip_frag.glsl'),
			uniforms: {
				volume: { value: null },
				sdf: { value: null },
				isovalue: { value: null }
			},
			transparent: true
		});

		this.materialSelection = new THREE.ShaderMaterial({
			vertexShader: require('./shaders/selection_vert.glsl'),
			fragmentShader: require('./shaders/selection_frag.glsl'),
			uniforms: {
				clear: { value: true },
				lastPosition: { value: new THREE.Vector2(0.0, 0.0) },
				position: { value: new THREE.Vector2(0.0, 0.0) },
				depressed: { value: false }
			},
			transparent: true
		});

		this.materialMap = new THREE.ShaderMaterial({
			vertexShader: require('./shaders/map_vert.glsl'),
			fragmentShader: require('./shaders/map_frag.glsl'),
			uniforms: {
				selection: { value: null },
				projection: { value: null }
			},
			transparent: true
		});

		this.renderTargetSelection = new THREE.WebGLRenderTarget(1024, 1024);
		this.renderTargetProjection = new THREE.WebGLRenderTarget(1024, 1024);

		this.camera = new THREE.OrthographicCamera( - 1, 1, 1, - 1, 0, 1 );

		{
		this.sceneProjection = new THREE.Scene();
		let plane = new THREE.PlaneGeometry( 2, 2 );
		let quad = new THREE.Mesh(plane, this.materialProjection);
		this.sceneProjection.add(quad);
		}

		{
		this.sceneSelection = new THREE.Scene();
		let plane = new THREE.PlaneGeometry( 2, 2 );
		let quad = new THREE.Mesh(plane, this.materialSelection);
		this.sceneSelection.add(quad);
		}

		{
		this.sceneMap = new THREE.Scene();
		let plane = new THREE.PlaneGeometry( 2, 2 );
		let quad = new THREE.Mesh(plane, this.materialMap);
		this.sceneMap.add(quad);
		}

		this.materialMap.uniforms.projection.value = this.renderTargetProjection.texture;
		this.materialMap.uniforms.selection.value = this.renderTargetSelection.texture;

		this.projectionDirty = false;
		this.selectionDirty = false;

		this.dom.addEventListener('mousemove', e => { this.mouseMove(e); });
		this.dom.addEventListener('mousedown', e => { this.mouseDown(e);});
		this.dom.addEventListener('mouseup', e => { this.mouseUp(e);});
		this.dom.addEventListener('mouseout', e => { this.mouseOut(e);});
			
		window.addEventListener('resize', () => {
			this.resizeCallback();
		});
		this.resizeCallback();
    };

	mouseDown(e) {
		const rect = this.dom.getBoundingClientRect();
		const x = (e.clientX - rect.left) / (rect.right - rect.left); //x position within the element.
		const y = 1.0 - (e.clientY - rect.top) / (rect.bottom - rect.top); //y position within the element.
		this.materialSelection.uniforms.position.value = new THREE.Vector2(x, y);
		this.materialSelection.uniforms.lastPosition.value = this.materialSelection.uniforms.position.value;
		this.materialSelection.uniforms.depressed.value = true;
		this.selectionDirty = true;
	}

	mouseMove(e) {
		if (this.materialSelection.uniforms.depressed.value) {
			const rect = this.dom.getBoundingClientRect();
			const x = (e.clientX - rect.left) / (rect.right - rect.left); //x position within the element.
			const y = 1.0 - (e.clientY - rect.top) / (rect.bottom - rect.top); //y position within the element.
			this.materialSelection.uniforms.lastPosition.value = this.materialSelection.uniforms.position.value;
			this.materialSelection.uniforms.position.value = new THREE.Vector2(x, y);
			this.selectionDirty = true;
		}
	}

	mouseOut(e) {
		this.materialSelection.uniforms.depressed.value = false;
	}

	mouseUp(e) {
		this.materialSelection.uniforms.depressed.value = false;
	}

	renderProjection() {
		this.renderer.setViewport(0, 0, 1024, 1024);
		this.renderer.setScissorTest(false);
		this.renderer.setRenderTarget(this.renderTargetProjection);
		this.renderer.render(this.sceneProjection, this.camera);
		this.projectionDirty = false;
	}

	renderSelection() {
		this.renderer.setViewport(0, 0, 1024, 1024);
		this.renderer.setScissorTest(false);
		this.renderer.setRenderTarget(this.renderTargetSelection);
		this.renderer.render(this.sceneSelection, this.camera);
		if (this.materialSelection.uniforms.clear.value) {
			this.materialSelection.uniforms.clear.value = false;
		}
		console.log("HEY")
		this.onSelectionUpdated();
		this.selectionDirty = false;
		//$(document).trigger("selectionUpdated");
	}

	renderMap() {
		const rect = this.dom.getBoundingClientRect();
			
		const width  = rect.right - rect.left;
		const height = rect.bottom - rect.top;
		const left   = rect.left;
		const bottom = window.innerHeight - rect.bottom;
		
		this.renderer.setViewport(left, bottom, width, height);
		this.renderer.setScissor(left, bottom, width, height);
		this.renderer.setScissorTest(true);

		this.renderer.setRenderTarget(null);
		this.renderer.render(this.sceneMap, this.camera);
	}

	// Renders the volume.
	render() {
		if (this.selectionDirty) this.renderSelection();
		if (this.projectionDirty) this.renderProjection();

		this.renderMap();
	};

	setVolumeSize(width, height, depth) { };

	// Set the protein data.
	setProteinData(texture) {
		this.volumeTexture = texture;
		this.materialProjection.uniforms.volume.value = this.volumeTexture;
		this.projectionDirty = true;
	};

	setDistanceData(textures) {
		this.sdfTextures = textures;
		this.materialProjection.uniforms.sdf.value = this.sdfTextures[0];
		this.projectionDirty = true;
	};

	setIsovalue(value) {
		this.materialProjection.uniforms.isovalue.value = value;
		this.projectionDirty = true;
	};

	setCompartmentIndex(value) {
		this.materialProjection.uniforms.sdf.value = this.sdfTextures[value];
		this.projectionDirty = true;
	};

	getSeletionTexture() {
		return this.renderTargetSelection.texture;
	};

	getSelectionPixels() {
		var pixels = {
			width: this.renderTargetSelection.width,
			height: this.renderTargetSelection.height,
			buffer: new Uint8Array(this.renderTargetSelection.width*this.renderTargetSelection.width*4)
		}
		this.renderer.readRenderTargetPixels(this.renderTargetSelection, 0, 0, pixels.width, pixels.height, pixels.buffer);
		return pixels;
	};

	getProjectionPixels() {
		var pixels = {
			width: this.renderTargetProjection.width,
			height: this.renderTargetProjection.height,
			buffer: new Uint8Array(this.renderTargetProjection.width*this.renderTargetProjection.width*4)
		}
		this.renderer.readRenderTargetPixels(this.renderTargetProjection, 0, 0, pixels.width, pixels.height, pixels.buffer);
		return pixels;
	}

	getProjectionTexture() {
		return this.renderTargetProjection.texture;
	}

	deleteSelection() {
		this.materialSelection.uniforms.clear.value = true;
		this.selectionDirty = true;
	}

	resizeCallback() {
		/*this.renderer.setSize(window.innerWidth, window.innerHeight);
		
		const rect = this.dom.getBoundingClientRect();
			
		const width  = rect.right - rect.left;
		const height = rect.bottom - rect.top;
		const left   = rect.left;
		const bottom = window.innerHeight - rect.bottom;
		
		this.camera.aspect = width/height;
		this.camera.updateProjectionMatrix();*/
	};
}

export { MapRenderer };