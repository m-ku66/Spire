// components/GameRenderer.tsx - Physics Body Renderer
import Matter from 'matter-js';
import React from 'react';
import { Dimensions, StyleSheet, View } from 'react-native';

const { width: SCREEN_WIDTH } = Dimensions.get('window');

export interface RenderableBody {
    id: string;
    body: Matter.Body;
    color: string;
    type: 'circle' | 'rectangle';
}

interface GameRendererProps {
    bodies: RenderableBody[];
    showGround?: boolean;
}

const GameRenderer: React.FC<GameRendererProps> = ({
    bodies,
    showGround = true
}) => {
    return (
        <View style={styles.container}>
            {/* Render ground if enabled */}
            {showGround && (
                <View style={styles.ground} />
            )}

            {/* Render all physics bodies */}
            {bodies.map(renderableBody => {
                const { body, id, color, type } = renderableBody;

                if (type === 'circle') {
                    const radius = (body as any).circleRadius || 20;

                    return (
                        <View
                            key={id}
                            style={[
                                styles.physicsBody,
                                styles.circle,
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
                } else if (type === 'rectangle') {
                    // For rectangles, we need to get bounds from the body
                    const bounds = body.bounds;
                    const width = bounds.max.x - bounds.min.x;
                    const height = bounds.max.y - bounds.min.y;

                    return (
                        <View
                            key={id}
                            style={[
                                styles.physicsBody,
                                styles.rectangle,
                                {
                                    left: body.position.x - width / 2,
                                    top: body.position.y - height / 2,
                                    width: width,
                                    height: height,
                                    backgroundColor: color,
                                    transform: [{ rotate: `${body.angle}rad` }]
                                }
                            ]}
                        />
                    );
                }

                return null;
            })}
        </View>
    );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
        position: 'relative',
    },
    ground: {
        position: 'absolute',
        bottom: 0,
        width: SCREEN_WIDTH,
        height: 60,
        backgroundColor: '#333',
    },
    physicsBody: {
        position: 'absolute',
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.3,
        shadowRadius: 4,
        elevation: 5,
    },
    circle: {
        // Circle-specific styles (already handled in inline styles)
    },
    rectangle: {
        // Rectangle-specific styles
        borderRadius: 4,
    },
});

export default GameRenderer;