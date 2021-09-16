varying vec2 vUv;

uniform bool clear;
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
    if (clear) {
        gl_FragColor = vec4(0.0, 0.0, 0.0, 1.0);
        return;
    }

    if (sdSegment(vUv, position, lastPosition) < 0.015 && depressed) {
        gl_FragColor = vec4(1.0, 0.0, 0.0, 1.0);
    } else {
        discard;
    }
}