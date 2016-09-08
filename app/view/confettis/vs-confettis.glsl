uniform mat4 modelViewMatrix;
uniform mat4 projectionMatrix;
uniform float size;

attribute vec3 position;
attribute float scale;
attribute vec2 offset;
attribute vec3 color;

varying vec3 vColor;
varying vec2 vOffset;

void main(void) {
  vColor = color;
  vOffset = offset;

  vec4 mvPosition = modelViewMatrix * vec4(position, 1.0);

  gl_PointSize = size * (scale / -mvPosition.z);
  gl_Position = projectionMatrix * mvPosition;
}
