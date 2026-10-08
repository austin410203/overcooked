import { LEVELS } from '../game/data/levels';
import { isLevelUnlocked, useGame } from '../store/useGame';
import { useT } from './i18n';
import { unlockAudio } from '../utils/audio';

export function Toggles({ compact = false }: { compact?: boolean }) {
  const t = useT();
  const { lang, theme, sound, toggleLang, toggleTheme, toggleSound } = useGame();
  return (
    <div className={`toggles ${compact ? 'compact' : ''}`}>
      <button className="pill" onClick={toggleLang} aria-label={t('language')} title={t('language')}>
        <span className={lang === 'zh' ? 'on' : ''}>中</span><span className={lang === 'en' ? 'on' : ''}>EN</span>
      </button>
      <button className="pill" onClick={toggleTheme} aria-label={t('dayNight')} title={t('dayNight')}>
        <span className={theme === 'day' ? 'on' : ''}>☀️{!compact && ` ${t('day')}`}</span>
        <span className={theme === 'night' ? 'on' : ''}>🌙{!compact && ` ${t('night')}`}</span>
      </button>
      <button className="pill icon" onClick={toggleSound} aria-label={t('sound')} title={t('sound')}>{sound ? '🔊' : '🔇'}</button>
    </div>
  );
}

export function MainMenu() {
  const t = useT();
  const { setScreen, startLevel, stars } = useGame();
  const nextIdx = Math.min(LEVELS.length - 1, LEVELS.findIndex((l) => !(stars[l.id] > 0)) === -1 ? LEVELS.length - 1 : LEVELS.findIndex((l) => !(stars[l.id] > 0)));
  const hasProgress = Object.keys(stars).length > 0;
  return (
    <div className="screen menu-screen">
      <div className="menu-card">
        <div className="logo">
          <div className="logo-icon">🍔</div>
          <div>
            <h1>{t('title')}</h1>
            <div className="logo-en">DRIVE-THRU DASH</div>
          </div>
        </div>
        <p className="tagline">{t('subtitle')}</p>
        <div className="menu-buttons">
          <button className="btn primary big" onClick={() => { unlockAudio(); startLevel(hasProgress ? nextIdx : 0); }}>
            {hasProgress ? `${t('continue')} · ${t(LEVELS[nextIdx].id)}` : t('start')}
          </button>
          <button className="btn" onClick={() => setScreen('levels')}>{t('levels')}</button>
        </div>
        <div className="howto">
          <h3>{t('howto')}</h3>
          <p>{t('howtoBody')}</p>
          <ul>
            <li>{t('tutorial2')}</li>
            <li>{t('tutorial3')}</li>
            <li>{t('tutorial4')}</li>
          </ul>
          <p className="keys">{t('keys')}</p>
        </div>
        <div className="settings-row">
          <Toggles />
        </div>
      </div>
    </div>
  );
}

export function LevelSelect() {
  const t = useT();
  const { stars, startLevel, setScreen, best, resetProgress } = useGame();
  return (
    <div className="screen levels-screen">
      <div className="levels-head">
        <button className="btn ghost" onClick={() => setScreen('menu')}>← {t('back')}</button>
        <h2>{t('levels')}</h2>
        <button className="btn ghost small" onClick={() => { if (window.confirm?.(t('resetProgress') + '?')) resetProgress(); }}>{t('resetProgress')}</button>
      </div>
      <div className="city-map">
        <svg className="map-path" viewBox="0 0 100 100" preserveAspectRatio="none" aria-hidden>
          <path d="M8 80 C 20 40, 30 85, 42 55 S 60 15, 72 45 S 88 80, 94 22" fill="none" stroke="currentColor" strokeWidth="1.4" strokeDasharray="3 2.5" />
        </svg>
        <div className="level-grid">
          {LEVELS.map((l, i) => {
            const unlocked = isLevelUnlocked(i, stars);
            const s = stars[l.id] ?? 0;
            return (
              <button key={l.id} className={`level-node ${unlocked ? '' : 'locked'} ${l.night ? 'night' : ''}`} disabled={!unlocked} onClick={() => { unlockAudio(); startLevel(i); }}>
                <div className="level-num">{String(i + 1).padStart(2, '0')}</div>
                <div className="level-name">{t(l.id)}</div>
                <div className="level-desc">{unlocked ? t(l.id + 'd') : `🔒 ${t('lockedNeed')}`}</div>
                <div className="level-meta">
                  <span className="stars">{[0, 1, 2].map((k) => <b key={k} className={k < s ? 'on' : ''}>★</b>)}</span>
                  <span>{t('objServe', { n: l.goal.orders })}</span>
                </div>
                {best[l.id] ? <div className="level-best">${best[l.id]}</div> : null}
              </button>
            );
          })}
        </div>
      </div>
      <div className="levels-foot"><Toggles /></div>
    </div>
  );
}

export function ResultScreen() {
  const t = useT();
  const { lastResult: r, startLevel, setScreen } = useGame();
  if (!r) return null;
  const lvl = LEVELS[r.levelIndex];
  const hasNext = r.levelIndex < LEVELS.length - 1 && r.stars > 0;
  return (
    <div className="screen result-screen">
      <div className="result-card">
        <div className="result-sub">{String(r.levelIndex + 1).padStart(2, '0')} · {t(lvl.id)}</div>
        <h2>{t('result')}</h2>
        <div className="big-stars">{[0, 1, 2].map((k) => <span key={k} className={k < r.stars ? 'on' : ''} style={{ animationDelay: `${k * 0.25}s` }}>★</span>)}</div>
        <div className="result-grid">
          <div><label>{t('served')}</label><b>{r.served} / {lvl.goal.orders}</b></div>
          <div><label>{t('failedOrders')}</label><b>{r.failed}</b></div>
          <div><label>{t('mistakes')}</label><b>{r.mistakes}</b></div>
          <div><label>{t('avgWait')}</label><b>{r.avgWait.toFixed(1)} {t('sec')}</b></div>
          <div><label>{t('maxCombo')}</label><b>x{r.maxCombo}</b></div>
          <div><label>{t('revenue')}</label><b>${r.cash}</b></div>
          {r.vipTotal > 0 && <div><label>{t('vip')}</label><b>{r.vipServed} / {r.vipTotal}</b></div>}
          <div><label>{t('rep')}</label><b>{Math.round(r.reputation)}</b></div>
        </div>
        <div className="result-goals">
          <div className={r.served >= Math.ceil(lvl.goal.orders * 0.6) ? 'ok' : ''}>★ {t('objServe', { n: Math.ceil(lvl.goal.orders * 0.6) })}</div>
          <div className={r.served >= lvl.goal.orders ? 'ok' : ''}>★★ {t('objServe', { n: lvl.goal.orders })}</div>
          <div className={r.stars === 3 ? 'ok' : ''}>★★★ {goalText(t, lvl.goal)}</div>
        </div>
        {r.newUnlock && <div className="unlock-banner">🎁 {t('unlockedItem', { x: t(r.newUnlock) })}</div>}
        <div className="result-buttons">
          <button className="btn" onClick={() => setScreen('levels')}>{t('levels')}</button>
          <button className="btn" onClick={() => startLevel(r.levelIndex)}>{t('retry')}</button>
          {hasNext && <button className="btn primary" onClick={() => startLevel(r.levelIndex + 1)}>{t('next')} →</button>}
        </div>
      </div>
    </div>
  );
}

export function goalText(t: ReturnType<typeof useT>, g: (typeof LEVELS)[number]['goal']) {
  const parts = [t('mistakesMax', { n: g.maxMistakes })];
  if (g.avgWaitBelow) parts.push(t('avgWaitMax', { n: g.avgWaitBelow }));
  if (g.minCombo) parts.push(t('comboMin', { n: g.minCombo }));
  if (g.vipPerfect) parts.push(t('vipPerfect'));
  return parts.join(' · ');
}
