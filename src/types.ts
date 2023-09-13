export type LogsEvent = (log:string) => void 
export type ProgressTextEvent = (progress:string) => void 
export type ProgressEventEventData = {
  action: string
  percentage: string
  remainingTime: string
} 
export type ProgressEventEvent = (status: ProgressEventEventData) => void 
export type UploadedEvent = (url: string) => void 
export type DailyLimitEvent = (message: string) => void 

export type ErrorEventData = {
  code: "invalid_cookies" | "youtube_error"
  message: string
}
export type ErrorLimitEvent = (error: ErrorEventData) => void 


export type ZytUploaderEvents = {
  logs: LogsEvent
  progress: ProgressEventEvent
  progressText: ProgressTextEvent
  uploaded: UploadedEvent
  dailyLimit: DailyLimitEvent
  error: ErrorLimitEvent

}