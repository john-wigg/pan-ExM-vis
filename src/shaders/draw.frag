#version 300 es

#ifdef GL_FRAGMENT_PRECISION_HIGH
precision highp float;
#else
precision mediump float;
#endif

out vec4 FragColor;

uniform bool firstFrame;
uniform vec2 offset;
uniform vec2 resolution;
uniform vec2 lastPosition;
uniform vec2 position;
uniform bool depressed;

// https://iquilezles.org/www/articles/distfunctions2d/distfunctions2d.htm
float sdSegment( in vec2 p, in vec2 a, in vec2 b )
{
    vec2 pa = p-a, ba = b-a;
    float h = clamp( dot(pa,ba)/dot(ba,ba), 0.0, 1.0 );
    return length( pa - ba*h );
}

void main()
{
    if (firstFrame) {
        FragColor = vec4(0.0, 0.0, 0.0, 1.0);
        return;
    }

    vec2 uv = (gl_FragCoord.xy - offset) / resolution;

    if (sdSegment(uv, position, lastPosition) < 0.025 && depressed) {
        FragColor = vec4(1.0, 0.0, 0.0, 1.0);
    } else {
        discard;
    }
}