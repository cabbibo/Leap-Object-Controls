  
  uniform sampler2D tPosition;
  uniform vec3 fPos; // Finger Position
  
  varying float vDistance;
  varying vec3 vColor;
  
  attribute vec2 color;
  
  void main(){
    
    vec4 pos  = vec4( texture2D(tPosition, color.xy).xyz, 1.0 );
    vDistance = length(fPos.xyz - pos.xyz);

    // Shows accurate from and too colors
    vColor = mix(vec3(1.,0.3,0.3), vec3(0.3,0.3,1.), position.x);
  	
    vec4 mvPosition = modelViewMatrix * pos;
  	gl_Position = projectionMatrix * mvPosition;

  }
