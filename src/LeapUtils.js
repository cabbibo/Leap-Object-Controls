

LeapUtils = {};


/*

   Leap To Scene:
   
   Converts a leap position to a three.js vector based on the frame,
   the position you are trying to convert to, and how large you want 
   the interaction area to be. 

   Keep in mind that this uses the interaction box as the single unit
   cube that we scale based on size.

*/

LeapUtils.leapToScene = function( position , frame , size ){

  var x = position[0] - frame.interactionBox.center[0];
  var y = position[1] - frame.interactionBox.center[1];
  var z = position[2] - frame.interactionBox.center[2];
    
  x /= frame.interactionBox.size[0];
  y /= frame.interactionBox.size[1];
  z /= frame.interactionBox.size[2];

  x *= size;
  y *= size;
  z *= size;

  return new THREE.Vector3( x , y , z );

}


LeapUtils.leapToFrustum = function( position , frame , fov, near, far, result ){
  result = result || new THREE.Vector3();
  var nn = near / (far - near);
  var normalized = frame.interactionBox.normalizePoint(position, false);
  normalized[2] = Math.max(normalized[2], 0);
  result.fromArray(normalized);
  result.multiplyScalar(2).addScalar(-1);
  var scaleZ = near + (far - near) * (1 - normalized[2]);
  var theta = 2 * Math.atan(1/(2 * scaleZ));
  result.multiplyScalar(100 + 1/theta);
  result.setZ(-scaleZ);
  return result;
}
/*

  Leap To DOM:

  converts a leap position to a screen position covering the entire screen
  unless a width and height are specified. 

  These units will be in  'Dom Space' ( origin upper left )

*/
LeapUtils.leapToDom = function( position , frame , w , h  ){

  var iBox = frame.interactionBox;

  var left = iBox.center[0] - iBox.size[0]/2;
  var top = iBox.center[1] + iBox.size[1]/2;

  var x = position[0] - left;
  var y = position[1] - top;

  x /= iBox.size[0];
  y /= iBox.size[1];

  if( !w )
    w = window.innerWidth;
  
  if( !h )
    h = window.innerHeight;

  return [ x , -y ];

}

/*

  Leap To Screen:

  converts a leap position to a screen position covering the entire screen
  unless a width and height are specified. 

  These units will be in  'Three Space' ( origin center )

*/
LeapUtils.leapToScreen = function( position , frame , w , h  ){

  var x = position[0] - frame.interactionBox.center[0];
  var y = position[1] - frame.interactionBox.center[1];

  x /= frame.interactionBox.size[0];
  y /= frame.interactionBox.size[1];

  x *= frame.size;
  y *= frame.size;

  if( !w )
    w = window.innerWidth;
  
  if( !h )
    h = window.innerHeight;

  return [ x*w , y*h ];

}
