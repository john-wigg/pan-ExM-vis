in vec4 position;
uniform mat4 modelview;
uniform mat4 proj;
uniform vec3 cameraPos;
out vec3 vOrigin;
out vec3 vDirection;

void main() {
    vOrigin = vec3( inverse( modelview ) * vec4( 0.0, 0.0, 0.0, 1.0 ) ).xyz;
    vDirection = position.xyz - vOrigin;
    gl_Position = proj * modelview * position;
}