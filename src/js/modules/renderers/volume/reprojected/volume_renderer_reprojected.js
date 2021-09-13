import { VolumeRenderer } from '../volume_renderer.js'

import * as THREE from 'three';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js';

THREE.Object3D.DefaultUp = new THREE.Vector3(0,0,1);

class VolumeRendererReprojected extends VolumeRenderer {
	#dom;

	#volumeSize;

	#renderer;

	#renderTargetVolumeDepth;
	#renderTargetVolumeFlip;
	#renderTargetVolumeFlop;

	#camera;
	#controls;

	#cameraBlit;

	#boxVolume;
	#boxDepth;
	
	#materialMarchVolume;
	#materialMarchVolumeDepth;
	#materialBlit;

	#sceneVolume;
	#sceneVolumeDepth;
	#sceneBlit;

	#frame;

	constructor(renderer, dom) {
		super();
		this.#dom = dom;

		this.#renderer = renderer;
		this.#renderer.autoClearColor = false;

		this.#camera = new THREE.PerspectiveCamera( 75, canvas.clientWidth/canvas.clientHeight, 0.1, 5000 );
		this.#camera.position.z = 5;

		this.#controls = new OrbitControls(this.#camera, dom);

		const geometry = new THREE.BoxGeometry();

		this.#materialMarchVolume = new THREE.RawShaderMaterial( {
			glslVersion: THREE.GLSL3,
			uniforms: {
				modelview: { value: this.#camera.matrixWorldInverse },
				proj: {value: this.#camera.projectionMatrix },
				resolution: { value: new THREE.Vector2(1024, 1024) },
				volume: { value: null },
				volumeSize: { value: null },
				volDepthTexture: { value: null },
				resolution: { value: null },
				frame: { value: 0 },
				lastFrame: { value: null },
				prevMv: { value: new THREE.Matrix4() },
			},
			vertexShader: require('./shaders/volume_renderer_vert.glsl'),
			fragmentShader: require('./shaders/volume_renderer_frag.glsl'),
			side: THREE.BackSide,
			transparent: true
		});

		this.#materialMarchVolumeDepth = new THREE.RawShaderMaterial( {
			glslVersion: THREE.GLSL3,
			uniforms: {
				modelview: { value: this.#camera.matrixWorldInverse },
				proj: { value: this.#camera.projectionMatrix },
				volume: { value: null },
				volumeSize: { value: null }
			},
			vertexShader: require('./shaders/depth_renderer_vert.glsl'),
			fragmentShader: require('./shaders/depth_renderer_frag.glsl'),
			side: THREE.BackSide,
			transparent: true
		});

		this.#materialBlit = new THREE.ShaderMaterial({
			vertexShader: require('./shaders/post_vert.glsl'),
			fragmentShader: require('./shaders/post_frag.glsl'),
			uniforms: {
				tex: { value: null }
			},
			transparent: true
		} );

		this.#sceneVolume = new THREE.Scene();
		this.#boxVolume = new THREE.Mesh(geometry, this.#materialMarchVolume)
		this.#sceneVolume.add(this.#boxVolume);

		this.#sceneVolumeDepth = new THREE.Scene();
		this.#boxDepth = new THREE.Mesh(geometry, this.#materialMarchVolumeDepth)
		this.#sceneVolume.add(this.#boxDepth);
		this.#sceneVolumeDepth.add(this.#boxDepth);

		this.#cameraBlit = new THREE.OrthographicCamera( - 1, 1, 1, - 1, 0, 1 );
		
		let plane = new THREE.PlaneGeometry( 2, 2 );
		let quad = new THREE.Mesh(plane, this.#materialBlit);

		this.#sceneBlit = new THREE.Scene();
		this.#sceneBlit.add(quad);

		// Setup render targets.
		this.#renderTargetVolumeFlip = new THREE.WebGLRenderTarget(0, 0);
		this.#renderTargetVolumeFlop = new THREE.WebGLRenderTarget(0, 0);
		this.#renderTargetVolumeDepth = new THREE.WebGLRenderTarget(0, 0, {
			format: THREE.RedFormat,
			depthBuffer: false
		})
		
		this.#materialMarchVolume.uniforms.volDepthTexture.value = this.#renderTargetVolumeDepth.texture;

		this.#frame = 0;

		window.addEventListener('resize', this.resizeCallback);
		this.resizeCallback();
	}

	render() {
		this.#controls.update();

		this.#renderer.setRenderTarget(this.#renderTargetVolumeDepth);
		this.#renderer.render(this.#sceneVolumeDepth, this.#camera);

		this.#materialMarchVolume.uniforms.volDepthTexture.value = this.#renderTargetVolumeDepth.texture;

		if (this.#frame % 2 == 0) {
			this.#materialBlit.uniforms.tex.value = this.#renderTargetVolumeFlip.texture;
			this.#materialMarchVolume.uniforms.lastFrame.value = this.#renderTargetVolumeFlop.texture;
			this.#renderer.setRenderTarget(this.#renderTargetVolumeFlip);
		} else {
			this.#materialBlit.uniforms.tex.value = this.#renderTargetVolumeFlop.texture;
			this.#materialMarchVolume.uniforms.lastFrame.value = this.#renderTargetVolumeFlip.texture;
			this.#renderer.setRenderTarget(this.#renderTargetVolumeFlop);
		}

		this.#materialMarchVolume.uniforms.frame.value = this.#frame;
		this.#renderer.render(this.#sceneVolume, this.#camera);

		this.#renderer.setRenderTarget(null);
		this.#renderer.render(this.#sceneBlit, this.#cameraBlit);

		this.#materialMarchVolume.uniforms.prevMv.value = this.#camera.matrixWorldInverse.clone();
		this.#frame += 1;
	}

	setVolumeSize(width, height, depth) {
		this.#volumeSize = new THREE.Vector3(width, height, depth);
		this.#boxVolume.geometry = new THREE.BoxGeometry(this.#volumeSize.x, this.#volumeSize.y, this.#volumeSize.z);
		this.#boxDepth.geometry = new THREE.BoxGeometry(this.#volumeSize.x, this.#volumeSize.y, this.#volumeSize.z);
	}

	setProteinData(array, dims) {
		const texture = new THREE.DataTexture3D(array, dims[0], dims[1], dims[2]);
		texture.format = THREE.RedFormat;
		texture.minFilter = THREE.LinearFilter;
		texture.magFilter = THREE.LinearFilter;
		texture.unpackAlignment = 1;
		
		this.#materialMarchVolume.uniforms.resolution = {value: new THREE.Vector2(1024, 1024)};
		this.#materialMarchVolume.uniforms.volume.value = texture;
		this.#materialMarchVolume.uniforms.volumeSize.value = this.#volumeSize;
		
		this.#materialMarchVolumeDepth.uniforms.volume.value = texture;
		this.#materialMarchVolumeDepth.uniforms.volumeSize.value = this.#volumeSize;

		this.#boxVolume.geometry = new THREE.BoxGeometry(this.#volumeSize.x, this.#volumeSize.y, this.#volumeSize.z);
		this.#boxDepth.geometry = new THREE.BoxGeometry(this.#volumeSize.x, this.#volumeSize.y, this.#volumeSize.z);
	}
	
	resizeCallback() {
		this.#renderer.setSize(this.#renderer.domElement.clientWidth, this.#renderer.domElement.clientHeight);

		const rect = this.#dom.getBoundingClientRect();
	
		const width  = rect.right - rect.left;
		const height = rect.bottom - rect.top;
		const left   = rect.left;
		const bottom = canvas.clientHeight - rect.bottom;

		this.#camera.aspect = width/height;
		this.#camera.updateProjectionMatrix();
		this.#renderTargetVolumeFlip.setSize(width, height);
		this.#renderTargetVolumeFlop.setSize(width, height);
		this.#renderTargetVolumeDepth.setSize(0.25*width, 0.25*height);
		this.#materialMarchVolume.uniforms.resolution.value = new THREE.Vector2(width, height);
	}
}

export { VolumeRendererReprojected };