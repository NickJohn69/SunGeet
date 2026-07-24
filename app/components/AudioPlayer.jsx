// app/components/AudioPlayer.jsx
import { useEffect, useRef, useState } from 'react';

/**
 * AudioPlayer component
 * Props:
 *   videoId: YouTube video ID to stream
 *   title: optional display title
 *
 * The component fetches the best audio URL from the `/api/stream` endpoint
 * and plays it using an HTML5 <audio> element. It also registers a MediaSession
 * so that playback can continue when the app is in the background on mobile
 * browsers (iOS Safari, Android Chrome).
 */
export default function AudioPlayer({ videoId, title }) {
  const audioRef = useRef(null);
  const [audioUrl, setAudioUrl] = useState(null);
  const [error, setError] = useState(null);

  // Fetch the audio URL when videoId changes
  useEffect(() => {
    if (!videoId) return;
    const fetchAudio = async () => {
      try {
        const res = await fetch(`/api/stream?q=${videoId}`);
        const data = await res.json();
        if (res.ok && data.audioUrl) {
          setAudioUrl(data.audioUrl);
          setError(null);
        } else {
          setError(data.error || 'Failed to get audio URL');
        }
      } catch (e) {
        setError(e.message);
      }
    };
    fetchAudio();
  }, [videoId]);

  // Setup Media Session for background playback on mobile
  useEffect(() => {
    if (!audioUrl) return;
    const audio = audioRef.current;
    if (!audio) return;

    const updateMediaSession = () => {
      if ('mediaSession' in navigator) {
        navigator.mediaSession.metadata = new MediaMetadata({
          title: title || 'YouTube Audio',
          artist: '',
          album: '',
          artwork: [
            {
              src: `https://i.ytimg.com/vi/${videoId}/hqdefault.jpg`,
              sizes: '512x512',
              type: 'image/jpeg',
            },
          ],
        });
        navigator.mediaSession.setActionHandler('play', () => audio.play());
        navigator.mediaSession.setActionHandler('pause', () => audio.pause());
        navigator.mediaSession.setActionHandler('stop', () => audio.pause());
      }
    };

    audio.addEventListener('play', updateMediaSession);
    return () => {
      audio.removeEventListener('play', updateMediaSession);
    };
  }, [audioUrl, videoId, title]);

  if (error) {
    return <div style={{ color: 'red' }}>Audio error: {error}</div>;
  }

  return (
    <div>
      {audioUrl ? (
        <audio
          ref={audioRef}
          src={audioUrl}
          controls
          preload="metadata"
          // iOS requires the `playsinline` attribute on the video element, but for audio we can set `muted` initially and then play on user gesture.
        />
      ) : (
        <p>Loading audio...</p>
      )}
    </div>
  );
}
