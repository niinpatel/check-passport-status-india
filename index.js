#!/usr/bin/env node

const puppeteer = require('puppeteer-core');
const { promises: fsPromise } = require('fs');
const argsParser = require('minimist');

const execPath =
  'C:\\Program Files (x86)\\Google\\Chrome\\Application\\chrome.exe';

const url =
  'https://portal2.passportindia.gov.in/AppOnlineProject/statusTracker/trackStatusInpNew';

const status = 'Application_Status';

const args = argsParser(process.argv.slice(2));

const fileno = args.fileno;
const dob = args.dob;

const closeAfterDone = args.close == null ? true : args.close;
const saveTheResult = args.save == null ? true : args.save;
const headless = args.headless == null ? false : args.headless;

const main = async ({
  fileno,
  dob,
  closeAfterDone,
  saveTheResult,
  headless
}) => {
  try {
    if (!fileno) {
      throw new Error('Please provide the fileno');
    }

    if (!dob) {
      throw new Error('Please provide the date of birth in DD/MM/YYY format');
    }

    const browser = await puppeteer.launch({
      executablePath: execPath,
      headless
    });

    const page = await browser.newPage();

    await page.goto(url);
    await page.waitForSelector('#optStatus', { visible: true });
    await page.select('#optStatus', status);
    await page.waitForSelector('#fileNo', { visible: true });
    await page.type('#fileNo', fileno);
    await page.waitForSelector('#applDob', { visible: true });
    await page.type('#applDob', dob);
    await page.click('#trackFile');
    await page.waitForSelector('#trackStatusForFileNoNew_fileIsPCC');

    const result = await page.evaluate(() => {
      if (document.querySelectorAll('tr tr tr tr tr tr')[9])
        return document.querySelectorAll('tr tr tr tr tr tr')[9].innerText;
    });

    if (result) {
      console.log(result);
      saveTheResult && (await saveResult(result));
      await page.waitFor(4000);
      closeAfterDone && (await browser.close());
      closeAfterDone && process.exit(0);
    }
  } catch (e) {
    console.log(e);
  }
};

const saveResult = async result =>
  fsPromise.appendFile(
    `passportstatus.txt`,
    `${new Date()} -\n ${result}\n\n`,
    'utf-8'
  );

main({ fileno, dob, closeAfterDone, saveTheResult, headless });
