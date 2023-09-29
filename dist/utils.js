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
Object.defineProperty(exports, "__esModule", { value: true });
exports.scrollTillVeiw = exports.autoScroll = exports.waitUploadComplete = exports.sleep = exports.waitUntilSomeResponse = exports.blockRequestsResources = exports.waitForPageUrl = exports.$xtypeElmement = exports.$xclickElement = exports.$xtypeInputElement = exports.convertJsonCookiesToText = void 0;
function convertJsonCookiesToText(cookies) {
    return cookies.map((c) => `${c.name}=${c.value}`).join('; ');
}
exports.convertJsonCookiesToText = convertJsonCookiesToText;
function $xtypeInputElement(xpath, page, text) {
    return __awaiter(this, void 0, void 0, function* () {
        yield page.waitForXPath(xpath);
        const inputEl = yield page.$x(xpath);
        yield inputEl[0].focus();
        yield inputEl[0].type(text);
    });
}
exports.$xtypeInputElement = $xtypeInputElement;
function $xclickElement(xpath, page) {
    return __awaiter(this, void 0, void 0, function* () {
        const emailNextButton = yield page.$x(xpath);
        yield emailNextButton[0].click();
    });
}
exports.$xclickElement = $xclickElement;
function $xtypeElmement(xpath, comment, page) {
    return __awaiter(this, void 0, void 0, function* () {
        const emailNextButton = yield page.$x(xpath);
        yield emailNextButton[0].type(comment);
    });
}
exports.$xtypeElmement = $xtypeElmement;
function waitForPageUrl(url, page) {
    return __awaiter(this, void 0, void 0, function* () {
        return new Promise((resolve) => {
            const waitUrlInterval = setInterval(() => {
                const pageUrl = page.url();
                if (pageUrl.includes(url)) {
                    clearInterval(waitUrlInterval);
                    resolve(true);
                }
            }, 50);
        });
    });
}
exports.waitForPageUrl = waitForPageUrl;
function blockRequestsResources(page, terms = []) {
    page.setRequestInterception(true);
    page.on('request', (request) => __awaiter(this, void 0, void 0, function* () {
        const requestType = request.resourceType();
        if (terms.includes(requestType)) {
            request.abort();
            return;
        }
        request.continue();
    }));
}
exports.blockRequestsResources = blockRequestsResources;
function waitUntilSomeResponse(page, url) {
    return new Promise(resolve => {
        page.setRequestInterception(true);
        page.on('response', (response) => __awaiter(this, void 0, void 0, function* () {
            const responseUrl = response.url();
            if (responseUrl.includes(url)) {
                resolve(true);
            }
        }));
    });
}
exports.waitUntilSomeResponse = waitUntilSomeResponse;
const sleep = (time = 1000) => __awaiter(void 0, void 0, void 0, function* () { return new Promise(resolve => setTimeout(resolve, time)); });
exports.sleep = sleep;
function waitUploadComplete(page, event) {
    return __awaiter(this, void 0, void 0, function* () {
        return new Promise(resolve => {
            let lastMessageSent = "";
            const endUploadMessages = ["Checking", "Processing", "Uploading 100%", "Checking", "Checks complete", "Upload complete"];
            const interval = setInterval(() => __awaiter(this, void 0, void 0, function* () {
                let curProgress = yield page.evaluate(() => {
                    let items = document.querySelectorAll('span.progress-label.ytcp-video-upload-progress');
                    for (let i = 0; i < items.length; i++) {
                        return items.item(i).textContent;
                    }
                });
                if (interval == undefined || !curProgress)
                    return;
                const progressMessage = curProgress;
                if (lastMessageSent !== progressMessage) {
                    event === null || event === void 0 ? void 0 : event.emit("progress", progressMessage);
                    if (containsEndMessage(progressMessage, endUploadMessages)) {
                        clearInterval(interval);
                        resolve(true);
                        return;
                    }
                    if (progressMessage.includes("%")) {
                        const [action, percentage] = progressMessage.split(" ");
                        const remainingTime = progressMessage.split(" ... ")[1];
                        event === null || event === void 0 ? void 0 : event.emit(`${action.toLowerCase()}`, { action, percentage, remainingTime });
                        if (Number(percentage.replace("%", "")) >= 100 && action == "Uploading") {
                            clearInterval(interval);
                            resolve(true);
                        }
                    }
                }
            }), 500);
            return interval;
        });
    });
}
exports.waitUploadComplete = waitUploadComplete;
function containsEndMessage(inputString, endMessages) {
    return endMessages.some(message => inputString.includes(message));
}
function autoScroll(page) {
    return __awaiter(this, void 0, void 0, function* () {
        yield page.evaluate(`(async () => {
      await new Promise((resolve, reject) => {
          var totalHeight = 0;
          var distance = 100;
          var timer = setInterval(() => {
              var scrollHeight = document.body.scrollHeight;
              window.scrollBy(0, distance);
              totalHeight += distance;

              if(totalHeight >= scrollHeight){
                  clearInterval(timer);
                  resolve(0);
              }
          }, 100);
      });
  })()`);
    });
}
exports.autoScroll = autoScroll;
function scrollTillVeiw(page, element) {
    return __awaiter(this, void 0, void 0, function* () {
        let sc = true;
        while (sc) {
            try {
                yield page.focus(element);
                sc = false;
            }
            catch (err) {
                yield autoScroll(page);
                sc = true;
            }
        }
        return;
    });
}
exports.scrollTillVeiw = scrollTillVeiw;
