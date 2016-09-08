precision highp float;

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
  float alpha = map(vProgress, 0.5, 1.0, 1.0, 0.0);

  gl_FragColor = vec4(vTint, vInfluence);
  gl_FragColor.a *= alpha;
}
