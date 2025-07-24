import AsyncStorage from '@react-native-async-storage/async-storage';
import React, { createContext, ReactNode, useContext, useEffect, useReducer } from 'react';
import { AVAILABLE_THEMES, setCurrentTheme } from './themes';

// Storage keys for AsyncStorage
const STORAGE_KEYS = {
    CURRENCY: 'spire_currency',
    UNLOCKED_THEMES: 'spire_unlocked_themes',
    CURRENT_THEME: 'spire_current_theme',
    DAILY_STREAK: 'spire_daily_streak',
    LAST_DAILY_CLAIM: 'spire_last_daily_claim',
    HIGH_SCORE: 'spire_high_score',
    GAMES_PLAYED: 'spire_games_played',
} as const;

// App states - the main screens/modes of the app
export enum AppState {
    LOADING = 'loading',           // Initial app loading
    MAIN_MENU = 'main_menu',       // Main menu screen
    PLAYING = 'playing',           // Game is active
    PAUSED = 'paused',            // Game paused
    GAME_OVER = 'game_over',      // Show game over screen
}

// Modal states - which modals can be open
export enum ModalType {
    NONE = 'none',
    SHOP = 'shop',
    DAILY_REWARDS = 'daily_rewards',
    SETTINGS = 'settings',
    THEME_PREVIEW = 'theme_preview',
}

// Player progress and persistent data
export interface PlayerData {
    currency: number;
    unlockedThemes: string[];
    currentTheme: string;
    dailyStreak: number;
    lastDailyClaim: string | null; // ISO date string
    highScore: number;
    gamesPlayed: number;
}

// Complete app state structure
export interface AppStateData {
    // Current app screen/mode
    currentState: AppState;

    // Modal system
    activeModal: ModalType;
    modalData?: any; // Extra data for modals (like which theme to preview)

    // Player progress (persisted)
    playerData: PlayerData;

    // Current game session data (not persisted)
    currentScore: number;
    gameInProgress: boolean;

    // UI states
    isLoading: boolean;
    showHUD: boolean;
}

// Action types for state updates
export type AppAction =
    | { type: 'SET_APP_STATE'; payload: AppState }
    | { type: 'SET_MODAL'; payload: { modal: ModalType; data?: any } }
    | { type: 'CLOSE_MODAL' }
    | { type: 'SET_LOADING'; payload: boolean }
    | { type: 'SET_SHOW_HUD'; payload: boolean }
    | { type: 'UPDATE_CURRENCY'; payload: number }
    | { type: 'SPEND_CURRENCY'; payload: number }
    | { type: 'UNLOCK_THEME'; payload: string }
    | { type: 'SET_THEME'; payload: string }
    | { type: 'UPDATE_SCORE'; payload: number }
    | { type: 'SET_GAME_IN_PROGRESS'; payload: boolean }
    | { type: 'INCREMENT_DAILY_STREAK' }
    | { type: 'RESET_DAILY_STREAK' }
    | { type: 'SET_LAST_DAILY_CLAIM'; payload: string }
    | { type: 'UPDATE_HIGH_SCORE'; payload: number }
    | { type: 'INCREMENT_GAMES_PLAYED' }
    | { type: 'LOAD_PLAYER_DATA'; payload: PlayerData };

// Default player data for new users
const DEFAULT_PLAYER_DATA: PlayerData = {
    currency: 0,
    unlockedThemes: ['classic'], // Classic theme is free
    currentTheme: 'classic',
    dailyStreak: 0,
    lastDailyClaim: null,
    highScore: 0,
    gamesPlayed: 0,
};

// Initial app state
const INITIAL_STATE: AppStateData = {
    currentState: AppState.LOADING,
    activeModal: ModalType.NONE,
    modalData: undefined,
    playerData: DEFAULT_PLAYER_DATA,
    currentScore: 0,
    gameInProgress: false,
    isLoading: true,
    showHUD: false,
};

// State reducer function
function appStateReducer(state: AppStateData, action: AppAction): AppStateData {
    switch (action.type) {
        case 'SET_APP_STATE':
            return {
                ...state,
                currentState: action.payload,
                // Auto-show HUD when playing
                showHUD: action.payload === AppState.PLAYING,
            };

        case 'SET_MODAL':
            return {
                ...state,
                activeModal: action.payload.modal,
                modalData: action.payload.data,
            };

        case 'CLOSE_MODAL':
            return {
                ...state,
                activeModal: ModalType.NONE,
                modalData: undefined,
            };

        case 'SET_LOADING':
            return { ...state, isLoading: action.payload };

        case 'SET_SHOW_HUD':
            return { ...state, showHUD: action.payload };

        case 'UPDATE_CURRENCY':
            return {
                ...state,
                playerData: {
                    ...state.playerData,
                    currency: Math.max(0, state.playerData.currency + action.payload),
                },
            };

        case 'SPEND_CURRENCY':
            return {
                ...state,
                playerData: {
                    ...state.playerData,
                    currency: Math.max(0, state.playerData.currency - action.payload),
                },
            };

        case 'UNLOCK_THEME':
            return {
                ...state,
                playerData: {
                    ...state.playerData,
                    unlockedThemes: [...state.playerData.unlockedThemes, action.payload],
                },
            };

        case 'SET_THEME':
            return {
                ...state,
                playerData: {
                    ...state.playerData,
                    currentTheme: action.payload,
                },
            };

        case 'UPDATE_SCORE':
            return { ...state, currentScore: action.payload };

        case 'SET_GAME_IN_PROGRESS':
            return { ...state, gameInProgress: action.payload };

        case 'INCREMENT_DAILY_STREAK':
            return {
                ...state,
                playerData: {
                    ...state.playerData,
                    dailyStreak: state.playerData.dailyStreak + 1,
                },
            };

        case 'RESET_DAILY_STREAK':
            return {
                ...state,
                playerData: {
                    ...state.playerData,
                    dailyStreak: 0,
                },
            };

        case 'SET_LAST_DAILY_CLAIM':
            return {
                ...state,
                playerData: {
                    ...state.playerData,
                    lastDailyClaim: action.payload,
                },
            };

        case 'UPDATE_HIGH_SCORE':
            const newHighScore = Math.max(state.playerData.highScore, action.payload);
            return {
                ...state,
                playerData: {
                    ...state.playerData,
                    highScore: newHighScore,
                },
            };

        case 'INCREMENT_GAMES_PLAYED':
            return {
                ...state,
                playerData: {
                    ...state.playerData,
                    gamesPlayed: state.playerData.gamesPlayed + 1,
                },
            };

        case 'LOAD_PLAYER_DATA':
            return {
                ...state,
                playerData: action.payload,
            };

        default:
            return state;
    }
}

// Context type
interface AppStateContextType {
    state: AppStateData;

    // App state actions
    setAppState: (state: AppState) => void;

    // Modal actions
    openModal: (modal: ModalType, data?: any) => void;
    closeModal: () => void;

    // Currency actions
    addCurrency: (amount: number) => void;
    spendCurrency: (amount: number) => boolean; // Returns true if successful

    // Theme actions
    unlockTheme: (themeId: string) => void;
    switchTheme: (themeId: string) => void;
    canAffordTheme: (themeId: string) => boolean;

    // Game actions
    updateScore: (score: number) => void;
    endGame: (finalScore: number) => void;
    startNewGame: () => void;

    // Daily reward actions
    canClaimDaily: () => boolean;
    claimDailyReward: () => number; // Returns currency earned

    // Utility actions
    setLoading: (loading: boolean) => void;
}

// Create context
const AppStateContext = createContext<AppStateContextType | null>(null);

// Provider component
interface AppStateProviderProps {
    children: ReactNode;
}

export const AppStateProvider: React.FC<AppStateProviderProps> = ({ children }) => {
    const [state, dispatch] = useReducer(appStateReducer, INITIAL_STATE);

    // Load persistent data on app start
    useEffect(() => {
        loadPersistedData();
    }, []);

    // Save data whenever playerData changes
    useEffect(() => {
        if (state.currentState !== AppState.LOADING) {
            savePersistedData();
        }
    }, [state.playerData]);

    // Load data from AsyncStorage
    const loadPersistedData = async () => {
        try {
            dispatch({ type: 'SET_LOADING', payload: true });

            const [
                currency,
                unlockedThemes,
                currentTheme,
                dailyStreak,
                lastDailyClaim,
                highScore,
                gamesPlayed,
            ] = await Promise.all([
                AsyncStorage.getItem(STORAGE_KEYS.CURRENCY),
                AsyncStorage.getItem(STORAGE_KEYS.UNLOCKED_THEMES),
                AsyncStorage.getItem(STORAGE_KEYS.CURRENT_THEME),
                AsyncStorage.getItem(STORAGE_KEYS.DAILY_STREAK),
                AsyncStorage.getItem(STORAGE_KEYS.LAST_DAILY_CLAIM),
                AsyncStorage.getItem(STORAGE_KEYS.HIGH_SCORE),
                AsyncStorage.getItem(STORAGE_KEYS.GAMES_PLAYED),
            ]);

            const playerData: PlayerData = {
                currency: currency ? parseInt(currency, 10) : 0,
                unlockedThemes: unlockedThemes ? JSON.parse(unlockedThemes) : ['classic'],
                currentTheme: currentTheme || 'classic',
                dailyStreak: dailyStreak ? parseInt(dailyStreak, 10) : 0,
                lastDailyClaim: lastDailyClaim,
                highScore: highScore ? parseInt(highScore, 10) : 0,
                gamesPlayed: gamesPlayed ? parseInt(gamesPlayed, 10) : 0,
            };

            // Apply the current theme
            setCurrentTheme(playerData.currentTheme);

            dispatch({ type: 'LOAD_PLAYER_DATA', payload: playerData });
            dispatch({ type: 'SET_APP_STATE', payload: AppState.MAIN_MENU });
            dispatch({ type: 'SET_LOADING', payload: false });

            console.log('Player data loaded:', playerData);
        } catch (error) {
            console.error('Failed to load player data:', error);
            dispatch({ type: 'SET_APP_STATE', payload: AppState.MAIN_MENU });
            dispatch({ type: 'SET_LOADING', payload: false });
        }
    };

    // Save data to AsyncStorage
    const savePersistedData = async () => {
        try {
            const { playerData } = state;

            await Promise.all([
                AsyncStorage.setItem(STORAGE_KEYS.CURRENCY, playerData.currency.toString()),
                AsyncStorage.setItem(STORAGE_KEYS.UNLOCKED_THEMES, JSON.stringify(playerData.unlockedThemes)),
                AsyncStorage.setItem(STORAGE_KEYS.CURRENT_THEME, playerData.currentTheme),
                AsyncStorage.setItem(STORAGE_KEYS.DAILY_STREAK, playerData.dailyStreak.toString()),
                AsyncStorage.setItem(STORAGE_KEYS.LAST_DAILY_CLAIM, playerData.lastDailyClaim || ''),
                AsyncStorage.setItem(STORAGE_KEYS.HIGH_SCORE, playerData.highScore.toString()),
                AsyncStorage.setItem(STORAGE_KEYS.GAMES_PLAYED, playerData.gamesPlayed.toString()),
            ]);

            console.log('Player data saved successfully');
        } catch (error) {
            console.error('Failed to save player data:', error);
        }
    };

    // Context value with all the action functions
    const contextValue: AppStateContextType = {
        state,

        // App state actions
        setAppState: (newState: AppState) => {
            dispatch({ type: 'SET_APP_STATE', payload: newState });
        },

        // Modal actions
        openModal: (modal: ModalType, data?: any) => {
            dispatch({ type: 'SET_MODAL', payload: { modal, data } });
        },

        closeModal: () => {
            dispatch({ type: 'CLOSE_MODAL' });
        },

        // Currency actions
        addCurrency: (amount: number) => {
            dispatch({ type: 'UPDATE_CURRENCY', payload: amount });
        },

        spendCurrency: (amount: number): boolean => {
            if (state.playerData.currency >= amount) {
                dispatch({ type: 'SPEND_CURRENCY', payload: amount });
                return true;
            }
            return false;
        },

        // Theme actions
        unlockTheme: (themeId: string) => {
            const theme = AVAILABLE_THEMES[themeId];
            if (theme && !state.playerData.unlockedThemes.includes(themeId)) {
                dispatch({ type: 'UNLOCK_THEME', payload: themeId });
            }
        },

        switchTheme: (themeId: string) => {
            if (state.playerData.unlockedThemes.includes(themeId)) {
                setCurrentTheme(themeId); // Update the theme system
                dispatch({ type: 'SET_THEME', payload: themeId });
            }
        },

        canAffordTheme: (themeId: string): boolean => {
            const theme = AVAILABLE_THEMES[themeId];
            return theme ? state.playerData.currency >= (theme.price || 0) : false;
        },

        // Game actions
        updateScore: (score: number) => {
            dispatch({ type: 'UPDATE_SCORE', payload: score });
        },

        endGame: (finalScore: number) => {
            dispatch({ type: 'UPDATE_HIGH_SCORE', payload: finalScore });
            dispatch({ type: 'INCREMENT_GAMES_PLAYED' });
            dispatch({ type: 'SET_GAME_IN_PROGRESS', payload: false });
            dispatch({ type: 'SET_APP_STATE', payload: AppState.GAME_OVER });

            // Award currency based on score (1 currency per 2 blocks stacked)
            const currencyEarned = Math.floor(finalScore / 2);
            if (currencyEarned > 0) {
                dispatch({ type: 'UPDATE_CURRENCY', payload: currencyEarned });
            }
        },

        startNewGame: () => {
            dispatch({ type: 'UPDATE_SCORE', payload: 0 });
            dispatch({ type: 'SET_GAME_IN_PROGRESS', payload: true });
            dispatch({ type: 'SET_APP_STATE', payload: AppState.PLAYING });
        },

        // Daily reward actions
        canClaimDaily: (): boolean => {
            if (!state.playerData.lastDailyClaim) return true;

            const lastClaim = new Date(state.playerData.lastDailyClaim);
            const now = new Date();
            const daysDiff = Math.floor((now.getTime() - lastClaim.getTime()) / (1000 * 60 * 60 * 24));

            return daysDiff >= 1;
        },

        claimDailyReward: (): number => {
            const now = new Date().toISOString();
            const baseReward = 10;
            const streakBonus = Math.min(state.playerData.dailyStreak * 2, 50); // Max 50 bonus
            const totalReward = baseReward + streakBonus;

            dispatch({ type: 'INCREMENT_DAILY_STREAK' });
            dispatch({ type: 'SET_LAST_DAILY_CLAIM', payload: now });
            dispatch({ type: 'UPDATE_CURRENCY', payload: totalReward });

            return totalReward;
        },

        // Utility actions
        setLoading: (loading: boolean) => {
            dispatch({ type: 'SET_LOADING', payload: loading });
        },
    };

    return (
        <AppStateContext.Provider value={contextValue}>
            {children}
        </AppStateContext.Provider>
    );
};

// Custom hook to use the app state
export const useAppState = (): AppStateContextType => {
    const context = useContext(AppStateContext);
    if (!context) {
        throw new Error('useAppState must be used within an AppStateProvider');
    }
    return context;
};