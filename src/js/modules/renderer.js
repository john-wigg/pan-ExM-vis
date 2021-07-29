import * as twgl from './3rdparty/twgl-full.module.js';
import * as glm from './3rdparty/gl-matrix/index.js';
import * as util from './util/common.js'
import { floor } from './3rdparty/gl-matrix/vec3.js';

const canvas = document.querySelector('#canvas');
const gl = canvas.getContext('webgl2', {preserveDrawingBuffer: true});

const mainView = document.getElementById('main-view')
const mapView = document.getElementById('map-view')

const arrays = {
    position: [-1.0, -1.0, 0.0, -1.0, 3.0, 0.0, 3.0, -1.0, 0.0],
};
const bufferInfo = twgl.createBufferInfoFromArrays(gl, arrays);

var programInfo = null;
var mapProgramInfo = null;
var blitProgramInfo = null;

const mapUniforms = {
    volume: 0,
    sdf: 1,
    resolution: null,
    offset: null,
    volumeDims: [1024, 1024, 150],
    isovalue: null
}

const distanceFieldData = {
    arrays: [],
    dims: [0, 0, 0]
};

const proteinData = {
    array: null,
    dims: [0, 0, 0]
};


const attachments = [
    { format: gl.RGBA, type: gl.UNSIGNED_BYTE, min: gl.LINEAR, wrap: gl.CLAMP_TO_EDGE },
    { format: gl.DEPTH_STENCIL, },
]


const fbi = twgl.createFramebufferInfo(gl, attachments, 1024, 1024);

const blitUniforms = {
    source: fbi.attachments[0],
    offset: [0, 0],
    resolution: [0, 0]
}

const uniforms = {
    model: glm.mat4.create(),
    view: glm.mat4.create(),
    proj: glm.mat4.create(),
    resolution: null,
    volumeSize: null,
    renderIsosurface: null,
    renderVolume: null,
    isovalue: null,
    volume: 0,
    sdf: 1,
    maxInfo: fbi.attachments[0]
};

const voxelSize = glm.vec3.fromValues(0.24, 0.24, 0.2999309);

var mouseSpeed = 0.5;
var mouseX = 0.0;
var mouseY = 0.0;
var mouseDown = false;

main();

async function main() {
    // If we don't have a GL context, give up now
    // Only continue if WebGL is available and working

    if (!gl) {
        alert('Unable to initialize WebGL2. Your browser or machine may not support it.');
        return;
    }

    // Setup mouse events.
    mainView.addEventListener('mousemove', e => {handleMouseMove(e);});
    mainView.addEventListener('mousedown', e => {handleMouseDown(e);});
    mainView.addEventListener('mouseup', e => {handleMouseUp(e);});
    mainView.addEventListener('mouseout', e => {handleMouseOut(e);});

    // Shaders
    const vertShaderCode = await util.requestFile("src/shaders/volume-renderer.vert", 'text');
    const fragShaderCode = await util.requestFile("src/shaders/volume-renderer.frag", 'text');
    programInfo = twgl.createProgramInfo(gl, [vertShaderCode, fragShaderCode]);

    const mapVertShaderCode = await util.requestFile("src/shaders/map-renderer.vert", 'text');
    const mapFragShaderCode = await util.requestFile("src/shaders/map-renderer.frag", 'text');
    mapProgramInfo = twgl.createProgramInfo(gl, [mapVertShaderCode, mapFragShaderCode]);

    const blitVertShaderCode = await util.requestFile("src/shaders/blit.vert", 'text');
    const blitFragShaderCode = await util.requestFile("src/shaders/blit.frag", 'text');
    blitProgramInfo = twgl.createProgramInfo(gl, [blitVertShaderCode, blitFragShaderCode]);

    uniforms.volume = 0;
    uniforms.sdf = 1;
    uniforms.isovalue = 5.0;
    uniforms.renderIsosurface = 1;
    uniforms.renderVolume = 1;
    uniforms.resolution = [gl.canvas.width, gl.canvas.height];

    mapUniforms.isovalue = uniforms.isovalue;
    mapUniforms.resolution = uniforms.resolution;

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
        uniforms.model = glm.mat4.multiply(glm.mat4.create(), rotMat, uniforms.model);

        mouseX = e.clientX;
        mouseY = e.clientY;
    }
}

function draw() {
    twgl.resizeCanvasToDisplaySize(gl.canvas);
    const rect = mainView.getBoundingClientRect();

    const width  = rect.right - rect.left;
    const height = rect.bottom - rect.top;
    const left   = rect.left;
    const bottom = gl.canvas.clientHeight - rect.bottom;

    uniforms.resolution = [width, height];
    
    uniforms.proj = glm.mat4.perspective(glm.mat4.create(), 60.0 * Math.PI / 180.0, width/height, 0.01, 10.0);
    
    gl.bindFramebuffer(gl.FRAMEBUFFER, null);
    gl.viewport(left, bottom, width, height);
    gl.scissor(left, bottom, width, height);

    // Set clear color to black, fully opaque
    //gl.clearColor(0.0, 1.0, 0.0, 1.0);
    // Clear the color buffer with specified clear color
    //gl.clear(gl.COLOR_BUFFER_BIT);

    gl.useProgram(programInfo.program);
    twgl.setBuffersAndAttributes(gl, programInfo, bufferInfo);
    twgl.setUniforms(programInfo, uniforms);
    twgl.drawBufferInfo(gl, bufferInfo);
    window.requestAnimationFrame(function() {draw(); });
}

function drawMap() {
    twgl.bindFramebufferInfo(gl, fbi);

    gl.viewport(0, 0, 1024, 1024);
    gl.scissor(0, 0, 1024, 1024);

    mapUniforms.resolution = [1024, 1024];
    mapUniforms.offset = [0, 0];

    gl.useProgram(mapProgramInfo.program);
    twgl.setBuffersAndAttributes(gl, mapProgramInfo, bufferInfo);
    twgl.setUniforms(mapProgramInfo, mapUniforms);
    twgl.drawBufferInfo(gl, bufferInfo);

    gl.bindFramebuffer(gl.FRAMEBUFFER, null);

    const rect = mapView.getBoundingClientRect();

    const width  = rect.right - rect.left;
    const height = rect.bottom - rect.top;
    const left   = rect.left;
    const bottom = gl.canvas.clientHeight - rect.bottom;

    gl.viewport(left, bottom, width, height);
    gl.scissor(left, bottom, width, height);

    blitUniforms.resolution = [width, height];
    blitUniforms.offset = [left, bottom];
    blitUniforms.source = fbi.attachments[0];

    // Set clear color to black, fully opaque
    //gl.clearColor(1.0, 0.0, 0.0, 1.0);
    // Clear the color buffer with specified clear color
    //gl.clear(gl.COLOR_BUFFER_BIT);

    gl.useProgram(blitProgramInfo.program);
    twgl.setBuffersAndAttributes(gl, blitProgramInfo, bufferInfo);
    twgl.setUniforms(blitProgramInfo, blitUniforms);
    twgl.drawBufferInfo(gl, bufferInfo);
}

function setup() {
    uniforms.volumeSize = glm.vec3.multiply(glm.vec3.create(), voxelSize, glm.vec3.fromValues(1024, 1024, 150));

    var shift  = glm.vec3.multiply(glm.vec3.create(), uniforms.volumeSize, glm.vec3.fromValues(-0.5, -0.5, -0.5));
    uniforms.model = glm.mat4.fromTranslation(glm.mat4.create(), shift);
    uniforms.view = glm.mat4.lookAt(glm.mat4.create(), glm.vec3.fromValues(1.5 * uniforms.volumeSize[0], 0.0, 0.0), glm.vec3.fromValues(0.0, 0.0, 0.0), glm.vec3.fromValues(0.0, 1.0, 0.0));
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

    mapUniforms.sdf = uniforms.sdf;

    drawMap();
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
    mapUniforms.volume = textures.volume;

    window.requestAnimationFrame(function() {drawMap(); });
}

function setDisplayCompartment(value) {
    uniforms.renderIsosurface = value;
}

function setDisplayProtein(value) {
    uniforms.renderVolume = value;
}

function setIsovalue(value) {
    uniforms.isovalue = value;
    mapUniforms.isovalue = uniforms.isovalue;

    window.requestAnimationFrame(function() {drawMap(); });
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

    window.requestAnimationFrame(function() {drawMap(); });
}

export { setDistanceFieldData, setProteinData, setIsovalue, setDisplayProtein, setDisplayCompartment, setCompartmentIndex };