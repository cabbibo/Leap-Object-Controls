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
    
    this.vecTranslate = new THREE.Vector3();
    this.vecRotate = new THREE.Vector3();
    this.vecOrbit = new THREE.Vector3();
    this.orbScale = 0;
    
    this.decayTranslate = 0.9;
    this.decayRotate = 0.9;
    this.decayOrbit = 0.9;
    this.decayScale = 0.9;
  };

  Camera.prototype = {    
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
    
    scale: function (scale, isDelta) {
      if (isDelta) {
        this.orbScale += scale;
      } else {
        this.orbScale = scale;
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
      this.stepScale();

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
    
    stepScale: function () {
      this.orbScale *= this.decayScale;
      tmpVec.subVectors(this.position, this.lookAt).multiplyScalar(1 + this.orbScale);
      this.position.addVectors(this.lookAt, tmpVec);
    }
  }
}());
