var SimulatorRenderer;
(function () {

  var DT2 = 0.1;
  // var BB_POWER = 106.7999;
  var BB_POWER = 1;
  
  SimulatorRenderer = function(WIDTH, HEIGHT, renderer, vertexShader, fragmentShader) {
    // webgl renderer
    WIDTH = WIDTH || 4;
    HEIGHT = HEIGHT || 4;
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

    fragmentShader = fragmentShader.replace(/\$\{WIDTH\}/g, WIDTH);
    fragmentShader = fragmentShader.replace(/\$\{HEIGHT\}/g, HEIGHT);
    fragmentShader = fragmentShader.replace(/\$\{DT2\}/g, DT2);
  	var simulatorMaterial = new THREE.ShaderMaterial( {
  		uniforms: {
  			min_dist: { type: "f", value: 0.0 },
  			texture1: { type: "t", value: null },
  			texture2: { type: "t", value: null },
  		},
  		vertexShader: vertexShader,
  		fragmentShader: fragmentShader
  	});
    

    var scene = new THREE.Scene();

    var uniforms = {
      time: { type: "f", value: 1.0 },
      texture: { type: "t", value: null },
    };

    var material = new THREE.ShaderMaterial({
      uniforms: uniforms,
      vertexShader: document.getElementById( 'vertexShader' ).textContent,
      fragmentShader: document.getElementById( 'fragmentShader' ).textContent
    });
  
  
    var geometry = new THREE.PlaneGeometry( 2, 2 );

    var mesh = new THREE.Mesh( geometry, material );

    scene.add( mesh );
    
    

    this.getRenderTarget = function() {
      var renderTarget = new THREE.WebGLRenderTarget(WIDTH, HEIGHT, {
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

    this.copyTexture = function(input, output) {
      uniforms.texture.value = input;

      renderer.render(scene, camera, output);
      this.output = output;
    }

    this.renderStep = function(material, t1, t2, output) {
      mesh.material = material;
      material.uniforms.texture1.value = t1;
      material.uniforms.texture2.value = t2;
      renderer.render(scene, camera, output);
      this.output = output;
    }
    
		var rt0 = this.getRenderTarget();
		var rt1 = rt0.clone();
		var rt2 = rt0.clone();

		this.copyTexture(generateDataTexture(0), rt0);
    this.copyTexture(generateDataTexture(13.7), rt1);
    
    var flipflop = 0, renderCount = 1;
    this.simulate = function () {
      
      // if (renderCount++ < 100) {
      //   simulatorMaterial.uniforms.min_dist.value = 0.08;
      // } else {
      //   simulatorMaterial.uniforms.min_dist.value = 1;
      // }
      renderCount += 0.5;
      simulatorMaterial.uniforms.min_dist.value = Math.min(renderCount/200, 1);
      
      switch(flipflop) {
      case 0:
        this.renderStep(simulatorMaterial, rt0, rt1, rt2);
        break;
      case 1:
        this.renderStep(simulatorMaterial, rt1, rt2, rt0);
        break;
      case 2:
        this.renderStep(simulatorMaterial, rt2, rt0, rt1);
        break;
      }
			flipflop = (flipflop+1) % 3;
    }
    
    // for (var sc = 0; sc < 100; sc++) this.simulate();
    // simulatorMaterial.uniforms.min_dist.value = 0.01;
  }
  
	function generateDataTexture(R) {
		var x, y, z;
		var w = WIDTH, h = HEIGHT;
		var a = new Float32Array(PARTICLES * 4);
		for (var k = 0; k < PARTICLES; k++) {
      
      var sq = 2;
      while (sq > 1) {
				x = Math.random() * 2 - 1;
				y = Math.random() * 2 - 1;
				z = Math.random() * 2 - 1;
        sq = Math.sqrt(x*x + y*y + z*z);
      }
      
			a[ k*4 + 0 ] = x*R;
			a[ k*4 + 1 ] = y*R;
			a[ k*4 + 2 ] = z*R;
      // a[ k*4 + 3 ] = 1;
      a[ k*4 + 3 ] = norm(4) * 0.99 + 0.01;
		}
    
    function norm(i) {
      var s = 0;
      for (var j = 0; j < i; j++) {
        s += Math.random();
      }
      return s / i;
    }

		var texture = new THREE.DataTexture( a, WIDTH, HEIGHT, THREE.RGBAFormat, THREE.FloatType );
		texture.minFilter = THREE.NearestFilter;
		texture.magFilter = THREE.NearestFilter;
		texture.needsUpdate = true;
		texture.flipY = false;
		console.log(texture);

		return texture;

	}
}());