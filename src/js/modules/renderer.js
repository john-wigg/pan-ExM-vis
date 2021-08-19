import * as twgl from './3rdparty/twgl-full.module.js';
import * as glm from './3rdparty/gl-matrix/index.js';
import * as util from './util/common.js'
import { dist, distance } from './3rdparty/gl-matrix/vec3.js';

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
var drawProgramInfo = null;

const mapUniforms = {
    volume: 0,
    sdf: 1,
    resolution: null,
    offset: null,
    volumeDims: [0, 0, 0],
    isovalue: null,
};

const drawUniforms = {
    firstFrame: false,
    lastPosition: [0.0, 0.0],
    position: [0.0, 0.0],
    depressed: false,
    offset: [0, 0],
    resolution: [0, 0]
};

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

const drawAttachments = [
    { format: gl.RGBA, type: gl.UNSIGNED_BYTE, min: gl.LINEAR, wrap: gl.CLAMP_TO_EDGE },
    { format: gl.DEPTH_STENCIL, },
]

const fbi = twgl.createFramebufferInfo(gl, attachments, 1024, 1024);
const drawFbi = twgl.createFramebufferInfo(gl, drawAttachments, 1024, 1024);

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
    maxInfo: fbi.attachments[0],
    draw: drawFbi.attachments[0]
};

const voxelSize = glm.vec3.fromValues(0.24, 0.24, 0.2999309);

var mouseSpeed = 0.5;
var mouseX = 0.0;
var mouseY = 0.0;
var mouseDown = false;

var modelRotation = glm.quat.create();
var modelScale = glm.vec3.create();
var modelTranslation = glm.vec3.create();

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
    mainView.addEventListener('wheel', e => {handleScroll(e);});

    mapView.addEventListener('mousemove', e => { mapHandleMouseMove(e); });
    mapView.addEventListener('mousedown', e => { mapHandleMouseDown(e);});
    mapView.addEventListener('mouseup', e => { mapHandleMouseUp(e);});
    mapView.addEventListener('mouseout', e => { mapHandleMouseOut(e);});

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

    const drawVertShaderCode = await util.requestFile("src/shaders/draw.vert", 'text');
    const drawFragShaderCode = await util.requestFile("src/shaders/draw.frag", 'text');
    drawProgramInfo = twgl.createProgramInfo(gl, [drawVertShaderCode, drawFragShaderCode]);

    uniforms.volume = 0;
    uniforms.sdf = 1;
    uniforms.isovalue = 5.0;
    uniforms.renderIsosurface = 1;
    uniforms.renderVolume = 1;
    uniforms.resolution = [gl.canvas.width, gl.canvas.height];

    mapUniforms.isovalue = uniforms.isovalue;
    mapUniforms.resolution = uniforms.resolution;

    setup(0, 0, 0);

    drawUniforms.firstFrame = true;
    window.requestAnimationFrame(function() {drawSelection(); drawUniforms.firstFrame = false;});
    

    window.requestAnimationFrame(function() {draw(); });
}

function handleMouseDown(e) {
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
        glm.quat.multiply(modelRotation, rotQuat, modelRotation);

        glm.mat4.fromRotationTranslationScaleOrigin(uniforms.model, modelRotation, glm.vec3.multiply(glm.vec3.create(), modelTranslation, glm.vec3.fromValues(-1.0, -1.0, -1.0)), modelScale, modelTranslation);
    

        mouseX = e.clientX;
        mouseY = e.clientY;
    }
}

function handleScroll(e) {
    let scale = 1.0 + e.deltaY / 400.0;
    glm.vec3.scale(modelScale, modelScale, scale);
    glm.mat4.fromRotationTranslationScaleOrigin(uniforms.model, modelRotation, glm.vec3.multiply(glm.vec3.create(), modelTranslation, glm.vec3.fromValues(-1.0, -1.0, -1.0)), modelScale, modelTranslation);
}

function mapHandleMouseDown(e) {
    const rect = mapView.getBoundingClientRect();
    const x = (e.clientX - rect.left) / (rect.right - rect.left); //x position within the element.
    const y = 1.0 - (e.clientY - rect.top) / (rect.bottom - rect.top); //y position within the element.
    drawUniforms.position = [x, y];
    drawUniforms.lastPosition = drawUniforms.position;
    drawUniforms.depressed = true;
    window.requestAnimationFrame(function() {drawSelection(); });
}

function mapHandleMouseUp(e) {
    drawUniforms.depressed = false;
    window.requestAnimationFrame(function() {drawSelection(); });
}


function mapHandleMouseOut(e) {
    drawUniforms.depressed = false;
}

function mapHandleMouseMove(e) {
    if (drawUniforms.depressed) {
        const rect = mapView.getBoundingClientRect();
        const x = (e.clientX - rect.left) / (rect.right - rect.left); //x position within the element.
        const y = 1.0 - (e.clientY - rect.top) / (rect.bottom - rect.top); //y position within the element.
        drawUniforms.lastPosition = drawUniforms.position;
        drawUniforms.position = [x, y];
        window.requestAnimationFrame(function() {drawSelection(); });
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

function drawSelection() {
    twgl.bindFramebufferInfo(gl, drawFbi);

    gl.viewport(0, 0, 1024, 1024);
    gl.scissor(0, 0, 1024, 1024);

    drawUniforms.resolution = [1024, 1024];
    drawUniforms.offset = [0, 0];

    gl.useProgram(drawProgramInfo.program);
    twgl.setBuffersAndAttributes(gl, drawProgramInfo, bufferInfo);
    twgl.setUniforms(drawProgramInfo, drawUniforms);
    twgl.drawBufferInfo(gl, bufferInfo);

    gl.bindFramebuffer(gl.FRAMEBUFFER, null);

    drawBlit();
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

    drawBlit();
}

function drawBlit() {
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
    blitUniforms.draw = drawFbi.attachments[0];

    gl.useProgram(blitProgramInfo.program);
    twgl.setBuffersAndAttributes(gl, blitProgramInfo, bufferInfo);
    twgl.setUniforms(blitProgramInfo, blitUniforms);
    twgl.drawBufferInfo(gl, bufferInfo);
}

function setup(width, height, depth) {
    uniforms.volumeSize = glm.vec3.multiply(glm.vec3.create(), voxelSize, glm.vec3.fromValues(width, height, depth));
    mapUniforms.volumeDims = [width, height, depth]

    
    glm.vec3.multiply(modelTranslation, uniforms.volumeSize, glm.vec3.fromValues(0.5, 0.5, 0.5));
    modelScale = glm.vec3.fromValues(1.0, 1.0, 1.0);
    
    glm.mat4.fromRotationTranslationScaleOrigin(uniforms.model, modelRotation, glm.vec3.multiply(glm.vec3.create(), modelTranslation, glm.vec3.fromValues(-1.0, -1.0, -1.0)), modelScale, modelTranslation);
    uniforms.view = glm.mat4.lookAt(glm.mat4.create(), glm.vec3.fromValues(1.5 * uniforms.volumeSize[0], 0.0, 0.0), glm.vec3.fromValues(0.0, 0.0, 0.0), glm.vec3.fromValues(0.0, 1.0, 0.0));
}

function setDistanceFieldData(arrays, dims) {
    distanceFieldData.arrays = arrays;
    distanceFieldData.dims = dims;

    uniforms.sdf = twgl.createTexture(gl, {
          target: gl.TEXTURE_3D,
          mag: gl.LINEAR,
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
          mag: gl.LINEAR,
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

    setup(proteinData.dims[0], proteinData.dims[1], proteinData.dims[2]);

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

function deleteSelection() {
    window.requestAnimationFrame(function() {drawUniforms.firstFrame = true; drawSelection(); drawUniforms.firstFrame = false; });
}

function setCompartmentIndex(index) {
    twgl.setTextureFromArray(gl, uniforms.sdf, distanceFieldData.arrays[index],{
        target: gl.TEXTURE_3D,
        mag: gl.LINEAR,
        min: gl.LINEAR,
        internalFormat: gl.R8,
        format: gl.RED,
        width: distanceFieldData.dims[0],
        height: distanceFieldData.dims[1],
        depth: distanceFieldData.dims[2]
    });

    window.requestAnimationFrame(function() {drawMap(); });
}

export { setDistanceFieldData, setProteinData, setIsovalue, setDisplayProtein, setDisplayCompartment, setCompartmentIndex, deleteSelection };