precision highp float;
precision highp sampler2D;

varying vec2 vUv;
varying vec4 vPos;
varying float vTime;
varying float vTimeOffset;
varying float vSpeed;

float random(const in vec3 scale, const in float seed) {
  return fract(sin(dot(gl_FragCoord.xyz + seed, scale)) *43758.5453 + seed);
}

void main() {
  float time = vTime * vSpeed;

  float sin1 = (sin(time * vTimeOffset) + 1.0) / 2.0;
  float sin2 = (sin(time - vTimeOffset) + 1.0) / 2.0;
  float cos1 = (cos(time + vTimeOffset) + 1.0) / 2.0;

  float r = sin1;
  float g = cos1;
  float b = sin2;

  gl_FragColor = vec4(r, g, b, 1.0);

  float noise = 0.05 * random(vec3(1.0), length(gl_FragCoord));
  gl_FragColor.rgb += vec3(noise);
}
