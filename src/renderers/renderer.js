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

function setProteinData(array, dims) {
	const texture = new THREE.DataTexture3D(array, dims[0], dims[1], dims[2]);
	texture.format = THREE.RedFormat;
	texture.minFilter = THREE.LinearFilter;
	texture.magFilter = THREE.LinearFilter;
	texture.unpackAlignment = 1;
	
	volumeRenderer.setProteinData(texture);
	mapRenderer.setProteinData(texture);
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
	stats.begin();

	volumeRenderer.render();
	mapRenderer.render();

	stats.end();
}

function handleSelectionUpdated() {
	console.log("UUUPS");
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
	mapRenderer.deleteSelection();
}

function getMapSelectionPixels() {
	return mapRenderer.getSelectionPixels();
}

function getMapProjectionPixels() {
	return mapRenderer.getProjectionPixels();
}

export { main, setDistanceFieldData, setProteinData, setIsovalue, setDisplayProtein, setDisplayCompartment, setCompartmentIndex, setVolumeSize, deleteSelection, setSkeleton, getMapSelectionPixels, getMapProjectionPixels};