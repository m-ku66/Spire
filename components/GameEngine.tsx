import { GLView } from 'expo-gl';
import React, { useEffect, useRef, useState } from 'react';
import { Dimensions, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import * as THREE from 'three';
import Block from './BlockClass'; // Import our Block class
import {
    getCurrentBackgroundColor,
    getCurrentMessageColor,
    getCurrentScoreColor
} from './themes'; // Import our theme system!

// Get device dimensions
const { width: screenWidth, height: screenHeight } = Dimensions.get('window');
const { width: screenWidthPixels, height: screenHeightPixels } = Dimensions.get('screen');

interface GameEngineProps {
    onReady?: () => void;
    onError?: (error: Error) => void;
    onScoreUpdate?: (score: number) => void;
    onGameOver?: (finalScore: number) => void;
}

interface GameEngineContext {
    scene: THREE.Scene;
    camera: THREE.OrthographicCamera;
    renderer: THREE.WebGLRenderer;
    light: THREE.DirectionalLight;
    softLight: THREE.AmbientLight;
    // Game-specific Three.js groups
    newBlocks: THREE.Group;
    placedBlocks: THREE.Group;
    choppedBlocks: THREE.Group;
}

// Game states (matching original Stack game)
const GAME_STATES = {
    LOADING: 'loading',
    PLAYING: 'playing',
    READY: 'ready',
    ENDED: 'ended',
    RESETTING: 'resetting'
} as const;

type GameState = typeof GAME_STATES[keyof typeof GAME_STATES];

const GameEngine: React.FC<GameEngineProps> = ({ onReady, onError, onScoreUpdate, onGameOver }) => {
    const contextRef = useRef<GameEngineContext | null>(null);
    const animationFrameRef = useRef<number | null>(null);
    const subscriptionRef = useRef<any>(null); // Store the subscription for cleanup

    // Game state management
    const [gameState, setGameState] = useState<GameState>(GAME_STATES.LOADING);
    const gameStateRef = useRef<GameState>(GAME_STATES.LOADING);
    const [score, setScore] = useState(0);
    const blocksRef = useRef<Block[]>([]); // Array of Block instances

    // Camera animation state
    const cameraAnimationRef = useRef<{
        isAnimating: boolean;
        startY: number;
        targetY: number;
        startTime: number;
        duration: number;
    }>({
        isAnimating: false,
        startY: 4,
        targetY: 4,
        startTime: 0,
        duration: 800 // 800ms animation duration
    });

    // And update the ref whenever state changes by adding this useEffect:
    useEffect(() => {
        gameStateRef.current = gameState;
    }, [gameState]);

    // Easing function (easeOutCubic for smooth deceleration)
    const easeOutCubic = (t: number): number => {
        return 1 - Math.pow(1 - t, 3);
    };

    // Update camera animation in render loop
    const updateCameraAnimation = () => {
        const animation = cameraAnimationRef.current;
        const context = contextRef.current;

        if (!animation.isAnimating || !context) return;

        const elapsed = Date.now() - animation.startTime;
        const progress = Math.min(elapsed / animation.duration, 1);

        // Apply easing
        const easedProgress = easeOutCubic(progress);

        // Interpolate camera position
        const currentY = animation.startY + (animation.targetY - animation.startY) * easedProgress;

        // Update camera position
        context.camera.position.y = currentY;

        // Update lookAt target
        const lookAtY = currentY - 4; // Since camera is 4 units above the target
        const lookAtTarget = new THREE.Vector3(0, lookAtY, 0);
        context.camera.lookAt(lookAtTarget);

        // Update camera matrix
        context.camera.updateMatrixWorld();

        // Check if animation is complete
        if (progress >= 1) {
            animation.isAnimating = false;
        }
    };

    // Smooth camera animation function (replaces the old setCameraPosition)
    const setCameraPosition = (y: number, duration: number = 800) => {
        const context = contextRef.current;
        if (!context) return;

        const animation = cameraAnimationRef.current;
        const targetY = y + 4; // Camera is 4 units above the target

        // If already at target, no animation needed
        if (Math.abs(context.camera.position.y - targetY) < 0.1) {
            return;
        }

        console.log(`Starting smooth camera animation to y=${targetY}, duration=${duration}ms`);

        // Set up animation parameters
        animation.startY = context.camera.position.y;
        animation.targetY = targetY;
        animation.startTime = Date.now();
        animation.duration = duration;
        animation.isAnimating = true;
    };

    // Add first block to start the game
    const addBlock = () => {
        const lastBlock = blocksRef.current[blocksRef.current.length - 1];

        // Check if last block missed (game over condition)
        if (lastBlock && lastBlock.state === lastBlock.STATES.MISSED) {
            console.log('Last block missed - ending game');
            return endGame();
        }

        // Update score display
        const newScore = blocksRef.current.length;
        setScore(newScore);

        // Notify parent component of score update
        onScoreUpdate?.(newScore);

        // Create new block
        const newBlock = new Block(lastBlock || null);
        console.log(`Adding block ${newBlock.index}`);

        // Add to blocks array
        blocksRef.current.push(newBlock);

        // Add mesh to scene
        const context = contextRef.current;
        if (context && newBlock.mesh) {
            context.newBlocks.add(newBlock.mesh);
        }

        // Move camera to follow the stack (now with smooth animation!)
        setCameraPosition(blocksRef.current.length * 2);

        console.log(`Block ${newBlock.index} added to game`);
    };

    // Game action handler (tap/click)
    const onGameAction = () => {
        console.log(`Game action triggered! Current state: ${gameState}`);

        switch (gameState) {
            case GAME_STATES.READY:
                startGame();
                break;
            case GAME_STATES.PLAYING:
                placeBlock();
                break;
            case GAME_STATES.ENDED:
                restartGame();
                break;
        }
    };

    // Game methods
    const startGame = () => {
        console.log('Starting game!');
        if (gameState !== GAME_STATES.PLAYING) {
            setScore(0);
            setGameState(GAME_STATES.PLAYING);
            addBlock(); // Add the first block
        }
    };

    const placeBlock = () => {
        console.log('Placing block!');

        const currentBlock = blocksRef.current[blocksRef.current.length - 1];
        if (!currentBlock) return;

        // Place the block and get the result
        const placementResult = currentBlock.place();

        const context = contextRef.current;
        if (!context) return;

        // Remove the moving block from newBlocks group
        if (currentBlock.mesh) {
            context.newBlocks.remove(currentBlock.mesh);
        } else {
            console.log('No mesh found for current block');
        }

        // Add placed block to placedBlocks group
        if (placementResult.placed) {
            context.placedBlocks.add(placementResult.placed);
            console.log('Placed block added to scene');
        }

        // Handle chopped piece with falling animation
        if (placementResult.chopped) {
            context.choppedBlocks.add(placementResult.chopped);
            console.log('Chopped block added to scene');

            // Create falling animation for chopped piece
            animateChoppedBlock(placementResult.chopped, placementResult);
        }

        // Add next block
        addBlock();
    };

    // Animate chopped block falling (simplified version)
    const animateChoppedBlock = (choppedMesh: THREE.Mesh, result: any) => {
        const context = contextRef.current;
        if (!context) return;

        // Simple falling animation
        const fallDirection = result.plane;
        const fallSpeed = 40 * Math.abs(result.direction);

        // Animate position and rotation
        const startTime = Date.now();
        const animationDuration = 1000; // 1 second

        const animateFrame = () => {
            const elapsed = Date.now() - startTime;
            const progress = Math.min(elapsed / animationDuration, 1);

            // Fall down
            choppedMesh.position.y -= 30 * progress * 0.016; // Approximate frame time

            // Move sideways
            choppedMesh.position.set(
                fallDirection === 'x' ? choppedMesh.position.x + fallSpeed * progress * 0.016 : choppedMesh.position.x,
                choppedMesh.position.y,
                fallDirection === 'z' ? choppedMesh.position.z + fallSpeed * progress * 0.016 : choppedMesh.position.z
            );

            // Add rotation
            choppedMesh.rotation.x += 0.1 * progress;
            choppedMesh.rotation.z += 0.1 * progress;

            // Continue animation or cleanup
            if (progress < 1) {
                requestAnimationFrame(animateFrame);
            } else {
                // Remove from scene after animation
                context.choppedBlocks.remove(choppedMesh);
                choppedMesh.geometry.dispose();
                (choppedMesh.material as THREE.Material).dispose();
            }
        };

        requestAnimationFrame(animateFrame);
    };

    const restartGame = () => {
        console.log('Restarting game!');
        setGameState(GAME_STATES.RESETTING);

        const context = contextRef.current;
        if (context) {
            // Clean up all blocks
            blocksRef.current.forEach(block => {
                block.dispose(); // Clean up Block resources
            });

            // Clear all block groups
            context.newBlocks.clear();
            context.placedBlocks.clear();
            context.choppedBlocks.clear();
        }

        // Reset game state
        blocksRef.current = [];
        setScore(0);

        // Reset camera position (with smooth animation!)
        setCameraPosition(0);

        // Restart the game after a brief delay
        setTimeout(() => {
            setGameState(GAME_STATES.READY);
        }, 500);

        // Add the foundation block
        setTimeout(() => {
            console.log('Adding foundation block...');
            addBlock();
        }, 100); // Small delay to ensure state is set
        console.log('Game reset complete!');
    };

    const endGame = () => {
        console.log('Game ended!');
        const finalScore = blocksRef.current.length - 1; // Subtract 1 because we don't count the foundation block
        setGameState(GAME_STATES.ENDED);

        // Notify parent component of game over with final score
        onGameOver?.(finalScore);
    };

    // Game tick function - updates active blocks
    const gameTick = () => {
        if (gameStateRef.current === GAME_STATES.PLAYING && blocksRef.current.length > 0) {
            const currentBlock = blocksRef.current[blocksRef.current.length - 1];

            if (currentBlock) {
                currentBlock.tick(); // Update block movement
            }
        }
    };

    // Handle screen resize - using CONSISTENT aspect ratio method + device pixel ratio
    const handleResize = () => {
        const context = contextRef.current;
        if (!context) return;

        const { width, height } = Dimensions.get('window');

        // Get actual WebGL drawing buffer dimensions
        const gl = context.renderer.getContext() as any;
        const actualWidth = gl.drawingBufferWidth || gl.canvas.width || width;
        const actualHeight = gl.drawingBufferHeight || gl.canvas.height || height;

        const d = 20; // Same d value used in initialization
        const aspect = actualWidth / actualHeight; // Use ACTUAL render dimensions for aspect ratio

        // Update renderer to use actual dimensions
        try {
            context.renderer.setSize(width, height);
            // Set the viewport to match the actual drawing buffer
            context.renderer.setViewport(0, 0, actualWidth, actualHeight);
        } catch (error) {
            console.warn(`Renderer setup failed:`, error);
        }

        // Calculate new camera bounds using ACTUAL aspect ratio
        const newLeft = -d * aspect;   // Use actual aspect ratio
        const newRight = d * aspect;   // Use actual aspect ratio
        const newTop = d;              // Same as initialization: 20
        const newBottom = -d;          // Same as initialization: -20

        // Use CONSISTENT aspect ratio method with actual dimensions
        context.camera.left = newLeft;
        context.camera.right = newRight;
        context.camera.top = newTop;
        context.camera.bottom = newBottom;
        context.camera.updateProjectionMatrix();
    };

    // Initialize Three.js scene
    const initializeThreeJS = (gl: WebGLRenderingContext) => {
        try {
            // Get actual WebGL drawing buffer dimensions
            const actualWidth = gl.drawingBufferWidth || screenWidth;
            const actualHeight = gl.drawingBufferHeight || screenHeight;

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
            // Set viewport to match actual WebGL buffer dimensions
            renderer.setViewport(0, 0, actualWidth, actualHeight);

            // Use theme system for background color! 🎨
            renderer.setClearColor(getCurrentBackgroundColor(), 1);

            // Create scene
            const scene = new THREE.Scene();

            // Create orthographic camera using ACTUAL render dimensions
            const aspect = actualWidth / actualHeight;
            const d = 20; // Match original initialization

            const camera = new THREE.OrthographicCamera(
                -d * aspect, d * aspect,
                d, -d,
                -100, 1000
            );

            // Position camera like in original game during play
            camera.position.set(2, 4, 2);
            camera.lookAt(new THREE.Vector3(0, 0, 0));

            // Add lighting (match original game)
            const light = new THREE.DirectionalLight(0xffffff, 0.5);
            light.position.set(0, 499, 0);
            scene.add(light);

            const softLight = new THREE.AmbientLight(0xffffff, 0.4);
            scene.add(softLight);

            // Create Three.js groups for organizing blocks (like original game)
            const newBlocks = new THREE.Group();
            const placedBlocks = new THREE.Group();
            const choppedBlocks = new THREE.Group();
            scene.add(newBlocks);
            scene.add(placedBlocks);
            scene.add(choppedBlocks);
            console.log(`Three.js groups created and added to scene`);

            // Store context
            contextRef.current = {
                scene,
                camera,
                renderer,
                light,
                softLight,
                newBlocks,
                placedBlocks,
                choppedBlocks,
            };

            console.log(`Context stored successfully!`);

            // Now that context is set, set up proper camera sizing
            console.log(`Calling handleResize() for initial setup...`);
            handleResize();

            // Listen for screen orientation/size changes and store subscription
            console.log(`Setting up Dimensions change listener...`);
            subscriptionRef.current = Dimensions.addEventListener('change', ({ window, screen }) => {
                console.log(`Dimensions change event triggered!`);
                console.log(`Window: ${window.width}x${window.height}`);
                console.log(`Screen: ${screen.width}x${screen.height}`);
                handleResize();
            });

            // Start render loop
            console.log(`Starting render loop...`);
            startRenderLoop();

            // Set initial game state to READY and add first block
            console.log(`Setting game state to READY`);
            setGameState(GAME_STATES.READY);

            // Add the foundation block
            setTimeout(() => {
                console.log('Adding foundation block...');
                addBlock();
            }, 100); // Small delay to ensure state is set

            // Notify parent component that setup is complete
            console.log(`Game engine ready!`);
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

        // Update game logic
        gameTick();

        // Update camera animation
        updateCameraAnimation();

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
            console.log(`Cleaning up GameEngine...`);

            if (animationFrameRef.current) {
                cancelAnimationFrame(animationFrameRef.current);
                console.log(`Animation frame canceled`);
            }

            // Clean up dimension change listener
            if (subscriptionRef.current) {
                subscriptionRef.current.remove();
                console.log(`Dimensions listener removed`);
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
                console.log(`Three.js resources disposed`);
            }
        };
    }, []);

    // Create dynamic styles that use theme colors! 🎨
    const dynamicStyles = StyleSheet.create({
        container: {
            flex: 1,
            backgroundColor: getCurrentBackgroundColor(), // Theme-aware background!
        },
        glView: {
            flex: 1,
        },
        uiOverlay: {
            position: 'absolute',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            pointerEvents: 'none', // Allow touches to pass through to TouchableOpacity
            justifyContent: 'space-between',
            alignItems: 'center',
            paddingTop: 60,
            paddingBottom: 100,
        },
        scoreContainer: {
            alignItems: 'center',
        },
        scoreText: {
            fontSize: 48,
            fontWeight: 'regular',
            color: getCurrentScoreColor(), // Theme-aware score color!
        },
        messageContainer: {
            alignItems: 'center',
            paddingHorizontal: 20,
        },
        messageText: {
            fontSize: 24,
            fontWeight: '400',
            color: getCurrentMessageColor(), // Theme-aware message color!
            textAlign: 'center',
            overflow: 'hidden',
        },
        touchArea: {
            position: 'absolute',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
        },
    });

    return (
        <View style={dynamicStyles.container}>
            <GLView
                style={dynamicStyles.glView}
                onContextCreate={initializeThreeJS}
                // Enable multisampling for smoother edges
                msaaSamples={4}
            />

            {/* Game UI Overlay */}
            <View style={dynamicStyles.uiOverlay}>
                {/* Score Display */}
                <View style={dynamicStyles.scoreContainer}>
                    <Text style={dynamicStyles.scoreText}>{score}</Text>
                </View>

                {/* Game State Messages */}
                <View style={dynamicStyles.messageContainer}>
                    {gameState === GAME_STATES.READY && (
                        <Text style={dynamicStyles.messageText}>Tap to Start!</Text>
                    )}
                    {/* {gameState === GAME_STATES.PLAYING && (
                        <Text style={dynamicStyles.messageText}>Tap to Drop Block!</Text>
                    )} */}
                    {gameState === GAME_STATES.ENDED && (
                        <Text style={dynamicStyles.messageText}>Game Over! Tap to Restart</Text>
                    )}
                    {gameState === GAME_STATES.RESETTING && (
                        <Text style={dynamicStyles.messageText}>Restarting...</Text>
                    )}
                </View>
            </View>

            {/* Touch Handler - covers entire screen */}
            <TouchableOpacity
                style={dynamicStyles.touchArea}
                onPress={onGameAction}
                activeOpacity={1} // No visual feedback needed
            />
        </View>
    );
};

export default GameEngine;