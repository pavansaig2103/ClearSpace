import { mkdir } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";

import { chromium } from "playwright";

const appUrl = process.env.E2E_APP_URL ?? "http://127.0.0.1:3000";
const email = process.env.E2E_EMAIL ?? "pavan@clearspace.dev";
const password = process.env.E2E_PASSWORD ?? "Clearspace123!";
const rootDir = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..", "..");
const artifactDir = path.join(rootDir, "artifacts");

async function expectVisible(locator, label) {
  await locator.waitFor({ state: "visible", timeout: 15000 }).catch((error) => {
    throw new Error(`Expected visible: ${label}. ${error.message}`);
  });
}

async function assertCanvasPixels(page, label) {
  await page.locator("canvas").waitFor({ state: "visible", timeout: 15000 });
  await page.waitForTimeout(800);
  const stats = await page.evaluate(() => {
    const canvas = document.querySelector("canvas");
    if (!canvas) return null;
    const gl = canvas.getContext("webgl2") || canvas.getContext("webgl") || canvas.getContext("experimental-webgl");
    if (!gl) return { width: canvas.width, height: canvas.height, colorSamples: -1, alphaSamples: -1 };

    const sampleSize = 18;
    const x = Math.max(0, Math.floor(canvas.width / 2 - sampleSize / 2));
    const y = Math.max(0, Math.floor(canvas.height / 2 - sampleSize / 2));
    const pixels = new Uint8Array(sampleSize * sampleSize * 4);
    gl.finish();
    gl.readPixels(x, y, sampleSize, sampleSize, gl.RGBA, gl.UNSIGNED_BYTE, pixels);

    let colorSamples = 0;
    let alphaSamples = 0;
    for (let index = 0; index < pixels.length; index += 4) {
      if (pixels[index] || pixels[index + 1] || pixels[index + 2]) colorSamples += 1;
      if (pixels[index + 3]) alphaSamples += 1;
    }
    return { width: canvas.width, height: canvas.height, colorSamples, alphaSamples };
  });

  if (!stats || stats.width === 0 || stats.height === 0 || stats.colorSamples === 0) {
    throw new Error(`${label} canvas did not render usable pixels: ${JSON.stringify(stats)}`);
  }
  return stats;
}

async function login(page) {
  await page.goto(`${appUrl}/login`, { waitUntil: "networkidle" });
  await expectVisible(page.getByRole("button", { name: "Open ClearSpace" }), "login form");
  await page.getByLabel("Email").fill(email);
  await page.getByLabel("Password").fill(password);
  const loginResponse = page.waitForResponse(
    (response) => response.url().endsWith("/api/auth/login/") && response.request().method() === "POST",
    { timeout: 15000 },
  );
  await page.getByRole("button", { name: "Open ClearSpace" }).click();
  await loginResponse;
  await page.waitForURL("**/home", { timeout: 15000 });
  await expectVisible(page.getByText("Let's clear a little space."), "home headline");
}

async function capture(page, rawContent) {
  await page.getByLabel("Dump anything here").fill(rawContent);
  await page.getByRole("button", { name: "Clear it out" }).click();
  await expectVisible(page.getByText("Captured. Your head is a little lighter."), "capture feedback");
}

async function main() {
  await mkdir(artifactDir, { recursive: true });
  const stamp = Date.now();
  const taskRaw = `Email Anika about portfolio review tomorrow at 5pm #career ${stamp}`;
  const taskTitle = `Email Anika about portfolio review ${stamp}`;
  const ideaRaw = `Idea: compact study focus lamp for hostel desks ${stamp}`;
  const followUpRaw = `Ask Rahul about internship referral ${stamp}`;
  const personName = `Meera Smoke ${stamp}`;
  const memoryText = `Smoke test memory for ClearSpace ${stamp}`;

  const browser = await chromium.launch({ headless: true });
  const context = await browser.newContext({ viewport: { width: 1440, height: 1000 } });
  const page = await context.newPage();

  try {
    await login(page);
    const desktopCanvas = await assertCanvasPixels(page, "desktop home");
    const desktopScreenshot = path.join(artifactDir, "clearspace-smoke-desktop-home.png");
    await page.screenshot({ path: desktopScreenshot, fullPage: true });

    await capture(page, taskRaw);
    await page.goto(`${appUrl}/inbox`, { waitUntil: "domcontentloaded" });
    const taskRow = page.locator("article").filter({ hasText: taskRaw });
    await expectVisible(taskRow, "captured task row");
    await taskRow.getByRole("button", { name: "Edit" }).click();
    await page.getByLabel("Title").fill(taskTitle);
    await page.getByLabel("Priority").selectOption("high");
    await page.getByRole("button", { name: "Save changes" }).click();
    await expectVisible(page.getByText(taskTitle), "edited task title");

    await page.goto(`${appUrl}/search`, { waitUntil: "domcontentloaded" });
    await page.getByPlaceholder("Search tasks, ideas, follow-ups, people, archived items...").fill("Anika");
    await expectVisible(page.getByText(taskTitle), "search result");
    await page.getByRole("button", { name: `Complete ${taskTitle}` }).click();
    await page.getByLabel("Status").selectOption("completed");
    await expectVisible(page.getByText(taskTitle), "completed search result");

    await page.goto(`${appUrl}/home`, { waitUntil: "domcontentloaded" });
    await capture(page, ideaRaw);
    await page.goto(`${appUrl}/ideas`, { waitUntil: "domcontentloaded" });
    await expectVisible(
      page.getByRole("heading", { name: `compact study focus lamp for hostel desks ${stamp}` }),
      "idea card",
    );

    await page.goto(`${appUrl}/home`, { waitUntil: "domcontentloaded" });
    await capture(page, followUpRaw);
    await page.goto(`${appUrl}/follow-ups`, { waitUntil: "domcontentloaded" });
    await expectVisible(page.getByText(followUpRaw), "follow-up card");
    await page.getByRole("button", { name: "Add person" }).click();
    await page.getByLabel("Name").fill(personName);
    await page.getByLabel("Relationship").fill("Colleague");
    await page.getByRole("button", { name: "Save person" }).click();
    await expectVisible(page.getByText(personName), "new person");

    await page.goto(`${appUrl}/memories`, { waitUntil: "domcontentloaded" });
    await page.getByPlaceholder("A small moment, a lesson, a feeling...").fill(memoryText);
    await page.getByRole("button", { name: "Save memory" }).click();
    await expectVisible(page.getByText(`\"${memoryText}\"`), "memory entry");

    await page.goto(`${appUrl}/more`, { waitUntil: "domcontentloaded" });
    await page.locator("main").getByRole("button", { name: "Logout" }).click();
    await page.waitForURL("**/login", { timeout: 15000 });
    await login(page);
    await page.goto(`${appUrl}/search`, { waitUntil: "domcontentloaded" });
    await page.getByPlaceholder("Search tasks, ideas, follow-ups, people, archived items...").fill("Anika");
    await page.getByLabel("Status").selectOption("completed");
    await expectVisible(page.getByText(taskTitle), "persisted completed item");

    await page.setViewportSize({ width: 390, height: 844 });
    await page.goto(`${appUrl}/home`, { waitUntil: "domcontentloaded" });
    const mobileCanvas = await assertCanvasPixels(page, "mobile home");
    const mobileScreenshot = path.join(artifactDir, "clearspace-smoke-mobile-home.png");
    await page.screenshot({ path: mobileScreenshot, fullPage: true });

    console.log(
      JSON.stringify(
        {
          ok: true,
          desktopCanvas,
          mobileCanvas,
          screenshots: {
            desktop: desktopScreenshot,
            mobile: mobileScreenshot,
          },
        },
        null,
        2,
      ),
    );
  } finally {
    await browser.close();
  }
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
