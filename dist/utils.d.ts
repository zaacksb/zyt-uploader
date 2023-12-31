/// <reference types="node" />
import type { HTTPRequest, Page } from "puppeteer";
export declare function convertJsonCookiesToText(cookies: Record<string, Object>[]): string;
export declare function $xtypeInputElement(xpath: string, page: Page, text: string): Promise<void>;
export declare function $xclickElement(xpath: string, page: Page): Promise<void>;
export declare function $xtypeElmement(xpath: string, comment: string, page: Page): Promise<void>;
export declare function waitForPageUrl(url: string, page: Page): Promise<unknown>;
export declare function blockRequestsResources(page: Page, terms?: ReturnType<HTTPRequest["resourceType"]>[]): void;
export declare function waitUntilSomeResponse(page: Page, url: string): Promise<unknown>;
export declare const sleep: (time?: number) => Promise<unknown>;
export declare function waitUploadComplete(page: Page, event: NodeJS.EventEmitter | undefined): Promise<unknown>;
export declare function autoScroll(page: Page): Promise<void>;
export declare function scrollTillVeiw(page: Page, element: string): Promise<void>;
