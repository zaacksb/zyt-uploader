import { UploadVideo } from ".";
import puppeteer from "puppeteer-extra"
import puppeteerStealthPlugin from "puppeteer-extra-plugin-stealth"
import { $xclickElement, blockRequestsResources, sleep, waitUploadComplete } from "./utils";

export async function youtubeUpload({title, videoPath, description, tags, thumbnailPath, visibility, launchOptions}: UploadVideo, cookies: any, event?: NodeJS.EventEmitter){
  return new Promise(async (resolve) => {
    event?.emit("logs", "Starting youtube vod uploader")
    const maxTitleLen = 100;
    const maxDescLen = 5000;
    if(!cookies){
      event?.emit("error", {code: "invalid_cookies", message: "An error occurred while parsing cookies for zyt"}) 
      throw new Error("Invalid cookies")
    }

    const browser = await puppeteer.launch({
      ...launchOptions
    });

    const pages = await browser.pages();
    const page = pages[0];
    blockRequestsResources(page, ["font", "image", "media"])
    await page.setExtraHTTPHeaders({
      'Accept-Language': 'en'
    });
    await page.setCookie(...cookies);
    await page.goto("https://www.youtube.com/upload?persist_gl=1&gl=US&persist_hl=1&hl=en", {waitUntil: 'domcontentloaded'})
    
    const SELECT_FILE_BTN_XPATH = '//*[@id="select-files-button"]'
    const SELECT_THUMBNAIL_BTN_XPATH = '//*[@id="select-button"]'

    const closeBtnXPath = "//*[normalize-space(text())='Close']"
    const uploadAsDraft = false

    event?.emit("logs", "Selecting video file") 
    await page.waitForXPath(SELECT_FILE_BTN_XPATH, {
      visible: true
    })
    const [fileChooser] = await Promise.all([
      page.waitForFileChooser(),
      $xclickElement(SELECT_FILE_BTN_XPATH, page) // button that triggers file selection
    ])
    await fileChooser.accept([videoPath])
    event?.emit("logs", "Video file selected") 
    
    await page.waitForXPath('//*[@id="reuse-details-button"]', {visible: true}) // wait modal load
    

    const errorMessage = await page.evaluate(() =>
          (document.querySelector('.error-area.style-scope.ytcp-uploads-dialog') as HTMLElement)?.innerText.trim()
      )
    if (errorMessage) {
        await browser.close()
        event?.emit("error", {code: "youtube_error", message: `Youtube returned an error: ${errorMessage}`})
        throw new Error('Youtube returned an error : ' + errorMessage)
    }



    // Check if daily upload limit is reached
    event?.emit("logs", "Checking daily limit reached") 
    const dailyUploadPromise = await page.waitForXPath('//div[contains(text(),"Daily upload limit reached")]', { timeout: 5000 }).then(() => 'dailyUploadReached').catch(() => "none")
    if (dailyUploadPromise === 'dailyUploadReached') {
      browser.close()
      event?.emit("dailyLimit", "Daily upload limit reached") 
      throw new Error('Daily upload limit reached')
    }

    event?.emit("logs", "Waiting upload complete") 
    await waitUploadComplete(page, event)
    // Wait for upload to go away and processing to start, skip the wait if the user doesn't want it.
    if (true) {
      // waits for checks to be complete (upload should be complete already)
      await page.waitForXPath('//*[contains(text(),"Video upload complete")]', { hidden: true, timeout: 0 })
    }
    event?.emit("logs", "Upload completed") 
    
    
    if (thumbnailPath) {
      event?.emit("logs", "Starting thumbnail upload") 
      await page.waitForXPath(SELECT_THUMBNAIL_BTN_XPATH);
      const [thumbChooser] = await Promise.all([
        page.waitForFileChooser(),
        $xclickElement(SELECT_THUMBNAIL_BTN_XPATH, page) // button that triggers file selection
      ]);
      await thumbChooser.accept([thumbnailPath]);
      event?.emit("logs", "Thumbnail Uploaded") 
    }

    event?.emit("logs", "Writing video title")
    await page.waitForFunction('document.querySelectorAll(\'[id="textbox"]\').length > 1')
    const textBoxes = await page.$x('//*[@id="textbox"]')
    await page.bringToFront()
    // Add the title value
    await textBoxes[0].focus()
    await sleep()
    await textBoxes[0].evaluate((e) => ((e as any).__shady_native_textContent = ''))
    await textBoxes[0].type(title.substring(0, maxTitleLen))
    // Add the Description content
    if(description){
      event?.emit("logs", "Writing video description")
      await textBoxes[0].evaluate((e) => ((e as any).__shady_native_textContent = ''))
      await textBoxes[1].type(description.substring(0, maxDescLen))
    }
    
    await $xclickElement('//*[contains(text(),"No, it\'s")]', page)
    
    const isNotForKid = true
    const isAgeRestriction = false
    if (!isNotForKid) {
      event?.emit("logs", "Selecting video restriction: For kids")
      await page.click("tp-yt-paper-radio-button[name='VIDEO_MADE_FOR_KIDS_MFK']").catch(() => {})
    } else if (isAgeRestriction) {
      event?.emit("logs", "Selecting video restriction: Age restriction")
      await page.$eval(`tp-yt-paper-radio-button[name='VIDEO_AGE_RESTRICTION_SELF']`, (e: any) => e.click())
    } else {
      event?.emit("logs", "Selecting video restriction: Not for kids without age restriction")
      await page.click("tp-yt-paper-radio-button[name='VIDEO_MADE_FOR_KIDS_NOT_MFK']").catch(() => {})
    }



    let showMoreButton = await page.$('#toggle-button')
      if (showMoreButton == undefined) throw `uploadVideo - Toggle button not found.`
      else {
          while ((await page.$('ytcp-video-metadata-editor-advanced')) == undefined) {
              await showMoreButton.click()
              await sleep(1000)
          }
      }

      // Add tags
      event?.emit("logs", "Adding video tags") 
      if (tags) {
        //show more
        try {
          await page.focus(`[aria-label="Tags"]`)
          await page.type(`[aria-label="Tags"]`, tags.join(', ').substring(0, 495) + ', ')
        } catch (err) {}
      }
      
      const nextBtnXPath = "//*[normalize-space(text())='Next']/parent::*[not(@disabled)]"
      let next
      
      await page.waitForXPath(nextBtnXPath)
      next = await page.$x(nextBtnXPath)
      await $xclickElement(nextBtnXPath, page)
      
      const isChannelMonetized = false
      if (isChannelMonetized) {
        event?.emit("logs", "Configuring settings for non-monetized channel") 
        try {
            await page.waitForSelector('#child-input ytcp-video-monetization', { visible: true, timeout: 10000 })

            await sleep(1500)

            await page.click('#child-input ytcp-video-monetization')

            await page.waitForSelector(
                'ytcp-video-monetization-edit-dialog.cancel-button-hidden .ytcp-video-monetization-edit-dialog #radioContainer #onRadio'
            )
            await page.evaluate(() =>
                (
                    document.querySelector(
                        'ytcp-video-monetization-edit-dialog.cancel-button-hidden .ytcp-video-monetization-edit-dialog #radioContainer #onRadio'
                    ) as HTMLInputElement
                ).click()
            )

            await sleep(1500)

            await page.waitForSelector(
                'ytcp-video-monetization-edit-dialog.cancel-button-hidden .ytcp-video-monetization-edit-dialog #save-button',
                { visible: true }
            )
            await page.click(
                'ytcp-video-monetization-edit-dialog.cancel-button-hidden .ytcp-video-monetization-edit-dialog #save-button'
            )

            await sleep(1500)

            await page.waitForXPath(nextBtnXPath)
            next = await page.$x(nextBtnXPath)
            await $xclickElement(nextBtnXPath, page)
        } catch {}

        try {
            await page.waitForSelector(
                '.ytpp-self-certification-questionnaire .ytpp-self-certification-questionnaire #checkbox-container',
                { visible: true, timeout: 10000 }
            )
            await page.evaluate(() =>
                (
                    document.querySelector(
                        '.ytpp-self-certification-questionnaire .ytpp-self-certification-questionnaire #checkbox-container'
                    ) as HTMLInputElement
                ).click()
            )

            await sleep(1500)

            await page.waitForSelector(
                '.ytpp-self-certification-questionnaire .ytpp-self-certification-questionnaire #submit-questionnaire-button',
                { visible: true }
            )
            await page.evaluate(() =>
                (
                    document.querySelector(
                        '.ytpp-self-certification-questionnaire .ytpp-self-certification-questionnaire #submit-questionnaire-button'
                    ) as HTMLButtonElement
                ).click()
            )

            await page.waitForXPath(nextBtnXPath)
            next = await page.$x(nextBtnXPath)
            await $xclickElement(nextBtnXPath, page)

            await sleep(1500)
        } catch {}
    }
    event?.emit("logs", "Finished monetization settings")
    
    
    event?.emit("logs", "Click next button")
    await page.waitForXPath(nextBtnXPath)
    // click next button
    next = await page.$x(nextBtnXPath)
    await $xclickElement(nextBtnXPath, page)
    await page.waitForXPath(nextBtnXPath)
    // click next button
    next = await page.$x(nextBtnXPath)
    await $xclickElement(nextBtnXPath, page)
    
    event?.emit("logs", `Selecting video visibility: ${visibility}`)
    await page.waitForSelector('#privacy-radios *[name="' + visibility?.toUpperCase() + '"]', { visible: true })
    
    await sleep(1000)
    
    await page.click('#privacy-radios *[name="' + visibility?.toUpperCase() + '"]')
    
    // Get publish button
    event?.emit("logs", `Waiting for publish button`)
    const publishXPath = "//*[normalize-space(text())='Publish']/parent::*[not(@disabled)] | //*[normalize-space(text())='Save']/parent::*[not(@disabled)]"
    await page.waitForXPath(publishXPath)
    // save youtube upload link
    const videoBaseLink = 'https://youtu.be'
    const shortVideoBaseLink = 'https://youtube.com/shorts'
    const uploadLinkSelector = `[href^="${videoBaseLink}"], [href^="${shortVideoBaseLink}"]`
    await page.waitForSelector(uploadLinkSelector)
    const uploadedLinkHandle = await page.$(uploadLinkSelector)
    
    let uploadedLink
    do {
      await sleep(500)
      uploadedLink = await page.evaluate((e: any) => e.getAttribute('href'), uploadedLinkHandle)
    } while (uploadedLink === videoBaseLink || uploadedLink === shortVideoBaseLink)
    
    // const closeDialogXPath = uploadAsDraft ? saveCloseBtnXPath : publishXPath
    const closeDialogXPath =  publishXPath
    for (let i = 0; i < 10; i++) {
      try {
        await page.$x(closeDialogXPath)
        await $xclickElement(closeDialogXPath, page)
        event?.emit("logs", `Publishing`)
        break
      } catch (error) {
        await sleep(5000)
      }
    }

    if (isChannelMonetized) {
        try {
            await page.waitForSelector('#dialog-buttons #secondary-action-button', { visible: true })

            await page.click('#dialog-buttons #secondary-action-button')
        } catch {}
    }

    // await page.waitForXPath('//*[contains(text(),"Finished processing")]', { timeout: 0})

    // no closeBtn will show up if keeps video as draft
    event?.emit("logs", "Waiting networkIdle, publication confirmation")
    await page.waitForNetworkIdle()
    if (uploadAsDraft){
      resolve(uploadedLink)
      
    } 
    
    // Wait for closebtn to show up
    
    try {
      await page.waitForXPath(closeBtnXPath)
    } catch (e) {
      await browser.close()
      throw new Error(
        'Please make sure you set up your default video visibility correctly, you might have forgotten. More infos : https://github.com/fawazahmed0/youtube-uploader#youtube-setup'
        )
      }
      event?.emit("logs", "Closing browser")
      await browser.close()
    event?.emit("logs", "Video uploaded successfully")
    event?.emit("uploaded", uploadedLink)
    resolve(uploadedLink)
  })
}