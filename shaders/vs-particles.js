  
  uniform float size;
  uniform float scale;
  uniform vec3  fPos;
  uniform sampler2D tPosition;
  
  varying float vDistance;
  
  void main(){
    
    vec3 pos = texture2D(tPosition, position.xy).xyz;
    vDistance = length( pos - fPos );
    
    vec4 mvPosition = modelViewMatrix * vec4( pos , 1.0 );
    
    //gl_PointSize = size * (scale / length(mvPosition.xyz));
    
    gl_PointSize = size;
    gl_Position = projectionMatrix * mvPosition;
  
  }
