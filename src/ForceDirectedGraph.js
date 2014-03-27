var ForceDirectedGraph;
(function () {
  
  ForceDirectedGraph = function (vertextShaderText, fragmentShaderText, nodeCount, edges) {
    this.nodeCount = nodeCount;
    this.edgeCount = edges;
  
    this.geometry = new THREE.BufferGeometry();
    this.geometry.addAttribute('position', Float32Array, edges, 3);
    this.geometry.addAttribute('node_indecies', Float32Array, edges, 4);
    this.populateEdgeGeometry();
        
    this.material = new THREE.ShaderMaterial({
      attributes: {
        node_indecies: {type: 'vec4', value: null}
      }
      uniforms: {
        time: { type: "f", value: 1.0 },
        texture1: { type: "t", value: null },
        texture2: { type: "t", value: null },
      },
      vertexShader: vertextShaderText,
      fragmentShader: fragmentShaderText
    });
  }
  
  var Proto = ForceDirectedGraph.prototype;
  
  Proto.populateEdgeGeometry = function () {
    var i;
    var pos = this.geometry.attributes.position.value;
    var node_ids = this.geometry.attributes.node_indecies.value;
    
    for (i = 0; i < pos.length; i++) {
      pos[i] = Math.random() * 200;
    }
    
    for (i = 0; i < node_ids.length; i++) {
      node_ids[i] = Math.floor(Math.random() * this.nodeCount) * (1 / this.nodeCount);
    }
  };
  
}());