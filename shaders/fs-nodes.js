
varying vec2 vUv;
uniform sampler2D tPosition;  // Positions of every node
uniform sampler2D tForces;    // Forces from the edges
uniform float strength;

const float d_width = 1. / ${WIDTH}.;   // preproccessing command
const float d_height = 1. / ${HEIGHT}.; // to get texture width

void main() {
  
  vec4 pos = texture2D(tPosition, vUv);

  // test to make sure there is even a pixel
  // to deal with 
  if (pos.a > 0.5) {

    // Forces from the edges
    vec3 fl = texture2D(tForces, vUv).xyz;
    vec3 f = vec3(0.);
    
    // Creates a double loop to repel every node 
    // from every other node.
    for (float y = d_height * 0.5; y < 1.0; y += d_height) {
      if (texture2D(tPosition, vec2(0., y)).a > .5) {
        for (float x = d_width * 0.5; x < 1.0; x += d_width) {
          vec4 oPos = texture2D(tPosition, vec2(x, y));
          vec3 diff = pos.xyz - oPos.xyz;
          float a = length(diff) + 10.;
          f += oPos.a * diff / pow(a, 2.5);
        }
      }
    }
    // f = clamp(f, vec3(-2.5), vec3(2.5));
    vec3 newPos = pos.xyz + fl + f * strength;
    gl_FragColor = vec4(newPos.xyz, pos.a);

  // If there is no pixel in this location 
  // make sure it gets a full null pixel
  } else {
    gl_FragColor = vec4(0.);
  }
}

