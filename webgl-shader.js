/* Shader utility class. */
/* Based on https://learnopengl.com/code_viewer_gh.php?code=includes/learnopengl/shader_s.h */

class Shader {
    constructor(gl, vertexCode, fragmentCode) {
        var vertexShader = gl.createShader(gl.VERTEX_SHADER);
        gl.shaderSource(vertexShader, vertexCode);
        gl.compileShader(vertexShader);

        if (!gl.getShaderParameter(vertexShader, gl.COMPILE_STATUS)) {
            console.error("Vertex shader compilation failed: " + gl.getShaderInfoLog(vertexShader));
            return;
        }

        var fragmentShader = gl.createShader(gl.FRAGMENT_SHADER);
        gl.shaderSource(fragmentShader, fragmentCode);
        gl.compileShader(fragmentShader);

        if (!gl.getShaderParameter(fragmentShader, gl.COMPILE_STATUS)) {
            console.error("Fragment shader compilation failed: " + gl.getShaderInfoLog(fragmentShader));
            return;
        }

        this.program = gl.createProgram()
        gl.attachShader(this.program, vertexShader);
        gl.attachShader(this.program, fragmentShader);
        gl.linkProgram(this.program);

        if (!gl.getProgramParameter(this.program, gl.LINK_STATUS)) {
            console.error("Shader program linking failed: " + gl.getProgramInfoLog(this.program));
            return;
        }

        // deleteShader not necessary due to garbage collection
    }

    use(gl) {
        gl.useProgram(this.program);
    }

    setFloat(gl, name, value) {
        gl.uniform1f(gl.getUniformLocation(this.program, name), value); 
    }

    setMat4(gl, name, value) {
        gl.uniformMatrix4fv(gl.getUniformLocation(this.program, name), false, value);
    }
}