from playwright.sync_api import sync_playwright
import os

def run_verification():
    """
    This script verifies the Babylon.js application by:
    1. Launching a browser with WebGL-compatible flags.
    2. Opening the local index.html file.
    3. Waiting for the 3D model to be loaded, ensuring the scene is ready.
    4. Taking a screenshot of the initial static scene.
    5. Clicking the canvas to trigger the main animation.
    6. Waiting for animations to complete.
    7. Taking a final screenshot of the scene after the UI elements have animated.
    """
    with sync_playwright() as p:
        browser = p.chromium.launch(
            headless=True,
            args=[
                "--headless",
                "--disable-gpu",
                "--use-gl=swiftshader",
                "--no-sandbox"
            ]
        )
        page = browser.new_page()

        # Construct the absolute path to the index.html file
        file_path = os.path.abspath('index.html')

        # Navigate to the local HTML file and wait for the model to be requested
        # This is a reliable way to know the scene is being set up.
        with page.expect_request("**/gate-animated-1.glb", timeout=10000) as request_info:
            page.goto(f'file://{file_path}')

        print("3D model request detected. Scene should be ready.")

        # Give it an extra moment for the initial render after model load
        page.wait_for_timeout(2000)

        # 1. Take a screenshot of the initial state
        page.screenshot(path='jules-scratch/verification/01_initial_view.png')

        # 2. Click the canvas to start the animation sequence
        page.click('#renderCanvas')

        # 3. Wait for animations to finish
        page.wait_for_timeout(5000)

        # 4. Take the final screenshot
        page.screenshot(path='jules-scratch/verification/verification.png')

        browser.close()
        print("Verification script completed and screenshots saved.")

if __name__ == '__main__':
    run_verification()