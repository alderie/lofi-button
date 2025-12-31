import React, { useState, useRef, useLayoutEffect, useEffect } from 'react';

import ReactPlayer from 'react-player/lazy';

import play from '../assets/resources/play.svg';
import pause from '../assets/resources/pause.svg';
import ring from '../assets/resources/ring.svg';
import volumeIcon from '../assets/resources/volume.svg';
import volumeMutedIcon from '../assets/resources/muted.svg';
import close from '../assets/resources/close.svg';
import logoIcon from '../assets/logo.png';

import SongList from './song_list.json';
import './font-face.css';
import './App.global.css';

type ReactPlayerProgress = {
  played: number;
  playedSeconds: number;
  loaded: number;
  loadedSeconds: number;
};

const ProgressIndicator = ({
  live,
  loadedPercent,
  playedPercent,
  playing,
  buffering,
  setPlayerProgress,
}: {
  live: boolean;
  loadedPercent: number;
  playedPercent: number;
  playing: boolean;
  buffering: boolean;
  setPlayerProgress: (percent: number) => void;
}) => {
  const [tracking, setTracking] = useState(false);
  const maxStrokeLength = 805;

  const updatePlayerProgress = (x: number, y: number) => {
    let centerX = window.innerWidth / 2;
    let centerY = window.innerHeight / 2;
    let xDiff = x - centerX;
    let yDiff = centerY - y;
    let res = 0;

    /* Calculate progress around a circle */
    if (xDiff >= 0 && yDiff >= 0) {
      res = Math.atan(xDiff / yDiff);
    } else if (xDiff > 0 && yDiff < 0) {
      res = Math.atan(-yDiff / xDiff) + Math.PI / 2;
    } else if (xDiff <= 0 && yDiff < 0) {
      res = Math.atan(xDiff / yDiff) + Math.PI;
    } else {
      res = Math.atan(yDiff / -xDiff) + Math.PI * (3 / 2);
    }

    setPlayerProgress(res / (2 * Math.PI));
  };

  const onMouseDown = (evt: React.MouseEvent<SVGSVGElement, MouseEvent>) => {
    if (live) {
      return;
    }

    setTracking(true);

    updatePlayerProgress(evt.nativeEvent.x, evt.nativeEvent.y);

    document.addEventListener('mousemove', onMouseMove);
    document.addEventListener('mouseup', onMouseUp);
  };

  const onMouseUp = () => {
    if (live) {
      return;
    }

    setTracking(false);

    document.removeEventListener('mousemove', onMouseMove);
    document.removeEventListener('mouseup', onMouseUp);
  };

  const onMouseMove = (evt: MouseEvent) => {
    updatePlayerProgress(evt.x, evt.y);
  };

  return (
    <div className="progress">
      {!live ? (
        <svg
          className="ring"
          width="100%"
          height="100%"
          viewBox="0 0 267 267"
          version="1.1"
          onMouseDown={onMouseDown}
        >
          <g
            transform="matrix(1,0,0,1,-1371.01,-1066.7)"
            style={{
              fillRule: 'evenodd',
              clipRule: 'evenodd',
              strokeLinecap: 'round',
              strokeLinejoin: 'round',
              strokeMiterlimit: 2,
            }}
          >
            <g transform="matrix(0.554628,0,0,0.554628,1282.46,978.149)">
              <g transform="matrix(1.80301,0,0,1.80301,-1421.01,-1057.63)">
                <path
                  className={`ring-path ${buffering ? 'buffering' : ''}`}
                  d="M1009.98,678.622C1081.63,678.622 1139.8,736.793 1139.8,808.443C1139.8,880.093 1081.63,938.264 1009.98,938.264C938.331,938.264 880.16,880.093 880.16,808.443C880.16,736.793 938.331,678.622 1009.98,678.622ZM1009.98,678.622C1081.63,678.622 1139.8,736.793 1139.8,808.443C1139.8,880.093 1081.63,938.264 1009.98,938.264C938.331,938.264 880.16,880.093 880.16,808.443C880.16,736.793 938.331,678.622 1009.98,678.622Z"
                  style={{
                    fill: 'none',
                    stroke: 'grey',
                    opacity: 0.4,
                    strokeDashoffset: (1 - loadedPercent) * maxStrokeLength,
                  }}
                />
                <path
                  className={`ring-path ${buffering ? 'buffering' : ''}`}
                  d="M1009.98,678.622C1081.63,678.622 1139.8,736.793 1139.8,808.443C1139.8,880.093 1081.63,938.264 1009.98,938.264C938.331,938.264 880.16,880.093 880.16,808.443C880.16,736.793 938.331,678.622 1009.98,678.622ZM1009.98,678.622C1081.63,678.622 1139.8,736.793 1139.8,808.443C1139.8,880.093 1081.63,938.264 1009.98,938.264C938.331,938.264 880.16,880.093 880.16,808.443C880.16,736.793 938.331,678.622 1009.98,678.622Z"
                  style={{
                    fill: 'none',
                    stroke: 'white',
                    strokeDashoffset: (1 - playedPercent) * maxStrokeLength,
                  }}
                />
              </g>
            </g>
          </g>
        </svg>
      ) : (
        <div className="live-indicator">LIVE</div>
      )}
      <img className={'bg-ring ' + (playing ? 'active' : '')} src={ring}></img>
    </div>
  );
};

const VolumeModal = ({
  visible,
  currentVolume,
  setVolume,
  onMouseLeave,
}: {
  visible: boolean;
  currentVolume: number;
  setVolume: React.Dispatch<React.SetStateAction<number>>;
  onMouseLeave: Function;
}) => {
  const maxVolumeBarHeight = 160;
  const [height, setHeight] = useState(currentVolume * maxVolumeBarHeight);
  const [tracking, setTracking] = useState(false);

  const adjustVolume = async (yPos: number) => {
    // Update height relative to yPos
    setHeight(Math.min(window.innerHeight - yPos, maxVolumeBarHeight));

    // Update Volume relative to percent of bar height
    let volume = Math.max((window.innerHeight - yPos) / maxVolumeBarHeight, 0);
    await window.electronAPI.store.set('volume', volume);

    const maxVolume = await window.electronAPI.store.get('maxVolume');
    setVolume(volume * maxVolume);
  };

  return visible ? (
    <div
      className="volume-bar"
      onMouseDown={(evt) => {
        setTracking(true);
        adjustVolume(evt.nativeEvent.pageY);
      }}
      onMouseUp={() => {
        setTracking(false);
      }}
      onMouseLeave={() => {
        setTracking(false);
        onMouseLeave();
      }}
      onMouseMove={(evt) => {
        if (tracking) adjustVolume(evt.nativeEvent.pageY);
      }}
    >
      <div className="bar" style={{ height }}></div>
    </div>
  ) : (
    <></>
  );
};

const Controls = () => {
  const list = SongList;

  const [activeSong, setActiveSong] = useState(0);
  const [offset, setOffset] = useState(0);
  const [playing, setPlaying] = useState(false);
  const [progress, setProgress] = useState(0);
  const [bufferProgress, setBufferProgress] = useState(0);
  const [duration, setDuration] = useState(0);
  const [currentTime, setCurrentTime] = useState(0);
  const [buffering, setBuffering] = useState(false);

  const [volumeModalOpen, setVolumeModalOpen] = useState(false);
  const [volume, setVolume] = useState(0.5);

  const player = useRef<any>(null);
  const listRef = useRef<HTMLDivElement>(null);

  const formatTime = (seconds: number): string => {
    if (!seconds || !isFinite(seconds)) return '0:00';
    const hours = Math.floor(seconds / 3600);
    const mins = Math.floor((seconds % 3600) / 60);
    const secs = Math.floor(seconds % 60);

    if (hours > 0) {
      return `${hours}:${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
    }
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  const togglePlayMode = () => {
    setPlaying(!playing);
  };

  const onPlayerStart = () => {
    if (progress !== 0) {
      if (player.current) {
        player.current.seekTo(progress, 'fraction');
      }
    }
  };

  const changeToNextSong = () => {
    if (activeSong + 1 < list.length) {
      changeSong(activeSong + 1);
    } else {
      changeSong(0);
    }
    setPlaying(true);
  };

  const updateProgress = (data: ReactPlayerProgress) => {
    setProgress(data.played);
    setBufferProgress(data.loaded);
    setCurrentTime(data.playedSeconds);

    // Played until completion
    if (data.played == 1) {
      setProgress(0);
      setPlaying(false);

      changeToNextSong();
    }
  };

  const setPlayerProgress = (percent: number) => {
    setProgress(percent);

    if (player.current) {
      player.current.seekTo(percent, 'fraction');
    }
  };

  const closeWindow = () => {
    window.close();
  };

  const changeSong = async (index: number) => {
    if (listRef.current == null) return;

    // Update the ticker offset to show the right track
    let target = listRef.current.children[index];
    if (target instanceof HTMLElement) {
      let elem = target as HTMLElement;
      setOffset(
        -(elem.offsetLeft - window.innerWidth / 2 + elem.clientWidth / 2)
      );
    } else {
      setOffset(0);
    }

    setActiveSong(index);
    await window.electronAPI.store.set('activeSong', index);
    setProgress(0);
    setBufferProgress(0);
    setDuration(0);
    setCurrentTime(0);
  };

  const onVisitSong = (index: number) => {
    if (index == activeSong) {
      let url = `https://www.youtube.com/watch?v=${list[activeSong].id}`;
      window.open(url);
    }
  };

  useLayoutEffect(() => {
    // Wait for font load before centering
    document.fonts.ready.then(async () => {
      const activeSongIndex = await window.electronAPI.store.get('activeSong');
      changeSong(activeSongIndex);
    });
  }, []);

  // Load initial volume
  useEffect(() => {
    (async () => {
      const storedVolume = await window.electronAPI.store.get('volume');
      const maxVolume = await window.electronAPI.store.get('maxVolume');
      setVolume(storedVolume * maxVolume);
    })();
  }, []);

  return (
    <>
      <div className="control-group">
        <div className="header">
          <img
            src={volume == 0 ? volumeMutedIcon : volumeIcon}
            className="icon volume"
            onClick={() => {
              setVolumeModalOpen(!volumeModalOpen);
            }}
          />

          <div className="grab-region">
            <img className="logo" src={logoIcon} style={{ height: 30 }}></img>
          </div>

          <img
            src={close}
            className="icon close"
            onClick={() => {
              closeWindow();
            }}
          />
        </div>

        <div className="controls">
          <img
            className="button icon"
            src={playing ? pause : play}
            onClick={() => {
              togglePlayMode();
            }}
          />
          {!list[activeSong].live && duration > 0 && (
            <div className="time-indicator">
              <div className="currentTime">{formatTime(currentTime)}</div>
            </div>
          )}
        </div>

        <ProgressIndicator
          live={list[activeSong].live}
          playing={playing}
          buffering={buffering}
          playedPercent={progress}
          loadedPercent={bufferProgress}
          setPlayerProgress={setPlayerProgress}
        ></ProgressIndicator>

        <div ref={listRef} className="labels" style={{ left: offset }}>
          {list.map((label, index: number) =>
            activeSong != index ? (
              <div
                key={index}
                className="inactive"
                onClick={() => {
                  changeSong(index);
                }}
              >
                {label.name}
              </div>
            ) : (
              <div
                key={-1}
                className="active"
                onClick={() => {
                  onVisitSong(index);
                }}
              >
                {label.name}
              </div>
            )
          )}
        </div>

        <ReactPlayer
          ref={player}
          playing={playing}
          width={0}
          height={0}
          volume={volume}
          url={`https://www.youtube.com/watch?v=${list[activeSong].id}`}
          onError={() => {
            console.error('Failed to play track');
          }}
          onStart={onPlayerStart}
          onBuffer={() => {
            setBuffering(true);
          }}
          onBufferEnd={() => {
            setBuffering(false);
          }}
          onDuration={(duration) => {
            setDuration(duration);
          }}
          onProgress={(data) => {
            updateProgress(data);
          }}
        ></ReactPlayer>

        <img
          src={`https://img.youtube.com/vi/${list[activeSong].id}/hqdefault.jpg`}
          className="background"
        />
      </div>

      <VolumeModal
        visible={volumeModalOpen}
        currentVolume={volume}
        setVolume={setVolume}
        onMouseLeave={() => {
          setVolumeModalOpen(false);
        }}
      ></VolumeModal>
    </>
  );
};

export default function App() {
  return (
    <div className="box">
      <Controls></Controls>
    </div>
  );
}
