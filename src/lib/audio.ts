export const playSound = (type: 'click' | 'win' | 'star' | 'swap', enabled: boolean = true) => {
  if (!enabled) return;
  try {
    const AudioContext = window.AudioContext || (window as any).webkitAudioContext;
    if (!AudioContext) return;
    
    const ctx = new AudioContext();
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    
    osc.connect(gain);
    gain.connect(ctx.destination);
    
    if (type === 'click' || type === 'swap') {
      osc.type = 'sine';
      osc.frequency.setValueAtTime(type === 'click' ? 600 : 400, ctx.currentTime);
      osc.frequency.exponentialRampToValueAtTime(800, ctx.currentTime + 0.1);
      gain.gain.setValueAtTime(0.1, ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.1);
      osc.start(ctx.currentTime);
      osc.stop(ctx.currentTime + 0.1);
    } else if (type === 'star') {
      osc.type = 'triangle';
      osc.frequency.setValueAtTime(880, ctx.currentTime);
      osc.frequency.exponentialRampToValueAtTime(1200, ctx.currentTime + 0.2);
      gain.gain.setValueAtTime(0.2, ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.2);
      osc.start(ctx.currentTime);
      osc.stop(ctx.currentTime + 0.2);
    } else if (type === 'win') {
      osc.type = 'square';
      osc.frequency.setValueAtTime(440, ctx.currentTime);
      osc.frequency.setValueAtTime(554, ctx.currentTime + 0.1);
      osc.frequency.setValueAtTime(659, ctx.currentTime + 0.2);
      osc.frequency.setValueAtTime(880, ctx.currentTime + 0.3);
      gain.gain.setValueAtTime(0.1, ctx.currentTime);
      gain.gain.linearRampToValueAtTime(0, ctx.currentTime + 0.6);
      osc.start(ctx.currentTime);
      osc.stop(ctx.currentTime + 0.6);
    }
  } catch(e) {
    console.error("Audio error", e);
  }
};

let bgMusic: HTMLAudioElement | null = null;
export const playBackgroundMusic = (enabled: boolean = true) => {
  if (!bgMusic) {
    bgMusic = new Audio('/hitslab-game-gaming-video-game-music-459876.mp3');
    bgMusic.loop = true;
    bgMusic.volume = 0.5;
  }
  if (enabled) {
    bgMusic.play().catch(e => console.error("Audio play error:", e));
  } else {
    bgMusic.pause();
  }
};

export const setBackgroundMusicVolume = (volume: number) => {
  if (bgMusic) {
    bgMusic.volume = volume;
  }
};
