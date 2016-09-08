#extension GL_OES_standard_derivatives : enable

precision highp float;
precision highp sampler2D;

uniform sampler2D textureMap;
uniform sampler2D normalMap;
uniform float opacity;

varying vec4 vPos;

varying mat3 vNormalMatrix;
varying vec4 vOPosition;
varying vec3 vU;
varying vec3 vSmoothNormal;

float random(vec3 scale,float seed){return fract(sin(dot(gl_FragCoord.xyz+seed,scale))*43758.5453+seed);}

void main() {
  vec3 fdx = dFdx( vPos.xyz );
  vec3 fdy = dFdy( vPos.xyz );
  vec3 n = normalize(cross(fdx, fdy));
  n = vSmoothNormal;

  vec3 vNormal = vNormalMatrix * n;
  vec3 vONormal = n;

  vec3 c1 = vec3(1.0, 1.0, 1.0);

  vec3 color = vec3( .0, .0, .0 );
  vec2 texScale = vec2(1.0);
  float normalScale = 0.0;
  float useSSS = 1.0;
  float useScreen = 2.0;

  //    vec3 n = normalize( vONormal.xyz );
  vec3 blend_weights = abs( n );
  blend_weights = ( blend_weights - 0.2 ) * 7.;
  blend_weights = max( blend_weights, 0. );
  blend_weights /= ( blend_weights.x + blend_weights.y + blend_weights.z );

  vec2 coord1 = vPos.yz * texScale;
  vec2 coord2 = vPos.zx * texScale;
  vec2 coord3 = vPos.xy * texScale;

  vec3 bump1 = texture2D( normalMap, coord1 ).rgb;
  vec3 bump2 = texture2D( normalMap, coord2 ).rgb;
  vec3 bump3 = texture2D( normalMap, coord3 ).rgb;

  vec3 blended_bump = bump1 * blend_weights.xxx + bump2 * blend_weights.yyy + bump3 * blend_weights.zzz;

  vec3 tanX = vec3( vNormal.x, -vNormal.z, vNormal.y);
  vec3 tanY = vec3( vNormal.z, vNormal.y, -vNormal.x);
  vec3 tanZ = vec3(-vNormal.y, vNormal.x, vNormal.z);
  vec3 blended_tangent = tanX * blend_weights.xxx + tanY * blend_weights.yyy + tanZ * blend_weights.zzz;

  vec3 normalTex = blended_bump * 2.0 - 1.0;
  normalTex.xy *= normalScale;
  normalTex.y *= -1.;
  normalTex = normalize( normalTex );
  mat3 tsb = mat3( normalize( blended_tangent ), normalize( cross( vNormal, blended_tangent ) ), normalize( vNormal ) );
  vec3 finalNormal = tsb * normalTex;

  vec3 r = reflect( normalize( vU ), normalize( finalNormal ) );
  float m = 2.0 * sqrt( r.x * r.x + r.y * r.y + ( r.z + 1.0 ) * ( r.z + 1.0 ) );
  vec2 calculatedNormal = vec2( r.x / m + 0.5,  r.y / m + 0.5 );

  vec3 base = texture2D( textureMap, calculatedNormal ).rgb;

  float rim = 1.75 * max( 0., abs( dot( normalize( vNormal ), normalize( -vOPosition.xyz ) ) ) );
  base += useSSS * color * ( 1. - .75 * rim );
  base += ( 1. - useSSS ) * 10. * base * color * clamp( 1. - rim, 0., .15 );

  if( useScreen == 1. ) {
    base = vec3( 1. ) - ( vec3( 1. ) - base ) * ( vec3( 1. ) - base );
  }

  float nn = .05 * random( vec3( 1. ), length( gl_FragCoord ) );
  base += vec3( nn );

  gl_FragColor = vec4(base.rgb, opacity);
}
