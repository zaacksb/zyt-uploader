import type { ElementHandle, HTTPRequest, Page } from "puppeteer"

export function convertJsonCookiesToText(cookies: Record<string, Object>[]){
  return cookies.map((c) => `${c.name}=${c.value}`).join('; ')
}

export async function $xtypeInputElement(xpath: string, page: Page, text: string){
  await page.waitForXPath(xpath)
  const inputEl = await page.$x(xpath)
  await inputEl[0].focus()
  await inputEl[0].type(text)
}

export async function $xclickElement(xpath: string, page: Page){
  const emailNextButton = await page.$x(xpath)
  await (emailNextButton[0] as ElementHandle<Element>).click()
}

export async function waitForPageUrl(url: string, page: Page){
  return new Promise((resolve) => {
    const waitUrlInterval = setInterval(()=>{
      const pageUrl = page.url()
      if(pageUrl.includes(url)){
        clearInterval(waitUrlInterval)
        resolve(true)
      }
    }, 50)
  })
} 

  
export function blockRequestsResources(page: Page, terms: ReturnType<HTTPRequest["resourceType"]>[] = []){
  page.setRequestInterception(true)
  page.on('request', async (request) => {
    const requestType = request.resourceType()
    if (terms.includes(requestType)) {
        request.abort()
        return
    }
      request.continue()

})
}


export const sleep = async (time: number = 1000) => new Promise(resolve => setTimeout(resolve, time))
export async function waitUploadComplete(page: Page, event: NodeJS.EventEmitter | undefined){
  return new Promise(resolve => {
    let lastMessageSent = ""
    const endUploadMessages = ["Checking", "Processing", "Uploading 100%", "Checking", "Checks complete", "Upload complete"]
    const interval = setInterval( async ()=> {
      let curProgress = await page.evaluate(() => {
        let items = document.querySelectorAll('span.progress-label.ytcp-video-upload-progress') as any
        for (let i = 0; i < items.length; i++) {
            return items.item(i).textContent;
        }
      });
      if (interval == undefined || !curProgress) return;
      const progressMessage = curProgress
      if(lastMessageSent !== progressMessage){
        event?.emit("progress", progressMessage)
        if(containsEndMessage(progressMessage, endUploadMessages)){
          clearInterval(interval)
          resolve(true)
          return
        }

      if(progressMessage.includes("%")){
        const [ action, percentage ] = progressMessage.split(" ")
        const remainingTime = progressMessage.split(" ... ")[1]
        event?.emit(`${action.toLowerCase()}`, {action, percentage, remainingTime} )
        if(Number(percentage.replace("%", "")) >= 100 && action == "Uploading"){
          clearInterval(interval)
          resolve(true)
        }
      }
    }
    }, 500)
    return interval
  })
}

function containsEndMessage(inputString: string, endMessages: string[]) {
  return endMessages.some(message => inputString.includes(message));
}