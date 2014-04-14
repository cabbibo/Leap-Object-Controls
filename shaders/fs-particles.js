varying float vDistance;
uniform sampler2D map;
void main(){
  gl_FragColor = texture2D(map, vec2(gl_PointCoord.x, 1.0 - gl_PointCoord.y));
  //gl_FragColor.a *= max( 0.3 , (1.0 - vDistance/200.0 ) );
}

