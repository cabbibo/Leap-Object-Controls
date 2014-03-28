var ForceDirectedGraph;
(function () {
  
  ForceDirectedGraph = function (renderer, vertextShaderText, fragmentShaderText, nodeCount, edges) {
    this.renderer = renderer;
    this.nodeCount = nodeCount;
    this.edgeCount = edges;

    this.copyScene = null;
    this.copyMaterial = null;
    this.setupCopyShader();

    this.camera = new THREE.Camera();
    this.camera.position.z = 1;
    
    var dims = getTextureSize(nodeCount);
    this.dims = dims;
    this.rt0 = getRenderTarget(dims[0], dims[1]);
    this.rt1 = this.rt0.clone();
    this.copyTexture(getRandomTexture(dims[0], dims[1]), this.rt0);
    // this.copyTexture(this.rt0, this.rt1);
    this.rtIdx = 0;
    
    this.setupForcesShader(vertextShaderText, fragmentShaderText);
  }
  
  var Proto = ForceDirectedGraph.prototype;
  
  Proto.populateEdgeGeometry = function () {
    var i;
    var pos = this.geometry.attributes.position.array;
    var node_ids = this.geometry.attributes.node_indecies.array;
    
    for (i = 0; i < pos.length; i++) {
      pos[i] = Math.random() * 200;
    }
    var dims = getTextureSize(this.nodeCount);
    
    for (i = 0; i < node_ids.length; i+=2) {
      node_ids[i] = Math.floor(Math.random() * dims[0]) * (1 / this.nodeCount);
      node_ids[i+1] = Math.floor(Math.random() * dims[1]) * (1 / this.nodeCount);
    }
  };
  
  Proto.computeForces = function () {
    var input, output;
    if (this.rtIdx) {
      input = this.rt0;
      output = this.rt1;
    } else {
      input = this.rt1;
      output = this.rt0;
    }
    this.rtIdx = (this.rtIdx || 2) - 1;
    
    this.forceMaterial.uniforms.texture1.value = input;
    this.renderer.setSize(this.dims[0], this.dims[1]);
    this.renderer.render(this.forceScene, this.camera, output);
  }
  
  Proto.copyTexture = function(input, output) {
    this.copyMaterial.uniforms.texture.value = input;
    this.renderer.render(this.copyScene, this.camera, output)
    this.output = output;
  };
  
  Proto.setupForcesShader = function (vertextShaderText, fragmentShaderText) {
    
    this.geometry = new THREE.BufferGeometry();
    this.geometry.addAttribute('position', Float32Array, this.edgeCount, 3);
    this.geometry.addAttribute('node_indecies', Float32Array, this.edgeCount, 4);
    this.populateEdgeGeometry();
    
    this.forceMaterial = new THREE.ShaderMaterial({
      attributes: {
        node_indecies: { type: 'v4', value: null }
      },
      uniforms: {
        texture1: { type: "t", value: null }
      },
      vertexShader: vertextShaderText,
      fragmentShader: fragmentShaderText
    });

    this.forceScene = new THREE.Scene();
  
    var mesh = new THREE.Mesh(this.geometry, this.forceMaterial);
    this.forceScene.add(mesh);
  }
  
  Proto.setupCopyShader = function () {
    var vs = [
      'varying vec2 vUv;',
  		'void main() {',
      '  vUv = uv;',
  		'  gl_Position = vec4(position, 1.0);',
  		'}'
    ].join('\n');
    
    var fs = [
  		'uniform sampler2D texture;',
      'varying vec2 vUv;',
  		'void main() {',
  		'  gl_FragColor = texture2D(texture, vUv);',
  		'}'
    ].join('\n');

    this.copyScene = new THREE.Scene();
    this.copyMaterial = new THREE.ShaderMaterial({
      uniforms: {
        texture: { type: "t", value: null },
      },
      vertexShader: vs,
      fragmentShader: fs
    });
  
    var mesh = new THREE.Mesh(new THREE.PlaneGeometry(2, 2), this.copyMaterial);
    this.copyScene.add(mesh);
  };
  
  function getRenderTarget(width, height) {
    var renderTarget = new THREE.WebGLRenderTarget(width, height, {
      wrapS: THREE.RepeatWrapping,
      wrapT: THREE.RepeatWrapping,
      minFilter: THREE.NearestFilter,
      magFilter: THREE.NearestFilter,
      format: THREE.RGBAFormat,
      type: THREE.FloatType,
      stencilBuffer: false
    });

    return renderTarget;
  }

	function getRandomTexture(w, h) {
		var x, y, z, l = w * h;
		var a = new Float32Array(l * 4);
		for (var k = 0; k < l; k++) {      
			x = Math.random() * 2 - 1;
			y = Math.random() * 2 - 1;
			z = Math.random() * 2 - 1;
      
			a[k*4 + 0] = x * 100;
			a[k*4 + 1] = y * 100;
			a[k*4 + 2] = z * 100;
      a[k*4 + 3] = 1;
		}
    
    var texture = new THREE.DataTexture(a, w, h, THREE.RGBAFormat, THREE.FloatType);
		texture.minFilter = THREE.NearestFilter;
		texture.magFilter = THREE.NearestFilter;
		texture.needsUpdate = true;
		texture.flipY = false;
		
		return texture;
	}
  
  function getTextureSize(num) {
    var w = 1, h = 1;
    
    while (h * w < num) {
      w *= 2;
      if (h * w >= num) break;
      h *= 2;
    }
    console.log(w, h, num, (w*h), (w*h)/num);
    return [w, h];
  }
  
  // function p2(n) {
  //   return Math.ceil(Math.log(n)/Math.log(2));
  // }
}());