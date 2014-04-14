uniform vec3 fPos;
uniform sampler2D tPosition;

varying vec2 vUv;

const float d_width = 1. / ${WIDTH}.;
const float d_height = 1. / ${HEIGHT}.;

void main()	{

  float minDist = 10000000000000.;
  vec2 minCoords = vec2(0.);
  
  for (float y = d_height * 0.5; y < 1.0; y += d_height) {
    
    if (texture2D(tPosition, vec2(0., y)).a > .5) {
      
      for (float x = d_width * 0.5; x < 1.0; x += d_width) {
        
        vec4 pos = texture2D(tPosition, vec2(x, y));
        float dist = length(pos.xyz - fPos.xyz);
        
        if (dist < minDist) {
          minDist = dist;
          minCoords = vec2(x, y);
        }

      }

    }

  }
  gl_FragColor = vec4(minCoords.x, minCoords.y, 0., 0.);
}
