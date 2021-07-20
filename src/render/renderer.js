const {mat2, mat3, mat4, vec2, vec3, vec4, quat} = glMatrix;

var meshData = new Float32Array([-1.0, -1.0, 0.0, 1.0, -1.0, 3.0, 0.0, 1.0, 3.0, -1.0, 0.0, 1.0]);

var voxelSize = vec3.fromValues(0.24, 0.24, 0.2999309);
var volumeSize = null

var meshVBO = null;
var volumeTex = null;
var sdfTex = null;

var vertShader = null;
var fragShader = null;
var shaderProgram = null;

var uniformModel = null;
var uniformView = null;
var uniformProj = null;
var uniformResolution = null;
var uniformVolume = null;
var uniformVolumeSize = null;
var uniformSdf = null;
var uniformRenderIsosurface = null;
var uniformRenderVolume = null;
var uniformIsovalue = null;

var mouseSpeed = 0.5;
var mouseX = 0.0;
var mouseY = 0.0;
var mouseDown = false;

var modelMatrix = mat4.create();
var viewMatrix = mat4.create();

var gl = undefined;

//
// Start here
//

function requestFile(url, responseType) {
    return new Promise(function(resolve, reject) {
        var request = new XMLHttpRequest();
        request.open('GET', url);
        request.responseType = responseType;

        request.onload = function() {
            if (request.status === 200) {
                resolve(request.response);
            } else {
                reject(Error('Could not load file "' + url + '": ' + request.statusText));
            }
        };

        request.onerror = function() {
            reject(Error("There was a network error!"));
        };

        request.send();
    });
}

main();

async function main() {
    const canvas = document.querySelector('#main-canvas');
    const canvasDiv = document.querySelector('#canvas-container');

    resizeCanvas();
    // Not supported in older browsers, but works nicely.
    new ResizeObserver(resizeCanvas).observe(canvasDiv)

    // Initialize the GL context
    gl = canvas.getContext('webgl2');

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
    projMatrix = mat4.perspective(mat4.create(), 60.0 * Math.PI / 180.0, gl.canvas.width/gl.canvas.height, 0.01, 10.0);

    // Model matrix.
    //var modelMatrix = mat4.create();

    // Test cube data.
    meshVBO = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, meshVBO);
    gl.bufferData(gl.ARRAY_BUFFER, meshData, gl.STATIC_DRAW);

    // Shaders
    const vertShaderCode = await requestFile("src/shaders/volume-renderer.vert", 'text');
    vertShader = gl.createShader(gl.VERTEX_SHADER);
    gl.shaderSource(vertShader, vertShaderCode);
    gl.compileShader(vertShader);
    if (!gl.getShaderParameter(vertShader, gl.COMPILE_STATUS)) {
        alert("Failed to compile vertex shader! See console for log.");
        console.log(gl.getShaderInfoLog(vertShader));
        return;
    }
    
    const fragShaderCode = await requestFile("src/shaders/volume-renderer.frag", 'text');
    fragShader = gl.createShader(gl.FRAGMENT_SHADER);
    gl.shaderSource(fragShader, fragShaderCode);
    gl.compileShader(fragShader);
    if (!gl.getShaderParameter(fragShader, gl.COMPILE_STATUS)) {
        alert("Failed to compile fragment shader! See console for error log.");
        console.log(gl.getShaderInfoLog(fragShader));
        return;
    }

    shaderProgram = gl.createProgram();
    gl.attachShader(shaderProgram, vertShader);
    gl.attachShader(shaderProgram, fragShader);
    gl.linkProgram(shaderProgram);
    if (!gl.getProgramParameter(shaderProgram, gl.LINK_STATUS)) {
        alert("Failed to link shaders. See console for error log.");
        console.log(gl.getProgramInfoLog(shaderProgram));
        return null;
    }

    uniformModel = gl.getUniformLocation(shaderProgram, "model");
    uniformView = gl.getUniformLocation(shaderProgram, "view");
    uniformProj = gl.getUniformLocation(shaderProgram, "proj");
    uniformResolution = gl.getUniformLocation(shaderProgram, "resolution");
    uniformVolume = gl.getUniformLocation(shaderProgram, "volume");
    uniformVolumeSize = gl.getUniformLocation(shaderProgram, "volumeSize");
    uniformSdf = gl.getUniformLocation(shaderProgram, "sdf");
    uniformRenderIsosurface = gl.getUniformLocation(shaderProgram, "renderIsosurface");
    uniformRenderVolume = gl.getUniformLocation(shaderProgram, "renderVolume");
    uniformIsovalue = gl.getUniformLocation(shaderProgram, "isovalue");

    gl.useProgram(shaderProgram);
    
    gl.uniform1i(uniformVolume, 0);
    gl.uniform1i(uniformSdf, 1);
    gl.uniform1f(uniformIsovalue, 5.0);
    gl.uniform1i(uniformRenderIsosurface, 1);
    gl.uniform1i(uniformRenderVolume, 1);
    gl.uniform2f(uniformResolution, gl.canvas.width, gl.canvas.height);

    setup();

    window.requestAnimationFrame(function() {draw(gl, meshData); });
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

        var rotQuat = quat.fromEuler(quat.create(), 0.0, difX*mouseSpeed, -difY*mouseSpeed);
        var rotMat = mat4.fromQuat(mat4.create(), rotQuat)
        modelMatrix = mat4.multiply(mat4.create(), rotMat, modelMatrix);

        mouseX = e.clientX;
        mouseY = e.clientY;
    }
}

function draw(gl, meshData) {
    var projMatrix = mat4.perspective(mat4.create(), 60.0 * Math.PI / 180.0, gl.canvas.width/gl.canvas.height, 0.01, 10.0);
    // TODO: Update only when aspect changes.
    gl.uniformMatrix4fv(uniformProj, false, projMatrix);
    gl.uniformMatrix4fv(uniformView, false, viewMatrix);
    gl.uniformMatrix4fv(uniformModel, false, modelMatrix);

    gl.viewport(0, 0, gl.canvas.width, gl.canvas.height);

    // Set clear color to black, fully opaque
    gl.clearColor(0.0, 0.0, 0.0, 1.0);
    // Clear the color buffer with specified clear color
    gl.clear(gl.COLOR_BUFFER_BIT);

    gl.bindBuffer(gl.ARRAY_BUFFER, meshVBO);

    gl.enableVertexAttribArray(0);
    gl.vertexAttribPointer(0, 4, gl.FLOAT, false, 0, 0);

    gl.drawArrays(gl.TRIANGLES, 0, 3);
    window.requestAnimationFrame(function() {draw(gl, meshData); });
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
    volumeSize = vec3.multiply(vec3.create(), voxelSize, vec3.fromValues(1024, 1024, 150));
    gl.uniform3f(uniformVolumeSize, volumeSize[0], volumeSize[1], volumeSize[2]);

    var shift  = vec3.multiply(vec3.create(), volumeSize, vec3.fromValues(-0.5, -0.5, -0.5));
    modelMatrix = mat4.fromTranslation(mat4.create(), shift);
    viewMatrix = mat4.lookAt(mat4.create(), vec3.fromValues(1.5 * volumeSize[0], 0.0, 0.0), vec3.fromValues(0.0, 0.0, 0.0), vec3.fromValues(0.0, 1.0, 0.0));

    gl.uniformMatrix4fv(uniformView, false, viewMatrix);
    gl.uniformMatrix4fv(uniformModel, false, modelMatrix);
}

function createSdfTex(sdfBuffer, sdfDims) {
    let buffer = new Uint8Array(sdfBuffer, 0, sdfBuffer.byteLength);
    sdfTex = gl.createTexture();
    gl.activeTexture(gl.TEXTURE1);
    gl.bindTexture(gl.TEXTURE_3D, sdfTex);
    gl.texStorage3D(gl.TEXTURE_3D, 1, gl.R8, sdfDims[0], sdfDims[1], sdfDims[2]);
    gl.texParameteri(gl.TEXTURE_3D, gl.TEXTURE_MIN_FILTER, gl.LINEAR);
    gl.texParameteri(gl.TEXTURE_3D, gl.TEXTURE_MAG_FILTER, gl.LINEAR);
    gl.texParameteri(gl.TEXTURE_3D, gl.TEXTURE_WRAP_R, gl.CLAMP_TO_EDGE);
    gl.texParameteri(gl.TEXTURE_3D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
    gl.texParameteri(gl.TEXTURE_3D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
    gl.texSubImage3D(gl.TEXTURE_3D, 0, 0, 0, 0, sdfDims[0], sdfDims[1], sdfDims[2], gl.RED, 
        gl.UNSIGNED_BYTE, buffer);

    gl.uniform1i(uniformSdf, 1);
}

function createVolumeTex(volBuffer, volDims) {
    let buffer = new Uint8Array(volBuffer, 0, volBuffer.byteLength);
    volumeTex = gl.createTexture();
    gl.activeTexture(gl.TEXTURE0);
    gl.bindTexture(gl.TEXTURE_3D, volumeTex);
    gl.texStorage3D(gl.TEXTURE_3D, 1, gl.R8, volDims[0], volDims[1], volDims[2]);
    gl.texParameteri(gl.TEXTURE_3D, gl.TEXTURE_MIN_FILTER, gl.LINEAR);
    gl.texParameteri(gl.TEXTURE_3D, gl.TEXTURE_MAG_FILTER, gl.LINEAR);
    gl.texParameteri(gl.TEXTURE_3D, gl.TEXTURE_WRAP_R, gl.CLAMP_TO_EDGE);
    gl.texParameteri(gl.TEXTURE_3D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
    gl.texParameteri(gl.TEXTURE_3D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
    gl.texSubImage3D(gl.TEXTURE_3D, 0, 0, 0, 0, volDims[0], volDims[1], volDims[2], gl.RED, 
        gl.UNSIGNED_BYTE, buffer);

    gl.uniform1i(uniformVolume, 0);
}

var renderIsosurface = true;
function toggleIsosurface() {
    renderIsosurface = !renderIsosurface;
    gl.uniform1i(uniformRenderIsosurface, renderIsosurface);
}

var renderVolume = true;
function toggleVolume() {
    renderVolume = !renderVolume;
    gl.uniform1i(uniformRenderVolume, renderVolume);
}

function setIsovalue() {
    var elem = document.getElementById('rangeIsovalue');
    gl.uniform1f(uniformIsovalue, elem.value);
}