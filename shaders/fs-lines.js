
  varying float vDistance;
  varying vec3 vColor;

  void main(){
    
    gl_FragColor = vec4( vColor, 0.5 );
    //gl_FragColor.a *= max( 0.3 , (1.0 - vDistance/200.0 ) );
  }
