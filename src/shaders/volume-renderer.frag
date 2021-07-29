#version 300 es

#ifdef GL_FRAGMENT_PRECISION_HIGH
precision highp float;
#else
precision mediump float;
#endif

out vec4 FragColor;

uniform lowp sampler3D volume;
uniform lowp sampler3D sdf;
uniform lowp sampler2D maxInfo;
uniform vec2 resolution;
uniform mat4 model;
uniform mat4 view;
uniform mat4 proj;
uniform vec3 volumeSize;
uniform bool renderIsosurface;
uniform bool renderVolume;
uniform float isovalue;

const float gamma = 0.5;

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
vec4 colormap(float x) {
    return vec4(clamp(x, 0.0, 1.0), clamp(0.5 * x + 0.5, 0.0, 1.0), 0.4, 1.0);
}

float f(vec3 p) {
    return texture(sdf, p).r * 100.0;
}

vec3 calcNormal(vec3 p) // for function f(p)
{
    vec3 h = 0.00005 * volumeSize; // replace by an appropriate value
    const vec2 k = vec2(1,-1);
    return normalize( k.xyy*f( p + k.xyy*h ) + 
                      k.yyx*f( p + k.yyx*h ) + 
                      k.yxy*f( p + k.yxy*h ) + 
                      k.xxx*f( p + k.xxx*h ) );
}

void main()
{
	// Get clip space position
	vec2 uv = 2.0 * gl_FragCoord.xy / resolution - 1.0;

	vec4 clipPos = vec4(uv.xy, 1.0, 1.0); // z=1.0 ist the near plane

	vec3 rayOrig = (inverse(view*model) * vec4(0.0, 0.0, 0.0, 1.0)).xyz;
	vec3 rayDir = normalize((inverse(view*model) * vec4((inverse(proj) * clipPos).xyz, 0.0)).xyz);

    vec2 boxDst = rayBoxDst(vec3(0.0), volumeSize, rayOrig, rayDir);
    rayOrig += boxDst.x * rayDir;

    float distInVolume = boxDst.y;

    vec4 surfaceColor = vec4(0.0, 0.0, 0.0, 1.0);
    vec4 volumeColor = vec4(0.0, 0.0, 0.0, 0.0);
    if (renderIsosurface) {
        vec3 rayPos = rayOrig;
        float dist = 0.0;
        while (dist < distInVolume) {
            // Simple sphere tracer.            
            float sdfVal = texture(sdf, rayPos / volumeSize).r * 255.0 / 10.0;
            
            if (sdfVal < 0.2) {
                vec3 normal = calcNormal(rayPos / volumeSize);
                float ldn = dot(normal, vec3(1.0, 0.0, 0.0));
                surfaceColor = vec4(0.5, 0.5, 0.5, 1.0) + 0.5 * vec4(ldn, ldn, ldn, 1.0);
                break;
            }

            dist += sdfVal;
            rayPos += sdfVal * rayDir;
        }
        distInVolume = dist;
    }

    if (renderVolume) {
        vec3 rayPos = rayOrig;
        float dist = 0.0;
        float stepSize = 0.5;
        float totalDensity = 0.0;

        float maxProxAmount = 0.0;

        bool inProximity = false;
        while (dist < distInVolume) {
            if (!inProximity) {
                float sdfVal = texture(sdf, rayPos / volumeSize).r * 255.0 / 10.0 - isovalue;
                
                if (sdfVal < 0.2) {
                    inProximity = true;
                } else {
                    dist += sdfVal;
                    rayPos += sdfVal * rayDir;
                }
            } else {
                float sdfVal = texture(sdf, rayPos / volumeSize).r * 255.0 / 10.0 - isovalue;
                if (sdfVal > 0.2) {
                    inProximity = false;
                    dist += sdfVal;
                    rayPos += sdfVal * rayDir;
                } else {
                    float density = texture(volume, rayPos / volumeSize).r;
                    totalDensity += density;

                    if (abs((rayPos.z / volumeSize.z) - texture(maxInfo, rayPos.xy / volumeSize.xy).g) < 0.02) {
                        maxProxAmount += 0.1;
                    }

                    dist += stepSize;
                    rayPos += stepSize * rayDir;
                }
            }
        }

        float absorption = 1.0 - exp(-totalDensity);
        volumeColor = mix(vec4(colormap(absorption).rgb, absorption), vec4(colormap(absorption).gbr, absorption), maxProxAmount);
    }

    FragColor = vec4(mix(surfaceColor.rgb, volumeColor.rgb, volumeColor.a), 1.0);
}