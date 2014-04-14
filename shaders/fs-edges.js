
  varying vec3 vForce; // Passes in the force for the edge
  
  void main() {
    gl_FragColor = vec4(vForce, 1.);
  }
