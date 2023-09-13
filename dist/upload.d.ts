/// <reference types="node" />
import { UploadVideo } from ".";
export declare function youtubeUpload({ title, videoPath, description, tags, thumbnailPath, visibility, launchOptions }: UploadVideo, cookies: any, event?: NodeJS.EventEmitter): Promise<unknown>;
