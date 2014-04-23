var Camera, TranslationModule, RotationModule;

(function () {
  
  var X_AXIS = new THREE.Vector3(1, 0, 0);
  var Y_AXIS = new THREE.Vector3(0, 1, 0);
  var Z_AXIS = new THREE.Vector3(0, 0, 1);
  
  var tmpVec = new THREE.Vector3();
  var tmpVec2 = new THREE.Vector3();
  
  var tmpQuat = new THREE.Quaternion();
  var tmpQuat2 = new THREE.Quaternion();
  
  var tmpState = {
    position: new THREE.Vector3(0, 0, 0),
    lookAt: new THREE.Vector3(0, 0, -1),
    up: new THREE.Vector3(0, 1, 0)
  };
  
  var tmpState2 = {
    position: new THREE.Vector3(0, 0, 0),
    lookAt: new THREE.Vector3(0, 0, -1),
    up: new THREE.Vector3(0, 1, 0)
  };
  
  Camera = function Camera(threeCam) {
    this.threeCam = threeCam;
    this.state = {
      position: new THREE.Vector3(0, 0, 0),
      lookAt: new THREE.Vector3(0, 0, -1),
      up: new THREE.Vector3(0, 1, 0)
    };
    this.modules = [];
  }

  Camera.prototype = {
    addModule: function (module) {
      this.modules.push(module);
      module.init(this.state, this.threeCam);
    },
  
    update: function (values) {
      copyState(tmpState, this.state);
      
      for (var i = 0; i < this.modules.length; i++) {
        var module = this.modules[i];
        module.update(values, tmpState);
      }
    },
    
    step: function () {
      copyState(tmpState2, this.state);
      
      for (var i = 0; i < this.modules.length; i++) {
        var module = this.modules[i];
        zeroState(tmpState);
        module.step(this.state, tmpState);
        
        tmpState2.position.add(tmpState.position);
        tmpState2.lookAt.add(tmpState.lookAt);
        tmpState2.up.add(tmpState.up);
      }
      
      this.state.position.copy(tmpState2.position);
      this.state.lookAt.copy(tmpState2.lookAt);
      this.state.up.copy(tmpState2.up);
      
      this.threeCam.position.copy(this.state.position);
      this.threeCam.up.copy(this.state.up);
      this.threeCam.lookAt(this.state.lookAt);
    }
  }
  
  TranslationModule = function () {
    this.position = new THREE.Vector3();
    this.velocity = new THREE.Vector3();
    this.acceleration = new THREE.Vector3();
    this.friction = 0.1;
  };
  
  TranslationModule.prototype = {
    
    init: function (state, camera) {
      this.position.copy(camera.position);
      this.threeCam = camera;
    },
    
    update: function (values, state) {
      if (values.acceleration) {
        this.acceleration.copy(values.acceleration).applyQuaternion(this.threeCam.quaternion);
      }
      if (values.velocity) {
        this.velocity.copy(values.velocity).applyQuaternion(this.threeCam.quaternion);
      }
      if (values.position) {
        this.position.copy(values.position).applyQuaternion(this.threeCam.quaternion);
      }
      if (values.friction) {
        this.friction = values.friction;
      }
      if (values.acceleration_delta) {
        tmpVec.copy(values.acceleration_delta).applyQuaternion(this.threeCam.quaternion);
        this.acceleration.add(tmpVec)
      }
      if (values.velocity_delta) {
        tmpVec.copy(values.velocity_delta).applyQuaternion(this.threeCam.quaternion);
        this.velocity.add(tmpVec);
      }
      if (values.position_delta) {
        tmpVec.copy(values.position_delta).applyQuaternion(this.threeCam.quaternion);
        this.position.copy(tmpVec);
      }
      if (values.friction_delta) {
        this.friction += values.friction_delta;
      }
    },
    
    step: function (state, diffout) {
      this.velocity.multiplyScalar(1 - this.friction);
      addMult(this.velocity, this.acceleration, 0.1);
      addMult(this.position, this.velocity, 0.1);
      
      tmpVec.subVectors(this.position, state.position);
      
      diffout.position.copy(tmpVec);
      diffout.lookAt.copy(tmpVec);
    }
  };
  
  var OrbitModule = function () {
    
  };
  
  OrbitModule.prototype = {
    
    init: function (state) {
    },
    
    update: function (values, state) {
    },
    
    step: function (state) {
    }
  };
  
  RotationModule = function () {
    this.quaternion = new THREE.Quaternion();
    this.targetQuat = new THREE.Quaternion();
    this.lookAt = new THREE.Vector3();
    this.up = new THREE.Vector3();
  };
  
  RotationModule.prototype = {
    
    init: function (state, camera) {
      this.threeCam = camera;
      this.quaternion.copy(camera.quaternion);
      this.targetQuat.copy(camera.quaternion);
      this.lookAt.copy(state.lookAt).sub(state.position);
      this.up.copy(state.up);
    },
    
    update: function (values, state) {
      if (values.rotation) {
        var rotation = values.rotation;

        tmpQuat.setFromAxisAngle(X_AXIS, rotation.x);
        this.targetQuat.multiply(tmpQuat);
        tmpQuat.setFromAxisAngle(Y_AXIS, rotation.y);
        this.targetQuat.multiply(tmpQuat);
        tmpQuat.setFromAxisAngle(Z_AXIS, rotation.z);
        this.targetQuat.multiply(tmpQuat);
        
        this.targetQuat.normalize();
      }
    },
    
    step: function (state, diffout) {
      this.quaternion.slerp(this.targetQuat, 0.1);
      
      tmpVec.copy(this.lookAt).applyQuaternion(this.quaternion);
      tmpVec2.subVectors(state.lookAt, state.position);
      diffout.lookAt.subVectors(tmpVec, tmpVec2);
      
      tmpVec.copy(this.up).applyQuaternion(this.quaternion);
      diffout.up.subVectors(tmpVec, state.up);
    }
  };
  
  function copyState(s1, s2) {
    s1.position.copy(s2.position);
    s1.lookAt.copy(s2.lookAt);
    s1.up.copy(s2.up);
  }
  
  function zeroState(state) {
    state.position.set(0, 0, 0);
    state.lookAt.set(0, 0, 0);
    state.up.set(0, 0, 0);
  }
  
  function addMult(v1, v2, s) {
    v1.x += v2.x * s;
    v1.y += v2.y * s;
    v1.z += v2.z * s;
  }
}());
