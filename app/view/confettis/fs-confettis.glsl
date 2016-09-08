precision highp float;

uniform sampler2D map;
uniform vec2 repeat;

varying vec3 vColor;
varying vec2 vOffset;

void main(void) {
  vec2 uv = vec2(gl_PointCoord.x, 1.0 - gl_PointCoord.y);
  vec2 offsetedUv = uv * repeat + vOffset;

  vec4 textureColor = texture2D(map, offsetedUv);
  textureColor.rgb *= vColor;

  gl_FragColor = textureColor;
}
