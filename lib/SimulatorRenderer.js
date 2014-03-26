// SimulationShader
function SimulatorRenderer(WIDTH, renderer) {
	// webgl renderer
	WIDTH = WIDTH || 4;
	var camera = new THREE.Camera();
	camera.position.z = 1;


	// Init RTT stuff
	gl = renderer.getContext();

	if( !gl.getExtension( "OES_texture_float" )) {
		alert( "No OES_texture_float support for float textures!" );
		return;
	}

	if( gl.getParameter(gl.MAX_VERTEX_TEXTURE_IMAGE_UNITS) == 0) {
		alert( "No support for vertex shader textures!" );
		return;
	}


	var scene = new THREE.Scene();


	var uniforms = {
		time: { type: "f", value: 1.0 },
		resolution: { type: "v2", value: new THREE.Vector2(WIDTH, WIDTH) },
		texture: { type: "t", value: null },
		// Inputs
	};

	var material = new THREE.ShaderMaterial( {

		uniforms: uniforms,
		vertexShader: document.getElementById( 'vertexShader' ).textContent,
		fragmentShader: document.getElementById( 'fragmentShader' ).textContent
	} );

	var mesh = new THREE.Mesh( new THREE.PlaneGeometry( 2, 2 ), material );

	scene.add( mesh );

	this.getRenderTarget = function() {
		var renderTarget = new THREE.WebGLRenderTarget(WIDTH, WIDTH, {
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

	// this.render2 = function(renderer) {
	// 	mesh.material = material2;
	// 	uniforms.texture.value = renderTarget;
	// 	// mesh.material.needsUpdate = true;
	// 	renderer.render(scene, camera, renderTarget2, false);
	// 	this.target = renderTarget2;
	// }

	// this.render3 = function(renderer) {
	// 	uniforms.texture.value = renderTarget2;
	// 	renderer.render(scene, camera, renderTarget, false);
	// 	this.target = renderTarget;
	// }

	// passThroughRender(input, target)
	// Takes a texture, and render out as another texture
	// aka. renderToTexture()

	this.copyTexture = function(input, output) {
		uniforms.texture.value = input;

		renderer.render(scene, camera, output)
		this.output = output;
	}

	this.renderStep = function(material, t1, t2, output) {
		mesh.material = material;
		material.uniforms.texture1.value = t1;
		material.uniforms.texture2.value = t2;
		renderer.render(scene, camera, output);
		this.output = output;
	}

  // this.renderPosition = function(position, velocity, output) {
  //   mesh.material = positionShader;
  //   positionShader.uniforms.texturePosition.value = position;
  //   positionShader.uniforms.textureVelocity.value = velocity;
  //   renderer.render(scene, camera, output);
  //   this.output = output;
  // }
  // 
  // this.renderVelocity = function(position, velocity, output) {
  //   mesh.material = velocityShader;
  //   velocityShader.uniforms.texturePosition.value = position;
  //   velocityShader.uniforms.textureVelocity.value = velocity;
  //   velocityShader.uniforms.time.value = performance.now();
  //   // Date
  //   renderer.render(scene, camera, output);
  //   this.output = output;
  // }

	/*

	ShaderNode.clearInputs();
	ShaderNode.addInput(TextureNode1);
	ShaderNode.addInput(TextureNode2);
	setInput(t1, t2)
	ShaderNode.setOutput(TextureNode3);

	TextureNode {
		id:,
		texture: 
	}

	*/

}