import { useEffect, useRef, useState } from 'react';
import { useUI } from '@/lib/state';
import { useLiveAPIContext } from '@/contexts/LiveAPIContext';
import './VideoView.css';
import { motion, AnimatePresence } from 'motion/react';

export default function VideoView() {
  const { isVideoViewOpen, setVideoViewOpen } = useUI();
  const { client, connected } = useLiveAPIContext();
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [stream, setStream] = useState<MediaStream | null>(null);
  const [isScreenSharing, setIsScreenSharing] = useState(false);
  const [facingMode, setFacingMode] = useState<'user' | 'environment'>('user');
  const [isMirrored, setIsMirrored] = useState(true);

  // Keep track of previous states for notifications
  const prevVideoViewOpenRef = useRef(false);
  const prevScreenShareRef = useRef(false);

  useEffect(() => {
    // Only send notifications when connected
    if (!connected) return;

    const justOpened = isVideoViewOpen && !prevVideoViewOpenRef.current;
    const justClosed = !isVideoViewOpen && prevVideoViewOpenRef.current;
    
    if (justOpened || justClosed) {
      if (justOpened) {
        client.send([{ text: "[System: The user just turned on their camera. Please briefly acknowledge that you can see them now in a natural way.]" }]);
      } else if (justClosed) {
        client.send([{ text: "[System: The user just turned off their camera. Please briefly acknowledge this.]" }]);
      }
      prevVideoViewOpenRef.current = isVideoViewOpen;
    } else if (isVideoViewOpen) {
      const startedScreenShare = isScreenSharing && !prevScreenShareRef.current;
      const stoppedScreenShare = !isScreenSharing && prevScreenShareRef.current;
      
      if (startedScreenShare) {
        client.send([{ text: "[System: The user is now sharing their screen with you. Acknowledge that you can see their screen.]" }]);
      } else if (stoppedScreenShare) {
        client.send([{ text: "[System: The user stopped sharing their screen and switched back to the camera. Acknowledge this.]" }]);
      }
      prevScreenShareRef.current = isScreenSharing;
    }
  }, [isVideoViewOpen, isScreenSharing, connected, client]);

  useEffect(() => {
    if (isVideoViewOpen) {
      startCamera();
    } else {
      stopStream();
    }
    return () => stopStream();
  }, [isVideoViewOpen, facingMode, isScreenSharing]);

  const startCamera = async () => {
    stopStream();
    try {
      let newStream: MediaStream;
      if (isScreenSharing) {
        newStream = await navigator.mediaDevices.getDisplayMedia({
          video: true,
        });
        // Handle stream end (e.g. user clicks "Stop sharing" in browser UI)
        newStream.getVideoTracks()[0].onended = () => {
          setIsScreenSharing(false);
          setIsMirrored(true);
        };
      } else {
        newStream = await navigator.mediaDevices.getUserMedia({
          video: { facingMode },
        });
      }
      setStream(newStream);
      if (videoRef.current) {
        videoRef.current.srcObject = newStream;
      }
    } catch (err) {
      console.error('Error accessing media:', err);
      setIsScreenSharing(false);
      setIsMirrored(true);
    }
  };

  const stopStream = () => {
    if (stream) {
      stream.getTracks().forEach(track => track.stop());
      setStream(null);
    }
  };

  const toggleFacingMode = () => {
    setFacingMode(prev => (prev === 'user' ? 'environment' : 'user'));
  };

  const toggleScreenShare = () => {
    setIsScreenSharing(prev => {
      const next = !prev;
      setIsMirrored(!next);
      return next;
    });
  };

  const toggleMirror = () => {
    setIsMirrored(prev => !prev);
  };

  useEffect(() => {
    let interval: NodeJS.Timeout;
    if (connected && stream && isVideoViewOpen) {
      interval = setInterval(() => {
        if (videoRef.current && canvasRef.current) {
          const video = videoRef.current;
          const canvas = canvasRef.current;
          const context = canvas.getContext('2d');
          if (context && video.videoWidth > 0) {
            // Resize canvas to a reasonable size for the model
            const maxWidth = 640;
            const maxHeight = 480;
            let width = video.videoWidth;
            let height = video.videoHeight;

            if (width > maxWidth) {
              height = (maxWidth / width) * height;
              width = maxWidth;
            }
            if (height > maxHeight) {
              width = (maxHeight / height) * width;
              height = maxHeight;
            }

            canvas.width = width;
            canvas.height = height;
            context.drawImage(video, 0, 0, width, height);
            const base64 = canvas.toDataURL('image/jpeg', 0.6).split(',')[1];
            client.sendRealtimeInput([{
              mimeType: 'image/jpeg',
              data: base64,
            }]);
          }
        }
      }, 500); // 2 fps
    }
    return () => clearInterval(interval);
  }, [connected, stream, isVideoViewOpen, client]);

  return (
    <AnimatePresence>
      {isVideoViewOpen && (
        <motion.div 
          className="video-view-overlay"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
        >
          <div className="video-container">
            <video 
              ref={videoRef} 
              autoPlay 
              playsInline 
              muted 
              className="video-feed" 
              style={{ transform: isMirrored ? 'scaleX(-1)' : 'none' }}
            />
            <canvas ref={canvasRef} style={{ display: 'none' }} />
            
            <div className="video-controls">
              <button 
                className="video-control-button" 
                onClick={toggleFacingMode}
                title="Switch Camera"
                disabled={isScreenSharing}
              >
                <span className="material-symbols-outlined">flip_camera_ios</span>
              </button>
              <button 
                className={`video-control-button ${isMirrored ? 'active' : ''}`} 
                onClick={toggleMirror}
                title={isMirrored ? "Disable Mirroring" : "Enable Mirroring"}
              >
                <span className="material-symbols-outlined">sync_alt</span>
              </button>
              <button 
                className={`video-control-button ${isScreenSharing ? 'active' : ''}`} 
                onClick={toggleScreenShare}
                title={isScreenSharing ? "Stop Screen Share" : "Share Screen"}
              >
                <span className="material-symbols-outlined">
                  {isScreenSharing ? 'stop_screen_share' : 'screen_share'}
                </span>
              </button>
              <button 
                className="video-control-button close-button" 
                onClick={() => setVideoViewOpen(false)}
                title="Close Video"
              >
                <span className="material-symbols-outlined">close</span>
              </button>
            </div>

            <div className="video-status">
              {connected ? (
                <span className="status-badge live">● LIVE</span>
              ) : (
                <span className="status-badge offline">OFFLINE</span>
              )}
              <span className="mode-label">
                {isScreenSharing ? 'Screen Share' : 'Camera'}
              </span>
            </div>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
