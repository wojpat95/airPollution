var container,
    camera, scene, renderer,
    stats,
    axisHelper, linesMaterial,
    radious = 1600, theta = 45, onMouseDownTheta = 45, phi = 60, onMouseDownPhi = 60,
    layerMesh;

var isMouseDown = false, onMouseDownPosition, theta = 45, onMouseDownTheta = 45, phi = 60, onMouseDownPhi = 60;

// default layer that will be shown
var index_parameter = 'aqi';

// data to remember in local storage. variable used in function showLayer to show layer on view
var stations;


// MAIN

init();
animate();


//

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

    var earthGeo = new THREE.SphereGeometry(100, 100, 100, 0, Math.PI * 2, 0, Math.PI),
        earthMat = new THREE.MeshBasicMaterial( {color: 0x808080} );
        // earthMat = new THREE.MeshNormalMaterial();

    var earthMesh = new THREE.Mesh(earthGeo, earthMat);
    scene.add(earthMesh);

    // GUI Controller

    var props = {
        index: index_parameter
    };
    var datGui = new dat.GUI();

    datGui.add(props,'index',
        ['aqi','p10','p25','co','so2', 'no2', 'o3'])
        .name('Index').listen().onChange(function(newValue){
        console.log(newValue);
        index_parameter = newValue;
        if (stations){
            console.log('stations');
            showLayer(stations, index_parameter, earthMesh)
        }

    });


    // Earth map texture

    var geometry   = new THREE.SphereGeometry(100.01, 100, 100, 0, Math.PI * 2, 0, Math.PI);
    var material  = new THREE.MeshBasicMaterial({
        map     : new THREE.ImageUtils.loadTexture('asserts/img/earth.png'),
        side        : THREE.DoubleSide,
        transparent : true,
        depthWrite  : false,
    });
    var cloudMesh = new THREE.Mesh(geometry, material);
    earthMesh.add(cloudMesh);

    layers.stations().then((values) => {
        stations = values;
        showLayer(values, index_parameter, earthMesh);
        }
    );


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

    // event.preventDefault();

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

    // event.preventDefault();

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

function showLayer(stations, index, earthMesh){
    layers.clearCanvas();
    earthMesh.remove(layerMesh);

    let layer = layers.layer(stations, index);

    layers.canvas.getContext("2d").putImageData(layer.imageData, 0, 0);

    let texture  = new THREE.Texture(layers.canvas);
    texture.needsUpdate = true;

    var geometry   = new THREE.SphereGeometry(101, 100, 100, 0, Math.PI * 2, 0, Math.PI);
    let material  = new THREE.MeshBasicMaterial({
        map         : texture,
        side        : THREE.DoubleSide,
        opacity     : 0.8,
        transparent : true,
        depthWrite  : false,
    });
    layerMesh = new THREE.Mesh(geometry, material);
    earthMesh.add(layerMesh);
}