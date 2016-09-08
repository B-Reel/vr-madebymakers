#extension GL_OES_standard_derivatives : enable

precision highp float;

attribute vec3 position;
attribute vec3 normal;
attribute vec2 aV2I;
attribute vec2 uv;

uniform mat4 modelViewMatrix;
uniform mat4 projectionMatrix;
uniform mat3 normalMatrix;
uniform mat4 modelMatrix;
uniform mat4 viewMatrix;
uniform float inflation;

varying vec4 vPos;
varying vec2 vUv;

varying mat3 vNormalMatrix;
varying vec4 vOPosition;
varying vec3 vU;
varying vec3 vSmoothNormal;

void main() {
  vec3 pos = position;

  vPos = vec4(pos, 1.0);
  vOPosition = modelViewMatrix * vPos;
  vU = normalize( vec3( modelViewMatrix * vPos ) );
  vNormalMatrix = normalMatrix;

  vSmoothNormal = normal;
  gl_Position = projectionMatrix * modelViewMatrix * vec4(pos + normal * inflation, 1.0);
}
