import { AppState, ModalType, useAppState } from '@/components/AppStateProvider';
import GameEngine from '@/components/GameEngine';
import { StatusBar } from 'expo-status-bar';
import React from 'react';
import { ActivityIndicator, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { getCurrentBackgroundColor, getCurrentMessageColor, getCurrentScoreColor } from './themes';

const GameContainer: React.FC = () => {
    const {
        state,
        setAppState,
        openModal,
        closeModal,
        startNewGame,
        updateScore,
        endGame,
    } = useAppState();

    // Handle GameEngine callbacks
    const handleGameReady = () => {
        console.log('GameEngine ready in GameContainer');
    };

    const handleGameError = (error: Error) => {
        console.error('GameEngine error in GameContainer:', error);
    };

    // Handle GameEngine score updates
    const handleScoreUpdate = (newScore: number) => {
        updateScore(newScore);
    };

    // Handle GameEngine game over
    const handleGameOver = (finalScore: number) => {
        endGame(finalScore);
    };

    // Render loading screen
    const renderLoadingScreen = () => (
        <View style={[styles.fullScreen, styles.centered, { backgroundColor: getCurrentBackgroundColor() }]}>
            <ActivityIndicator size="large" color={getCurrentScoreColor()} />
            <Text style={[styles.loadingText, { color: getCurrentScoreColor() }]}>
                Loading Spire...
            </Text>
        </View>
    );

    // Render main menu screen
    const renderMainMenu = () => (
        <View style={[styles.fullScreen, styles.centered, { backgroundColor: getCurrentBackgroundColor() }]}>
            <View style={styles.menuContainer}>
                {/* Game Title */}
                <Text style={[styles.gameTitle, { color: getCurrentScoreColor() }]}>
                    SPIRE
                </Text>

                {/* High Score Display */}
                <Text style={[styles.highScoreText, { color: getCurrentMessageColor() }]}>
                    High Score: {state.playerData.highScore}
                </Text>

                {/* Currency Display */}
                <View style={styles.currencyContainer}>
                    <Text style={[styles.currencyIcon, { color: getCurrentScoreColor() }]}>💰</Text>
                    <Text style={[styles.currencyText, { color: getCurrentScoreColor() }]}>
                        {state.playerData.currency}
                    </Text>
                </View>

                {/* Menu Buttons */}
                <TouchableOpacity
                    style={[styles.menuButton, { borderColor: getCurrentScoreColor() }]}
                    onPress={startNewGame}
                >
                    <Text style={[styles.menuButtonText, { color: getCurrentScoreColor() }]}>
                        START GAME
                    </Text>
                </TouchableOpacity>

                <TouchableOpacity
                    style={[styles.menuButton, { borderColor: getCurrentMessageColor() }]}
                    onPress={() => openModal(ModalType.SHOP)}
                >
                    <Text style={[styles.menuButtonText, { color: getCurrentMessageColor() }]}>
                        🛍️ SHOP
                    </Text>
                </TouchableOpacity>

                <TouchableOpacity
                    style={[styles.menuButton, { borderColor: getCurrentMessageColor() }]}
                    onPress={() => openModal(ModalType.DAILY_REWARDS)}
                >
                    <Text style={[styles.menuButtonText, { color: getCurrentMessageColor() }]}>
                        🎁 DAILY REWARDS
                    </Text>
                </TouchableOpacity>
            </View>
        </View>
    );

    // Render game over screen
    const renderGameOverScreen = () => (
        <View style={[styles.fullScreen, styles.centered, { backgroundColor: getCurrentBackgroundColor() }]}>
            <View style={styles.gameOverContainer}>
                <Text style={[styles.gameOverTitle, { color: getCurrentScoreColor() }]}>
                    GAME OVER
                </Text>

                <Text style={[styles.finalScoreText, { color: getCurrentScoreColor() }]}>
                    Score: {state.currentScore}
                </Text>

                {state.currentScore === state.playerData.highScore && (
                    <Text style={[styles.newRecordText, { color: getCurrentScoreColor() }]}>
                        🎉 NEW RECORD! 🎉
                    </Text>
                )}

                {/* Currency earned */}
                <Text style={[styles.currencyEarnedText, { color: getCurrentMessageColor() }]}>
                    Currency Earned: {Math.floor(state.currentScore / 2)}
                </Text>

                {/* Buttons */}
                <TouchableOpacity
                    style={[styles.menuButton, { borderColor: getCurrentScoreColor() }]}
                    onPress={startNewGame}
                >
                    <Text style={[styles.menuButtonText, { color: getCurrentScoreColor() }]}>
                        PLAY AGAIN
                    </Text>
                </TouchableOpacity>

                <TouchableOpacity
                    style={[styles.menuButton, { borderColor: getCurrentMessageColor() }]}
                    onPress={() => setAppState(AppState.MAIN_MENU)}
                >
                    <Text style={[styles.menuButtonText, { color: getCurrentMessageColor() }]}>
                        MAIN MENU
                    </Text>
                </TouchableOpacity>
            </View>
        </View>
    );

    // Render HUD overlay (shown during gameplay)
    const renderHUD = () => {
        if (!state.showHUD) return null;

        return (
            <View style={styles.hudOverlay}>
                {/* Top HUD - Currency and Shop Button */}
                <View style={styles.topHUD}>
                    {/* Currency Display */}
                    <View style={styles.hudCurrencyContainer}>
                        <Text style={[styles.hudCurrencyIcon, { color: getCurrentScoreColor() }]}>💰</Text>
                        <Text style={[styles.hudCurrencyText, { color: getCurrentScoreColor() }]}>
                            {state.playerData.currency}
                        </Text>
                    </View>

                    {/* Shop Button */}
                    <TouchableOpacity
                        style={[styles.hudButton, { borderColor: getCurrentScoreColor() }]}
                        onPress={() => openModal(ModalType.SHOP)}
                    >
                        <Text style={[styles.hudButtonText, { color: getCurrentScoreColor() }]}>🛍️</Text>
                    </TouchableOpacity>

                    {/* Pause/Menu Button */}
                    <TouchableOpacity
                        style={[styles.hudButton, { borderColor: getCurrentScoreColor() }]}
                        onPress={() => setAppState(AppState.MAIN_MENU)}
                    >
                        <Text style={[styles.hudButtonText, { color: getCurrentScoreColor() }]}>⏸️</Text>
                    </TouchableOpacity>
                </View>

                {/* Bottom HUD - could add more controls later */}
                <View style={styles.bottomHUD}>
                    {/* Could add things like power-ups, special abilities, etc. */}
                </View>
            </View>
        );
    };

    // Render game playing screen
    const renderGameScreen = () => (
        <View style={styles.fullScreen}>
            {/* GameEngine - handles the actual 3D game */}
            <GameEngine
                onReady={handleGameReady}
                onError={handleGameError}
                onScoreUpdate={handleScoreUpdate}
                onGameOver={handleGameOver}
            />

            {/* HUD Overlay */}
            {renderHUD()}
        </View>
    );

    // Render modals (placeholder for now)
    const renderModals = () => {
        if (state.activeModal === ModalType.NONE) return null;

        return (
            <View style={styles.modalOverlay}>
                <View style={[styles.modalContainer, { backgroundColor: getCurrentBackgroundColor() }]}>
                    {/* Modal Header */}
                    <View style={styles.modalHeader}>
                        <Text style={[styles.modalTitle, { color: getCurrentScoreColor() }]}>
                            {state.activeModal === ModalType.SHOP && 'SHOP'}
                            {state.activeModal === ModalType.DAILY_REWARDS && 'DAILY REWARDS'}
                            {state.activeModal === ModalType.SETTINGS && 'SETTINGS'}
                        </Text>

                        <TouchableOpacity
                            style={[styles.closeButton, { borderColor: getCurrentMessageColor() }]}
                            onPress={closeModal}
                        >
                            <Text style={[styles.closeButtonText, { color: getCurrentMessageColor() }]}>✕</Text>
                        </TouchableOpacity>
                    </View>

                    {/* Modal Content - Placeholder */}
                    <View style={styles.modalContent}>
                        <Text style={[styles.placeholderText, { color: getCurrentMessageColor() }]}>
                            {state.activeModal.toUpperCase()} COMING SOON!
                        </Text>
                        <Text style={[styles.placeholderSubtext, { color: getCurrentMessageColor() }]}>
                            This modal will be implemented in the next phase.
                        </Text>
                    </View>
                </View>
            </View>
        );
    };

    // Main render - switch based on app state
    return (
        <View style={styles.container}>
            <StatusBar style="auto" />

            {/* Main Content */}
            {state.currentState === AppState.LOADING && renderLoadingScreen()}
            {state.currentState === AppState.MAIN_MENU && renderMainMenu()}
            {state.currentState === AppState.PLAYING && renderGameScreen()}
            {state.currentState === AppState.GAME_OVER && renderGameOverScreen()}

            {/* Modal Layer */}
            {renderModals()}
        </View>
    );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
    },
    fullScreen: {
        flex: 1,
        width: '100%',
        height: '100%',
    },
    centered: {
        justifyContent: 'center',
        alignItems: 'center',
    },

    // Loading Screen
    loadingText: {
        fontSize: 18,
        marginTop: 20,
        fontWeight: '400',
    },

    // Main Menu
    menuContainer: {
        alignItems: 'center',
        paddingHorizontal: 40,
    },
    gameTitle: {
        fontSize: 72,
        fontWeight: 'bold',
        marginBottom: 20,
        letterSpacing: 8,
    },
    highScoreText: {
        fontSize: 18,
        marginBottom: 20,
    },
    currencyContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: 40,
        paddingHorizontal: 20,
        paddingVertical: 10,
        borderRadius: 25,
        backgroundColor: 'rgba(255, 255, 255, 0.1)',
    },
    currencyIcon: {
        fontSize: 24,
        marginRight: 8,
    },
    currencyText: {
        fontSize: 20,
        fontWeight: '600',
    },
    menuButton: {
        paddingHorizontal: 30,
        paddingVertical: 15,
        borderWidth: 2,
        borderRadius: 25,
        marginVertical: 8,
        minWidth: 200,
        alignItems: 'center',
    },
    menuButtonText: {
        fontSize: 18,
        fontWeight: '600',
    },

    // Game Over Screen
    gameOverContainer: {
        alignItems: 'center',
        paddingHorizontal: 40,
    },
    gameOverTitle: {
        fontSize: 48,
        fontWeight: 'bold',
        marginBottom: 20,
    },
    finalScoreText: {
        fontSize: 36,
        fontWeight: '600',
        marginBottom: 10,
    },
    newRecordText: {
        fontSize: 18,
        fontWeight: '600',
        marginBottom: 20,
    },
    currencyEarnedText: {
        fontSize: 16,
        marginBottom: 30,
    },

    // HUD Overlay
    hudOverlay: {
        position: 'absolute',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        pointerEvents: 'box-none', // Allow touches to pass through to game
    },
    topHUD: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        paddingTop: 60,
        paddingHorizontal: 20,
    },
    bottomHUD: {
        flex: 1,
        justifyContent: 'flex-end',
        paddingBottom: 50,
        paddingHorizontal: 20,
    },
    hudCurrencyContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: 'rgba(0, 0, 0, 0.3)',
        paddingHorizontal: 12,
        paddingVertical: 6,
        borderRadius: 20,
    },
    hudCurrencyIcon: {
        fontSize: 16,
        marginRight: 6,
    },
    hudCurrencyText: {
        fontSize: 16,
        fontWeight: '600',
    },
    hudButton: {
        backgroundColor: 'rgba(0, 0, 0, 0.3)',
        borderWidth: 1,
        borderRadius: 20,
        paddingHorizontal: 12,
        paddingVertical: 8,
        marginLeft: 10,
    },
    hudButtonText: {
        fontSize: 16,
    },

    // Modal System
    modalOverlay: {
        position: 'absolute',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        backgroundColor: 'rgba(0, 0, 0, 0.7)',
        justifyContent: 'center',
        alignItems: 'center',
    },
    modalContainer: {
        width: '85%',
        maxWidth: 400,
        borderRadius: 20,
        paddingVertical: 20,
        paddingHorizontal: 20,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.3,
        shadowRadius: 8,
        elevation: 8,
    },
    modalHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 20,
    },
    modalTitle: {
        fontSize: 24,
        fontWeight: 'bold',
    },
    closeButton: {
        borderWidth: 1,
        borderRadius: 15,
        paddingHorizontal: 8,
        paddingVertical: 4,
    },
    closeButtonText: {
        fontSize: 16,
        fontWeight: 'bold',
    },
    modalContent: {
        alignItems: 'center',
        paddingVertical: 20,
    },
    placeholderText: {
        fontSize: 18,
        fontWeight: '600',
        marginBottom: 10,
        textAlign: 'center',
    },
    placeholderSubtext: {
        fontSize: 14,
        textAlign: 'center',
        opacity: 0.7,
    },
});

export default GameContainer;