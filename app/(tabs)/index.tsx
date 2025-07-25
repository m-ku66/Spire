import { AppStateProvider } from '@/components/AppStateProvider';
import GameContainer from '@/components/GameContainer';

export default function App() {
  return (
    <AppStateProvider>
      <GameContainer />
    </AppStateProvider>
  );
}