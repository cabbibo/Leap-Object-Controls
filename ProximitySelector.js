/*

   Leap Proximity Selector:

   This is a method of interacting with objects that 


*/



function LeapProximitySelector( controller , camera , params ){


  this.controller = controller;
  this.camera     = camera;
  this.params     = params;

  this.frame      = this.controller.frame();


  for( propt in params ){
  
    console.log( propt );

  }

  this.objects = [];

  if( this.params.objects )
    this.addObjects( this.params.objects );  

}

LeapProximitySelector.prototype.addObjects = function( objectArray ){

  for( var i = 0; i < objectArray.length; i++ ){
    this.addObject( objectArray[i] );
  }

}

LeapProximitySelector.prototype.addObject = function( object ){

  object.leapData = {}
  object.leapData.distanceToSelector = 1000000000; // very large number
  object.leapData.selected = false;
  object.leapData.onSelect = function(){ console.log('select' ) };
  object.leapData.onDeselect = function(){ console.log('deselect' ) };

  this.objects.push( object );



}

LeapProximitySelector.prototype.removeObject = function( object ){

  object.leapData = undefined;

  for( var i = 0; i < this.objects.length; i ++ ){
    
    if( this.objects[i] == object ){
      this.objects.splice( i , 1 );
      i--;
    }

  }

}

LeapProximitySelector.prototype.update = function(){


  this.frame = this.controller.frame();

  for( var i = 0; i < frame.hands.length; i++ ){

    this.getClosestObject

  }


}


// This function moves from a position from leap space, 
  // to a position in scene space, using the sceneSize
  // we defined in the global variables section
LeapProximitySelector.prototype.leapToScene = function( position ){


  var x = position[0] - this.frame.interactionBox.center[0];
  var y = position[1] - this.frame.interactionBox.center[1];
  var z = position[2] - this.frame.interactionBox.center[2];
    
  x /= this.frame.interactionBox.size[0];
  y /= this.frame.interactionBox.size[1];
  z /= this.frame.interactionBox.size[2];

  x *= this.size;
  y *= this.size;
  z *= this.size;

  z -= this.size;

  var pos = new THREE.Vector3( x , y , z );
  pos.applyQuaternion( this.camera.quaternion );

  return new THREE.Vector3( x , y , z );

}
