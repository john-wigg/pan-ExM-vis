precision highp float;
precision highp sampler3D;

out vec4 FragColor;

uniform sampler3D volume;
uniform sampler3D sdf;
uniform sampler2D maxInfo;
uniform sampler2D draw;
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

vec4 matlab_spring(float x) {
    return vec4(1.0, clamp(x, 0.0, 1.0), clamp(1.0 - x, 0.0, 1.0), 1.0);
}

float f(vec3 p) {
    return texture(sdf, p).r * 255.0 / 10.0 - 5.0;
}

void calcNormalAndCurv(vec3 p, out vec3 normal, out float curv) // for function f(p)
{
    float h = 2.0; 
    vec2 k = h * vec2(1., 0.);

    float t1 = f(p + k.xyy/volumeSize); float t2 = f(p - k.xyy/volumeSize);
    float t3 = f(p + k.yxy/volumeSize); float t4 = f(p - k.yxy/volumeSize);
    float t5 = f(p + k.yxx/volumeSize); float t6 = f(p - k.yxx/volumeSize);

    curv = (t1+t2+t3+t4+t5+t6-6.0*f(p))/(h*h);
    normal = normalize(k.xyy * (t1-t2) + k.yxy * (t3-t4) + k.yyx * (t5-t6));
}

void main()
{
    vec2 uv = gl_FragCoord.xy / resolution;
    FragColor = texture(volume, vec3(uv, 0.5));
    return;

    
	// Get clip space position
	//vec2 uv = 2.0 * gl_FragCoord.xy / resolution - 1.0;

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
            float sdfVal = f(rayPos / volumeSize);
            
            if (sdfVal < 0.01) {
                float curv;
                vec3 normal;
                calcNormalAndCurv(rayPos / volumeSize, normal, curv);
                float ldn = dot(normal, vec3(1.0, 0.0, 0.0));
                //surfaceColor = vec4(1.0, 1.0 - 0.5*abs(-curv), 1.0 - 0.5*abs(-curv), 1.0);
                surfaceColor = mix(vec4(0.0, 0.0, 0.0, 1.0), vec4(1.0, 1.0, 1.0, 1.0), 0.5 + 0.5 * ldn);
                break;
            }

            dist += sdfVal;
            rayPos += sdfVal * rayDir;
        }
        distInVolume = min(dist, boxDst.y);
    }

    if (renderVolume) {
        vec3 rayPos = rayOrig;
        float dist = 0.0;
        float stepSize = 0.5;
        float totalDensity = 0.0;
        vec4 totalColor = vec4(0.0);

        bool inProximity = false;
        while (dist < distInVolume) {
            if (!inProximity) {
                float sdfVal = f(rayPos / volumeSize) - isovalue;
                
                if (sdfVal < 0.01) {
                    inProximity = true;
                } else {
                    dist += sdfVal;
                    rayPos += sdfVal * rayDir;
                }
            } else {
                float sdfVal = f(rayPos / volumeSize) - isovalue;
                if (sdfVal > 0.01) {
                    inProximity = false;
                    dist += sdfVal;
                    rayPos += sdfVal * rayDir;
                } else {
                    // Actually sample volume.
                    float density = texture(volume, rayPos / volumeSize).r;

                    vec3 uvw = rayPos / volumeSize;
                    float distanceToMaximum = clamp(1.0 - abs(uvw.z - texture(maxInfo, uvw.xy).g) / 0.025, 0.0, 1.0);
                    float selectionMask = texture(draw, uvw.xy).r;

                    float highlight = distanceToMaximum * selectionMask;
                    vec4 color = mix(colormap(density), 5.0 * matlab_spring(density), highlight);

                    totalColor = totalColor + density * color * (1.0 - totalDensity);
                    totalDensity = totalDensity + density * (1.0 - totalDensity);

                    dist += stepSize;
                    rayPos += stepSize * rayDir;
                }
            }
        }
        volumeColor = vec4(totalColor.rgb, totalDensity);
    }

    FragColor = vec4(mix(surfaceColor.rgb, volumeColor.rgb, volumeColor.a), 1.0);
}