## ZYT Uploader
<h1 align="center">Youtube video uploader</h1> 

[![npm version](https://img.shields.io/npm/v/zyt-uploader.svg?style=flat)](https://www.npmjs.com/package/zyt-uploader)

------------


##### **🚨important :** This is not the final version, I did it just as a provisional, In case you find any issue, please raise an  [issue](https://github.com/zaacksb/zyt-uploader/issues/new/choose), So that I can fix it.<br>
  
Please star this repo by clicking on [:star: button](#) above [:arrow_upper_right:](#)

**ZytUploader** is a Node.js library that simplifies the process of uploading videos to YouTube without the limitations of the Google API. This library, written in TypeScript, utilizes Puppeteer for automation.

### Features:
- No upload Limits (50+ videos/day limit set by youtube for every channel)
- Free & Easy to use

### Prerequisite:
- Install [Nodejs Current Version](https://nodejs.org/en/#:~:text=Current)
  
### Installation:
```bash
npm i zyt-uploader
```



## Usage:
### To use zyt-uploader, follow these steps:

#### Import the ZytUploader class and create an instance:
```js
const { ZytUploader } = require('zyt-uploader');
const zytUploader = new ZytUploader();
```

#### Authenticate and load cookies:
```js
const credentialsFile = 'youtubeCredentials.json';
const loginParams = {
    email: 'your email',
    password: 'your password',
    launchOptions: {
        headless: false,
    },
};

await zytUploader.loadCookiesFromFile(credentialsFile).catch(async (e) => {
    await zytUploader.loginAndGetCookies(loginParams);
    await zytUploader.saveCookiesOnDisk(credentialsFile);
});
```

#### Check if cookies are valid and re-authenticate if necessary:
```js
const cookieIsValid = await zytUploader.cookiesIsValid();
if (!cookieIsValid) {
    await zytUploader.loginAndGetCookies(loginParams);
}
```
#### Upload a video using the uploadVideo method:
```js
const videoUrl = await zytUploader.uploadVideo({
    videoPath: 'video.mp4',
    title: '👩‍💻 Video uploaded by zyt-uploader',
    description: 'zyt-upload project: https://github.com/zaacksb/zyt-uploader',
    thumbnailPath: 'thumbnail.jpg',
    tags: ['nodejs', 'zyt'],
    visibility: 'unlisted',
    launchOptions: {
        headless: 'new',
    },
});
```

#### set up event listeners for progress, logs, errors, daily limit, and upload completion:
```js
zytUploader.on('progress', ({action, percentage, remainingTime}) => {
    console.log(status);
});

zytUploader.on('progressText', (progress) => {
    console.log(Event progress: ${progress});
});

zytUploader.on('logs', (log) => {
    console.log(log);
});

zytUploader.on('dailyLimit', (message) => {
    console.log(message);
});

zytUploader.on('error', (error) => {
    console.log(error);
});

zytUploader.on('uploaded', (url) => {
    console.log(Video uploaded: ${url});
});
```


## Additional Information
To see the browser window during execution, use headless: false. For headless operation, use headless: "new".

You can monitor the progress of the upload using the 'progress' event, which provides information about the action, percentage, and remaining time.

The 'logs' event logs all messages during the process.

The 'error' event provides error information, including codes and messages.

The 'dailyLimit' event notifies you if you reach the daily upload limit on YouTube.

The 'uploaded' event is triggered when the entire upload process is complete, providing the URL of the uploaded video.



## License
This library is distributed under the MIT license. Feel free to use, modify, and distribute it as needed.

For more details, check out the zyt-uploader GitHub repository.


###### Based on the [youtube-uploader](https://github.com/fawazahmed0/youtube-uploader) library by [fawazahmed0](https://github.com/fawazahmed0)
<br>
<br>