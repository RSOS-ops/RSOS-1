window.addEventListener('DOMContentLoaded', async () => {
    //-- CONFIGURATION --//
    const AppConfig = {
        CANVAS_ID: 'renderCanvas',
        MODEL_PATH: 'models/',
        MODEL_FILE: 'gate-animated-1.glb',
        WIZARD_MODEL_FILE: 'Wiz-ComboAnims.glb',
        CAMERA_START_POS: new BABYLON.Vector3(0, -0.5, -7),
        CAMERA_TARGET_OFFSET: new BABYLON.Vector3(0, 1, 0),
        LIGHT_INTENSITY: 1,
        GLOW_INTENSITY: 0.5,
        MOTION_BLUR_STRENGTH: 1.5,
        MOTION_BLUR_SAMPLES: 32,
        MESH_SCALE: new BABYLON.Vector3(4.5, 4.5, 4.5),
        MESH_START_POS: new BABYLON.Vector3(0, -1, 0),
        MESH_ROTATION: new BABYLON.Vector3(0, -Math.PI, 0),
        MESH_FLY_SPEED: 0.5,
        RECT_WIDTH: 5,
        RECT_HEIGHT: 3,
        RECT_GAP: 1,
        RECT_START_Z: 1000,
        RECT_TARGET_Z: 10,
        RECT_Y_POS: 7.5,
        RECT_BORDER_WIDTH: 0.05,
        RECT_CORNER_RADIUS: 0.3,
        RECT_LABELS: ["Art", "Visuals", "Code"],
        ANIMATION_DELAY: 1000, // ms
        FADE_DURATION: 1000, // ms
        FLY_DURATION: 1000, // ms
        MOVE_DELAY: 1250, // ms
    };

    //-- BABYLON.JS SETUP --//
    const canvas = document.getElementById(AppConfig.CANVAS_ID);
    const engine = new BABYLON.Engine(canvas, true, { antialias: true });
    const scene = new BABYLON.Scene(engine);
    scene.clearColor = new BABYLON.Color4(0, 0, 0, 1);

    const createCamera = () => {
        const camera = new BABYLON.ArcRotateCamera("Camera", Math.PI, Math.PI / 2, 7, AppConfig.CAMERA_TARGET_OFFSET, scene);
        camera.attachControl(canvas, false);
        camera.inputs.clear(); // Disable all user controls
        camera.setPosition(AppConfig.CAMERA_START_POS);
        return camera;
    };

    const createLighting = () => {
        const light = new BABYLON.HemisphericLight("light1", new BABYLON.Vector3(0, 1, 0), scene);
        light.intensity = AppConfig.LIGHT_INTENSITY;
        const glowLayer = new BABYLON.GlowLayer("glow", scene);
        glowLayer.intensity = AppConfig.GLOW_INTENSITY;
    };

    const createUI = () => {
        const totalWidth = 3 * AppConfig.RECT_WIDTH + 2 * AppConfig.RECT_GAP;
        const startX = -totalWidth / 2 + AppConfig.RECT_WIDTH / 2;
        const allRects = [];

        const rectMaterial = new BABYLON.StandardMaterial("rectMat", scene);
        rectMaterial.diffuseColor = new BABYLON.Color3(0, 0, 0);
        rectMaterial.emissiveColor = new BABYLON.Color3(0, 0, 0);
        rectMaterial.wireframe = false;

        const borderMaterial = new BABYLON.StandardMaterial("borderMat", scene);
        borderMaterial.emissiveColor = BABYLON.Color3.FromHexString("#ce02d4");

        const path = createRoundedRectPath(AppConfig.RECT_WIDTH, AppConfig.RECT_HEIGHT, AppConfig.RECT_CORNER_RADIUS);

        for (let i = 0; i < 3; i++) {
            const rect = BABYLON.MeshBuilder.CreatePlane(`rect${i}`, { width: AppConfig.RECT_WIDTH, height: AppConfig.RECT_HEIGHT }, scene);
            rect.position = new BABYLON.Vector3(startX + i * (AppConfig.RECT_WIDTH + AppConfig.RECT_GAP), AppConfig.RECT_Y_POS, AppConfig.RECT_START_Z);
            rect.material = rectMaterial;
            rect.setEnabled(false);
            allRects.push(rect);

            const border = BABYLON.MeshBuilder.CreateTube(`border${i}`, { path, radius: AppConfig.RECT_BORDER_WIDTH, cap: BABYLON.Mesh.CAP_ALL }, scene);
            border.position = rect.position.clone();
            border.material = borderMaterial;
            border.setEnabled(false);
            allRects.push(border);

            const textPlane = createText(AppConfig.RECT_LABELS[i], i, scene);
            textPlane.position = rect.position.clone();
            textPlane.position.z += 0.01;
            textPlane.setEnabled(false);
            allRects.push(textPlane);
        }

        return allRects;
    };

    const createRoundedRectPath = (width, height, cornerRadius) => {
        const path = [];
        const hw = width / 2 - cornerRadius;
        const hh = height / 2 - cornerRadius;
        const segments = 16;

        const corners = [
            { x: hw, y: hh, startAngle: 0 },                   // Top-right
            { x: -hw, y: hh, startAngle: Math.PI / 2 },        // Top-left
            { x: -hw, y: -hh, startAngle: Math.PI },           // Bottom-left
            { x: hw, y: -hh, startAngle: 3 * Math.PI / 2 }     // Bottom-right
        ];

        corners.forEach(corner => {
            for (let i = 0; i <= segments; i++) {
                const angle = corner.startAngle + (Math.PI / 2) * (i / segments);
                path.push(new BABYLON.Vector3(corner.x + Math.cos(angle) * cornerRadius, corner.y + Math.sin(angle) * cornerRadius, 0));
            }
        });

        path.push(path[0]); // Close the path
        return path;
    };

    const createText = (text, index, scene) => {
        const plane = BABYLON.MeshBuilder.CreatePlane(`textPlane${index}`, { width: AppConfig.RECT_WIDTH * 0.8, height: AppConfig.RECT_HEIGHT * 0.3 }, scene);
        const texture = new BABYLON.DynamicTexture(`textTexture${index}`, { width: 512, height: 128 }, scene, true);
        texture.drawText(text, null, null, "bold 48px Arial", "white", "transparent", true);

        const material = new BABYLON.StandardMaterial(`textMat${index}`, scene);
        material.diffuseTexture = texture;
        material.emissiveTexture = texture;
        material.emissiveColor = new BABYLON.Color3(1, 1, 1);
        material.disableLighting = true;
        material.useAlphaFromDiffuseTexture = true;
        plane.material = material;
        return plane;
    };

    const loadModelAndSetupAnimation = async (camera, allRects) => {
        const { meshes, animationGroups } = await BABYLON.SceneLoader.ImportMeshAsync("", AppConfig.MODEL_PATH, AppConfig.MODEL_FILE, scene);

        const rootMesh = meshes[0];
        rootMesh.scaling = AppConfig.MESH_SCALE;
        rootMesh.position = AppConfig.MESH_START_POS;
        rootMesh.rotation = AppConfig.MESH_ROTATION;

        // Load wizard model
    const wizardResult = await BABYLON.SceneLoader.ImportMeshAsync("", AppConfig.MODEL_PATH, AppConfig.WIZARD_MODEL_FILE, scene);
    const wizardMesh = wizardResult.meshes[0];
    wizardMesh.position = new BABYLON.Vector3(0, AppConfig.RECT_Y_POS - 10, AppConfig.RECT_START_Z - 4); // 4 units in front of rectangles, 5 units lower on y axis
    wizardMesh.scaling = new BABYLON.Vector3(6.5, 6.5, 6.5); // Appropriate scale for the wizard
    wizardMesh.setEnabled(false); // Initially hidden like rectangles
        
        // Start wizard animation loop - find and play "wiz.idle" animation
        if (wizardResult.animationGroups.length > 0) {
            const idleAnimation = wizardResult.animationGroups.find(anim => anim.name === "wiz.idle");
            if (idleAnimation) {
                idleAnimation.play(true); // Loop the idle animation
            } else {
                // Fallback to first animation if "wiz.idle" not found
                wizardResult.animationGroups[0].play(true);
            }
        }
        
        wizardMesh.rotation = new BABYLON.Vector3(0, Math.PI, 0); // Rotate 180 degrees to face away
        
        // Add wizard to allRects so it animates with them
        allRects.push(wizardMesh);

        const motionBlur = new BABYLON.MotionBlurPostProcess("mb", scene, 1.0, camera);
        motionBlur.motionStrength = AppConfig.MOTION_BLUR_STRENGTH;
        motionBlur.motionBlurSamples = AppConfig.MOTION_BLUR_SAMPLES;
        motionBlur.excludedMeshes = [...scene.meshes.filter(m => m !== rootMesh && m !== wizardMesh)];
        motionBlur.isEnabled = false;

        if (animationGroups.length > 0) {
            const animation = animationGroups[0];
            animation.stop();

            const onCanvasClick = () => {
                canvas.removeEventListener('click', onCanvasClick);

                animation.play(false);

                // Use addOnce for a reliable callback when the animation group ends
                animation.onAnimationGroupEndObservable.addOnce(() => {
                    motionBlur.isEnabled = true;

                    // Trigger UI and mesh animations to run concurrently after their respective delays
                    setTimeout(() => {
                        animateUI(allRects, motionBlur, rootMesh);
                    }, AppConfig.ANIMATION_DELAY);

                    setTimeout(() => {
                        animateMeshFly(rootMesh);
                    }, AppConfig.MOVE_DELAY);
                });
            };
            canvas.addEventListener('click', onCanvasClick);
        }
    };

    const animateUI = async (allRects, motionBlur, rootMesh) => {
        allRects.forEach(r => r.setEnabled(true));

        // Create animations
        const fadeAnimation = new BABYLON.Animation("fade", "material.alpha", 60, BABYLON.Animation.ANIMATIONTYPE_FLOAT, BABYLON.Animation.ANIMATIONLOOPMODE_CONSTANT);
        fadeAnimation.setKeys([{ frame: 0, value: 0 }, { frame: 100, value: 1 }]);

        const flyAnimation = new BABYLON.Animation("fly", "position.z", 60, BABYLON.Animation.ANIMATIONTYPE_FLOAT, BABYLON.Animation.ANIMATIONLOOPMODE_CONSTANT);
        flyAnimation.setKeys([{ frame: 0, value: AppConfig.RECT_START_Z }, { frame: 100, value: AppConfig.RECT_TARGET_Z }]);

        // Run animations with promises
        const fadePromises = allRects
            .filter(r => r.material)
            .map(r => scene.beginDirectAnimation(r, [fadeAnimation], 0, 100, false, 1, null, AppConfig.FADE_DURATION / 1000).waitAsync());
        await Promise.all(fadePromises);

        motionBlur.excludedMeshes.push(...allRects);

        const flyPromises = allRects.map(r => scene.beginDirectAnimation(r, [flyAnimation], 0, 100, false, 1, null, AppConfig.FLY_DURATION / 1000).waitAsync());
        await Promise.all(flyPromises);

        motionBlur.excludedMeshes = scene.meshes.filter(m => m !== rootMesh);
    };

    const animateMeshFly = (rootMesh) => {
        const observer = scene.onBeforeRenderObservable.add(() => {
            rootMesh.position.z -= AppConfig.MESH_FLY_SPEED;
            if (rootMesh.position.z < -12) { // Past camera
                scene.onBeforeRenderObservable.remove(observer);
                rootMesh.dispose(); // Unload the gate-animated-1 model from memory
            }
        });
    };

    //-- MAIN EXECUTION --//
    const main = async () => {
        const camera = createCamera();
        createLighting();
        const allRects = createUI();
        await loadModelAndSetupAnimation(camera, allRects);

        engine.runRenderLoop(() => scene.render());
        window.addEventListener('resize', () => engine.resize());
        window.scene_ready = true; // Signal for Playwright
    };

    main();
});