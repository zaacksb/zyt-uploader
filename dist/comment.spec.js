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
exports.validateZytSession = void 0;
const _1 = __importDefault(require("."));
const zytUploader = new _1.default();
function validateZytSession() {
    return __awaiter(this, void 0, void 0, function* () {
        let credentialsFile = 'youtubeCredentials.json';
        const { credentialsPath, email, password } = { credentialsPath: "D:\\Bibliotecas\\zytUploader\\src\\", email: "zaquelsilva0@gmail.com", password: "u)fbxkj2k*&7quWX" };
        if (credentialsPath)
            credentialsFile = `${credentialsPath}\\youtubecreds.json`;
        const loginParams = {
            email: email,
            password: password,
            launchOptions: {
                headless: false,
            },
        };
        yield zytUploader.loadCookiesFromFile(credentialsFile).catch((e) => __awaiter(this, void 0, void 0, function* () {
            yield zytUploader.loginAndGetCookies(loginParams);
            yield zytUploader.saveCookiesOnDisk(credentialsFile);
        }));
        const cookiesIsValid = yield zytUploader.cookiesIsValid();
        if (!cookiesIsValid) {
            yield zytUploader.loginAndGetCookies(loginParams);
            yield zytUploader.saveCookiesOnDisk(credentialsFile);
        }
        return true;
    });
}
exports.validateZytSession = validateZytSession;
(() => __awaiter(void 0, void 0, void 0, function* () {
    yield validateZytSession();
    console.log("logado");
    zytUploader.on("logs", console.log);
    yield zytUploader.uploadVideo({
        title: "a title",
        videoPath: "C:\\Users\\Zack\\Downloads\\19. Conhecendo o Charles Proxy.mp4",
        visibility: "unlisted",
        launchOptions: {
            headless: "new"
        }
    });
    console.log("commented");
}))();
console.log;
