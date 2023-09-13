import fs from "node:fs"
import { EventEmitter } from "node:events"
import puppeteer from "puppeteer-extra"
import puppeteerStealthPlugin from "puppeteer-extra-plugin-stealth"
import type { PuppeteerLaunchOptions } from "puppeteer"

import { $xclickElement, $xtypeInputElement, blockRequestsResources, convertJsonCookiesToText, waitForPageUrl } from "./utils"
import { youtubeUpload } from "./upload"
import { ZytUploaderEvents } from "./types"
puppeteer.use(puppeteerStealthPlugin())

export type LoginAndGetCookies = {
  email?: string
  password?: string
  saveSession?: boolean
  launchOptions?: PuppeteerLaunchOptions
}

export type UploadVideo = {
  videoPath: string,
  title: string
  thumbnailPath?: string
  visibility?: "public" | "unlisted" | "private"
  description?: string
  tags?: string[]
  launchOptions?: PuppeteerLaunchOptions
}



export default class ZytUploader extends EventEmitter {
  private cookies: any

  constructor(){
    super()
    this.cookies = [{}]
  }

  on<E extends keyof ZytUploaderEvents>(event: E, listener: ZytUploaderEvents[E]): this {
    return super.on(event, listener);
  }
  
  public async loginAndGetCookies({password, email, launchOptions, saveSession}: LoginAndGetCookies = { saveSession: true}){
    const cookies = await loginAndGetCookies({password, email, launchOptions})
    if(saveSession) this.cookies = cookies
    return cookies
  }

  public async loadCookiesFromFile(filePath: string){
    if(!fs.existsSync(filePath)) throw new Error("Cookie file not found")
    try{
      const cookies = fs.readFileSync(filePath, { encoding: "utf-8" })
      this.cookies = JSON.parse(cookies)
    } catch (e){
      throw new Error("Cookie file contains invalid json")
    }
  }
  public async saveCookiesOnDisk(filePath: string){
    try{
     fs.writeFileSync(filePath, JSON.stringify(this.cookies), { encoding: "utf-8" })
    } catch (e){
      throw new Error("Cannot save cookies on disk")
    }
  }

  public getLoadedCookies(){
    return this.cookies
  }

  public async cookiesIsValid(cookies: Record<string, Object>[] = this.cookies){
    return cookiesIsValid(cookies)
  }

  public async uploadVideo({ title, videoPath, description, tags, thumbnailPath, visibility, launchOptions}: UploadVideo){
    if(!title || !videoPath) throw new Error("Missing title or videoPath")
    if(!this.cookiesIsValid()) throw new Error("Invalid cookies")
    return await youtubeUpload({title, videoPath, description, tags, thumbnailPath, visibility: visibility || "unlisted", launchOptions}, this.cookies, this)
  }
  
}


export async function cookiesIsValid(cookies: Record<string, Object>[]){
  const cookiesString = convertJsonCookiesToText(cookies)
  const res = await fetch(`https://youtube.com`, {
    headers: {
      'Accept-Language': 'pt-BR',
      Cookie: cookiesString
    }
  })
  const resText = await res.text()
  const keyLoggedIn = '{"key":"logged_in","value":"1"}]}'
  if(resText.includes(keyLoggedIn)){
    return true
  }else{
    return false
  }
} 
  
export async function loginAndGetCookies({email, password, launchOptions, }: Omit<LoginAndGetCookies, "saveSession">){
  const browser = await puppeteer.launch({
    ...launchOptions,
    headless: false
  });
  
  const pages = await browser.pages();
  const page = pages[0];
    blockRequestsResources(page, ["font", "image", "media"])
    await page.goto("https://youtube.com/upload", {waitUntil: 'domcontentloaded'})

    const INPUT_EMAIL_XPATH = "//input[@id='identifierId']"
    const INPUT_PASSWORD_XPATH = '//input[@type="password"]'

    const EMAIL_NEXTBUTTON_XPATH = "//div[@id='identifierNext']/div/button"
    const PASSWORD_NEXTBUTTON_XPATH = '//div[@id="passwordNext"]/div/button'

    if(email) {
      await $xtypeInputElement(INPUT_EMAIL_XPATH, page, email)
      await $xclickElement(EMAIL_NEXTBUTTON_XPATH, page)
      await page.waitForXPath('//*[@id="forgotPassword"]') /// Wait for the page password to load
      await page.waitForNetworkIdle()

    }
    const passwordElement = await page.$x(INPUT_PASSWORD_XPATH)
    await passwordElement[0].focus()
    if(password) {
      await $xtypeInputElement(INPUT_PASSWORD_XPATH, page, password)
      await $xclickElement(PASSWORD_NEXTBUTTON_XPATH, page)
    }
    
    await waitForPageUrl("studio.youtube.com/channel", page)
    const cookies = await page.cookies()
    await browser.close()
    return cookies
    
}

