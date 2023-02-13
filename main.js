import * as THREE from "three";
import { OrbitControls } from "three/addons/controls/OrbitControls.js";
import { ARButton } from "three/addons/webxr/ARButton.js";
import { GLTFLoader } from "three/addons/loaders/GLTFLoader.js";
import { DRACOLoader } from "three/examples/jsm/loaders/DRACOLoader.js";
import { RGBELoader } from "three/addons/loaders/RGBELoader.js";
import { XREstimatedLight } from "three/addons/webxr/XREstimatedLight.js";

let container;
let camera, scene, renderer;
let controller1, controller2;

let raycaster;

const intersected = [];
const tempMatrix = new THREE.Matrix4();

let group;

init();
animate();

function init() {

  container = document.createElement( 'div' );
  document.body.appendChild( container );
  scene = new THREE.Scene();
  camera = new THREE.PerspectiveCamera( 250, window.innerWidth / window.innerHeight, 10, 1000 );
  camera.position.set( 10, -500, 0 );
  const controls = new OrbitControls( camera, container );
  scene.add( new THREE.HemisphereLight( 0x808080, 0x080820) );
  const light = new THREE.DirectionalLight( 0xffffff );
  light.position.set( 0, 0, 0 );
  scene.add( light );

  group = new THREE.Group();
  scene.add( group );


// add the model
const loader = new GLTFLoader();
const dracoLoader = new DRACOLoader();
dracoLoader.setDecoderPath("/examples/jsm/libs/draco/");
loader.setDRACOLoader(dracoLoader);
// Load a glTF resource
loader.load(
  // resource URL
  "/trans_plane/scene.gltf",
  // called when the resource is loaded
  function (gltf) {
    console.log(gltf.scene);
    gltf.scene.scale.set(1,1,1);
    gltf.scene.position.x = 0; //Position (x = right+ left-)
    gltf.scene.position.y = -300; //Position (y = up+, down-)
    gltf.scene.position.z = 100;
    scene.add(gltf.scene);
  },
  // called while loading is progressing
  function (xhr) {
    console.log((xhr.loaded / xhr.total) * 100 + "% loaded");
  },
  // called when loading has errors
  function (error) {
    console.log("An error happened");
  }
);

// group.add(loader);
  //

  renderer = new THREE.WebGLRenderer( { antialias: true, alpha: true } );
  renderer.setPixelRatio( window.devicePixelRatio );
  renderer.setSize( window.innerWidth, window.innerHeight );
  renderer.outputEncoding = THREE.sRGBEncoding;
  renderer.xr.enabled = true;
  container.appendChild( renderer.domElement );

  document.body.appendChild( ARButton.createButton( renderer ) );

  // controllers

  controller1 = renderer.xr.getController( 0 );
  controller1.addEventListener( 'selectstart', onSelectStart );
  controller1.addEventListener( 'selectend', onSelectEnd );
  scene.add( controller1 );

  controller2 = renderer.xr.getController( 1 );
  controller2.addEventListener( 'selectstart', onSelectStart );
  controller2.addEventListener( 'selectend', onSelectEnd );
  scene.add( controller2 );

  raycaster = new THREE.Raycaster();

  //

  window.addEventListener( 'resize', onWindowResize );

}

function onWindowResize() {

  camera.aspect = window.innerWidth / window.innerHeight;
  camera.updateProjectionMatrix();

  renderer.setSize( window.innerWidth, window.innerHeight );

}

function onSelectStart( event ) {

  const controller = event.target;

  const intersections = getIntersections( controller );

  if ( intersections.length > 0 ) {

    const intersection = intersections[ 0 ];

    const object = intersection.object;
    object.material.emissive.b = 1;
    controller.attach( object );

    controller.userData.selected = object;

  }

}

function onSelectEnd( event ) {

  const controller = event.target;

  if ( controller.userData.selected !== undefined ) {

    const object = controller.userData.selected;
    object.material.emissive.b = 0;
    group.attach( object );

    controller.userData.selected = undefined;

  }


}

function getIntersections( controller ) {

  tempMatrix.identity().extractRotation( controller.matrixWorld );

  raycaster.ray.origin.setFromMatrixPosition( controller.matrixWorld );
  raycaster.ray.direction.set( 0, 0, - 1 ).applyMatrix4( tempMatrix );

  return raycaster.intersectObjects( group.children, false );

}

function intersectObjects( controller ) {

  // Do not highlight when already selected

  if ( controller.userData.selected !== undefined ) return;

  const intersections = getIntersections( controller );

  if ( intersections.length > 0 ) {

    const intersection = intersections[ 0 ];

    const object = intersection.object;
    object.material.emissive.r = 1;
    intersected.push( object );

  }

}

function cleanIntersected() {

  while ( intersected.length ) {

    const object = intersected.pop();
    object.material.emissive.r = 0;

  }

}

//

function animate() {

  renderer.setAnimationLoop( render );

}

function render() {

  cleanIntersected();

  intersectObjects( controller1 );
  intersectObjects( controller2 );

  renderer.render( scene, camera );

}