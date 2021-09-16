precision highp float;
precision highp sampler3D;

out vec4 FragColor;

uniform sampler3D volume;

uniform sampler2D volDepthTexture;
uniform sampler2D lastFrame;

uniform mat4 modelview;
uniform mat4 proj;

uniform vec3 volumeSize;
uniform vec2 resolution;

uniform int frame;
uniform mat4 prevMv;

in vec3 vOrigin;
in vec3 vDirection;

//https://www.shadertoy.com/view/ttcSD8
#define BAYER_LIMIT 16
#define BAYER_LIMIT_H 4

// 4 x 4 Bayer matrix
const int bayerFilter[BAYER_LIMIT] = int[]
(
	 0,  8,  2, 10,
	12,  4, 14,  6,
	 3, 11,  1,  9,
	15,  7, 13,  5
);

bool writeToPixel(vec2 fragCoord, int iFrame)
{
    ivec2 iFragCoord = ivec2(fragCoord);
    int index = iFrame % BAYER_LIMIT;
    return (((iFragCoord.x + BAYER_LIMIT_H * iFragCoord.y) % BAYER_LIMIT)
            == bayerFilter[index]);
		
}

vec2 rayBoxDst(vec3 bmin, vec3 bmax, vec3 p, vec3 d) {
    vec3 t0 = (bmin - p) / d;
    vec3 t1 = (bmax - p) / d;
    vec3 tmin = min(t0, t1);
    vec3 tmax = max(t0, t1);

    float dstA = max(max(tmin.x, tmin.y), tmin.z);
    float dstB = min(tmax.x, min(tmax.y, tmax.z));

    float dstToBox = max(0.0, dstA);
    float dstInsideBox = max(0.0, dstB - dstToBox);
    return vec2(dstToBox, dstInsideBox);
}

// https://github.com/kbinani/colormap-shaders/blob/master/shaders/glsl/MATLAB_summer.frag
vec3 colormap(float x) {
    return vec3(clamp(x, 0.0, 1.0), clamp(0.5 * x + 0.5, 0.0, 1.0), 0.4);
}

// Sample the protein channel, local coordinates.
float sampleProtein(vec3 p) {
    return texture(volume, p/volumeSize + 0.5).r;
}

void main()
{
    vec3 rayDir = normalize( vDirection );
    if (writeToPixel(gl_FragCoord.xy, frame)) {
        vec2 boxDst = rayBoxDst(-0.5 * volumeSize, 0.5 * volumeSize, vOrigin, rayDir);

        // Render volume.
        vec3 rayPos = vOrigin + boxDst.x * rayDir;

        float stepSize = 0.5;
        vec4 totalColor = vec4(0.0f);
        for (float dist = 0.0; dist < boxDst.y; dist += stepSize) {
            float density = sampleProtein(rayPos);
            vec3 color = colormap(density);

            totalColor.rgb += density * (1.0 - totalColor.a) * color;
            totalColor.a += density * (1.0 - totalColor.a);
            rayPos += stepSize * rayDir;
        }

        FragColor = totalColor;
    } else {
        float depth = texture(volDepthTexture, gl_FragCoord.xy / resolution).r * 1000.0;
        vec4 ndc = 0.5 * (proj * prevMv * vec4(vOrigin + depth * rayDir, 1.0)) + 0.5;
        vec2 pUv = ndc.xy / ndc.w;
        FragColor = texture(lastFrame, pUv);
    }
}