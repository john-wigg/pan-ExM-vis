var vertShader =
`#version 100
attribute vec4 aPos; // the position variable has attribute position 0

uniform mat4 model;
uniform mat4 view;
uniform mat4 proj;
  
varying vec4 vertexColor; // specify a color output to the fragment shader

void main()
{
    gl_Position = proj * view * model * vec4(aPos.xyz / 50.0, 1.0); // see how we directly give a vec3 to vec4's constructor
    vertexColor = vec4(0.5, 0.0, 0.0, 1.0); // set the output variable to a dark-red color
}`;

var fragShader =
`#version 100  
precision highp float;

varying vec4 vertexColor; // the input variable from the vertex shader (same name and same type)  

void main()
{
    gl_FragColor = vertexColor;
}`;