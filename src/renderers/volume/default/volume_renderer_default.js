import { VolumeRenderer } from '../volume_renderer.js'

import * as THREE from 'three';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js';

THREE.Object3D.DefaultUp = new THREE.Vector3(0,0,1);

class VolumeRendererDefault extends VolumeRenderer {
	volumeTexture
	sdfTextures

	dom;
	renderer;

	volumeSize;

	renderTargetGrid;
	renderTargetVolume;

	camera;
	controls;

	cameraCompose;

	box;
	grid;

	materialMarchVolume;
	materialCompose;

	sceneGrid;
	sceneVolume;
	sceneCompose;

	volumeDirty;

	constructor(renderer, dom) {
		super();
		this.dom = dom;
		this.renderer = renderer;

		this.camera = new THREE.PerspectiveCamera( 75, dom.clientWidth/dom.clientHeight, 0.1, 5000 );
		
		this.controls = new OrbitControls(this.camera, dom);
		this.camera.position.y = -85;
		this.controls.update();

		this.materialMarchVolume = new THREE.RawShaderMaterial( {
			glslVersion: THREE.GLSL3,
			uniforms: {
				modelview: { value: this.camera.matrixWorldInverse },
				proj: {value: this.camera.projectionMatrix },
				resolution: { value: new THREE.Vector2(0, 0) },
				volume0: { value:null },
				volume1: { value:null },
				volume2: { value:null },
				volume3: { value:null },
				volume4: { value:null },
				volume5: { value:null },
				volume6: { value:null },
				volume7: { value:null },
				volume8: { value:null },
				volume9: { value:null },
				volumeSize: { value: null },
				texDepth: { value: null },
				sdf: { value: null },
				curvature: { value: null },
				isovalue: { value: null },
				displayProtein: { value: false },
				displayCompartments: { value: false },
				selection: { value: false },
				projection: { value: false },
				debugSamples: { value: false },
				useLod: { value: true }
			},
			vertexShader: require('./shaders/volume_renderer_vert.glsl'),
			fragmentShader: require('./shaders/volume_renderer_frag.glsl'),
			side: THREE.BackSide,
			transparent: true
		});

		this.materialCompose = new THREE.ShaderMaterial({
			vertexShader: require('./shaders/post_vert.glsl'),
			fragmentShader: require('./shaders/post_frag.glsl'),
			uniforms: {
				texGrid: { value: null },
				texVolume: { value: null }
			},
			transparent: true
		} );

		this.sceneGrid = new THREE.Scene();
		const size = 10;
		const divisions = 10;
		this.grid = new THREE.GridHelper( size, divisions );
		this.grid.rotateX(0.5*Math.PI);
		this.sceneGrid.add(this.grid);
		
		this.grid.onBeforeRender = ( renderer, scene, camera, geometry, material, group ) => {
			var pos = this.controls.target;
			this.grid.position.x = pos.x;
			this.grid.position.y = pos.y;
			this.grid.position.z = pos.z;
			this.grid.updateMatrixWorld();
		};

		const geometry = new THREE.BoxGeometry();
		this.sceneVolume = new THREE.Scene();
		this.box = new THREE.Mesh(geometry, this.materialMarchVolume)
		this.sceneVolume.add(this.box);

		this.sceneCompose = new THREE.Scene();
		this.cameraCompose = new THREE.OrthographicCamera( - 1, 1, 1, - 1, 0, 1 );
		let plane = new THREE.PlaneGeometry( 2, 2 );
		let quad = new THREE.Mesh(plane, this.materialCompose);
		this.sceneCompose.add(quad);

		this.renderTargetVolume = new THREE.WebGLRenderTarget(0, 0);
		this.renderTargetGrid = new THREE.WebGLRenderTarget(0, 0);
		this.renderTargetGrid.depthTexture = new THREE.DepthTexture();

		
		this.materialMarchVolume.uniforms.texDepth.value = this.renderTargetGrid.depthTexture;
		this.materialCompose.uniforms.texGrid.value = this.renderTargetGrid.texture;
		this.materialCompose.uniforms.texVolume.value = this.renderTargetVolume.texture;

		this.volumeDirty = true;

		this.controls.addEventListener('change', () => {
			this.volumeDirty = true;
		} );
		
		window.addEventListener('resize', () => {
			this.resizeCallback();
		});
		this.resizeCallback();
	};

	// Renders the volume.
	render() {
		if (!this.volumeTexture) return;
		if (!this.sdfTextures) return;
		if (!this.volumeDirty) return;

		const rect = this.dom.getBoundingClientRect();
			
		const width  = rect.right - rect.left;
		const height = rect.bottom - rect.top;
		const left   = rect.left;
		const bottom = window.innerHeight - rect.bottom;

		this.renderer.setViewport(left, bottom, width, height);
		this.renderer.setScissor(left, bottom, width, height);
		this.renderer.setScissorTest(true);
		
		this.controls.update();

		let gl = this.renderer.getContext();
		this.renderer.setRenderTarget(this.renderTargetGrid);
		gl.clear(gl.COLOR_BUFFER_BIT);
		this.renderer.render(this.sceneGrid, this.camera);

		this.renderer.setRenderTarget(this.renderTargetVolume);
		gl.clear(gl.COLOR_BUFFER_BIT);
		this.renderer.render(this.sceneVolume, this.camera);

		this.renderer.setRenderTarget(null);
		gl.clear(gl.COLOR_BUFFER_BIT);
		this.renderer.render(this.sceneCompose, this.cameraCompose);

		this.volumeDirty = false;
	};

	selectionUpdated() {
		this.volumeDirty = true;
	}

	setVolumeSize(width, height, depth) { 
		this.volumeSize = new THREE.Vector3(width, height, depth);
		this.box.geometry = new THREE.BoxGeometry(this.volumeSize.x, this.volumeSize.y, this.volumeSize.z);
		this.materialMarchVolume.uniforms.volumeSize.value = this.volumeSize;
		this.volumeDirty = true;
	 };

	// Set the protein data.
	setProteinData(texture) {
		this.volumeTexture = texture;
		
		for (let i = 0; i < 9; ++i) {
			this.materialMarchVolume.uniforms["volume" + i].value = this.volumeTexture[i];
		}
		
		this.volumeDirty = true;
	};
	
	setDistanceData(textures, dims) {
		this.sdfTextures = textures;
		this.materialMarchVolume.uniforms.sdf.value = this.sdfTextures[0];
		this.volumeDirty = true;
	};

	setCurvatureData(texture) {
		this.curvatureTexture = texture;
		this.materialMarchVolume.uniforms.curvature.value = this.curvatureTexture;
		this.volumeDirty = true;
	}

	setIsovalue(value) {
		this.materialMarchVolume.uniforms.isovalue.value = value;
		//this.volumeDirty = true;
	}

	setCompartmentIndex(value) {
		this.materialMarchVolume.uniforms.sdf.value = this.sdfTextures[value];
		this.volumeDirty = true;
	};

	setDisplayCompartments(value) {
		this.materialMarchVolume.uniforms.displayCompartments.value = value;
		this.volumeDirty = true;
	};

	setDisplayProtein(value) {
		this.materialMarchVolume.uniforms.displayProtein.value = value;
		this.volumeDirty = true;
	};

	setSelectionTexture(texture) {
		this.materialMarchVolume.uniforms.selection.value = texture;
		this.volumeDirty = true;
	};

	setProjectionTexture(texture) {
		this.materialMarchVolume.uniforms.projection.value = texture;
		this.volumeDirty = true;
	};

	resizeCallback() {
		this.renderer.setSize(window.innerWidth, window.innerHeight);
		
		const rect = this.dom.getBoundingClientRect();
			
		const width  = rect.right - rect.left;
		const height = rect.bottom - rect.top;
		//const left   = rect.left;
		//const bottom = window.innerHeight - rect.bottom;
		
		this.camera.aspect = width/height;
		this.camera.updateProjectionMatrix();
		this.renderTargetVolume.setSize(width, height);
		this.renderTargetGrid.setSize(width, height);
		this.materialMarchVolume.uniforms.resolution.value = new THREE.Vector2(width, height);

		this.renderTargetGrid.depthTexture = new THREE.DepthTexture();
		this.materialMarchVolume.uniforms.texDepth.value = this.renderTargetGrid.depthTexture;

		this.volumeDirty = true;
	}

	setSkeleton(vec) {
		var geom = new THREE.BufferGeometry();

		geom.setAttribute( 'position', new THREE.BufferAttribute( vec, 3 ) );

		var points = new THREE.Points(geom);

		points.position.x = -0.5*this.volumeSize.x;
		points.position.y = -0.5*this.volumeSize.y;
		points.position.z = -0.5*this.volumeSize.z;

		this.sceneGrid.add(points);
	}

	setDebugSamples(value) {
		this.materialMarchVolume.uniforms.debugSamples.value = value;
	}

	setUseLod(value) {
		this.materialMarchVolume.uniforms.useLod.value = value;
	}
}

export { VolumeRendererDefault };