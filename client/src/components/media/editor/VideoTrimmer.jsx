import React, { useState, useRef, useEffect } from "react";
import { Button } from "../../ui/button";
import { Slider } from "../../ui/slider";
import { 
    Scissors, 
    Play, 
    Pause, 
    Save, 
    RotateCcw,
    Clock,
    AlertCircle,
    Loader2
} from "lucide-react";
import { Badge } from "../../ui/badge";

const VideoTrimmer = ({ videoUrl, onSave, onCancel }) => {
    const [ffmpegLoaded, setFfmpegLoaded] = useState(false);
    const [isProcessing, setIsProcessing] = useState(false);
    const [progress, setProgress] = useState(0);
    const [duration, setDuration] = useState(0);
    const [range, setRange] = useState([0, 10]);
    const [currentTime, setCurrentTime] = useState(0);
    const [isPlaying, setIsPlaying] = useState(false);
    const videoRef = useRef(null);
    const ffmpegRef = useRef(null);

    // Lazy load FFmpeg
    const loadFFmpeg = async () => {
        if (ffmpegRef.current) return;
        
        try {
            const { FFmpeg } = await import("@ffmpeg/ffmpeg");
            const { toBlobURL } = await import("@ffmpeg/util");
            
            const ffmpeg = new FFmpeg();
            
            // For production scalability, we use single-threaded if COOP/COEP headers are missing
            // but the user asked for headers on specific routes, so we assume they are present.
            // If they fail, we can fallback.
            
            const baseURL = "https://unpkg.com/@ffmpeg/core@0.12.6/dist/esm";
            await ffmpeg.load({
                coreURL: await toBlobURL(`${baseURL}/ffmpeg-core.js`, "text/javascript"),
                wasmURL: await toBlobURL(`${baseURL}/ffmpeg-core.wasm`, "application/wasm"),
            });
            
            ffmpegRef.current = ffmpeg;
            setFfmpegLoaded(true);
        } catch (error) {
            console.error("FFmpeg load failed:", error);
            // Fallback instruction for user or UI feedback
        }
    };

    useEffect(() => {
        loadFFmpeg();
    }, []);

    const handleLoadedMetadata = () => {
        if (videoRef.current) {
            const dur = videoRef.current.duration;
            setDuration(dur);
            setRange([0, Math.min(dur, 60)]); // Default trim to first 60s or total
        }
    };

    const handleTimeUpdate = () => {
        if (videoRef.current) {
            setCurrentTime(videoRef.current.currentTime);
            // Loop playback within range
            if (videoRef.current.currentTime >= range[1]) {
                videoRef.current.currentTime = range[0];
            }
        }
    };

    const togglePlay = () => {
        if (isPlaying) {
            videoRef.current.pause();
        } else {
            videoRef.current.play();
        }
        setIsPlaying(!isPlaying);
    };

    const handleTrim = async () => {
        if (!ffmpegRef.current || isProcessing) return;
        
        setIsProcessing(true);
        const ffmpeg = ffmpegRef.current;
        
        try {
            const { fetchFile } = await import("@ffmpeg/util");
            const inputFileName = "input.mp4";
            const outputFileName = "output.mp4";
            
            await ffmpeg.writeFile(inputFileName, await fetchFile(videoUrl));
            
            ffmpeg.on("progress", ({ progress }) => {
                setProgress(Math.round(progress * 100));
            });

            // Use -ss (start) and -t (duration) or -to (end)
            // -c copy is fast but may be inaccurate on keyframes
            // For production, we might want to re-encode for accuracy
            await ffmpeg.exec([
                "-ss", range[0].toString(),
                "-to", range[1].toString(),
                "-i", inputFileName,
                "-c", "copy", // Fast copy
                outputFileName
            ]);

            const data = await ffmpeg.readFile(outputFileName);
            const blob = new Blob([data.buffer], { type: "video/mp4" });
            const file = new File([blob], "trimmed-video.mp4", { type: "video/mp4" });
            
            await onSave(file);
        } catch (error) {
            console.error("Trimming failed:", error);
        } finally {
            setIsProcessing(false);
            setProgress(0);
        }
    };

    const formatTime = (seconds) => {
        const mins = Math.floor(seconds / 60);
        const secs = Math.floor(seconds % 60);
        return `${mins}:${secs.toString().padStart(2, "0")}`;
    };

    return (
        <div className="flex flex-col h-full gap-4 p-4 bg-gray-50 dark:bg-gray-900 rounded-2xl border border-gray-100 dark:border-gray-800">
            {/* Video Player */}
            <div className="flex-1 bg-black rounded-xl overflow-hidden relative group">
                <video 
                    ref={videoRef}
                    src={videoUrl}
                    className="w-full h-full object-contain"
                    onLoadedMetadata={handleLoadedMetadata}
                    onTimeUpdate={handleTimeUpdate}
                    onClick={togglePlay}
                />
                <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none">
                    <div className="p-4 rounded-full bg-black/50 text-white backdrop-blur-sm">
                        {isPlaying ? <Pause className="h-8 w-8" /> : <Play className="h-8 w-8" />}
                    </div>
                </div>
                
                {/* Current Time Overlay */}
                <div className="absolute bottom-4 left-4 bg-black/60 backdrop-blur-md px-3 py-1 rounded-full text-white text-xs font-mono">
                    {formatTime(currentTime)} / {formatTime(duration)}
                </div>
            </div>

            {/* Trimmer Controls */}
            <div className="bg-white dark:bg-gray-800 p-6 rounded-xl shadow-sm border border-gray-100 dark:border-gray-700 space-y-6">
                <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                        <Scissors className="h-4 w-4 text-primary" />
                        <span className="text-sm font-bold">Trim Duration</span>
                    </div>
                    <div className="flex items-center gap-2">
                        <Badge variant="outline" className="font-mono">
                            {formatTime(range[0])} - {formatTime(range[1])}
                        </Badge>
                        <span className="text-xs text-muted-foreground">
                            ({formatTime(range[1] - range[0])} selected)
                        </span>
                    </div>
                </div>

                <div className="px-2">
                    <Slider 
                        value={range}
                        max={duration || 100}
                        step={0.1}
                        minStepsBetweenThumbs={1}
                        onValueChange={(val) => {
                            setRange(val);
                            if (videoRef.current) {
                                // Jump to start point on change for better preview
                                if (val[0] !== range[0]) videoRef.current.currentTime = val[0];
                            }
                        }}
                        className="py-4"
                    />
                </div>

                <div className="flex items-center justify-between pt-2 border-t">
                    <div className="flex gap-2">
                        <Button variant="outline" size="sm" onClick={onCancel} className="h-9">
                            Cancel
                        </Button>
                        <Button variant="ghost" size="sm" onClick={() => setRange([0, duration])} className="h-9">
                            <RotateCcw className="h-4 w-4 mr-2" /> Reset
                        </Button>
                    </div>

                    <div className="flex items-center gap-3">
                        {!ffmpegLoaded && (
                            <div className="flex items-center gap-2 text-xs text-amber-600 bg-amber-50 px-3 py-1.5 rounded-lg border border-amber-100">
                                <Loader2 className="h-3 w-3 animate-spin" />
                                <span>Loading Editor...</span>
                            </div>
                        )}
                        
                        {isProcessing ? (
                            <div className="flex items-center gap-3">
                                <div className="text-right">
                                    <p className="text-[10px] font-bold uppercase tracking-wider text-primary">Processing</p>
                                    <p className="text-xs font-mono">{progress}%</p>
                                </div>
                                <div className="w-24 h-2 bg-gray-100 rounded-full overflow-hidden">
                                    <div className="h-full bg-primary transition-all duration-300" style={{ width: `${progress}%` }} />
                                </div>
                            </div>
                        ) : (
                            <Button 
                                className="h-9 gap-2 shadow-lg shadow-primary/20" 
                                onClick={handleTrim} 
                                disabled={!ffmpegLoaded || isProcessing}
                            >
                                <Save className="h-4 w-4" />
                                Save Trimmed Video
                            </Button>
                        )}
                    </div>
                </div>
            </div>

            {/* Error Feedback */}
            {!window.crossOriginIsolated && ffmpegLoaded && (
                <div className="flex items-start gap-3 p-3 bg-red-50 dark:bg-red-900/20 rounded-xl border border-red-100 dark:border-red-900/30">
                    <AlertCircle className="h-4 w-4 text-red-600 mt-0.5" />
                    <div className="flex-1">
                        <p className="text-xs font-bold text-red-600">Cross-Origin Isolation Missing</p>
                        <p className="text-[10px] text-red-500">
                            Video processing will be slower. Please ensure COOP/COEP headers are enabled on your server.
                        </p>
                    </div>
                </div>
            )}
        </div>
    );
};

export default VideoTrimmer;
