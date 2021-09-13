import * as THREE from 'three';
import $ from "jquery";
import Stats from 'three/examples/jsm/libs/stats.module.js';
import { VolumeRendererReprojected } from './volume/reprojected/volume_renderer_reprojected.js'
import { VolumeRendererDefault} from './volume/default/volume_renderer_default.js'
import { MapRenderer } from "./map/map_renderer.js"

var stats = new Stats();
stats.showPanel( 0 ); // 0: fps, 1: ms, 2: mb, 3+: custom
document.body.appendChild( stats.dom );

const canvas = $('#canvas')[0];
const mainView = $('#main-view')[0];
const mapView = $('#map-view')[0];
const renderer = new THREE.WebGLRenderer({canvas: canvas, preserveDrawingBuffer: true});
renderer.autoClearColor = false;

var volumeRenderer = null;
var mapRenderer = null;
// Configure coordinate system to use Z as up.

async function main() {
	await init();
	animate();
}

function setVolumeSize(width, height, depth) {
	volumeRenderer.setVolumeSize(width, height, depth);
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
	let textures = new Array();
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
	mapRenderer = new MapRenderer(renderer, mapView);

	volumeRenderer.setSelectionTexture(mapRenderer.getSeletionTexture());
	volumeRenderer.setProjectionTexture(mapRenderer.getProjectionTexture());

	$( document ).on("eventCompartmentSelected", function(event, idx) {
        setCompartmentIndex(idx);
    });

	$( document ).on("eventIsovalueChanged", function(event, val) {
        setIsovalue(val);
    });

	$( document ).on("eventSetDisplayCompartment", function(event, val) {
        setDisplayCompartment(val);
    });

	$( document ).on("eventSetDisplayProtein", function(event, val) {
        setDisplayProtein(val);
    });
}

function animate() {
	requestAnimationFrame( animate );
	stats.begin();

	volumeRenderer.render();
	mapRenderer.render();

	stats.end();
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