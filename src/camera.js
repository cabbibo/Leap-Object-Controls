var LeapCameraControls, Activations, Interpreters, Mappings, Control;

(function () {
  LeapCameraControls = function (camera, controller) {
    this.camera = camera;
    this.controller = controller;
    this.cameraModel = new CameraModel(camera);
    
    this.controls = {};
  }
  
  LeapCameraControls.prototype = {
    
    add: function (name, control) {
      if (name in this.controls) {
        console.warn('control already added, overwriting', name);
      }
      this.controls[name] = control;
      this.controls[name].__enabled = true;
    },
    
    enable: function (name) {
      if (!(name in this.controls)) {
        console.warn('can\'t find control', name);
        return;
      }
      this.controls[name].__enabled = true;
    },
    
    disable: function (name) {
      if (!(name in this.controls)) {
        console.warn('can\'t find control', name);
        return;
      }
      this.controls[name].__enabled = false;
    },
    
    update: function () {
      for (var k in this.controls) {
        var c = this.controls[k];
        if (c.__enabled) {
          var value = c.update(this.controller);
          this.cameraModel[c.action](value, c.isDelta);
        }
      }
      
      this.cameraModel.step();
    }
  }
  
  var STEP_SIZE = 0.1;
  
  var tmpVec = new THREE.Vector3();
  var tmpEuler = new THREE.Euler();
  var tmpQuat = new THREE.Quaternion();
  
  CameraModel = function CameraModel(threeCam) {
    this.threeCam = threeCam;
    
    this.position = threeCam.position.clone();
    this.lookAt = new THREE.Vector3(0, 0, -1);
    this.up = threeCam.up.clone();
    
    this.vecTranslate = new THREE.Vector3();
    this.vecRotate = new THREE.Vector3();
    this.vecOrbit = new THREE.Vector3();
    this.eyeDist = 0;
    this.lookDist = 0;
    
    this.decayTranslate = 0.9;
    this.decayRotate = 0.9;
    this.decayOrbit = 0.9;
    this.decayEyeDist = 0.9;
    this.decayLookDist = 0.9;
  };

  CameraModel.prototype = {    
    translate: function (vector, isDelta) {
      tmpVec.copy(vector).applyQuaternion(this.threeCam.quaternion);
      this.updateVec(this.vecTranslate, tmpVec, isDelta);
    },
    
    rotate: function (vector, isDelta) {
      tmpVec.copy(vector).applyQuaternion(this.threeCam.quaternion);
      this.updateVec(this.vecRotate, tmpVec, isDelta);
    },
    
    orbit: function (vector, isDelta) {
      tmpVec.copy(vector).applyQuaternion(this.threeCam.quaternion);
      this.updateVec(this.vecOrbit, tmpVec, isDelta);
    },
    
    eyeDistance: function (distance, isDelta) {
      if (isDelta) {
        this.eyeDist += distance;
      } else {
        this.eyeDist = distance;
      }
    },
    
    lookDistance: function (distance, isDelta) {
      if (isDelta) {
        this.lookDist += distance;
      } else {
        this.lookDist = distance;
      }
    },
    
    updateVec: function (vec, values, isDelta) {
      if (isDelta) {
        vec.add(values);
      } else {
        vec.copy(values);
      }
    },
    
    step: function () {
      this.stepTranslation();
      this.stepRotation();
      this.stepOrbit();
      this.stepEyeDistance();
      this.stepLookDistance();

      this.threeCam.position.copy(this.position);
      this.threeCam.up.copy(this.up);
      this.threeCam.lookAt(this.lookAt);
    },
    
    stepTranslation: function () {
      this.vecTranslate.multiplyScalar(this.decayTranslate);
      tmpVec.copy(this.vecTranslate).multiplyScalar(STEP_SIZE);
      this.position.add(tmpVec);
      this.lookAt.add(tmpVec);
    },
    
    stepRotation: function () {
      this.vecRotate.multiplyScalar(this.decayRotate);
      
      tmpEuler.set(this.vecRotate.x, this.vecRotate.y, this.vecRotate.z, 'XYZ');
      tmpQuat.setFromEuler(tmpEuler);
      
      tmpVec.subVectors(this.lookAt, this.position).applyQuaternion(tmpQuat);
      this.lookAt.addVectors(this.position, tmpVec);
      this.up.applyQuaternion(tmpQuat);
    },
    
    stepOrbit: function () {
      this.vecOrbit.multiplyScalar(this.decayOrbit);
      
      tmpEuler.set(this.vecOrbit.x, this.vecOrbit.y, this.vecOrbit.z, 'XYZ');
      tmpQuat.setFromEuler(tmpEuler);
      
      tmpVec.subVectors(this.position, this.lookAt).applyQuaternion(tmpQuat);
      this.position.addVectors(this.lookAt, tmpVec);
      this.up.applyQuaternion(tmpQuat);
    },
    
    stepEyeDistance: function () {
      this.eyeDist *= this.decayEyeDist;
      tmpVec.subVectors(this.position, this.lookAt).multiplyScalar(1 + this.eyeDist);
      this.position.addVectors(this.lookAt, tmpVec);
    },
    
    stepLookDistance: function () {
      this.lookDist *= this.decayLookDist;
      tmpVec.subVectors(this.lookAt, this.position).multiplyScalar(1 + this.lookDist);
      this.lookAt.addVectors(this.position, tmpVec);
    }
  }
  
  Control = function (activation, interpreter, mapping, isDelta) {
    this.activation = activation;
    this.interpreter = interpreter;
    this.mapping = mapping;
    this.action = mapping.action;
    this.isDelta = typeof(isDelta) != 'undefined' ? isDelta : true;
    this.vec = new THREE.Vector3();

    this.lowPass = new THREE.Vector3();
  }
  
  Control.prototype = {
    update: function (controller) {
      prepareFrame.call(this, controller);
      var magnitude = this.activation(this.hands, this.anchorHands);
      var value = this.interpreter(this.hands, this.anchorHands);
      value = this.mapping(value);
      if (typeof(value) == 'number') {
        value *= magnitude;
      } else {
        value = this.vec.multiplyScalar(magnitude);
        value.sub(this.lowPass).multiplyScalar(0.8);
        this.lowPass.add(value);
        value.copy(this.lowPass);
      }
      
      return value;
    }
  }
  
  // map vec to vec
  // map vec component to scalar
  // map vec component to vec component
  // map scalar to scalar
  // map scalar to vec component
  
  Mappings = {
    toVec: function (action, order) {
      order = (order || 'xyz').split('');
      
      var f = function (value) {
        if (typeof(value) == 'number') {
          return this.vec.set(value, value, value);
        }
        tmpVec.copy(value);
        this.vec[order[0]] = tmpVec.x;
        this.vec[order[1]] = tmpVec.y;
        this.vec[order[2]] = tmpVec.z;
        
        return this.vec;
      }
      f.action = action;
      return f;
    },
    
    toVecComp: function (action, from, to) {
      from = from || 'x';
      to = to || 'x';
      
      var f = function (value) {
        if (typeof(value) == 'number') {
          this.vec.set(0, 0, 0);
          this.vec[to] = value;
        } else {
          tmpVec.copy(value);
          this.vec.set(0, 0, 0);
          this.vec[to] = tmpVec[from];
        }
        
        return this.vec;
      }
      f.action = action;
      return f;
    },
    
    toScalar: function (action, component) {
      component = component || 'x';
      var f = function (value) {
        if (typeof(value) == 'number') {
          return value;
        }
        return value[component];
      }
      f.action = action;
      return f;
    }
  }

  Activations = {
    pinch: function (which, multiplier) {
      function activation(hands, anchorHands) {
        var hand;
        for (var i = 0; i < hands.length; i++) {
          if (hands[i].type == which) {
            hand = hands[i];
            break;
          }
        }
        return hand ? hand.pinchStrength * activation.multiplier : 0;
      }
      activation.multiplier = multiplier;
      return activation;
    },
    
    paddle: function (which, multiplier) {
      function activation(hands, anchorHands) {
        var hand;
        for (var i = 0; i < hands.length; i++) {
          if (hands[i].type == which) {
            hand = hands[i];
            break;
          }
        }
        if (hand) {
          var v = normalize(hand.palmVelocity);
          return Math.max(0, dot(hand.palmNormal, v)) * activation.multiplier;
        }
        return 0;
      }
      activation.multiplier = multiplier;
      return activation;
    },
    
    clap: function (multiplier) {
      function activation(hands, anchorHands) {
        var hand1 = hands[0];
        var hand2 = hands[1];
        if (hand1 && hand2) {
          return (1 - dot(hand1.palmNormal, hand2.palmNormal)) * activation.multiplier;
        }
        return 0;
      }
      activation.multiplier = multiplier;
      return activation;
    }
  }
  
  Interpreters = {
    palmPosition: function () {
      return function (hands, anchorHands) {
        if (anchorHands.length != hands.length) {
          this.vec.set(0, 0, 0);
          return this.vec;
        }
        var centerAnchor = getCenter(anchorHands);
        var centerCurrent = getCenter(hands);
        this.vec.set(
          centerCurrent[0] - centerAnchor[0],
          centerCurrent[1] - centerAnchor[1],
          centerCurrent[2] - centerAnchor[2]).negate();
          
        return this.vec;
      }
    },
    
    palmOrbit: function () {
      return function (hands, anchorHands) {
        if (hands.length < 1 || anchorHands.length < 1
            || hands.length != anchorHands.length) {
          this.vec.set(0, 0, 0);
          return this.vec;
        }

        var am = getAxisMag(hands);
        // if (am[3] < 6000) {
        //   return [0, 0, 0];
        // }
        var mi = 1 / am[3];
        am[0]*=mi;
        am[1]*=mi;
        am[2]*=mi;

        var anchorAngles = getAngles(anchorHands);
        var angles = getAngles(hands);

        var dx = angles[0] - anchorAngles[0];
        var dy = angles[1] - anchorAngles[1];
        var dz = angles[2] - anchorAngles[2];

        if (dx > Math.PI) dx = dx - PI_2;
        else if (dx < -Math.PI) dx = dx + PI_2;
        if (dy > Math.PI) dy = dy - PI_2;
        else if (dy < -Math.PI) dy = dy + PI_2;
        if (dz > Math.PI) dz = dz - PI_2;
        else if (dz < -Math.PI) dz = dz + PI_2;
        
        this.vec.set(dx * am[0], dy * am[1], dz * am[2]).negate();
        return this.vec;
      }
    },
    
    palmScale: function () {
      return function(hands, anchorHands) {
        if (hands.length < 1 || anchorHands.length != hands.length) {
          this.vec.set(0, 0, 0);
          return this.vec;
        }
    
        var centerAnchor = getCenter(anchorHands, true);
        var centerCurrent = getCenter(hands, true);
        var aveRadiusAnchor = aveDistance(centerAnchor, anchorHands);
        var aveRadiusCurrent = aveDistance(centerCurrent, hands);
    
        // scale of current over previous
        this.vec.set(
          aveRadiusCurrent[0] / aveRadiusAnchor[0],
          aveRadiusCurrent[1] / aveRadiusAnchor[1],
          aveRadiusCurrent[2] / aveRadiusAnchor[2]).negate();
          
        // length(aveRadiusCurrent) / length(aveRadiusAnchor)
        return this.vec;
      }
    }
  }
  
  function prepareFrame(controller) {
    var frame = controller.frame();
    var anchorFrame = controller.frame(1);
    
    var hands = [];
    var anchorHands = [];
    this.hands = hands;
    this.anchorHands = anchorHands;
    
    // do we have a frame
    if (!frame || !frame.valid || !anchorFrame || !anchorFrame.valid) {
      return;
    }
    
    // match hands to anchors
    var rawHands = frame.hands;
    var rawAnchorHands = anchorFrame.hands;
    
    rawHands.forEach(function (hand, hIdx) {
      var anchorHand = anchorFrame.hand(hand.id);
      if (anchorHand.valid) {
        hands.push(hand);
        anchorHands.push(anchorHand);
      }
    });
  }

  var PI_2 = Math.PI * 2;
  
  function getCenter(hands, useIb) {
    var l = hands.length;
    if (l == 0) {
      return [0, 0, 0];
    } else if (l == 1) {
      return useIb ? hands[0].frame.interactionBox.center : hands[0].palmPosition;
    }
    
    var x = y = z = 0;
    hands.forEach(function (hand, i) {
      x += hand.palmPosition[0];
      y += hand.palmPosition[1];
      z += hand.palmPosition[2];
    });
    return [x/l, y/l, z/l];
  }
  
  function aveDistance(center, hands) {
    var aveDistance = [0, 0, 0];
    hands.forEach(function (hand) {
      var p = hand.palmPosition;
      aveDistance[0] += Math.abs(p[0] - center[0]);
      aveDistance[1] += Math.abs(p[1] - center[1]);
      aveDistance[2] += Math.abs(p[2] - center[2]);
    });
    aveDistance[0] /= hands.length;
    aveDistance[1] /= hands.length;
    aveDistance[2] /= hands.length;
    return aveDistance;
  }
  
  function length(arr) {
    var sum = 0;
    arr.forEach(function (v) {
      sum += v * v;
    });
    return Math.sqrt(sum);
  }
  
  function getAngles(hands) {
    if (hands.length == 0) {
      return [0, 0, 0];
    }
  
    var pos1;
    var hand = hands[0];
    if (hands.length > 1) {
      pos1 = hands[1].palmPosition;
    } else {
      pos1 = hand.frame.interactionBox.center;
    }
  
    var pos2 = hand.palmPosition;
  
    var dx = pos2[0] - pos1[0];
    var dy = pos2[1] - pos1[1];
    var dz = pos2[2] - pos1[2];

    var ax = Math.atan2(dz, dy);
    var ay = Math.atan2(dx, dz);
    var az = Math.atan2(dy, dx);
    return [ax, ay, az];
  }

  function getAxisMag(hands) {
    if (hands.length == 0) {
      return [0, 0, 0, 0];
    }
  
    var pos1;
    var hand = hands[0];
    if (hands.length > 1) {
      pos1 = hands[1].palmPosition;
    } else {
      pos1 = hand.frame.interactionBox.center;
    }
  
    var pos2 = hand.palmPosition;
  
    var dx = pos2[0] - pos1[0];
    var dy = pos2[1] - pos1[1];
    var dz = pos2[2] - pos1[2];
    var mag = dx * dx + dy * dy + dz * dz;
  
    var ax = dy * dy + dz * dz;
    var ay = dx * dx + dz * dz;
    var az = dy * dy + dx * dx;
  
    return [ax, ay, az, mag];
  }
  
  function dot(a, b) {
    return a[0] * b[0] + a[1] * b[1] + a[2] * b[2];
  }
  
  function normalize(a) {
    var s = Math.sqrt(dot(a, a));
    return [a[0]/s, a[1]/s, a[2]/s];
  }
}());