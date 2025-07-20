// components/GameControls.tsx - Touch Interaction Handler
import React from 'react';
import { GestureResponderEvent, StyleSheet, TouchableOpacity } from 'react-native';

interface GameControlsProps {
    children: React.ReactNode;
    onTap?: (event: GestureResponderEvent) => void;
    onDoubleTap?: (event: GestureResponderEvent) => void;
    onLongPress?: (event: GestureResponderEvent) => void;
    disabled?: boolean;
}

const GameControls: React.FC<GameControlsProps> = ({
    children,
    onTap,
    onDoubleTap,
    onLongPress,
    disabled = false
}) => {
    let tapTimeout: number | null = null; // might need to be a timeout??? Not sure yet
    let tapCount = 0;

    const handlePress = (event: GestureResponderEvent) => {
        if (disabled) return;

        tapCount++;

        if (tapCount === 1) {
            // Wait to see if there's a second tap for double tap
            tapTimeout = setTimeout(() => {
                if (onTap) {
                    onTap(event);
                }
                tapCount = 0;
            }, 300);
        } else if (tapCount === 2) {
            // Double tap detected
            if (tapTimeout) {
                clearTimeout(tapTimeout);
                tapTimeout = null;
            }

            if (onDoubleTap) {
                onDoubleTap(event);
            } else if (onTap) {
                // Fallback to single tap if no double tap handler
                onTap(event);
            }

            tapCount = 0;
        }
    };

    const handleLongPress = (event: GestureResponderEvent) => {
        if (disabled) return;

        // Clear any pending single/double tap
        if (tapTimeout) {
            clearTimeout(tapTimeout);
            tapTimeout = null;
        }
        tapCount = 0;

        if (onLongPress) {
            onLongPress(event);
        }
    };

    return (
        <TouchableOpacity
            style={styles.container}
            onPress={handlePress}
            onLongPress={handleLongPress}
            activeOpacity={1}
            disabled={disabled}
        >
            {children}
        </TouchableOpacity>
    );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
    },
});

export default GameControls;