import { useEffect } from 'react';
import RootNavigator from './src/navigation/RootNavigator';
import { usePlayerStore } from './src/store/playerStore';
import { ThemeProvider } from './src/context/ThemeContext';

export default function App() {
  const loadQueue = usePlayerStore((state) => state.loadQueue);

  useEffect(() => {
    loadQueue();
  }, []);

  return (
    <ThemeProvider>
      <RootNavigator />
    </ThemeProvider>
  );
}
