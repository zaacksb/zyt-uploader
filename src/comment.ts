import { UploadVideo, commentVideo } from ".";
import puppeteer from "puppeteer-extra";
import {
  $xclickElement,
  $xtypeElmement,
  blockRequestsResources,
  scrollTillVeiw,
  waitUntilSomeResponse,
} from "./utils";

export async function commentVideo(
  { comment, videoId, launchOptions, pin }: commentVideo,
  cookies: any,
  event?: NodeJS.EventEmitter
) {
 return await new Promise(async (resolve) => {
    event?.emit("logs", "Starting youtube vod uploader");
    if (!cookies) {
      return event?.emit("error", {
        code: "invalid_cookies",
        message: "An error occurred while parsing cookies for zyt",
      });
    }

    const browser = await puppeteer.launch({
      ...launchOptions,
    });

    const pages = await browser.pages();
    const page = pages[0];
    blockRequestsResources(page, ["font", "image", "media"]);
    await page.setExtraHTTPHeaders({
      "Accept-Language": "en",
    });
    await page.setCookie(...cookies);
    await page.goto(`https://www.youtube.com/watch?v=${videoId}&persist_gl=1&gl=US&persist_hl=1&hl=en`, {
      waitUntil: "domcontentloaded",
    });

    await scrollTillVeiw(page, `#placeholder-area`);

    await page.focus(`#placeholder-area`);
    const COMMENT_BOX_XPATH = '//*[@id="placeholder-area"]';
    await $xclickElement(COMMENT_BOX_XPATH, page);
    await $xtypeElmement(COMMENT_BOX_XPATH, comment.substring(0, 10000), page);

    page.exposeFunction("commentResolve", resolve);
    waitUntilSomeResponse(page, "comment/create_comment").then(async ()=>{
      await browser.close()
    })
    if (pin) {
      // Select the comment list
      const [commentList] = await page.$x(
        `//ytd-comments[@id="comments"]//ytd-item-section-renderer[@section-identifier="comment-item-section"]/div[@id="contents"]`
      );

      // Register mutation observer for comment list
      await commentList.evaluateHandle((commentList) => {
        const observer = new MutationObserver((mutations) => {
          mutations.forEach(async (mutation) => {
            if (mutation.addedNodes.length > 0) {
              try {
                // Get the recently added comment node
                const comment = mutation.addedNodes[0];

                // Finds three dot menu inside comment
                // Evaluate XPath relative to the added comment.
                // It'd be nice to use Puppeteer's helpers but the MutationObserver returns DOM nodes
                const menu = document.evaluate(
                  `.//div[@id="action-menu"]/ytd-menu-renderer/yt-icon-button`,
                  comment,
                  null,
                  XPathResult.FIRST_ORDERED_NODE_TYPE
                ).singleNodeValue;
                // Expand three dot menu
                menu && (menu as HTMLButtonElement).click();

                // Wait for menu to expand
                await new Promise((resolve) => setTimeout(resolve, 100));

                // Select pin button
                const pinButton = document.evaluate(
                  `.//tp-yt-paper-item//*[text()="Pin"]/ancestor::tp-yt-paper-item`,
                  document,
                  null,
                  XPathResult.FIRST_ORDERED_NODE_TYPE
                ).singleNodeValue;
                // Click pin button
                pinButton && (pinButton as HTMLButtonElement).click();

                // Wait for confirmation dialog
                await new Promise((resolve) => setTimeout(resolve, 100));

                // Confirm pin
                const confirmButton = document.querySelector(
                  "#confirm-button>yt-button-shape>button"
                );
                confirmButton && (confirmButton as HTMLButtonElement).click();

                // Disconnect observer
                observer.disconnect();

                // Resolve promise
                // @ts-expect-error - commentResolve is exposed to the page
                window.commentResolve({ err: false, data: "sucess" });
              } catch (err) {
                // @ts-expect-error - commentResolve is exposed to the page
                window.commentResolve({ err: true, data: err });
              }
            }
          });
        });

        observer.observe(commentList, { childList: true });
      });
    }

    await page.click("#submit-button");

    if (pin) {
      // Let mutation observer resolve promise after pinning comment
    } else {
      resolve({ err: false, data: "sucess" });
    }

  });
}
