precision highp float;

attribute float influence;
attribute vec3 position;
attribute vec3 tint;

uniform mat4 projectionMatrix;
uniform mat4 modelViewMatrix;
uniform float progress;

varying float vInfluence;
varying vec3 vTint;
varying float vProgress;

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
  vInfluence = influence;
  vTint = tint;
  vProgress = progress;

  vec3 finalPosition = position;
  finalPosition *= map(progress, 0.0, 1.0, 0.0, 1.0);

  gl_Position = projectionMatrix * modelViewMatrix * vec4(finalPosition, 1.0);
}
