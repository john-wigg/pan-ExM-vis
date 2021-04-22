#version 100  
precision highp float;

varying vec4 vertexColor; // the input variable from the vertex shader (same name and same type)  

void main()
{
    gl_FragColor = vertexColor;
}