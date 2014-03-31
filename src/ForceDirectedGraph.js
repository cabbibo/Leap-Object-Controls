var ForceDirectedGraph;
(function () {
  
  ForceDirectedGraph = function (renderer, vertextShaderText, fragmentShaderText, posFS, nodeCount, edges) {
    this.renderer = renderer;
    this.nodeCount = nodeCount;
    this.edges = edges;
    this.edgeCount = edges.length || edges;

    this.copyScene = null;
    this.copyMaterial = null;
    this.setupCopyShader();

    this.camera = new THREE.Camera();
    this.camera.position.z = 1;
    
    var dims = getTextureSize(nodeCount);
    this.setDimensions(dims[0], dims[1]);
    
    this.rt0 = getRenderTarget(dims[0], dims[1]);
    this.rt1 = this.rt0.clone();
    this.rt2 = this.rt0.clone();
    this.copyTexture(getRandomTexture(dims[0], dims[1], this.nodeCount), this.rt0);
    this.copyTexture(this.rt0, this.rt1);
    this.rtIdx = true;
    this.setupForcesShader(vertextShaderText, fragmentShaderText);
    this.setupPositionShader(posFS);

    if (this.edges.length) {
      this.populateEdgeGeometry();
    } else {
      this.generateRandomEdges();
    }
  }
  
  var Proto = ForceDirectedGraph.prototype;
  
  Proto.computeForces = function () {
    var input;
    if (this.rtIdx) {
      input = this.rt0;
    } else {
      input = this.rt1;
    }
    
    this.forceMaterial.uniforms.texture1.value = input;
    
    this.forceMaterial.uniforms.firstVertex.value = 1;
    this.renderer.render(this.forceScene, this.camera, this.rt2, false);

    this.renderer.autoClear = false;
    this.forceMaterial.uniforms.firstVertex.value = 0;
    this.renderer.render(this.forceScene, this.camera, this.rt2, false);
    this.renderer.autoClear = true;
  }
  
  Proto.updatePositions = function () {
    var input, output;
    if (this.rtIdx) {
      input = this.rt0;
      output = this.rt1;
    } else {
      input = this.rt1;
      output = this.rt0;
    }
    this.rtIdx = !this.rtIdx;

    this.positionMaterial.uniforms.tPosition.value = input;
    this.positionMaterial.uniforms.tForces.value = this.rt2;
    this.renderer.render(this.positionScene, this.camera, output);
    this.output = output;
  }
  
  Proto.renderNodes = function () {
    
  }
  
  Proto.renderEdges = function () {
    
  }
  
  Proto.copyTexture = function(input, output) {
    this.copyMaterial.uniforms.texture.value = input;
    this.renderer.render(this.copyScene, this.camera, output)
  };
  
  Proto.setupPositionShader = function (fragmentShader) {
    var vs = [
      'varying vec2 vUv;',
  		'void main() {',
      '  vUv = uv;',
  		'  gl_Position = vec4(position, 1.0);',
  		'}'
    ].join('\n');

    fragmentShader = fragmentShader.replace(/\$\{WIDTH\}/g, this.tWidth);
    fragmentShader = fragmentShader.replace(/\$\{HEIGHT\}/g, this.tHeight);

    this.positionScene = new THREE.Scene();
    this.positionMaterial = new THREE.ShaderMaterial({
      uniforms: {
        tPosition: { type: "t", value: null },
        tForces: { type: "t", value: null },
        strength: { type: 'f', value: 200 }
      },
      vertexShader: vs,
      fragmentShader: fragmentShader
    });
  
    var mesh = new THREE.Mesh(new THREE.PlaneGeometry(2, 2), this.positionMaterial);
    // mesh.position.x = 0.5;
    // mesh.position.y = 0.5;
    this.positionScene.add(mesh);
  }
  
  Proto.setupForcesShader = function (vertextShaderText, fragmentShaderText) {
    this.geometry = new THREE.BufferGeometry();
    this.geometry.addAttribute('position', Float32Array, this.edgeCount, 3);
    this.geometry.addAttribute('color', Float32Array, this.edgeCount, 4);
    
    this.forceMaterial = new THREE.ShaderMaterial({
      attributes: {
        color: { type: 'v4', value: null }
      },
      uniforms: {
        firstVertex: { type: 'f', value: 1 },
        density: { type: 'f', value: 0.01 },
        texture1: { type: 't', value: null }
      },
      transparent: true,
      blending: THREE.AdditiveBlending,
      depthWrite: false, depthTest: false,
      vertexShader: vertextShaderText,
      fragmentShader: fragmentShaderText
    });

    this.forceScene = new THREE.Scene();
  
    var mesh = new THREE.ParticleSystem(this.geometry, this.forceMaterial);
    
    this.forceScene.add(mesh);
  }
  
  Proto.setDimensions = function (w, h) {
    this.tWidth = w;
    this.tHeight = h;
    this.twInv = 1 / w;
    this.thInv = 1 / h;
    this.twOff = 1 / (w * 2);
    this.thOff = 1 / (h * 2);
  }
  
  Proto.populateEdgeGeometry = function () {
    var node_ids = this.geometry.attributes.color.array;
    
    for (i = 0; i < this.edges.length; i+=2) {
      var n1 = this.getIndecies(this.edges[i])
      var n2 = this.getIndecies(this.edges[i+1]);
      node_ids[i*4+0] = n1.x;
      node_ids[i*4+1] = n1.y;
      node_ids[i*4+2] = n2.x;
      node_ids[i*4+3] = n2.y;
    }
    this.edges = null;
  }
  
  Proto.getIndecies = function (nodeId) {
    var out = {x: (nodeId % this.tWidth) * this.twInv + this.twOff,
                y: Math.floor(nodeId / this.tWidth) * this.thInv + this.thOff};
    // console.log(nodeId)
    // console.log(out.x, out.y)
    return out;
  }
  
  Proto.generateRandomEdges = function () {
    var i;
    var node_ids = this.geometry.attributes.color.array;
    for (i = 0; i < node_ids.length; i += 2) {
      var n = this.getIndecies(Math.floor(Math.random() * this.nodeCount));
      node_ids[i] = n.x;
      node_ids[i+1] = n.y
    }
  };
  
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

	function getRandomTexture(w, h, c) {
		var x, y, z, l = w * h;
		var a = new Float32Array(l * 4);
		for (var k = 0; k < c; k++) {      
			x = Math.random() * 20 - 10;
			y = Math.random() * 20 - 10;
			z = Math.random() * 20 - 10;
      
			a[k*4 + 0] = x;
			a[k*4 + 1] = y;
			a[k*4 + 2] = z;
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