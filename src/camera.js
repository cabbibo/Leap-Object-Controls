var Camera, RotationModule;

(function () {
  
  var STEP_SIZE = 0.1;
  
  var tmpVec = new THREE.Vector3();
  var tmpEuler = new THREE.Euler();
  var tmpQuat = new THREE.Quaternion();
  
  Camera = function Camera(threeCam) {
    this.threeCam = threeCam;
    
    this.position = threeCam.position.clone();
    this.lookAt = new THREE.Vector3(0, 0, -1);
    this.up = threeCam.up.clone();
    
    this.translate = new THREE.Vector3();
    this.rotate = new THREE.Vector3();
    this.orbit = new THREE.Vector3();
    
    this.decayTranslate = 0.9;
    this.decayRotate = 0.9;
    this.decayOrbit = 0.9;
  };

  Camera.prototype = {
  
    update: function (values) {
      // debugger
      
      if (values.velocity) {
        tmpVec.copy(values.velocity).applyQuaternion(this.threeCam.quaternion);
        this.updateVec(this.translate, tmpVec, true);
      }
      
      if (values.rotation) {
        tmpVec.copy(values.rotation).applyQuaternion(this.threeCam.quaternion);
        this.updateVec(this.rotate, tmpVec, true);
      }
      
      if (values.orbit) {
        tmpVec.copy(values.orbit).applyQuaternion(this.threeCam.quaternion);
        this.updateVec(this.orbit, tmpVec, true);
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

      this.threeCam.position.copy(this.position);
      this.threeCam.up.copy(this.up);
      this.threeCam.lookAt(this.lookAt);
    },
    
    stepTranslation: function (state, diffout) {
      this.translate.multiplyScalar(this.decayTranslate);
      tmpVec.copy(this.translate).multiplyScalar(STEP_SIZE);
      this.position.add(tmpVec);
      this.lookAt.add(tmpVec);
    },
    
    stepRotation: function (state, diffout) {
      this.rotate.multiplyScalar(this.decayRotate);
      
      tmpEuler.set(this.rotate.x, this.rotate.y, this.rotate.z, 'XYZ');
      tmpQuat.setFromEuler(tmpEuler);
      
      tmpVec.subVectors(this.lookAt, this.position).applyQuaternion(tmpQuat);
      this.lookAt.addVectors(this.position, tmpVec);
      this.up.applyQuaternion(tmpQuat);
    },
    
    stepOrbit: function (state, diffout) {
      this.orbit.multiplyScalar(this.decayOrbit);
      
      tmpEuler.set(this.orbit.x, this.orbit.y, this.orbit.z, 'XYZ');
      tmpQuat.setFromEuler(tmpEuler);
      
      tmpVec.subVectors(this.position, this.lookAt).applyQuaternion(tmpQuat);
      this.position.addVectors(this.lookAt, tmpVec);
      this.up.applyQuaternion(tmpQuat);
    }
  }
}());
