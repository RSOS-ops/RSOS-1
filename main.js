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
    camera.attachControl(canvas, false); // Attach controls but disable user interaction
    camera.inputs.clear(); // Remove all input controls so user cannot orbit or pan
        camera.lowerRadiusLimit = 5;  // Prevent zooming too close
        camera.upperRadiusLimit = 12; // Prevent zooming too far
        camera.lowerBetaLimit = Math.PI / 3; // Limit how high user can rotate
        camera.upperBetaLimit = Math.PI / 1.8; // Limit how low user can rotate
        
        // Position camera to look directly at the front of the model
    camera.setPosition(new BABYLON.Vector3(0, -.5, -7));

        // create a light
        var light = new BABYLON.HemisphericLight("light1", new BABYLON.Vector3(0, 1, 0), scene);
        light.intensity = 1;

    // Add glow to the scene
    var glowLayer = new BABYLON.GlowLayer("glow", scene);
    glowLayer.intensity = .5;

        // Create 3 rounded rectangles positioned 10 units behind the model
        const rectWidth = 5; // Width of each rectangle
        const rectHeight = 3; // Height of each rectangle
        const gap = 1; // 1 unit gap between rectangles
        const totalWidth = 3 * rectWidth + 2 * gap; // total width occupied by all rectangles and gaps
        const zPosition = 1000; // units behind model (was 10)
        const yPosition = 7.5; // Top of screen
        const startX = -totalWidth / 2 + rectWidth / 2; // leftmost rectangle center
        
        const allRects = []; // Store all rectangle parts
        
        // Create material for rectangles
        const rectMaterial = new BABYLON.StandardMaterial("rectMat", scene);
        rectMaterial.diffuseColor = new BABYLON.Color3(0, 0, 0); // Black
        rectMaterial.emissiveColor = new BABYLON.Color3(0, 0, 0);
        rectMaterial.wireframe = false;
        
        // Border material
        const borderMaterial = new BABYLON.StandardMaterial("borderMat", scene);
        borderMaterial.emissiveColor = BABYLON.Color3.FromHexString("#ce02d4");
        
        // Create 3 rectangles
        for (let i = 0; i < 3; i++) {
            // Create rounded rectangle using a plane with custom shape
            const rect = BABYLON.MeshBuilder.CreatePlane("rect" + i, {
                width: rectWidth,
                height: rectHeight
            }, scene);
            
            // Position rectangles evenly spaced
            rect.position.x = startX + i * (rectWidth + gap);
            rect.position.y = yPosition;
            rect.position.z = zPosition;
            rect.material = rectMaterial;
            rect.setEnabled(false); // Initially hidden
            allRects.push(rect); // Add to list
            // Removed: rect.rotation.z = Math.PI / 2; // No rotation
            
            // Create border using thin tubes to simulate rounded rectangle border
            const borderWidth = 0.05;
            const cornerRadius = 0.3;
            
            // Create border path for rounded rectangle
            const path = [];
            const hw = rectWidth / 2 - cornerRadius;
            const hh = rectHeight / 2 - cornerRadius;
            
            // Create rounded corners using points
            const segments = 8;
            // Top right corner
            for (let j = 0; j <= segments; j++) {
                const angle = (Math.PI / 2) * (j / segments);
                path.push(new BABYLON.Vector3(hw + cornerRadius * Math.cos(angle), hh + cornerRadius * Math.sin(angle), 0));
            }
            // Top left corner
            for (let j = 0; j <= segments; j++) {
                const angle = Math.PI / 2 + (Math.PI / 2) * (j / segments);
                path.push(new BABYLON.Vector3(-hw + cornerRadius * Math.cos(angle), hh + cornerRadius * Math.sin(angle), 0));
            }
            // Bottom left corner
            for (let j = 0; j <= segments; j++) {
                const angle = Math.PI + (Math.PI / 2) * (j / segments);
                path.push(new BABYLON.Vector3(-hw + cornerRadius * Math.cos(angle), -hh + cornerRadius * Math.sin(angle), 0));
            }
            // Bottom right corner
            for (let j = 0; j <= segments; j++) {
                const angle = 3 * Math.PI / 2 + (Math.PI / 2) * (j / segments);
                path.push(new BABYLON.Vector3(hw + cornerRadius * Math.cos(angle), -hh + cornerRadius * Math.sin(angle), 0));
            }
            // Close the path
            path.push(path[0]);
            
            // Create tube for border
            const border = BABYLON.MeshBuilder.CreateTube("border" + i, {
                path: path,
                radius: borderWidth,
                cap: BABYLON.Mesh.CAP_ALL
            }, scene);
            
            border.position = rect.position.clone();
            // Removed: border.rotation.z = Math.PI / 2; // No rotation
            border.material = borderMaterial;
            border.setEnabled(false); // Initially hidden
            allRects.push(border); // Add to list
            
            // Create text for each rectangle
            const textLabels = ["Art", "Visuals", "Code"];
            const textPlane = BABYLON.MeshBuilder.CreatePlane("textPlane" + i, {
                width: rectWidth * 0.8,
                height: rectHeight * 0.3
            }, scene);
            
            // Create dynamic texture for text
            const textTexture = new BABYLON.DynamicTexture("textTexture" + i, {width: 512, height: 128}, scene);
            textTexture.hasAlpha = true;
            textTexture.drawText(textLabels[i], null, null, "bold 48px Arial", "white", "transparent", true);
            
            // Create material for text with glow
            const textMaterial = new BABYLON.StandardMaterial("textMat" + i, scene);
            textMaterial.diffuseTexture = textTexture;
            textMaterial.emissiveTexture = textTexture;
            textMaterial.emissiveColor = new BABYLON.Color3(1, 1, 1); // White glow
            textMaterial.disableLighting = true;
            textMaterial.useAlphaFromDiffuseTexture = true;
            
            // Position text at the center of the rectangle
            textPlane.position = rect.position.clone();
            textPlane.position.z += 0.01; // Slightly in front of rectangle to avoid z-fighting
            textPlane.material = textMaterial;
            textPlane.setEnabled(false); // Initially hidden
            allRects.push(textPlane); // Add to list so it moves with rectangles
        }

        // Load the GLB model
        BABYLON.SceneLoader.ImportMesh("", "models/", "gate-animated-1.glb", scene, function (meshes, particleSystems, skeletons, animationGroups) {
            // Get the root mesh and adjust its transform
                const rootMesh = meshes[0];
                rootMesh.scaling = new BABYLON.Vector3(4.5, 4.5, 4.5);  // Scale to fill screen
                rootMesh.position = new BABYLON.Vector3(0, -1, 0);  // Slightly raised position for better centering
                rootMesh.rotation = new BABYLON.Vector3(0, -Math.PI, 0);  // Rotate 180 degrees in the same direction to face camera
                console.log("Root mesh position:", rootMesh.position);
            
            // Setup motion blur but don't enable it yet
            const motionBlur = new BABYLON.MotionBlurPostProcess("mb", scene, 1.0, camera);
            motionBlur.motionStrength = 3;
            motionBlur.motionBlurSamples = 32;
            motionBlur.excludedMeshes = scene.meshes.filter(mesh => mesh !== rootMesh);
            motionBlur.isEnabled = false; // Start with blur disabled
            
            // Get the animation group
            if (animationGroups && animationGroups.length > 0) {
                const animation = animationGroups[0];
                console.log("Animation found:", animation.name); // Debug log
                
                // Stop animation initially to make it static
                animation.stop();
                animation.reset();

                // Add click handling to the canvas
                let animationPlayed = false;
                canvas.addEventListener('click', () => {
                    if (animationPlayed) return;
                    console.log("Canvas clicked"); // Debug log
                    // Only play if animation isn't already playing
                    if (!animation.isPlaying) {
                        console.log("Playing animation"); // Debug log
                        animation.reset();
                        animation.start(false); // Using start() instead of play()
                        animationPlayed = true;
                        // After animation completes (75 frames), pause 1s, then move mesh
                        let frames = 0;
                        let moving = false;
                        let moveTimeout;
                        animation.onAnimationGroupEndObservable.addOnce(() => {
                             // Enable motion blur when animation ends
                             motionBlur.isEnabled = true;
                             
                             // Show rectangles 1 second after animation ends and start flying
                             setTimeout(() => {
                                 allRects.forEach(r => {
                                     r.setEnabled(true);
                                     if (r.material) r.material.alpha = 0;
                                 });
                                 let fadeFrame = 0;
                                 const fadeDuration = 60; // 1 second at 60fps
                                 let fading = true;
                                 const fadeObserver = scene.onBeforeRenderObservable.add(() => {
                                     if (fading) {
                                         fadeFrame++;
                                         let t = fadeFrame / fadeDuration;
                                         if (t > 1) t = 1;
                                         allRects.forEach(r => {
                                             if (r.material) r.material.alpha = t;
                                         });
                                         if (t === 1) {
                                             fading = false;
                                             // Ensure rectangles and borders are fully visible after fade
                                             allRects.forEach(r => {
                                                 if (r.material) r.material.alpha = 1;
                                             });
                                             console.log("Rectangles and borders faded in and visible.");
                                             // Remove this observer once fade is complete
                                             scene.onBeforeRenderObservable.remove(fadeObserver);
                                         }
                                     }
                                 });
                                 // After fade, start flying
                                 setTimeout(() => {
                                     // Add rectangles to motion blur when they start flying
                                     motionBlur.excludedMeshes = scene.meshes.filter(mesh => mesh !== rootMesh && !allRects.includes(mesh));
                                     
                                     // Animate rectangles flying from z=2000 to z=10 over 2 seconds
                                     const startZ = 1000;
                                     const targetZ = 10;
                                     const flyDuration = 45; // frames for 1 second at 60fps
                                     let flyFrame = 0;
                                     let flying = true;
                                     const flyObserver = scene.onBeforeRenderObservable.add(() => {
                                         if (flying) {
                                             flyFrame++;
                                             let t = flyFrame / flyDuration;
                                             if (t > 1) t = 1;
                                             const currentZ = startZ + (targetZ - startZ) * t;
                                             allRects.forEach(r => {
                                                 r.position.z = currentZ;
                                             });
                                             if (t === 1) {
                                                 flying = false;
                                                 console.log("Rectangles and borders finished flying in.");
                                                 // Remove rectangles from motion blur after flying is complete
                                                 motionBlur.excludedMeshes = scene.meshes.filter(mesh => mesh !== rootMesh);
                                                 // Remove this observer once flying is complete
                                                 scene.onBeforeRenderObservable.remove(flyObserver);
                                             }
                                         }
                                     });
                                 }, 1000); // Start flying after fade-in
                             }, 1000); // End fade-in setTimeout
                             
                             // Wait 1.25 seconds before starting movement
                             moveTimeout = setTimeout(() => {
                                 moving = true;
                             }, 1250);
                            // Wait 0.5s, then smoothly move camera up by 2 units
                            setTimeout(() => {
                                setTimeout(() => {
                                    // Camera slide up and camera target slide down functionality is commented out for now
                                    /*
                                    let startY = camera.position.y;
                                    let targetY = startY + 2;
                                    let startTargetY = camera.target.y;
                                    let targetTargetY = startTargetY - 1;
                                    let duration = 240; // frames for smooth slide (~4s at 60fps)
                                    let frame = 0;
                                    let slideUp = true;
                                    scene.onBeforeRenderObservable.add(() => {
                                        if (slideUp) {
                                            frame++;
                                            let t = frame / duration;
                                            if (t > 1) t = 1;
                                            camera.setPosition(new BABYLON.Vector3(camera.position.x, startY + (targetY - startY) * t, camera.position.z));
                                            camera.target = new BABYLON.Vector3(camera.target.x, startTargetY + (targetTargetY - startTargetY) * t, camera.target.z);
                                            if (t === 1) slideUp = false;
                                        }
                                    });
                                    */
                                }, 660); // Start slide up 0.66s after animation completes
                            }, 500);
                        });
                        // Move mesh toward camera in render loop
                        scene.onBeforeRenderObservable.add(() => {
                            if (moving) {
                                // Move along Z axis toward camera
                                rootMesh.position.z -= 0.5; // Fast speed
                                // Stop when mesh is behind camera (camera at z = -7)
                                if (rootMesh.position.z < -7 - 4.5) { // 4.5 is mesh scale for safety
                                    moving = false;
                                }
                            }
                        });
                    }
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
    // Debug: log camera and mesh positions
    console.log("Camera position:", scene.activeCamera.position, "Camera target:", scene.activeCamera.target);
    });

    // the canvas/window resize event handler
    window.addEventListener('resize', function(){
        engine.resize();
    });
});