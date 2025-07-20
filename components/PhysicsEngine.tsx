// components/PhysicsEngine.tsx - Matter.js Engine Handler
import Matter from 'matter-js';
import { forwardRef, useEffect, useImperativeHandle, useRef } from 'react';
import { Dimensions } from 'react-native';

const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get('window');

export interface PhysicsEngineRef {
    addBody: (body: Matter.Body) => void;
    removeBody: (body: Matter.Body) => void;
    getEngine: () => Matter.Engine | null;
    getAllBodies: () => Matter.Body[];
}

interface PhysicsEngineProps {
    onUpdate?: (bodies: Matter.Body[]) => void;
    gravity?: number;
    isRunning?: boolean;
}

const PhysicsEngine = forwardRef<PhysicsEngineRef, PhysicsEngineProps>(
    ({ onUpdate, gravity = 0.8, isRunning = true }, ref) => {
        const engineRef = useRef<Matter.Engine | null>(null);
        const animationRef = useRef<number | null>(null);
        const dynamicBodiesRef = useRef<Matter.Body[]>([]);

        useImperativeHandle(ref, () => ({
            addBody: (body: Matter.Body) => {
                if (engineRef.current) {
                    Matter.World.add(engineRef.current.world, body);
                    dynamicBodiesRef.current.push(body);
                }
            },
            removeBody: (body: Matter.Body) => {
                if (engineRef.current) {
                    Matter.World.remove(engineRef.current.world, body);
                    dynamicBodiesRef.current = dynamicBodiesRef.current.filter(b => b !== body);
                }
            },
            getEngine: () => engineRef.current,
            getAllBodies: () => dynamicBodiesRef.current,
        }));

        useEffect(() => {
            // Create Matter.js engine
            const engine = Matter.Engine.create();
            engine.world.gravity.y = gravity;
            engineRef.current = engine;

            // Create static world boundaries
            const ground = Matter.Bodies.rectangle(
                SCREEN_WIDTH / 2,
                SCREEN_HEIGHT - 30,
                SCREEN_WIDTH,
                60,
                {
                    isStatic: true,
                    render: { fillStyle: '#333' },
                    label: 'ground'
                }
            );

            const leftWall = Matter.Bodies.rectangle(
                -30,
                SCREEN_HEIGHT / 2,
                60,
                SCREEN_HEIGHT,
                {
                    isStatic: true,
                    label: 'leftWall'
                }
            );

            const rightWall = Matter.Bodies.rectangle(
                SCREEN_WIDTH + 30,
                SCREEN_HEIGHT / 2,
                60,
                SCREEN_HEIGHT,
                {
                    isStatic: true,
                    label: 'rightWall'
                }
            );

            // Add static bodies to world
            Matter.World.add(engine.world, [ground, leftWall, rightWall]);

            // Start the physics loop
            const gameLoop = () => {
                if (engineRef.current && isRunning) {
                    // Update physics engine
                    Matter.Engine.update(engineRef.current, 16.667); // 60 FPS

                    // Clean up bodies that have fallen off screen
                    const bodiesToRemove: Matter.Body[] = [];
                    dynamicBodiesRef.current.forEach(body => {
                        if (body.position.y > SCREEN_HEIGHT + 100) {
                            bodiesToRemove.push(body);
                        }
                    });

                    // Remove off-screen bodies
                    bodiesToRemove.forEach(body => {
                        Matter.World.remove(engineRef.current!.world, body);
                    });
                    dynamicBodiesRef.current = dynamicBodiesRef.current.filter(
                        body => !bodiesToRemove.includes(body)
                    );

                    // Notify parent component of body updates
                    if (onUpdate) {
                        onUpdate([...dynamicBodiesRef.current]);
                    }
                }

                animationRef.current = requestAnimationFrame(gameLoop);
            };

            gameLoop();

            // Cleanup on unmount
            return () => {
                if (animationRef.current) {
                    cancelAnimationFrame(animationRef.current);
                }
                if (engineRef.current) {
                    Matter.Engine.clear(engineRef.current);
                }
            };
        }, [gravity, isRunning, onUpdate]);

        // This component doesn't render anything - it just manages physics
        return null;
    }
);

PhysicsEngine.displayName = 'PhysicsEngine';

export default PhysicsEngine;