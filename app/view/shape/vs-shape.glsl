precision highp float;

attribute vec3 position;
attribute vec3 normal;
attribute vec2 uv;

uniform mat4 modelViewMatrix;
uniform mat4 projectionMatrix;
uniform mat3 normalMatrix;
uniform mat4 modelMatrix;
uniform mat4 viewMatrix;

uniform float time;
uniform float timeOffset;
uniform float speed;
uniform vec2 growFromTo;

varying vec4 vPos;
varying vec2 vUv;
varying float vTime;
varying float vTimeOffset;
varying float vSpeed;

float map(const in float value, const in float inMin, const in float inMax, const in float outMin, const in float outMax) {
  if(value < inMin) {
    return outMin;
  }

  if(value > inMax) {
    return outMax;
  }

  return (value - inMin) / (inMax - inMin) * (outMax - outMin) + outMin;
}

void main() {
  vPos = vec4(position, 1.0);
  vUv = uv;
  vTime = time;
  vTimeOffset = timeOffset;
  vSpeed = speed;

  vec4 finalPosition = vec4(position * map(sin(time * timeOffset * speed), -1.0, 1.0, growFromTo.x, growFromTo.y), 1.0);

  gl_Position = projectionMatrix * modelViewMatrix * finalPosition;
}
