import { GLView } from 'expo-gl';
import React, { useEffect, useRef } from 'react';
import { Dimensions, StyleSheet, View } from 'react-native';
import * as THREE from 'three';

// Get device dimensions
const { width: screenWidth, height: screenHeight } = Dimensions.get('window');

interface GameEngineProps {
    onReady?: () => void;
    onError?: (error: Error) => void;
}

interface GameEngineContext {
    scene: THREE.Scene;
    camera: THREE.OrthographicCamera;
    renderer: THREE.WebGLRenderer;
    light: THREE.DirectionalLight;
    softLight: THREE.AmbientLight;
}

const GameEngine: React.FC<GameEngineProps> = ({ onReady, onError }) => {
    const contextRef = useRef<GameEngineContext | null>(null);
    const animationFrameRef = useRef<number | null>(null);
    const subscriptionRef = useRef<any>(null); // Store the subscription for cleanup

    // Handle screen resize - using EXACT original Stack game formula
    const handleResize = () => {
        const context = contextRef.current;
        if (!context) return;

        const { width, height } = Dimensions.get('window');
        const viewSize = 30; // Match original game

        context.renderer.setSize(width, height);

        // Use EXACT same formula as original Stack game onResize()
        context.camera.left = width / -viewSize;    // width / -30
        context.camera.right = width / viewSize;     // width / 30
        context.camera.top = height / viewSize;      // height / 30
        context.camera.bottom = height / -viewSize;  // height / -30
        context.camera.updateProjectionMatrix();
    };

    // Initialize Three.js scene
    const initializeThreeJS = (gl: WebGLRenderingContext) => {
        try {
            // Create renderer
            const renderer = new THREE.WebGLRenderer({
                canvas: {
                    width: screenWidth,
                    height: screenHeight,
                    style: {},
                    addEventListener: () => { },
                    removeEventListener: () => { },
                    clientHeight: screenHeight,
                    clientWidth: screenWidth,
                    getContext: () => gl,
                } as any,
                context: gl,
                antialias: true,
                alpha: false,
            });

            renderer.setSize(screenWidth, screenHeight);
            renderer.setClearColor('#D0CBC7', 1); // Match original game's background

            // Create scene
            const scene = new THREE.Scene();

            // Create orthographic camera (like in original Stack game)
            const aspect = screenWidth / screenHeight;
            const d = 20; // Match original initialization
            const camera = new THREE.OrthographicCamera(
                -d * aspect, d * aspect,
                d, -d,
                -100, 1000
            );

            // Position camera like in original game during play
            // Original setCamera(0) would set camera.y to 0 + 4 = 4
            camera.position.set(2, 4, 2);
            camera.lookAt(new THREE.Vector3(0, 0, 0));

            // Add lighting (match original game)
            const light = new THREE.DirectionalLight(0xffffff, 0.5);
            light.position.set(0, 499, 0);
            scene.add(light);

            const softLight = new THREE.AmbientLight(0xffffff, 0.4);
            scene.add(softLight);

            // Store context
            contextRef.current = {
                scene,
                camera,
                renderer,
                light,
                softLight,
            };

            // Now that context is set, set up proper camera sizing
            handleResize();

            // Listen for screen orientation/size changes and store subscription
            subscriptionRef.current = Dimensions.addEventListener('change', handleResize);

            // Add a test cube positioned like the first Stack block
            // Try different X positions to center it properly
            const geometry = new THREE.BoxGeometry(10, 2, 10); // Match original block dimensions
            const material = new THREE.MeshToonMaterial({
                color: 0x333344,
                // Note: THREE.FlatShading was deprecated, using default shading
            });
            const testCube = new THREE.Mesh(geometry, material);

            testCube.position.set(0, 1, 0);
            scene.add(testCube);

            // Start render loop
            startRenderLoop();

            // Notify parent component that setup is complete
            onReady?.();

        } catch (error) {
            console.error('Failed to initialize Three.js:', error);
            onError?.(error as Error);
        }
    };

    // Render loop
    const render = () => {
        const context = contextRef.current;
        if (!context) return;

        // Render the scene
        context.renderer.render(context.scene, context.camera);

        // Flush WebGL commands (important for React Native)
        const gl = context.renderer.getContext() as any;
        gl.flush();

        // endFrameEXP is an Expo-specific method, use optional chaining
        if (gl.endFrameEXP) {
            gl.endFrameEXP();
        }
    };

    // Start the animation loop
    const startRenderLoop = () => {
        const animate = () => {
            render();
            animationFrameRef.current = requestAnimationFrame(animate);
        };
        animate();
    };

    // Cleanup on unmount
    useEffect(() => {
        return () => {
            if (animationFrameRef.current) {
                cancelAnimationFrame(animationFrameRef.current);
            }

            // Clean up dimension change listener
            if (subscriptionRef.current) {
                subscriptionRef.current.remove();
            }

            const context = contextRef.current;
            if (context) {
                // Dispose of Three.js resources
                context.scene.traverse((child) => {
                    if (child instanceof THREE.Mesh) {
                        child.geometry.dispose();
                        if (child.material instanceof THREE.Material) {
                            child.material.dispose();
                        }
                    }
                });
            }
        };
    }, []);

    return (
        <View style={styles.container}>
            <GLView
                style={{ width: screenWidth, height: screenHeight }}
                onContextCreate={initializeThreeJS}
                // Enable multisampling for smoother edges
                msaaSamples={4}
            />
        </View>
    );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#D0CBC7',
        width: screenWidth,
        height: screenHeight,
    },
});

export default GameEngine;