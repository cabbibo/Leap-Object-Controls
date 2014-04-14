
  uniform sampler2D texture1;
  uniform float firstVertex;
  uniform float density;
    
  attribute vec4 color;
    
  varying vec3 vForce;

  void main() {

    vec3 pos1 = texture2D(texture1, color.xy).xyz;  // Pos of first node
    vec3 pos2 = texture2D(texture1, color.zw).xyz;  // Pos of second node

    gl_PointSize = 1.0;

    // Renders a the force of a node to that nodes position
    // on a texture ( can only render 1 force at a time ).
    if (firstVertex > 0.5) {
      vForce = (density * (pos2 - pos1));
      gl_Position = vec4(color.x * 2. - 1., color.y * 2. - 1., 0., 1.);
    } else {
      vForce = (density * (pos1 - pos2));
      gl_Position = vec4(color.z * 2. - 1., color.w * 2. - 1., 0., 1.);
    }

  }

