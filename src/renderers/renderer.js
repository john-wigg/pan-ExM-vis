import * as THREE from 'three';
import Stats from 'three/examples/jsm/libs/stats.module.js';
//import { VolumeRendererReprojected } from './volume/reprojected/volume_renderer_reprojected.js'
import { VolumeRendererDefault} from './volume/default/volume_renderer_default.js'
import { MapRenderer } from "./map/map_renderer.js"

var stats = new Stats();
stats.showPanel( 0 ); // 0: fps, 1: ms, 2: mb, 3+: custom
document.body.appendChild( stats.dom );

var canvas;
var mainView;
var mapView;

var renderer;

var volumeRenderer = null;
var mapRenderer = null;
// Configure coordinate system to use Z as up.

async function main(initCanvas, initMainView, initMapView) {
	canvas = initCanvas;
	mainView = initMainView;
	mapView = initMapView;
	renderer = new THREE.WebGLRenderer({canvas: canvas, preserveDrawingBuffer: true});
	renderer.autoClearColor = false;
	await init();
	animate();
}

function setVolumeSize(size) {
	volumeRenderer.setVolumeSize(size[0], size[1], size[2]);
}

function setProteinData(pyramid, dims) {
	let textures = []
	let w = dims[0];
	let h = dims[1];
	let d = dims[2];
	for (let i = 0; i < pyramid.length; ++i) {
		const texture = new THREE.DataTexture3D(pyramid[i], w, h, d);
		texture.format = THREE.RGFormat;
		texture.type = THREE.UnsignedByteType;
		texture.internalFormat = 'RG8';
		texture.minFilter = THREE.LinearFilter;
		texture.magFilter = THREE.LinearFilter;
		texture.generateMipmaps = false;
		texture.unpackAlignment = 1;

		w = Math.ceil(w/2.0);
		h = Math.ceil(h/2.0);
		d = Math.ceil(d/2.0);

		textures.push(texture);
	}

	
	volumeRenderer.setProteinData(textures);
	mapRenderer.setProteinData(textures[0]);
}

function setDistanceFieldData(arrays, dims) {
	let textures = [];
	for (var i = 0; i < arrays.length; ++i) {
		const tex = new THREE.DataTexture3D(arrays[i], dims[0], dims[1], dims[2]);
		tex.format = THREE.RedFormat;
		tex.minFilter = THREE.LinearFilter;
		tex.magFilter = THREE.LinearFilter;
		tex.unpackAlignment = 1;

		textures.push(tex);
	}
	volumeRenderer.setDistanceData(textures);
	mapRenderer.setDistanceData(textures);
}

async function init() {
	volumeRenderer = new VolumeRendererDefault(renderer, mainView);
	mapRenderer = new MapRenderer(renderer, mapView, handleSelectionUpdated);

	volumeRenderer.setSelectionTexture(mapRenderer.getSeletionTexture());
	volumeRenderer.setProjectionTexture(mapRenderer.getProjectionTexture());
}

function animate() {
	requestAnimationFrame( animate );
	
	volumeRenderer.render();
	mapRenderer.render();

	stats.update();
}

function handleSelectionUpdated() {
	volumeRenderer.selectionUpdated();
}

function setIsovalue(value) {
	volumeRenderer.setIsovalue(value);
	mapRenderer.setIsovalue(value);
}

function setDisplayProtein(value) {
	volumeRenderer.setDisplayProtein(value);
}

function setDisplayCompartment(value) {
	volumeRenderer.setDisplayCompartments(value);
}

function setCompartmentIndex(index) {
	volumeRenderer.setCompartmentIndex(index);
	mapRenderer.setCompartmentIndex(index);
}

function setSkeleton(vec) {
	volumeRenderer.setSkeleton(vec);
}

function deleteSelection() {
	if (mapRenderer) {
		mapRenderer.deleteSelection();
	}
}

function getMapSelectionPixels() {
	return mapRenderer.getSelectionPixels();
}

function getMapProjectionPixels() {
	return mapRenderer.getProjectionPixels();
}

function setMapSelectionPixels(pixels, width, height) {
	const texture = new THREE.DataTexture( pixels, width, height, THREE.RGBAFormat );
	mapRenderer.setSelectionFromTexture(texture);
}

function setDebugSamples(value) {
	volumeRenderer.setDebugSamples(value);
}

function setUseLod(value) {
	volumeRenderer.setUseLod(value);
}

function setPenMode(mode) {
	if (mapRenderer) {
		mapRenderer.setPenMode(mode);
	}
}

function setPenSize(value) {
	if (mapRenderer) {
		mapRenderer.setPenSize(value);
	}
}

export { main, setDistanceFieldData, setProteinData, setIsovalue, setDisplayProtein, setDisplayCompartment, setCompartmentIndex, setVolumeSize, deleteSelection, setSkeleton, setMapSelectionPixels, getMapSelectionPixels, getMapProjectionPixels, setDebugSamples, setUseLod, setPenMode, setPenSize};