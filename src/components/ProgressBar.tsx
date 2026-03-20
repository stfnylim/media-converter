interface ProgressBarProps {
  progress: number;
  status: string;
  log?: string;
  showLog?: boolean;
  onToggleLog?: () => void;
}

export function ProgressBar({ progress, status, log, showLog, onToggleLog }: ProgressBarProps) {
  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between text-sm">
        <span className="text-gray-300 font-medium">{status}</span>
        <span className="text-violet-400 font-mono font-bold">{progress}%</span>
      </div>
      <div className="w-full bg-gray-800 rounded-full h-2 overflow-hidden">
        <div
          className="h-2 bg-gradient-to-r from-violet-600 to-pink-500 rounded-full transition-all duration-300"
          style={{ width: `${progress}%` }}
        />
      </div>
      {log !== undefined && (
        <div>
          <button
            onClick={onToggleLog}
            className="text-xs text-gray-500 hover:text-gray-300 transition-colors flex items-center gap-1"
          >
            <span className={["transition-transform", showLog ? "rotate-90" : ""].join(" ")}>▶</span>
            {showLog ? "Hide" : "Show"} FFmpeg log
          </button>
          {showLog && (
            <pre className="mt-2 p-3 bg-black/60 rounded-lg border border-gray-800 text-xs text-green-400 font-mono overflow-auto max-h-40 scrollbar-thin whitespace-pre-wrap">
              {log || "(waiting...)"}
            </pre>
          )}
        </div>
      )}
    </div>
  );
}
