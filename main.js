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
        var camera = new BABYLON.ArcRotateCamera("Camera", Math.PI, Math.PI / 2, 7, new BABYLON.Vector3(0, 1, 0), scene);
        camera.attachControl(canvas, true);
        camera.lowerRadiusLimit = 5;  // Prevent zooming too close
        camera.upperRadiusLimit = 12; // Prevent zooming too far
        camera.lowerBetaLimit = Math.PI / 3; // Limit how high user can rotate
        camera.upperBetaLimit = Math.PI / 1.8; // Limit how low user can rotate
        
        // Position camera to look directly at the front of the model
        camera.setPosition(new BABYLON.Vector3(0, -.5, 7));

        // create a light
        var light = new BABYLON.HemisphericLight("light1", new BABYLON.Vector3(0, 1, 0), scene);
        light.intensity = 0.7;

        // Load the GLB model
        BABYLON.SceneLoader.ImportMesh("", "models/", "gate-animated-1.glb", scene, function (meshes, particleSystems, skeletons, animationGroups) {
            // Get the root mesh and adjust its transform
            const rootMesh = meshes[0];
            rootMesh.scaling = new BABYLON.Vector3(4.5, 4.5, 4.5);  // Scale to fill screen
            rootMesh.position = new BABYLON.Vector3(0, -1, 0);  // Slightly raised position for better centering
            rootMesh.rotation = new BABYLON.Vector3(0, Math.PI, 0);  // Rotate 180 degrees to face camera
            
            // Get the animation group
            if (animationGroups && animationGroups.length > 0) {
                const animation = animationGroups[0];
                console.log("Animation found:", animation.name); // Debug log
                
                // Stop animation initially to make it static
                animation.stop();
                animation.reset();

                // Add click handling to all meshes in the model
                meshes.forEach(mesh => {
                    mesh.isPickable = true;  // Enable picking (clicking)
                    
                    // Click event handling
                    mesh.actionManager = new BABYLON.ActionManager(scene);
                    mesh.actionManager.registerAction(
                        new BABYLON.ExecuteCodeAction(
                            BABYLON.ActionManager.OnPickTrigger,
                            () => {
                                console.log("Mesh clicked"); // Debug log
                                // Only play if animation isn't already playing
                                if (!animation.isPlaying) {
                                    console.log("Playing animation"); // Debug log
                                    animation.reset();
                                    animation.start(false); // Using start() instead of play()
                                }
                            }
                        )
                    );
                });
            } else {
                console.log("No animation groups found in the model"); // Debug log
            }
        });

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