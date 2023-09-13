"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.loginAndGetCookies = exports.cookiesIsValid = void 0;
const node_fs_1 = __importDefault(require("node:fs"));
const node_events_1 = require("node:events");
const puppeteer_extra_1 = __importDefault(require("puppeteer-extra"));
const puppeteer_extra_plugin_stealth_1 = __importDefault(require("puppeteer-extra-plugin-stealth"));
const utils_1 = require("./utils");
const upload_1 = require("./upload");
puppeteer_extra_1.default.use((0, puppeteer_extra_plugin_stealth_1.default)());
class ZytUploader extends node_events_1.EventEmitter {
    cookies;
    constructor() {
        super();
        this.cookies = [{}];
    }
    on(event, listener) {
        return super.on(event, listener);
    }
    async loginAndGetCookies({ password, email, launchOptions, saveSession } = { saveSession: true }) {
        const cookies = await loginAndGetCookies({ password, email, launchOptions });
        if (saveSession)
            this.cookies = cookies;
        return cookies;
    }
    async loadCookiesFromFile(filePath) {
        if (!node_fs_1.default.existsSync(filePath))
            throw new Error("Cookie file not found");
        try {
            const cookies = node_fs_1.default.readFileSync(filePath, { encoding: "utf-8" });
            this.cookies = JSON.parse(cookies);
        }
        catch (e) {
            throw new Error("Cookie file contains invalid json");
        }
    }
    async saveCookiesOnDisk(filePath) {
        try {
            node_fs_1.default.writeFileSync(filePath, JSON.stringify(this.cookies), { encoding: "utf-8" });
        }
        catch (e) {
            throw new Error("Cannot save cookies on disk");
        }
    }
    getLoadedCookies() {
        return this.cookies;
    }
    async cookiesIsValid(cookies = this.cookies) {
        return cookiesIsValid(cookies);
    }
    async uploadVideo({ title, videoPath, description, tags, thumbnailPath, visibility, launchOptions }) {
        if (!title || !videoPath)
            throw new Error("Missing title or videoPath");
        if (!this.cookiesIsValid())
            throw new Error("Invalid cookies");
        return await (0, upload_1.youtubeUpload)({ title, videoPath, description, tags, thumbnailPath, visibility: visibility || "unlisted", launchOptions }, this.cookies, this);
    }
}
exports.default = ZytUploader;
async function cookiesIsValid(cookies) {
    const cookiesString = (0, utils_1.convertJsonCookiesToText)(cookies);
    const res = await fetch(`https://youtube.com`, {
        headers: {
            'Accept-Language': 'pt-BR',
            Cookie: cookiesString
        }
    });
    const resText = await res.text();
    const keyLoggedIn = '{"key":"logged_in","value":"1"}]}';
    if (resText.includes(keyLoggedIn)) {
        return true;
    }
    else {
        return false;
    }
}
exports.cookiesIsValid = cookiesIsValid;
async function loginAndGetCookies({ email, password, launchOptions, }) {
    const browser = await puppeteer_extra_1.default.launch({
        ...launchOptions,
        headless: false
    });
    const pages = await browser.pages();
    const page = pages[0];
    (0, utils_1.blockRequestsResources)(page, ["font", "image", "media"]);
    await page.goto("https://youtube.com/upload", { waitUntil: 'domcontentloaded' });
    const INPUT_EMAIL_XPATH = "//input[@id='identifierId']";
    const INPUT_PASSWORD_XPATH = '//input[@type="password"]';
    const EMAIL_NEXTBUTTON_XPATH = "//div[@id='identifierNext']/div/button";
    const PASSWORD_NEXTBUTTON_XPATH = '//div[@id="passwordNext"]/div/button';
    if (email) {
        await (0, utils_1.$xtypeInputElement)(INPUT_EMAIL_XPATH, page, email);
        await (0, utils_1.$xclickElement)(EMAIL_NEXTBUTTON_XPATH, page);
        await page.waitForXPath('//*[@id="forgotPassword"]'); /// Wait for the page password to load
        await page.waitForNetworkIdle();
    }
    const passwordElement = await page.$x(INPUT_PASSWORD_XPATH);
    await passwordElement[0].focus();
    if (password) {
        await (0, utils_1.$xtypeInputElement)(INPUT_PASSWORD_XPATH, page, password);
        await (0, utils_1.$xclickElement)(PASSWORD_NEXTBUTTON_XPATH, page);
    }
    await (0, utils_1.waitForPageUrl)("studio.youtube.com/channel", page);
    const cookies = await page.cookies();
    await browser.close();
    return cookies;
}
exports.loginAndGetCookies = loginAndGetCookies;
