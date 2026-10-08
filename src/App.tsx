import { useEffect } from 'react';
import { useGame } from './store/useGame';
import { MainMenu, LevelSelect, ResultScreen } from './ui/Screens';
import { GameScreen } from './ui/GameScreen';

export function App() {
  const screen = useGame((s) => s.screen);
  const theme = useGame((s) => s.theme);
  const lang = useGame((s) => s.lang);
  useEffect(() => {
    document.documentElement.dataset.theme = theme;
    document.documentElement.lang = lang === 'zh' ? 'zh-Hant' : 'en';
    document.title = lang === 'zh' ? 'Drive-Thru Dash｜得來速餐廳大作戰' : 'Drive-Thru Dash';
  }, [theme, lang]);
  return (
    <div className={`app ${theme}`}>
      {screen === 'menu' && <MainMenu />}
      {screen === 'levels' && <LevelSelect />}
      {(screen === 'game' || screen === 'result') && <GameScreen />}
      {screen === 'result' && <div className="overlay"><ResultScreen /></div>}
    </div>
  );
}
