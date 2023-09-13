"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.waitUploadComplete = exports.sleep = exports.blockRequestsResources = exports.waitForPageUrl = exports.$xclickElement = exports.$xtypeInputElement = exports.convertJsonCookiesToText = void 0;
function convertJsonCookiesToText(cookies) {
    return cookies.map((c) => `${c.name}=${c.value}`).join('; ');
}
exports.convertJsonCookiesToText = convertJsonCookiesToText;
async function $xtypeInputElement(xpath, page, text) {
    await page.waitForXPath(xpath);
    const inputEl = await page.$x(xpath);
    await inputEl[0].focus();
    await inputEl[0].type(text);
}
exports.$xtypeInputElement = $xtypeInputElement;
async function $xclickElement(xpath, page) {
    const emailNextButton = await page.$x(xpath);
    await emailNextButton[0].click();
}
exports.$xclickElement = $xclickElement;
async function waitForPageUrl(url, page) {
    return new Promise((resolve) => {
        const waitUrlInterval = setInterval(() => {
            const pageUrl = page.url();
            if (pageUrl.includes(url)) {
                clearInterval(waitUrlInterval);
                resolve(true);
            }
        }, 50);
    });
}
exports.waitForPageUrl = waitForPageUrl;
function blockRequestsResources(page, terms = []) {
    page.setRequestInterception(true);
    page.on('request', async (request) => {
        const requestType = request.resourceType();
        if (terms.includes(requestType)) {
            request.abort();
            return;
        }
        request.continue();
    });
}
exports.blockRequestsResources = blockRequestsResources;
const sleep = async (time = 1000) => new Promise(resolve => setTimeout(resolve, time));
exports.sleep = sleep;
async function waitUploadComplete(page, event) {
    return new Promise(resolve => {
        let lastMessageSent = "";
        const endUploadMessages = ["Checking", "Processing", "Uploading 100%", "Checking", "Checks complete", "Upload complete"];
        const interval = setInterval(async () => {
            let curProgress = await page.evaluate(() => {
                let items = document.querySelectorAll('span.progress-label.ytcp-video-upload-progress');
                for (let i = 0; i < items.length; i++) {
                    return items.item(i).textContent;
                }
            });
            if (interval == undefined || !curProgress)
                return;
            const progressMessage = curProgress;
            if (lastMessageSent !== progressMessage) {
                event?.emit("progress", progressMessage);
                if (containsEndMessage(progressMessage, endUploadMessages)) {
                    clearInterval(interval);
                    resolve(true);
                    return;
                }
                if (progressMessage.includes("%")) {
                    const [action, percentage] = progressMessage.split(" ");
                    const remainingTime = progressMessage.split(" ... ")[1];
                    event?.emit(`${action.toLowerCase()}`, { action, percentage, remainingTime });
                    if (Number(percentage.replace("%", "")) >= 100 && action == "Uploading") {
                        clearInterval(interval);
                        resolve(true);
                    }
                }
            }
        }, 500);
        return interval;
    });
}
exports.waitUploadComplete = waitUploadComplete;
function containsEndMessage(inputString, endMessages) {
    return endMessages.some(message => inputString.includes(message));
}
