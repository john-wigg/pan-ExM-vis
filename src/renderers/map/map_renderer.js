import * as THREE from 'three';

import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js';

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

	planeMap;

	volumeTexture;
	sdfTextures;

	renderTargetSelection;
	renderTargetProjection;

	projectionDirty;
	selectionDirty;

	constructor(renderer, dom, onSelectionUpdated, onProjectionUpdated, onSelectionDone) {
		this.dom = dom;
		this.renderer = renderer;

		this.onSelectionUpdated = onSelectionUpdated;
		this.onProjectionUpdated = onProjectionUpdated;
		this.onSelectionDone = onSelectionDone;

        this.materialProjection = new THREE.ShaderMaterial({
			vertexShader: require('./shaders/mip_vert.glsl'),
			fragmentShader: require('./shaders/mip_frag.glsl'),
			uniforms: {
				volume: { value: null },
				sdf: { value: null },
				isovalue: { value: null }
			},
			transparent: true,
			extensions: {
				shaderTextureLOD: true // set to use shader texture LOD
			}
		});

		this.materialSelection = new THREE.ShaderMaterial({
			vertexShader: require('./shaders/selection_vert.glsl'),
			fragmentShader: require('./shaders/selection_frag.glsl'),
			uniforms: {
				clear: { value: true },
				lastPosition: { value: new THREE.Vector2(0.0, 0.0) },
				position: { value: new THREE.Vector2(0.0, 0.0) },
				depressed: { value: false },
				penMode: {value: 0 },
				penSize: {value: 8.0 },
				resolution: {value: 1024},
				restore: {value: null },
				doRestore: { value: false }
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
		this.renderTargetProjection = new THREE.WebGLRenderTarget(1024, 1024, {
			magFilter:THREE.NearestFilter,
            minFilter:THREE.LinearMipMapLinearFilter,
            generateMipmaps:true
		});

		const aspect = dom.clientWidth/dom.clientHeight

		this.camera = new THREE.OrthographicCamera( -aspect, aspect, 1, - 1, 0, 2 );
		this.controls = new OrbitControls(this.camera, dom);
		this.camera.position.z = 1.0;
		this.controls.enableRotate = false;
		this.controls.update();

		{
		this.cameraProjection = new THREE.OrthographicCamera(-1, 1, 1, - 1, 0, 2 );
		this.sceneProjection = new THREE.Scene();
		let plane = new THREE.PlaneGeometry( 2, 2 );
		let quad = new THREE.Mesh(plane, this.materialProjection);
		this.planeMap = quad;
		this.sceneProjection.add(quad);
		}

		{
		this.cameraSelection = new THREE.OrthographicCamera(-1, 1, 1, - 1, 0, 2 );
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
		this.sceneMap.add(this.camera);
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

	getMousePosition(e) {
		const raycaster = new THREE.Raycaster();
		const mouse = new THREE.Vector2();
		const rect = this.dom.getBoundingClientRect();
		mouse.x = (e.clientX - rect.left) / (rect.right - rect.left) * 2.0 - 1.0; //x position within the element.
		mouse.y = 1.0 - (e.clientY - rect.top) / (rect.bottom - rect.top) * 2.0; //y position within the element.
		raycaster.setFromCamera( mouse.clone(), this.camera );
		const intersects = raycaster.intersectObject(this.planeMap);

		if (intersects.length > 0) {
			return intersects[0].uv;
		}
		return null;
	}

	mouseDown(e) {
		if (e.button === 0) {
			const mouse = this.getMousePosition(e);
			if (mouse) {
				this.materialSelection.uniforms.position.value = mouse;
				this.materialSelection.uniforms.lastPosition.value = this.materialSelection.uniforms.position.value;
				this.selectionDirty = true;
				this.materialSelection.uniforms.depressed.value = true;
			}
		}
	}

	mouseMove(e) {
		if (e.button === 0) {
			if (this.materialSelection.uniforms.depressed.value) {
				const mouse = this.getMousePosition(e);
				if (mouse) {
					this.materialSelection.uniforms.lastPosition.value = this.materialSelection.uniforms.position.value;
					this.materialSelection.uniforms.position.value = mouse;
					this.selectionDirty = true;
				}
			}
		}
	}

	mouseOut(e) {
		if (e.button === 0) {
			this.materialSelection.uniforms.depressed.value = false;
		}
	}

	mouseUp(e) {
		if (e.button === 0) {
			this.materialSelection.uniforms.depressed.value = false;
			this.onSelectionDone();
		}
	}

	renderProjection() {
		this.renderer.setViewport(0, 0, 1024, 1024);
		this.renderer.setScissorTest(false);
		this.renderer.setRenderTarget(this.renderTargetProjection);
		this.renderer.render(this.sceneProjection, this.cameraProjection);
		this.onProjectionUpdated();
		this.projectionDirty = false;
	}

	renderSelection() {
		this.renderer.setViewport(0, 0, 1024, 1024);
		this.renderer.setScissorTest(false);
		this.renderer.setRenderTarget(this.renderTargetSelection);
		this.renderer.render(this.sceneSelection, this.cameraSelection);
		//this.onSelectionUpdated();
		if (this.materialSelection.uniforms.clear.value) {
			this.materialSelection.uniforms.clear.value = false;
			this.onSelectionDone();
		}

		if (this.materialSelection.uniforms.doRestore.value) {
			this.materialSelection.uniforms.doRestore.value = false;
			this.onSelectionDone();
		}
		this.selectionDirty = false;
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
		let gl = this.renderer.getContext();
		gl.clear(gl.COLOR_BUFFER_BIT);
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

	setPenSize(value) {
		this.materialSelection.uniforms.penSize.value = value;
	};

	setPenMode(mode) {
		if (mode === "draw") {
			this.materialSelection.uniforms.penMode.value = 0;
		} else {
			this.materialSelection.uniforms.penMode.value = 1;
		}
	}

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

	setSelectionFromTexture(texture) {
		this.materialSelection.uniforms.doRestore.value = true;
		this.materialSelection.uniforms.restore.value = texture;
		this.selectionDirty = true;
	}

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
		this.renderer.setSize(window.innerWidth, window.innerHeight);
		
		const aspect = this.dom.clientWidth/this.dom.clientHeight
		
		this.camera.left = -aspect;
		this.camera.right = aspect;
		this.camera.updateProjectionMatrix();
	};
}

export { MapRenderer };