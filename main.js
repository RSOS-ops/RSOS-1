window.addEventListener('DOMContentLoaded', function(){
    // get the canvas DOM element
    var canvas = document.getElementById('renderCanvas');

    // create a Babylon.js engine
    var engine = new BABYLON.Engine(canvas, true);

    // create a scene
    var createScene = function(){
        var scene = new BABYLON.Scene(engine);
        scene.clearColor = new BABYLON.Color4(0, 0, 0, 1); // Set pure black background

        // create a camera
        var camera = new BABYLON.ArcRotateCamera("Camera", -Math.PI / 2, Math.PI / 2.5, 5, BABYLON.Vector3.Zero(), scene);
        camera.attachControl(canvas, true);

        // create a light
        var light = new BABYLON.HemisphericLight("light1", new BABYLON.Vector3(0, 1, 0), scene);
        light.intensity = 0.7;

        // create a cube
        var box = BABYLON.MeshBuilder.CreateBox("box", {size: 2}, scene);
        box.position = new BABYLON.Vector3(0, 0, 0);

        // create a material for the cube
        var material = new BABYLON.StandardMaterial("material", scene);
        material.diffuseColor = new BABYLON.Color3.FromHexString("#8ddcec");
        box.material = material;

        // add a glow layer
        var gl = new BABYLON.GlowLayer("glow", scene);
        gl.intensity = 1.5;
        gl.addIncludedOnlyMesh(box);

        return scene;
    }

    var scene = createScene();

    // Set the canvas resolution
    engine.setSize(1920, 1080);


    // run the render loop
    engine.runRenderLoop(function(){
        scene.render();
    });

    // the canvas/window resize event handler
    window.addEventListener('resize', function(){
        engine.resize();
    });
});