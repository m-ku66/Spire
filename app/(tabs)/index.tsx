// import GameEngine from '@/components/GameEngine';
// import { StyleSheet, View } from 'react-native';

// export default function App() {
//   return (
//     <View style={styles.container}>
//       <GameEngine
//         onReady={() => console.log('Game engine ready!')}
//         onError={(error) => console.error('Game engine error:', error)}
//       />
//     </View>
//   );
// }

// const styles = StyleSheet.create({
//   container: {
//     flex: 1,
//     width: '100%',
//     height: '100%',
//   },
// });
import { AppStateProvider } from '@/components/AppStateProvider';
import GameContainer from '@/components/GameContainer';

export default function App() {
  return (
    <AppStateProvider>
      <GameContainer />
    </AppStateProvider>
  );
}