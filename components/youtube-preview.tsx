'use client';

import { useEffect, useMemo, useRef, useState } from 'react';
import {
  Maximize,
  Pause,
  Play,
  Settings,
  Volume2,
  VolumeX,
} from 'lucide-react';
import type { Language } from '@/lib/types';

type YouTubePlayer = {
  destroy: () => void;
  getAvailablePlaybackRates: () => number[];
  getCurrentTime: () => number;
  getDuration: () => number;
  getPlaybackRate: () => number;
  getVolume: () => number;
  isMuted: () => boolean;
  mute: () => void;
  pauseVideo: () => void;
  playVideo: () => void;
  seekTo: (seconds: number, allowSeekAhead: boolean) => void;
  setPlaybackRate: (rate: number) => void;
  setVolume: (volume: number) => void;
  unMute: () => void;
};

type YouTubePlayerEvent = {
  data: number;
  target: YouTubePlayer;
};

type YouTubeApi = {
  Player: new (
    element: HTMLIFrameElement,
    options: {
      events: {
        onReady: (event: YouTubePlayerEvent) => void;
        onStateChange: (event: YouTubePlayerEvent) => void;
      };
    },
  ) => YouTubePlayer;
};

declare global {
  interface Window {
    YT?: YouTubeApi;
    onYouTubeIframeAPIReady?: () => void;
  }
}

let youtubeApiPromise: Promise<YouTubeApi> | null = null;

function loadYouTubeApi(): Promise<YouTubeApi> {
  if (window.YT?.Player) return Promise.resolve(window.YT);
  if (youtubeApiPromise) return youtubeApiPromise;

  youtubeApiPromise = new Promise((resolve, reject) => {
    const previousReady = window.onYouTubeIframeAPIReady;
    const timeout = window.setTimeout(() => {
      youtubeApiPromise = null;
      reject(new Error('YouTube player API timed out.'));
    }, 15000);

    window.onYouTubeIframeAPIReady = () => {
      previousReady?.();
      window.clearTimeout(timeout);
      if (window.YT?.Player) resolve(window.YT);
      else reject(new Error('YouTube player API is unavailable.'));
    };

    if (!document.querySelector('script[src="https://www.youtube.com/iframe_api"]')) {
      const script = document.createElement('script');
      script.src = 'https://www.youtube.com/iframe_api';
      script.async = true;
      script.onerror = () => {
        window.clearTimeout(timeout);
        youtubeApiPromise = null;
        reject(new Error('YouTube player API failed to load.'));
      };
      document.head.appendChild(script);
    }
  });

  return youtubeApiPromise;
}

function formatTime(value: number): string {
  if (!Number.isFinite(value) || value < 0) return '0:00';
  const total = Math.floor(value);
  const minutes = Math.floor(total / 60);
  const seconds = String(total % 60).padStart(2, '0');
  return `${minutes}:${seconds}`;
}

const labels = {
  en: {
    pause: 'Pause video',
    play: 'Play video',
    mute: 'Mute video',
    unmute: 'Unmute video',
    seek: 'Video progress',
    settings: 'Playback settings',
    speed: 'Playback speed',
    fullscreen: 'Full screen',
  },
  vi: {
    pause: 'Tạm dừng video',
    play: 'Phát video',
    mute: 'Tắt âm thanh',
    unmute: 'Bật âm thanh',
    seek: 'Tiến trình video',
    settings: 'Cài đặt phát',
    speed: 'Tốc độ phát',
    fullscreen: 'Toàn màn hình',
  },
} as const;

export function YouTubePreview({
  embedUrl,
  language,
  title,
}: {
  embedUrl: string;
  language: Language;
  title: string;
}) {
  const iframeRef = useRef<HTMLIFrameElement>(null);
  const shellRef = useRef<HTMLDivElement>(null);
  const playerRef = useRef<YouTubePlayer | null>(null);
  const [ready, setReady] = useState(false);
  const [playing, setPlaying] = useState(true);
  const [muted, setMuted] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [playbackRate, setPlaybackRate] = useState(1);
  const [availableRates, setAvailableRates] = useState([0.5, 1, 1.5, 2]);
  const [settingsOpen, setSettingsOpen] = useState(false);
  const copy = labels[language];

  const playerUrl = useMemo(() => {
    const url = new URL(embedUrl);
    url.searchParams.set('controls', '0');
    url.searchParams.set('enablejsapi', '1');
    url.searchParams.set('iv_load_policy', '3');
    return url.toString();
  }, [embedUrl]);

  useEffect(() => {
    let cancelled = false;
    let player: YouTubePlayer | null = null;

    void loadYouTubeApi()
      .then((api) => {
        if (cancelled || !iframeRef.current) return;
        player = new api.Player(iframeRef.current, {
          events: {
            onReady: (event) => {
              if (cancelled) return;
              playerRef.current = event.target;
              setReady(true);
              setDuration(event.target.getDuration());
              setAvailableRates(event.target.getAvailablePlaybackRates());
              setPlaybackRate(event.target.getPlaybackRate());
              event.target.setVolume(100);
              event.target.unMute();
              setMuted(false);
              event.target.playVideo();
            },
            onStateChange: (event) => {
              if (cancelled) return;
              setPlaying(event.data === 1);
            },
          },
        });
        playerRef.current = player;
      })
      .catch(() => {
        // The iframe remains usable if the optional control API is unavailable.
      });

    return () => {
      cancelled = true;
      playerRef.current = null;
      player?.destroy();
    };
  }, [playerUrl]);

  useEffect(() => {
    if (!ready) return;
    const sync = () => {
      const player = playerRef.current;
      if (!player) return;
      setCurrentTime(player.getCurrentTime());
      setDuration(player.getDuration());
      setMuted(player.isMuted() || player.getVolume() === 0);
    };
    sync();
    const interval = window.setInterval(sync, 250);
    return () => window.clearInterval(interval);
  }, [ready]);

  const togglePlayback = () => {
    const player = playerRef.current;
    if (!player) return;
    if (playing) player.pauseVideo();
    else player.playVideo();
  };

  const toggleMute = () => {
    const player = playerRef.current;
    if (!player) return;
    if (muted) {
      player.setVolume(100);
      player.unMute();
      setMuted(false);
    } else {
      player.mute();
      setMuted(true);
    }
  };

  const seek = (seconds: number) => {
    playerRef.current?.seekTo(seconds, true);
    setCurrentTime(seconds);
  };

  const changePlaybackRate = (rate: number) => {
    playerRef.current?.setPlaybackRate(rate);
    setPlaybackRate(rate);
    setSettingsOpen(false);
  };

  const enterFullscreen = () => {
    void shellRef.current?.requestFullscreen();
  };

  return (
    <div className="player-shell youtube-player-shell" ref={shellRef}>
      <iframe
        ref={iframeRef}
        src={playerUrl}
        title={title}
        tabIndex={-1}
        allow="autoplay; encrypted-media; picture-in-picture; fullscreen"
        allowFullScreen
      />
      <button
        type="button"
        className="youtube-click-layer"
        aria-label={playing ? copy.pause : copy.play}
        disabled={!ready}
        onClick={togglePlayback}
      />
      <div className="youtube-controls" aria-label={copy.settings}>
        <input
          className="youtube-progress"
          type="range"
          min="0"
          max={duration || 0}
          step="0.1"
          value={Math.min(currentTime, duration || 0)}
          aria-label={copy.seek}
          disabled={!ready || duration <= 0}
          onChange={(event) => seek(Number(event.target.value))}
          style={{
            '--youtube-progress': duration
              ? `${(currentTime / duration) * 100}%`
              : '0%',
          } as React.CSSProperties}
        />
        <div className="youtube-controls-row">
          <button
            type="button"
            aria-label={playing ? copy.pause : copy.play}
            title={playing ? copy.pause : copy.play}
            disabled={!ready}
            onClick={togglePlayback}
          >
            {playing ? <Pause /> : <Play fill="currentColor" />}
          </button>
          <button
            type="button"
            aria-label={muted ? copy.unmute : copy.mute}
            title={muted ? copy.unmute : copy.mute}
            disabled={!ready}
            onClick={toggleMute}
          >
            {muted ? <VolumeX /> : <Volume2 />}
          </button>
          <span className="youtube-time">
            {formatTime(currentTime)} / {formatTime(duration)}
          </span>
          <span className="youtube-controls-spacer" />
          <div className="youtube-settings-wrap">
            {settingsOpen && (
              <div className="youtube-settings-menu" role="menu">
                <strong>{copy.speed}</strong>
                <div>
                  {availableRates.map((rate) => (
                    <button
                      type="button"
                      role="menuitemradio"
                      aria-checked={playbackRate === rate}
                      className={playbackRate === rate ? 'active' : undefined}
                      key={rate}
                      onClick={() => changePlaybackRate(rate)}
                    >
                      {rate}×
                    </button>
                  ))}
                </div>
              </div>
            )}
            <button
              type="button"
              aria-label={copy.settings}
              title={copy.settings}
              disabled={!ready}
              aria-expanded={settingsOpen}
              onClick={() => setSettingsOpen((value) => !value)}
            >
              <Settings />
            </button>
          </div>
          <button
            type="button"
            aria-label={copy.fullscreen}
            title={copy.fullscreen}
            disabled={!ready}
            onClick={enterFullscreen}
          >
            <Maximize />
          </button>
        </div>
      </div>
    </div>
  );
}
