import * as twgl from './3rdparty/twgl-full.module.js';
import * as glm from './3rdparty/gl-matrix/index.js';
import * as util from './util/common.js'

const canvas = document.querySelector('#main-canvas');
const gl = canvas.getContext('webgl2');

var programInfo = null;

const arrays = {
    position: [-1.0, -1.0, 0.0, -1.0, 3.0, 0.0, 3.0, -1.0, 0.0],
};
const bufferInfo = twgl.createBufferInfoFromArrays(gl, arrays);

var projMatrix;

const uniforms = {
    model: null,
    view: null,
    proj: null,
    resolution: null,
    volumeSize: null,
    renderIsosurface: null,
    renderVolume: null,
    isovalue: null,
    volume: 0,
    sdf: 1
};

const distanceFieldData = {
    arrays: [],
    dims: [0, 0, 0]
};

const proteinData = {
    array: null,
    dims: [0, 0, 0]
};

var voxelSize = glm.vec3.fromValues(0.24, 0.24, 0.2999309);
var volumeSize = null

var mouseSpeed = 0.5;
var mouseX = 0.0;
var mouseY = 0.0;
var mouseDown = false;

var modelMatrix = glm.mat4.create();
var viewMatrix = glm.mat4.create();

//
// Start here
//

main();

async function main() {

    const canvasDiv = document.querySelector('#canvas-container');

    resizeCanvas();
    // Not supported in older browsers, but works nicely.
    new ResizeObserver(resizeCanvas).observe(canvasDiv)

    // If we don't have a GL context, give up now
    // Only continue if WebGL is available and working

    if (!gl) {
        alert('Unable to initialize WebGL2. Your browser or machine may not support it.');
        return;
    }

    // Setup mouse events.
    canvas.addEventListener('mousemove', e => {handleMouseMove(e);});
    canvas.addEventListener('mousedown', e => {handleMouseDown(e);});
    canvas.addEventListener('mouseup', e => {handleMouseUp(e);});
    canvas.addEventListener('mouseout', e => {handleMouseOut(e);});

    // Camera matrices.
    projMatrix = glm.mat4.perspective(glm.mat4.create(), 60.0 * Math.PI / 180.0, gl.canvas.width/gl.canvas.height, 0.01, 10.0);

    // Model matrix.
    //var modelMatrix = glm.mat4.create();

    // Shaders
    const vertShaderCode = await util.requestFile("src/shaders/volume-renderer.vert", 'text');
    const fragShaderCode = await util.requestFile("src/shaders/volume-renderer.frag", 'text');
    programInfo = twgl.createProgramInfo(gl, [vertShaderCode, fragShaderCode]);

    uniforms.volume = 0;
    uniforms.sdf = 1;
    uniforms.isovalue = 5.0;
    uniforms.renderIsosurface = 1;
    uniforms.renderVolume = 1;
    uniforms.resolution = [gl.canvas.width, gl.canvas.height];

    setup();

    window.requestAnimationFrame(function() {draw(); });
}

function handleMouseDown(e) {
    console.log("Mouse down")
    mouseX = e.clientX;
    mouseY = e.clientY;
    mouseDown = true;
}

function handleMouseUp(e) {
    mouseDown = false;
}

function handleMouseOut(e) {
    mouseDown = false;
}

function handleMouseMove(e) {
    if (mouseDown) {
        var difX = e.clientX - mouseX;
        var difY = e.clientY - mouseY;

        var rotQuat = glm.quat.fromEuler(glm.quat.create(), 0.0, difX*mouseSpeed, -difY*mouseSpeed);
        var rotMat = glm.mat4.fromQuat(glm.mat4.create(), rotQuat)
        modelMatrix = glm.mat4.multiply(glm.mat4.create(), rotMat, modelMatrix);

        mouseX = e.clientX;
        mouseY = e.clientY;
    }
}

function draw() {
    twgl.resizeCanvasToDisplaySize(gl.canvas);
    var projMatrix = glm.mat4.perspective(glm.mat4.create(), 60.0 * Math.PI / 180.0, gl.canvas.width/gl.canvas.height, 0.01, 10.0);
    // TODO: Update only when aspect changes.
    uniforms.proj = projMatrix;
    uniforms.view = viewMatrix;
    uniforms.model = modelMatrix;
    
    gl.viewport(0, 0, gl.canvas.width, gl.canvas.height);

    // Set clear color to black, fully opaque
    gl.clearColor(0.0, 1.0, 0.0, 1.0);
    // Clear the color buffer with specified clear color
    gl.clear(gl.COLOR_BUFFER_BIT);

    gl.useProgram(programInfo.program);
    twgl.setBuffersAndAttributes(gl, programInfo, bufferInfo);
    twgl.setUniforms(programInfo, uniforms);
    twgl.drawBufferInfo(gl, bufferInfo);
    window.requestAnimationFrame(function() {draw(); });
}

function resizeCanvas() {
    // Resize the canvas to fit its parent div.
    const mainCanvas = document.querySelector('#main-canvas');
    const mainView = document.querySelector('#main-view');
    mainCanvas.width = mainView.clientWidth;
    mainCanvas.height = mainView.clientHeight;

    const mapCanvas = document.querySelector('#map-canvas');
    const mapView = document.querySelector('#map-view');
    mapCanvas.width = mapView.clientWidth;
    mapCanvas.height = mapView.clientHeight;
}

function setup() {
    volumeSize = glm.vec3.multiply(glm.vec3.create(), voxelSize, glm.vec3.fromValues(1024, 1024, 150));
    uniforms.volumeSize = volumeSize;

    var shift  = glm.vec3.multiply(glm.vec3.create(), volumeSize, glm.vec3.fromValues(-0.5, -0.5, -0.5));
    modelMatrix = glm.mat4.fromTranslation(glm.mat4.create(), shift);
    viewMatrix = glm.mat4.lookAt(glm.mat4.create(), glm.vec3.fromValues(1.5 * volumeSize[0], 0.0, 0.0), glm.vec3.fromValues(0.0, 0.0, 0.0), glm.vec3.fromValues(0.0, 1.0, 0.0));

    uniforms.view = viewMatrix;
    uniforms.model = modelMatrix;
}

function setDistanceFieldData(arrays, dims) {
    distanceFieldData.arrays = arrays;
    distanceFieldData.dims = dims;

    uniforms.sdf = twgl.createTexture(gl, {
          target: gl.TEXTURE_3D,
          mag: gl.NEAREST,
          min: gl.LINEAR,
          internalFormat: gl.R8,
          format: gl.RED,
          src: distanceFieldData.arrays[0],
          width: distanceFieldData.dims[0],
          height: distanceFieldData.dims[1],
          depth: distanceFieldData.dims[2]
    });
}

function setProteinData(array, dims) {
    proteinData.array = array;
    proteinData.dims = dims;
    const textures = twgl.createTextures(gl, {
        // a 1x8 pixel texture from a typed array.
        volume: {
          target: gl.TEXTURE_3D,
          mag: gl.NEAREST,
          min: gl.LINEAR,
          internalFormat: gl.R8,
          format: gl.RED,
          src: proteinData.array,
          width: proteinData.dims[0],
          height: proteinData.dims[1],
          depth: proteinData.dims[2]
        },
    });
    uniforms.volume = textures.volume;
}

function setDisplayCompartment(value) {
    uniforms.renderIsosurface = value;
}

function setDisplayProtein(value) {
    uniforms.renderVolume = value;
}

function setIsovalue(value) {
    uniforms.isovalue = value;
}

function setCompartmentIndex(index) {
    twgl.setTextureFromArray(gl, uniforms.sdf, distanceFieldData.arrays[index],{
        target: gl.TEXTURE_3D,
        mag: gl.NEAREST,
        min: gl.LINEAR,
        internalFormat: gl.R8,
        format: gl.RED,
        width: 1024,
        height: 1024,
        depth: 150
    });
}

export { setDistanceFieldData, setProteinData, setIsovalue, setDisplayProtein, setDisplayCompartment, setCompartmentIndex };