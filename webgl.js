const {mat2, mat3, mat4, vec2, vec3, vec4, quat} = glMatrix;

const cubeStrip = [
	1, 1, -1,
	-1, 1, -1,
	1, 1, 1,
	-1, 1, 1,
	-1, -1, 1,
	-1, 1, -1,
	-1, -1, -1,
	1, 1, -1,
	1, -1, -1,
	1, 1, 1,
	1, -1, 1,
	-1, -1, 1,
	1, -1, -1,
	-1, -1, -1
];

var cubeVBO = null;
var shader = null;

var mouseSpeed = 0.5;
var mouseX = 0.0;
var mouseY = 0.0;
var mouseDown = false;

var modelMatrix = mat4.create();

//
// Start here
//
function renderMarchingCubes(meshData) {
    const canvas = document.querySelector('#glcanvas');
    const canvasDiv = document.querySelector('#canvas-container');

    resizeCanvas();
    // Not supported in older browsers, but works nicely.
    new ResizeObserver(resizeCanvas).observe(canvasDiv)

    // Initialize the GL context
    const gl = canvas.getContext('webgl');

    // If we don't have a GL context, give up now
    // Only continue if WebGL is available and working

    if (!gl) {
        alert('Unable to initialize WebGL. Your browser or machine may not support it.');
        return;
    }

    // Setup mouse events.
    canvas.addEventListener('mousemove', e => {handleMouseMove(e);});
    canvas.addEventListener('mousedown', e => {handleMouseDown(e);});
    canvas.addEventListener('mouseup', e => {handleMouseUp(e);});
    canvas.addEventListener('mouseout', e => {handleMouseOut(e);});

    // Camera matrices.
    var viewMatrix = mat4.lookAt(mat4.create(), vec3.fromValues(5.0, 0.0, 0.0), vec3.fromValues(0.0, 0.0, 0.0), vec3.fromValues(0.0, 1.0, 0.0));
    var projMatrix = mat4.perspective(mat4.create(), 60.0 * Math.PI / 180.0, gl.canvas.width/gl.canvas.height, 0.01, 10.0);

    // Model matrix.
    //var modelMatrix = mat4.create();

    gl.disable(gl.CULL_FACE);

    // Test cube data.
    meshVBO = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, meshVBO);
    gl.bufferData(gl.ARRAY_BUFFER, meshData, gl.STATIC_DRAW);

    // Shaders
    shader = new Shader (gl, vertShader, fragShader);
    shader.use(gl);
    shader.setMat4(gl, "model", modelMatrix);
    shader.setMat4(gl, "view", viewMatrix);
    shader.setMat4(gl, "proj", projMatrix);

    window.requestAnimationFrame(function() {draw(gl, meshData); });
}

function drawCube(gl, meshData) {
    gl.bindBuffer(gl.ARRAY_BUFFER, meshVBO);

    gl.vertexAttribPointer(0, 4, gl.FLOAT, false, 0, 0);
    gl.enableVertexAttribArray(0);

    gl.drawArrays(gl.TRIANGLES, 0, meshData.length);
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
    // TODO: Update only when aspect changes.
    projMatrix = mat4.perspective(mat4.create(), 60.0 * Math.PI / 180.0, gl.canvas.width/gl.canvas.height, 0.01, 10.0);
    shader.setMat4(gl, "proj", projMatrix);
    shader.setMat4(gl, "model", modelMatrix);

    gl.viewport(0, 0, gl.canvas.width, gl.canvas.height);

    // Set clear color to black, fully opaque
    gl.clearColor(1.0, 1.0, 1.0, 1.0);
    // Clear the color buffer with specified clear color
    gl.clear(gl.COLOR_BUFFER_BIT);

    drawCube(gl, meshData);

    window.requestAnimationFrame(function() {draw(gl, meshData); });
}

function resizeCanvas() {
    // Resize the canvas to fit its parent div.
    const canvas = document.querySelector('#glcanvas');
    const canvasDiv = document.querySelector('#canvas-container');
    canvas.width = canvasDiv.clientWidth;
    canvas.height = canvasDiv.clientHeight;
}