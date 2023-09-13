/// <reference types="node" />
import { EventEmitter } from "node:events";
import type { PuppeteerLaunchOptions } from "puppeteer";
import { ZytUploaderEvents } from "./types";
export type LoginAndGetCookies = {
    email?: string;
    password?: string;
    saveSession?: boolean;
    launchOptions?: PuppeteerLaunchOptions;
};
export type UploadVideo = {
    videoPath: string;
    title: string;
    thumbnailPath?: string;
    visibility?: "public" | "unlisted" | "private";
    description?: string;
    tags?: string[];
    launchOptions?: PuppeteerLaunchOptions;
};
export default class ZytUploader extends EventEmitter {
    private cookies;
    constructor();
    on<E extends keyof ZytUploaderEvents>(event: E, listener: ZytUploaderEvents[E]): this;
    loginAndGetCookies({ password, email, launchOptions, saveSession }?: LoginAndGetCookies): Promise<import("puppeteer").Protocol.Network.Cookie[]>;
    loadCookiesFromFile(filePath: string): Promise<void>;
    saveCookiesOnDisk(filePath: string): Promise<void>;
    getLoadedCookies(): any;
    cookiesIsValid(cookies?: Record<string, Object>[]): Promise<boolean>;
    uploadVideo({ title, videoPath, description, tags, thumbnailPath, visibility, launchOptions }: UploadVideo): Promise<unknown>;
}
export declare function cookiesIsValid(cookies: Record<string, Object>[]): Promise<boolean>;
export declare function loginAndGetCookies({ email, password, launchOptions, }: Omit<LoginAndGetCookies, "saveSession">): Promise<import("puppeteer").Protocol.Network.Cookie[]>;
