// components/GameUI.tsx - Overlay UI Interface
import React from 'react';
import { StyleSheet, Text, View } from 'react-native';

interface GameUIProps {
    title?: string;
    instructions?: string;
    stats?: {
        label: string;
        value: string | number;
    }[];
    position?: 'top' | 'bottom' | 'center';
}

const GameUI: React.FC<GameUIProps> = ({
    title = "Matter.js Physics Demo! 🔥",
    instructions = "Tap anywhere to create a ball!",
    stats = [],
    position = 'top'
}) => {
    const containerStyle = [
        styles.container,
        position === 'top' && styles.topPosition,
        position === 'bottom' && styles.bottomPosition,
        position === 'center' && styles.centerPosition,
    ];

    return (
        <View style={containerStyle}>
            {title && <Text style={styles.title}>{title}</Text>}

            {instructions && (
                <Text style={styles.instructions}>{instructions}</Text>
            )}

            {stats.length > 0 && (
                <View style={styles.statsContainer}>
                    {stats.map((stat, index) => (
                        <Text key={index} style={styles.stat}>
                            {stat.label}: {stat.value}
                        </Text>
                    ))}
                </View>
            )}
        </View>
    );
};

const styles = StyleSheet.create({
    container: {
        position: 'absolute',
        left: 20,
        right: 20,
        alignItems: 'center',
        backgroundColor: 'rgba(0, 0, 0, 0.3)',
        borderRadius: 12,
        padding: 16,
    },
    topPosition: {
        top: 60,
    },
    bottomPosition: {
        bottom: 60,
    },
    centerPosition: {
        top: '50%',
        transform: [{ translateY: -50 }],
    },
    title: {
        fontSize: 24,
        fontWeight: 'bold',
        color: '#fff',
        marginBottom: 8,
        textAlign: 'center',
    },
    instructions: {
        fontSize: 16,
        color: '#ccc',
        marginBottom: 8,
        textAlign: 'center',
    },
    statsContainer: {
        alignItems: 'center',
    },
    stat: {
        fontSize: 14,
        color: '#888',
        marginBottom: 2,
    },
});

export default GameUI;