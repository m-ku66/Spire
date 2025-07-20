// app/(tabs)/index.tsx - Refactored Main Component
import Matter from 'matter-js';
import React, { useCallback, useRef, useState } from 'react';
import { Dimensions, StyleSheet, View } from 'react-native';

// Import our modular components
import GameControls from '../../components/GameControls';
import GameRenderer, { RenderableBody } from '../../components/GameRenderer';
import GameUI from '../../components/GameUI';
import PhysicsEngine, { PhysicsEngineRef } from '../../components/PhysicsEngine';

const { width: SCREEN_WIDTH } = Dimensions.get('window');

export default function PhysicsDemo() {
  const physicsEngineRef = useRef<PhysicsEngineRef>(null);
  const [renderableBodies, setRenderableBodies] = useState<RenderableBody[]>([]);

  // Handle physics engine updates
  const handlePhysicsUpdate = useCallback((bodies: Matter.Body[]) => {
    // Convert Matter.js bodies to renderable objects
    const updatedBodies: RenderableBody[] = bodies.map((body, index) => ({
      id: `ball_${body.id}_${index}`,
      body,
      color: (body.render as any)?.fillStyle || '#4ecdc4',
      type: 'circle' as const
    }));

    setRenderableBodies(updatedBodies);
  }, []);

  // Create a new ball when screen is tapped
  const createBall = useCallback(() => {
    if (!physicsEngineRef.current) return;

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

    // Add to physics engine
    physicsEngineRef.current.addBody(body);
  }, []);

  // Prepare stats for UI
  const stats = [
    { label: 'Balls', value: renderableBodies.length },
    { label: 'FPS', value: '60' }, // Could calculate real FPS later
  ];

  return (
    <View style={styles.container}>
      {/* Physics Engine - handles all Matter.js logic */}
      <PhysicsEngine
        ref={physicsEngineRef}
        onUpdate={handlePhysicsUpdate}
        gravity={0.8}
        isRunning={true}
      />

      {/* Game Controls - handles all touch interactions */}
      <GameControls onTap={createBall}>
        {/* Game Renderer - renders all physics bodies */}
        <GameRenderer
          bodies={renderableBodies}
          showGround={true}
        />
      </GameControls>

      {/* Game UI - shows overlay information */}
      <GameUI
        title="Matter.js Physics Demo! 🔥"
        instructions="Tap anywhere to create a ball!"
        stats={stats}
        position="top"
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#1a1a1a',
  },
});