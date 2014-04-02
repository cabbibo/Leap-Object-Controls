var GpuMaterial;

(function () {
  var _precision = "highp";
  
  GpuMaterial = function (parameters) {
    THREE.Material.call( this );

  	this.fragmentShader = "void main() {}";
  	this.vertexShader = "void main() {}";
  	this.uniforms = {};
    

  	this.vertexColors = THREE.NoColors; // set to use "color" attribute stream

  	this.setValues( parameters );

    this.index0AttributeName = "position";
    this.needsUpdate = false;
    
    this.initMaterial();
  }
  
  GpuMaterial.prototype = Object.create(THREE.Material.prototype);

  GpuMaterial.prototype.clone = function () {
  	var material = new GpuMaterial();
  	THREE.Material.prototype.clone.call( this, material );
  }
  
  
  GpuMaterial.prototype.initMaterial = function() {
    // this.addEventListener( 'dispose', onMaterialDispose );
    
    var parameters = [];
    
		this.program = buildProgram( null, this.fragmentShader, this.vertexShader, this.uniforms, this.attributes, this.defines, parameters, this.index0AttributeName );
		var attributes = this.program.attributes;
		this.uniformsList = [];
		for ( var u in this.uniforms ) {

			this.uniformsList.push( [ this.uniforms[ u ], u ] );

		}
  }
  
  
	function buildProgram ( shaderID, fragmentShader, vertexShader, uniforms, attributes, defines, parameters, index0AttributeName ) {

		var p, pl, d, program, code;
		var chunks = [];

		// Generate code

		if ( shaderID ) {

			chunks.push( shaderID );

		} else {

			chunks.push( fragmentShader );
			chunks.push( vertexShader );

		}

		for ( d in defines ) {

			chunks.push( d );
			chunks.push( defines[ d ] );

		}

		for ( p in parameters ) {

			chunks.push( p );
			chunks.push( parameters[ p ] );

		}

		code = chunks.join();

		// Check if code has been already compiled

    // for ( p = 0, pl = _programs.length; p < pl; p ++ ) {
    // 
    //   var programInfo = _programs[ p ];
    // 
    //   if ( programInfo.code === code ) {
    // 
    //     // console.log( "Code already compiled." /*: \n\n" + code*/ );
    // 
    //     programInfo.usedTimes ++;
    // 
    //     return programInfo.program;
    // 
    //   }
    // 
    // }

    console.log( "building new program " );

		//

		var customDefines = generateDefines( defines );

		//

		program = _gl.createProgram();

		var prefix_vertex = [

			"precision " + _precision + " float;",
			"precision " + _precision + " int;",

			customDefines,
      
			"uniform mat4 modelMatrix;",
			"uniform mat4 modelViewMatrix;",
			"uniform mat4 projectionMatrix;",
			"uniform mat4 viewMatrix;",
			"uniform mat3 normalMatrix;",
			"uniform vec3 cameraPosition;",
      // 
      // "attribute vec3 position;",
      // "attribute vec3 normal;",
      // "attribute vec2 uv;",
      // "attribute vec2 uv2;",

			"#ifdef USE_COLOR",

				"attribute vec3 color;",

			"#endif",

			""

		].join("\n");

		var prefix_fragment = [

			"precision " + _precision + " float;",
			"precision " + _precision + " int;",

			customDefines,
      
			"uniform mat4 viewMatrix;",
			"uniform vec3 cameraPosition;",
			""

		].join("\n");

		var glVertexShader = getShader( "vertex", prefix_vertex + vertexShader );
		var glFragmentShader = getShader( "fragment", prefix_fragment + fragmentShader );

		_gl.attachShader( program, glVertexShader );
		_gl.attachShader( program, glFragmentShader );

		//Force a particular attribute to index 0.
		// because potentially expensive emulation is done by browser if attribute 0 is disabled.
		//And, color, for example is often automatically bound to index 0 so disabling it
		if ( index0AttributeName ) {
			_gl.bindAttribLocation( program, 0, index0AttributeName );
		}

		_gl.linkProgram( program );

		if ( !_gl.getProgramParameter( program, _gl.LINK_STATUS ) ) {

			console.error( "Could not initialise shader\n" + "VALIDATE_STATUS: " + _gl.getProgramParameter( program, _gl.VALIDATE_STATUS ) + ", gl error [" + _gl.getError() + "]" );
			console.error( "Program Info Log: " + _gl.getProgramInfoLog( program ) );
		}

		// clean up

		_gl.deleteShader( glFragmentShader );
		_gl.deleteShader( glVertexShader );

		// console.log( prefix_fragment + fragmentShader );
		// console.log( prefix_vertex + vertexShader );

		program.uniforms = {};
		program.attributes = {};

		var identifiers, u, a, i;

		// cache uniform locations

		identifiers = [

			'viewMatrix', 'modelViewMatrix', 'projectionMatrix', 'normalMatrix', 'modelMatrix', 'cameraPosition',
			'morphTargetInfluences'

		];

		for ( u in uniforms ) {
			identifiers.push( u );
		}

		cacheUniformLocations( program, identifiers );

		// cache attributes locations
    
    identifiers = [];
    // identifiers = [
    // 
    //   "position", "normal", "uv", "uv2", "tangent", "color",
    //   "skinIndex", "skinWeight", "lineDistance"
    // 
    // ];
    
		for ( a in attributes ) {

			identifiers.push( a );

		}

		cacheAttributeLocations( program, identifiers );

    // program.id = _programs_counter ++;
    // 
    // _programs.push( { program: program, code: code, usedTimes: 1 } );
    // 
    // _this.info.memory.programs = _programs.length;

		return program;

	};

	// Shader parameters cache

	function cacheUniformLocations ( program, identifiers ) {

		var i, l, id;

		for( i = 0, l = identifiers.length; i < l; i ++ ) {

			id = identifiers[ i ];
			program.uniforms[ id ] = _gl.getUniformLocation( program, id );

		}

	};
  
	function cacheAttributeLocations ( program, identifiers ) {

		var i, l, id;

		for( i = 0, l = identifiers.length; i < l; i ++ ) {

			id = identifiers[ i ];
			program.attributes[ id ] = _gl.getAttribLocation( program, id );

		}

	};
  


	function generateDefines ( defines ) {

		var value, chunk, chunks = [];

		for ( var d in defines ) {

			value = defines[ d ];
			if ( value === false ) continue;

			chunk = "#define " + d + " " + value;
			chunks.push( chunk );

		}

		return chunks.join( "\n" );

	};

	function getShader ( type, string ) {

		var shader;

		if ( type === "fragment" ) {

			shader = _gl.createShader( _gl.FRAGMENT_SHADER );

		} else if ( type === "vertex" ) {

			shader = _gl.createShader( _gl.VERTEX_SHADER );

		}

		_gl.shaderSource( shader, string );
		_gl.compileShader( shader );

		if ( !_gl.getShaderParameter( shader, _gl.COMPILE_STATUS ) ) {

			console.error( _gl.getShaderInfoLog( shader ) );
			console.error( addLineNumbers( string ) );
			return null;

		}

		return shader;

	};
	function addLineNumbers ( string ) {

		var chunks = string.split( "\n" );

		for ( var i = 0, il = chunks.length; i < il; i ++ ) {

			// Chrome reports shader errors on lines
			// starting counting from 1

			chunks[ i ] = ( i + 1 ) + ": " + chunks[ i ];

		}

		return chunks.join( "\n" );

	};
  
}());