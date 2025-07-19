// app/(tabs)/index.tsx - Simple Matter.js Physics Demo
import Matter from 'matter-js';
import React, { useEffect, useRef, useState } from 'react';
import { Dimensions, StyleSheet, Text, TouchableOpacity, View } from 'react-native';

const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get('window');

interface PhysicsBody {
  id: string;
  body: Matter.Body;
  color: string;
}

export default function PhysicsDemo() {
  const engineRef = useRef<Matter.Engine | null>(null);
  const [bodies, setBodies] = useState<PhysicsBody[]>([]);
  const animationRef = useRef<number | null>(null);

  useEffect(() => {
    // Create Matter.js engine
    const engine = Matter.Engine.create();
    engine.world.gravity.y = 0.8; // Adjust gravity
    engineRef.current = engine;

    // Create ground
    const ground = Matter.Bodies.rectangle(
      SCREEN_WIDTH / 2,
      SCREEN_HEIGHT - 30,
      SCREEN_WIDTH,
      60,
      {
        isStatic: true,
        render: { fillStyle: '#333' }
      }
    );

    // Create walls
    const leftWall = Matter.Bodies.rectangle(-30, SCREEN_HEIGHT / 2, 60, SCREEN_HEIGHT, { isStatic: true });
    const rightWall = Matter.Bodies.rectangle(SCREEN_WIDTH + 30, SCREEN_HEIGHT / 2, 60, SCREEN_HEIGHT, { isStatic: true });

    // Add static bodies to world
    Matter.World.add(engine.world, [ground, leftWall, rightWall]);

    // Create initial falling ball
    createBall();

    // Start the engine
    const gameLoop = () => {
      if (engineRef.current) {
        Matter.Engine.update(engineRef.current, 16.667); // 60 FPS
        updateBodies();
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
  }, []);

  const createBall = () => {
    if (!engineRef.current) return;

    // Random spawn position
    const x = Math.random() * (SCREEN_WIDTH - 100) + 50;
    const y = 50;

    // Random size and color
    const radius = Math.random() * 20 + 15;
    const colors = ['#ff6b6b', '#4ecdc4', '#45b7d1', '#96ceb4', '#feca57', '#ff9ff3'];
    const color = colors[Math.floor(Math.random() * colors.length)];

    // Create Matter.js body
    const body = Matter.Bodies.circle(x, y, radius, {
      restitution: 0.8, // Bounciness
      friction: 0.3,
      render: { fillStyle: color }
    });

    // Add to world
    Matter.World.add(engineRef.current.world, body);

    // Add to our state
    const physicsBody: PhysicsBody = {
      id: `ball_${Date.now()}_${Math.random()}`,
      body,
      color
    };

    setBodies(prev => [...prev, physicsBody]);
  };

  const updateBodies = () => {
    if (!engineRef.current) return;

    // Update all bodies based on Matter.js positions
    setBodies(prev =>
      prev.filter(physicsBody => {
        // Remove bodies that have fallen off screen
        if (physicsBody.body.position.y > SCREEN_HEIGHT + 100) {
          Matter.World.remove(engineRef.current!.world, physicsBody.body);
          return false;
        }
        return true;
      })
    );
  };

  const handleScreenTap = () => {
    createBall();
  };

  return (
    <TouchableOpacity
      style={styles.container}
      onPress={handleScreenTap}
      activeOpacity={1}
    >
      <View style={styles.gameArea}>
        {/* Render ground */}
        <View style={[styles.ground, {
          bottom: 0,
          width: SCREEN_WIDTH,
          height: 60
        }]} />

        {/* Render physics bodies */}
        {bodies.map(physicsBody => {
          const { body, id, color } = physicsBody;
          const radius = (body as any).circleRadius || 20;

          return (
            <View
              key={id}
              style={[
                styles.ball,
                {
                  left: body.position.x - radius,
                  top: body.position.y - radius,
                  width: radius * 2,
                  height: radius * 2,
                  borderRadius: radius,
                  backgroundColor: color,
                  transform: [{ rotate: `${body.angle}rad` }]
                }
              ]}
            />
          );
        })}
      </View>

      {/* UI */}
      <View style={styles.ui}>
        <Text style={styles.title}>Matter.js Physics Demo! 🔥</Text>
        <Text style={styles.instructions}>Tap anywhere to create a ball!</Text>
        <Text style={styles.info}>Balls: {bodies.length}</Text>
      </View>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#1a1a1a',
  },
  gameArea: {
    flex: 1,
    position: 'relative',
  },
  ground: {
    position: 'absolute',
    backgroundColor: '#333',
  },
  ball: {
    position: 'absolute',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 4,
    elevation: 5,
  },
  ui: {
    position: 'absolute',
    top: 60,
    left: 20,
    right: 20,
    alignItems: 'center',
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#fff',
    marginBottom: 8,
  },
  instructions: {
    fontSize: 16,
    color: '#ccc',
    marginBottom: 4,
  },
  info: {
    fontSize: 14,
    color: '#888',
  },
});