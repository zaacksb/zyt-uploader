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
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.commentVideo = void 0;
const puppeteer_extra_1 = __importDefault(require("puppeteer-extra"));
const utils_1 = require("./utils");
function commentVideo({ comment, videoId, launchOptions, pin }, cookies, event) {
    return __awaiter(this, void 0, void 0, function* () {
        return yield new Promise((resolve) => __awaiter(this, void 0, void 0, function* () {
            event === null || event === void 0 ? void 0 : event.emit("logs", "Starting youtube vod uploader");
            if (!cookies) {
                return event === null || event === void 0 ? void 0 : event.emit("error", {
                    code: "invalid_cookies",
                    message: "An error occurred while parsing cookies for zyt",
                });
            }
            const browser = yield puppeteer_extra_1.default.launch(Object.assign({}, launchOptions));
            const pages = yield browser.pages();
            const page = pages[0];
            (0, utils_1.blockRequestsResources)(page, ["font", "image", "media"]);
            yield page.setExtraHTTPHeaders({
                "Accept-Language": "en",
            });
            yield page.setCookie(...cookies);
            yield page.goto(`https://www.youtube.com/watch?v=${videoId}&persist_gl=1&gl=US&persist_hl=1&hl=en`, {
                waitUntil: "domcontentloaded",
            });
            yield (0, utils_1.scrollTillVeiw)(page, `#placeholder-area`);
            yield page.focus(`#placeholder-area`);
            const COMMENT_BOX_XPATH = '//*[@id="placeholder-area"]';
            yield (0, utils_1.$xclickElement)(COMMENT_BOX_XPATH, page);
            yield (0, utils_1.$xtypeElmement)(COMMENT_BOX_XPATH, comment.substring(0, 10000), page);
            page.exposeFunction("commentResolve", resolve);
            (0, utils_1.waitUntilSomeResponse)(page, "comment/create_comment").then(() => __awaiter(this, void 0, void 0, function* () {
                yield browser.close();
            }));
            if (pin) {
                // Select the comment list
                const [commentList] = yield page.$x(`//ytd-comments[@id="comments"]//ytd-item-section-renderer[@section-identifier="comment-item-section"]/div[@id="contents"]`);
                // Register mutation observer for comment list
                yield commentList.evaluateHandle((commentList) => {
                    const observer = new MutationObserver((mutations) => {
                        mutations.forEach((mutation) => __awaiter(this, void 0, void 0, function* () {
                            if (mutation.addedNodes.length > 0) {
                                try {
                                    // Get the recently added comment node
                                    const comment = mutation.addedNodes[0];
                                    // Finds three dot menu inside comment
                                    // Evaluate XPath relative to the added comment.
                                    // It'd be nice to use Puppeteer's helpers but the MutationObserver returns DOM nodes
                                    const menu = document.evaluate(`.//div[@id="action-menu"]/ytd-menu-renderer/yt-icon-button`, comment, null, XPathResult.FIRST_ORDERED_NODE_TYPE).singleNodeValue;
                                    // Expand three dot menu
                                    menu && menu.click();
                                    // Wait for menu to expand
                                    yield new Promise((resolve) => setTimeout(resolve, 100));
                                    // Select pin button
                                    const pinButton = document.evaluate(`.//tp-yt-paper-item//*[text()="Pin"]/ancestor::tp-yt-paper-item`, document, null, XPathResult.FIRST_ORDERED_NODE_TYPE).singleNodeValue;
                                    // Click pin button
                                    pinButton && pinButton.click();
                                    // Wait for confirmation dialog
                                    yield new Promise((resolve) => setTimeout(resolve, 100));
                                    // Confirm pin
                                    const confirmButton = document.querySelector("#confirm-button>yt-button-shape>button");
                                    confirmButton && confirmButton.click();
                                    // Disconnect observer
                                    observer.disconnect();
                                    // Resolve promise
                                    // @ts-expect-error - commentResolve is exposed to the page
                                    window.commentResolve({ err: false, data: "sucess" });
                                }
                                catch (err) {
                                    // @ts-expect-error - commentResolve is exposed to the page
                                    window.commentResolve({ err: true, data: err });
                                }
                            }
                        }));
                    });
                    observer.observe(commentList, { childList: true });
                });
            }
            yield page.click("#submit-button");
            if (pin) {
                // Let mutation observer resolve promise after pinning comment
            }
            else {
                resolve({ err: false, data: "sucess" });
            }
        }));
    });
}
exports.commentVideo = commentVideo;
