"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
var __classPrivateFieldSet = (this && this.__classPrivateFieldSet) || function (receiver, state, value, kind, f) {
    if (kind === "m") throw new TypeError("Private method is not writable");
    if (kind === "a" && !f) throw new TypeError("Private accessor was defined without a setter");
    if (typeof state === "function" ? receiver !== state || !f : !state.has(receiver)) throw new TypeError("Cannot write private member to an object whose class did not declare it");
    return (kind === "a" ? f.call(receiver, value) : f ? f.value = value : state.set(receiver, value)), value;
};
var __classPrivateFieldGet = (this && this.__classPrivateFieldGet) || function (receiver, state, kind, f) {
    if (kind === "a" && !f) throw new TypeError("Private accessor was defined without a getter");
    if (typeof state === "function" ? receiver !== state || !f : !state.has(receiver)) throw new TypeError("Cannot read private member from an object whose class did not declare it");
    return kind === "m" ? f : kind === "a" ? f.call(receiver) : f ? f.value : state.get(receiver);
};
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
var _ZytUploader_cookies;
Object.defineProperty(exports, "__esModule", { value: true });
exports.loginAndGetCookies = exports.cookiesIsValid = void 0;
const node_fs_1 = __importDefault(require("node:fs"));
const node_events_1 = require("node:events");
const puppeteer_extra_1 = __importDefault(require("puppeteer-extra"));
const puppeteer_extra_plugin_stealth_1 = __importDefault(require("puppeteer-extra-plugin-stealth"));
const utils_1 = require("./utils");
const upload_1 = require("./upload");
const comment_1 = require("./comment");
puppeteer_extra_1.default.use((0, puppeteer_extra_plugin_stealth_1.default)());
class ZytUploader extends node_events_1.EventEmitter {
    constructor() {
        super(...arguments);
        _ZytUploader_cookies.set(this, [{}]);
    }
    on(event, listener) {
        return super.on(event, listener);
    }
    loginAndGetCookies({ password, email, launchOptions, saveSession } = { saveSession: true }) {
        return __awaiter(this, void 0, void 0, function* () {
            const cookies = yield loginAndGetCookies({ password, email, launchOptions });
            __classPrivateFieldSet(this, _ZytUploader_cookies, cookies, "f");
            return cookies;
        });
    }
    loadCookiesFromFile(filePath) {
        return __awaiter(this, void 0, void 0, function* () {
            if (!node_fs_1.default.existsSync(filePath))
                return console.error("Cookie file not found");
            try {
                const cookies = node_fs_1.default.readFileSync(filePath, { encoding: "utf-8" });
                __classPrivateFieldSet(this, _ZytUploader_cookies, JSON.parse(cookies), "f");
                return __classPrivateFieldGet(this, _ZytUploader_cookies, "f");
            }
            catch (e) {
                return console.error("Cookie file contains invalid json");
            }
        });
    }
    saveCookiesOnDisk(filePath) {
        return __awaiter(this, void 0, void 0, function* () {
            try {
                node_fs_1.default.writeFileSync(filePath, JSON.stringify(__classPrivateFieldGet(this, _ZytUploader_cookies, "f")), { encoding: "utf-8" });
            }
            catch (e) {
                return console.error("Cannot save cookies on disk");
            }
        });
    }
    getLoadedCookies() {
        return __classPrivateFieldGet(this, _ZytUploader_cookies, "f");
    }
    cookiesIsValid(cookies = __classPrivateFieldGet(this, _ZytUploader_cookies, "f")) {
        return __awaiter(this, void 0, void 0, function* () {
            return cookiesIsValid(cookies);
        });
    }
    uploadVideo({ title, videoPath, description, tags, thumbnailPath, visibility, launchOptions }) {
        return __awaiter(this, void 0, void 0, function* () {
            if (!title || !videoPath)
                return console.error("Missing title or videoPath");
            if (!this.cookiesIsValid())
                return console.error("Invalid cookies");
            return yield (0, upload_1.youtubeUpload)({ title, videoPath, description, tags, thumbnailPath, visibility: visibility || "unlisted", launchOptions }, __classPrivateFieldGet(this, _ZytUploader_cookies, "f"), this);
        });
    }
    commentVideo({ comment, videoId, launchOptions, pin }) {
        return __awaiter(this, void 0, void 0, function* () {
            if (!videoId || !comment)
                return console.error("Missing title or videoPath");
            if (!this.cookiesIsValid())
                return console.error("Invalid cookies");
            return yield (0, comment_1.commentVideo)({ comment, videoId, launchOptions, pin }, __classPrivateFieldGet(this, _ZytUploader_cookies, "f"), this);
        });
    }
}
_ZytUploader_cookies = new WeakMap();
exports.default = ZytUploader;
function cookiesIsValid(cookies) {
    return __awaiter(this, void 0, void 0, function* () {
        const cookiesString = (0, utils_1.convertJsonCookiesToText)(cookies);
        const res = yield fetch(`https://youtube.com`, {
            headers: {
                'Accept-Language': 'pt-BR',
                Cookie: cookiesString
            }
        });
        const resText = yield res.text();
        const keyLoggedIn = '{"key":"logged_in","value":"1"}]}';
        if (resText.includes(keyLoggedIn)) {
            return true;
        }
        else {
            return false;
        }
    });
}
exports.cookiesIsValid = cookiesIsValid;
function loginAndGetCookies({ email, password, launchOptions, }) {
    return __awaiter(this, void 0, void 0, function* () {
        const browser = yield puppeteer_extra_1.default.launch(Object.assign(Object.assign({}, launchOptions), { headless: false }));
        const pages = yield browser.pages();
        const page = pages[0];
        (0, utils_1.blockRequestsResources)(page, ["font", "image", "media"]);
        yield page.goto("https://youtube.com/upload", { waitUntil: 'domcontentloaded' });
        const INPUT_EMAIL_XPATH = "//input[@id='identifierId']";
        const INPUT_PASSWORD_XPATH = '//input[@type="password"]';
        const EMAIL_NEXTBUTTON_XPATH = "//div[@id='identifierNext']/div/button";
        const PASSWORD_NEXTBUTTON_XPATH = '//div[@id="passwordNext"]/div/button';
        if (email) {
            yield (0, utils_1.$xtypeInputElement)(INPUT_EMAIL_XPATH, page, email);
            yield (0, utils_1.$xclickElement)(EMAIL_NEXTBUTTON_XPATH, page);
            yield page.waitForXPath('//*[@id="forgotPassword"]'); /// Wait for the page password to load
            yield page.waitForNetworkIdle();
        }
        const passwordElement = yield page.$x(INPUT_PASSWORD_XPATH);
        yield passwordElement[0].focus();
        if (password) {
            yield (0, utils_1.$xtypeInputElement)(INPUT_PASSWORD_XPATH, page, password);
            yield (0, utils_1.$xclickElement)(PASSWORD_NEXTBUTTON_XPATH, page);
        }
        yield (0, utils_1.waitForPageUrl)("studio.youtube.com/channel", page);
        const cookies = yield page.cookies();
        yield browser.close();
        return cookies;
    });
}
exports.loginAndGetCookies = loginAndGetCookies;
