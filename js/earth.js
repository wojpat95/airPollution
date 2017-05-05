var container,
    camera, scene, renderer,
    stats,
    axisHelper, linesMaterial,
    radious = 1600, theta = 45, onMouseDownTheta = 45, phi = 60, onMouseDownPhi = 60;

var isMouseDown = false, onMouseDownPosition, theta = 45, onMouseDownTheta = 45, phi = 60, onMouseDownPhi = 60;

init();
animate();

function init() {

    // Container

    container = document.createElement( 'div' );
    document.body.appendChild( container );

    // Scene

    scene = new THREE.Scene();

    // Camera

    camera = new THREE.PerspectiveCamera( 40, window.innerWidth / window.innerHeight, 1, 10000 );
    scene.add(camera);

    camera.position.x = radious * Math.sin( theta * Math.PI / 360 ) * Math.cos( phi * Math.PI / 360 );
    camera.position.y = radious * Math.sin( phi * Math.PI / 360 );
    camera.position.z = radious * Math.cos( theta * Math.PI / 360 ) * Math.cos( phi * Math.PI / 360 );
    camera.lookAt( scene.position );

    // Grid

    var earthGeo = new THREE.SphereGeometry(100, 100, 100, 0, Math.PI * 2, 0, Math.PI * 2),
        earthMat = new THREE.MeshBasicMaterial( {color: 0xfffffff} );
        // earthMat = new THREE.MeshNormalMaterial();

    var earthMesh = new THREE.Mesh(earthGeo, earthMat);
    scene.add(earthMesh);

    // Axis helper

    axisHelper = new THREE.AxisHelper();
    axisHelper.position.set(-500, 0, -500);
    axisHelper.scale.set(100, 100, 100);
    scene.add(axisHelper);

    // // Lights
    //
    // var ambientLight = new THREE.AmbientLight( 0x404040 );
    // scene.add( ambientLight );
    //
    // var directionalLight = new THREE.DirectionalLight( 0xffffff );
    // directionalLight.position.x = 1;
    // directionalLight.position.y = 1;
    // directionalLight.position.z = -0.75;
    // directionalLight.position.normalize();
    // scene.add( directionalLight );
    //
    // var directionalLight = new THREE.DirectionalLight( 0x808080 );
    // directionalLight.position.x = - 1;
    // directionalLight.position.y = 1;
    // directionalLight.position.z = - 0.75;
    // directionalLight.position.normalize();
    // scene.add( directionalLight );

    // Renderer

    renderer = new THREE.WebGLRenderer({
        antialias: true
    });
    renderer.setSize( window.innerWidth, window.innerHeight );

    container.appendChild(renderer.domElement);

    // Controls

    onMouseDownPosition = new THREE.Vector2();

    window.addEventListener( 'resize', onWindowResize, false );

    document.addEventListener( 'mousedown', onDocumentMouseDown, false );
    document.addEventListener( 'mousemove', onDocumentMouseMove, false );
    document.addEventListener( 'mouseup', onDocumentMouseUp, false );
    document.addEventListener( 'mousewheel', onDocumentMouseWheel, false );

}

function onWindowResize() {

    camera.aspect = window.innerWidth / window.innerHeight;
    camera.updateProjectionMatrix();

    renderer.setSize( window.innerWidth, window.innerHeight );

}

function render() {

    renderer.render( scene, camera );

}

function animate() {

    window.requestAnimationFrame( animate );

    render();

}

function onDocumentMouseDown( event ) {

    event.preventDefault();

    isMouseDown = true;

    onMouseDownTheta = theta;
    onMouseDownPhi = phi;
    onMouseDownPosition.x = event.clientX;
    onMouseDownPosition.y = event.clientY;

}

function onDocumentMouseMove( event ) {

    event.preventDefault();

    if ( isMouseDown ) {

        theta = - ( ( event.clientX - onMouseDownPosition.x ) * 0.5 ) + onMouseDownTheta;
        phi = ( ( event.clientY - onMouseDownPosition.y ) * 0.5 ) + onMouseDownPhi;

        phi = Math.min( 180, Math.max( -180, phi) );

        camera.position.x = radious * Math.sin( theta * Math.PI / 360 ) * Math.cos( phi * Math.PI / 360 );
        camera.position.y = radious * Math.sin( phi * Math.PI / 360 );
        camera.position.z = radious * Math.cos( theta * Math.PI / 360 ) * Math.cos( phi * Math.PI / 360 );
        camera.updateMatrix();
        camera.lookAt( scene.position );

    }

}

function onDocumentMouseUp( event ) {

    event.preventDefault();

    isMouseDown = false;

    onMouseDownPosition.x = event.clientX - onMouseDownPosition.x;
    onMouseDownPosition.y = event.clientY - onMouseDownPosition.y;

}

function onDocumentMouseWheel( event ) {

    radious -= event.wheelDeltaY;

    camera.position.x = radious * Math.sin( theta * Math.PI / 360 ) * Math.cos( phi * Math.PI / 360 );
    camera.position.y = radious * Math.sin( phi * Math.PI / 360 );
    camera.position.z = radious * Math.cos( theta * Math.PI / 360 ) * Math.cos( phi * Math.PI / 360 );
    camera.updateMatrix();

    render();

}