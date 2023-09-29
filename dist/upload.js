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
exports.youtubeUpload = void 0;
const puppeteer_extra_1 = __importDefault(require("puppeteer-extra"));
const utils_1 = require("./utils");
function youtubeUpload({ title, videoPath, description, tags, thumbnailPath, visibility, launchOptions }, cookies, event) {
    return __awaiter(this, void 0, void 0, function* () {
        return new Promise((resolve) => __awaiter(this, void 0, void 0, function* () {
            event === null || event === void 0 ? void 0 : event.emit("logs", "Starting youtube vod uploader");
            const maxTitleLen = 100;
            const maxDescLen = 5000;
            if (!cookies) {
                return event === null || event === void 0 ? void 0 : event.emit("error", { code: "invalid_cookies", message: "An error occurred while parsing cookies for zyt" });
            }
            const browser = yield puppeteer_extra_1.default.launch(Object.assign({}, launchOptions));
            const pages = yield browser.pages();
            const page = pages[0];
            (0, utils_1.blockRequestsResources)(page, ["font", "image", "media"]);
            yield page.setExtraHTTPHeaders({
                'Accept-Language': 'en'
            });
            yield page.setCookie(...cookies);
            yield page.goto("https://www.youtube.com/upload?persist_gl=1&gl=US&persist_hl=1&hl=en", { waitUntil: 'domcontentloaded' });
            const SELECT_FILE_BTN_XPATH = '//*[@id="select-files-button"]';
            const SELECT_THUMBNAIL_BTN_XPATH = '//*[@id="select-button"]';
            const closeBtnXPath = "//*[normalize-space(text())='Close']";
            const uploadAsDraft = false;
            event === null || event === void 0 ? void 0 : event.emit("logs", "Selecting video file");
            yield page.waitForXPath(SELECT_FILE_BTN_XPATH, {
                visible: true
            });
            const [fileChooser] = yield Promise.all([
                page.waitForFileChooser(),
                (0, utils_1.$xclickElement)(SELECT_FILE_BTN_XPATH, page) // button that triggers file selection
            ]);
            yield fileChooser.accept([videoPath]);
            event === null || event === void 0 ? void 0 : event.emit("logs", "Video file selected");
            yield page.waitForXPath('//*[@id="reuse-details-button"]', { visible: true }); // wait modal load
            const errorMessage = yield page.evaluate(() => { var _a; return (_a = document.querySelector('.error-area.style-scope.ytcp-uploads-dialog')) === null || _a === void 0 ? void 0 : _a.innerText.trim(); });
            if (errorMessage) {
                yield browser.close();
                return event === null || event === void 0 ? void 0 : event.emit("error", { code: "youtube_error", message: `Youtube returned an error: ${errorMessage}` });
            }
            // Check if daily upload limit is reached
            event === null || event === void 0 ? void 0 : event.emit("logs", "Checking daily limit reached");
            const dailyUploadPromise = yield page.waitForXPath('//div[contains(text(),"Daily upload limit reached")]', { timeout: 5000 }).then(() => 'dailyUploadReached').catch(() => "none");
            if (dailyUploadPromise === 'dailyUploadReached') {
                browser.close();
                event === null || event === void 0 ? void 0 : event.emit("dailyLimit", "Daily upload limit reached");
            }
            event === null || event === void 0 ? void 0 : event.emit("logs", "Waiting upload complete");
            yield (0, utils_1.waitUploadComplete)(page, event);
            // Wait for upload to go away and processing to start, skip the wait if the user doesn't want it.
            if (true) {
                // waits for checks to be complete (upload should be complete already)
                yield page.waitForXPath('//*[contains(text(),"Video upload complete")]', { hidden: true, timeout: 0 });
            }
            event === null || event === void 0 ? void 0 : event.emit("logs", "Upload completed");
            if (thumbnailPath) {
                event === null || event === void 0 ? void 0 : event.emit("logs", "Starting thumbnail upload");
                yield page.waitForXPath(SELECT_THUMBNAIL_BTN_XPATH);
                const [thumbChooser] = yield Promise.all([
                    page.waitForFileChooser(),
                    (0, utils_1.$xclickElement)(SELECT_THUMBNAIL_BTN_XPATH, page) // button that triggers file selection
                ]);
                yield thumbChooser.accept([thumbnailPath]);
                event === null || event === void 0 ? void 0 : event.emit("logs", "Thumbnail Uploaded");
            }
            event === null || event === void 0 ? void 0 : event.emit("logs", "Writing video title");
            yield page.waitForFunction('document.querySelectorAll(\'[id="textbox"]\').length > 1');
            const textBoxes = yield page.$x('//*[@id="textbox"]');
            yield page.bringToFront();
            // Add the title value
            yield textBoxes[0].focus();
            yield (0, utils_1.sleep)();
            yield textBoxes[0].evaluate((e) => (e.__shady_native_textContent = ''));
            yield textBoxes[0].type(title.substring(0, maxTitleLen));
            // Add the Description content
            if (description) {
                event === null || event === void 0 ? void 0 : event.emit("logs", "Writing video description");
                yield textBoxes[0].evaluate((e) => (e.__shady_native_textContent = ''));
                yield textBoxes[1].type(description.substring(0, maxDescLen));
            }
            yield (0, utils_1.$xclickElement)('//*[contains(text(),"No, it\'s")]', page);
            const isNotForKid = true;
            const isAgeRestriction = false;
            if (!isNotForKid) {
                event === null || event === void 0 ? void 0 : event.emit("logs", "Selecting video restriction: For kids");
                yield page.click("tp-yt-paper-radio-button[name='VIDEO_MADE_FOR_KIDS_MFK']").catch(() => { });
            }
            else if (isAgeRestriction) {
                event === null || event === void 0 ? void 0 : event.emit("logs", "Selecting video restriction: Age restriction");
                yield page.$eval(`tp-yt-paper-radio-button[name='VIDEO_AGE_RESTRICTION_SELF']`, (e) => e.click());
            }
            else {
                event === null || event === void 0 ? void 0 : event.emit("logs", "Selecting video restriction: Not for kids without age restriction");
                yield page.click("tp-yt-paper-radio-button[name='VIDEO_MADE_FOR_KIDS_NOT_MFK']").catch(() => { });
            }
            let showMoreButton = yield page.$('#toggle-button');
            if (showMoreButton == undefined)
                return event === null || event === void 0 ? void 0 : event.emit("error", `uploadVideo - Toggle button not found.`);
            else {
                while ((yield page.$('ytcp-video-metadata-editor-advanced')) == undefined) {
                    yield showMoreButton.click();
                    yield (0, utils_1.sleep)(1000);
                }
            }
            // Add tags
            event === null || event === void 0 ? void 0 : event.emit("logs", "Adding video tags");
            if (tags) {
                //show more
                try {
                    yield page.focus(`[aria-label="Tags"]`);
                    yield page.type(`[aria-label="Tags"]`, tags.join(', ').substring(0, 495) + ', ');
                }
                catch (err) { }
            }
            const nextBtnXPath = "//*[normalize-space(text())='Next']/parent::*[not(@disabled)]";
            yield page.waitForXPath(nextBtnXPath);
            yield page.$x(nextBtnXPath);
            yield (0, utils_1.$xclickElement)(nextBtnXPath, page);
            const isChannelMonetized = false;
            if (isChannelMonetized) {
                event === null || event === void 0 ? void 0 : event.emit("logs", "Configuring settings for non-monetized channel");
                try {
                    yield page.waitForSelector('#child-input ytcp-video-monetization', { visible: true, timeout: 10000 });
                    yield (0, utils_1.sleep)(1500);
                    yield page.click('#child-input ytcp-video-monetization');
                    yield page.waitForSelector('ytcp-video-monetization-edit-dialog.cancel-button-hidden .ytcp-video-monetization-edit-dialog #radioContainer #onRadio');
                    yield page.evaluate(() => {
                        var _a;
                        return (_a = (document.querySelector('ytcp-video-monetization-edit-dialog.cancel-button-hidden .ytcp-video-monetization-edit-dialog #radioContainer #onRadio')
                        // @ts-expect-error
                        )) === null || _a === void 0 ? void 0 : _a.click();
                    });
                    yield (0, utils_1.sleep)(1500);
                    yield page.waitForSelector('ytcp-video-monetization-edit-dialog.cancel-button-hidden .ytcp-video-monetization-edit-dialog #save-button', { visible: true });
                    yield page.click('ytcp-video-monetization-edit-dialog.cancel-button-hidden .ytcp-video-monetization-edit-dialog #save-button');
                    yield (0, utils_1.sleep)(1500);
                    yield page.waitForXPath(nextBtnXPath);
                    yield page.$x(nextBtnXPath);
                    yield (0, utils_1.$xclickElement)(nextBtnXPath, page);
                }
                catch (_a) { }
                try {
                    yield page.waitForSelector('.ytpp-self-certification-questionnaire .ytpp-self-certification-questionnaire #checkbox-container', { visible: true, timeout: 10000 });
                    yield page.evaluate(() => {
                        var _a;
                        return (_a = (document.querySelector('.ytpp-self-certification-questionnaire .ytpp-self-certification-questionnaire #checkbox-container')
                        // @ts-expect-error
                        )) === null || _a === void 0 ? void 0 : _a.click();
                    });
                    yield (0, utils_1.sleep)(1500);
                    yield page.waitForSelector('.ytpp-self-certification-questionnaire .ytpp-self-certification-questionnaire #submit-questionnaire-button', { visible: true });
                    yield page.evaluate(() => {
                        var _a;
                        return (_a = (document.querySelector('.ytpp-self-certification-questionnaire .ytpp-self-certification-questionnaire #submit-questionnaire-button')
                        // @ts-expect-error
                        )) === null || _a === void 0 ? void 0 : _a.click();
                    });
                    yield page.waitForXPath(nextBtnXPath);
                    yield page.$x(nextBtnXPath);
                    yield (0, utils_1.$xclickElement)(nextBtnXPath, page);
                    yield (0, utils_1.sleep)(1500);
                }
                catch (_b) { }
            }
            event === null || event === void 0 ? void 0 : event.emit("logs", "Finished monetization settings");
            event === null || event === void 0 ? void 0 : event.emit("logs", "Click next button");
            yield page.waitForXPath(nextBtnXPath);
            // click next button
            yield page.$x(nextBtnXPath);
            yield (0, utils_1.$xclickElement)(nextBtnXPath, page);
            yield page.waitForXPath(nextBtnXPath);
            // click next button
            yield page.$x(nextBtnXPath);
            yield (0, utils_1.$xclickElement)(nextBtnXPath, page);
            event === null || event === void 0 ? void 0 : event.emit("logs", `Selecting video visibility: ${visibility}`);
            yield page.waitForSelector('#privacy-radios *[name="' + (visibility === null || visibility === void 0 ? void 0 : visibility.toUpperCase()) + '"]', { visible: true });
            yield (0, utils_1.sleep)(1000);
            yield page.click('#privacy-radios *[name="' + (visibility === null || visibility === void 0 ? void 0 : visibility.toUpperCase()) + '"]');
            // Get publish button
            event === null || event === void 0 ? void 0 : event.emit("logs", `Waiting for publish button`);
            const publishXPath = "//*[normalize-space(text())='Publish']/parent::*[not(@disabled)] | //*[normalize-space(text())='Save']/parent::*[not(@disabled)]";
            yield page.waitForXPath(publishXPath);
            // save youtube upload link
            const videoBaseLink = 'https://youtu.be';
            const shortVideoBaseLink = 'https://youtube.com/shorts';
            const uploadLinkSelector = `[href^="${videoBaseLink}"], [href^="${shortVideoBaseLink}"]`;
            yield page.waitForSelector(uploadLinkSelector);
            const uploadedLinkHandle = yield page.$(uploadLinkSelector);
            let uploadedLink;
            do {
                yield (0, utils_1.sleep)(500);
                uploadedLink = yield page.evaluate((e) => e.getAttribute('href'), uploadedLinkHandle);
            } while (uploadedLink === videoBaseLink || uploadedLink === shortVideoBaseLink);
            // const closeDialogXPath = uploadAsDraft ? saveCloseBtnXPath : publishXPath
            const closeDialogXPath = publishXPath;
            for (let i = 0; i < 10; i++) {
                try {
                    yield page.$x(closeDialogXPath);
                    yield (0, utils_1.$xclickElement)(closeDialogXPath, page);
                    event === null || event === void 0 ? void 0 : event.emit("logs", `Publishing`);
                    break;
                }
                catch (error) {
                    yield (0, utils_1.sleep)(5000);
                }
            }
            if (isChannelMonetized) {
                try {
                    yield page.waitForSelector('#dialog-buttons #secondary-action-button', { visible: true });
                    yield page.click('#dialog-buttons #secondary-action-button');
                }
                catch (_c) { }
            }
            // await page.waitForXPath('//*[contains(text(),"Finished processing")]', { timeout: 0})
            // no closeBtn will show up if keeps video as draft
            event === null || event === void 0 ? void 0 : event.emit("logs", "Waiting networkIdle, publication confirmation");
            yield page.waitForNetworkIdle({ idleTime: 1000 });
            if (uploadAsDraft) {
                resolve(uploadedLink);
            }
            // Wait for closebtn to show up
            event === null || event === void 0 ? void 0 : event.emit("logs", "Video uploaded successfully");
            event === null || event === void 0 ? void 0 : event.emit("uploaded", uploadedLink);
            yield (0, utils_1.sleep)(10000);
            event === null || event === void 0 ? void 0 : event.emit("logs", "Closing browser");
            try {
                yield page.waitForXPath(closeBtnXPath);
            }
            catch (e) {
                yield browser.close();
                return event === null || event === void 0 ? void 0 : event.emit("error", 'Please make sure you set up your default video visibility correctly, you might have forgotten. More infos : https://github.com/fawazahmed0/youtube-uploader#youtube-setup');
            }
            yield browser.close();
            resolve(uploadedLink);
        }));
    });
}
exports.youtubeUpload = youtubeUpload;
