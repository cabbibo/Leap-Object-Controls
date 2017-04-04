
  function TextCreator(params ){

    this.params = {}
    p = params || {};
   
    this.params.size = p.size || 5;
    this.params.type = p.size || "Bold 20px Arial";
    this.params.color = p.color || "rgba( 255 , 255 , 255 , 0.95 )";
    this.params.crispness = p.crispness || 20;

    this.geo = new THREE.PlaneGeometry( 1 , 1 );
    this.randomWords = [
      "V2",
      "Rigged Hand",
      "Developer Love",
      "Skeletal",
      "OOBE",
      "Airspace",
      "Stome",
      "Community",
      "Developers",
      "Framework",
      "Magic",
      "ARM LINUX",
    ];
  }

  TextCreator.prototype.randomWord = function(){
    var id = Math.floor( Math.random() * this.randomWords.length );

    return this.randomWords[id];
  }
  
  TextCreator.prototype.createMesh = function( string , params ){

    var canvas    = document.createElement('canvas');
    var ctx       = canvas.getContext( '2d' ); 
    
    
    var params        = params                  || {};
    params.color      = this.params.color       || params.color;
    params.size       = this.params.size        || params.size;
    params.crispness  = this.params.crispness   || params.crispness;


    var size   = params.size;
    var color  = params.color;

    // This is the factor the canvas will be scaled 
    // up by, which basically equates to 'crispness'
    var scaleFactor = params.crispness;

    // To make sure that the text is crisp,
    // need to draw it large and scale down
    var fullSize = scaleFactor * size;


    // If you want a margin, you can define it in the params
    if( !params.margin )
      margin = size * .5 * params.crispness;

    // Gets how wide the tesxt is
    ctx.font      = fullSize + "pt Arial";
    var textWidth = ctx.measureText(string).width;
 
    canvas.width  = textWidth + margin;
    canvas.height = fullSize + margin;
    ctx.font      = fullSize + "pt Arial";


    // Gives us a background instead of transparent background
    if( params.backgroundColor ) {
        ctx.fillStyle = params.backgroundColor;
        ctx.fillRect(
            canvas.width / 2 - textWidth / 2 - margin / 2, 
            canvas.height / 2 - fullSize / 2 - + margin / 2, 
            textWidth + margin, 
            fullSize + margin
        );
    }

    // Makes sure our text is centered
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";
    ctx.fillStyle = color;
    ctx.fillText(string, canvas.width / 2, canvas.height / 2);

    // Creates a texture
    var texture = new THREE.Texture(canvas);
    texture.needsUpdate = true;

    var material = new THREE.MeshBasicMaterial({
      map:         texture,
      transparent:  true,
      side:         THREE.DoubleSide
    });

 
    var geo = new THREE.PlaneGeometry( 
        
        canvas.width  / scaleFactor,
        canvas.height / scaleFactor
    );

    var mesh = new THREE.Mesh( geo, material);
    mesh.frustumCulled = false;
    //mesh.scale.x = canvas.width  / scaleFactor,
    //mesh.scale.y = canvas.height / scaleFactor
    
    // Assigning the texture
    mesh.string = string;

    return mesh;

  }

  // A bit backwards / not designed well, but thats what
  // deadlines are for right :)
  TextCreator.prototype.createTexture = function( text , params ){
  
    var m = this.createMesh( text , params );

    var t = m.material.uniforms.map.value;

    return t;

  }

