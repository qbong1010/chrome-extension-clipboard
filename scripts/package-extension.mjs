import { execFileSync } from "node:child_process";
import fs from "node:fs";
import path from "node:path";
import process from "node:process";

const rootDir = process.cwd();
const distDir = path.join(rootDir, "dist");
const manifestPath = path.join(rootDir, "manifest.json");
const manifest = JSON.parse(fs.readFileSync(manifestPath, "utf8"));
const version = manifest.version;
const packageBaseName = `paste-right-v${version}`;
const stageDir = path.join(distDir, packageBaseName);
const zipPath = path.join(distDir, `${packageBaseName}.zip`);

const filesToCopy = [
  "sidepanel.html",
  "sidepanel.js",
  "background.js",
  "storage-utils.js",
  "building-code-lookup.js",
  "address-codes.json",
  "default-templates.json",
  "iframe-content.js",
];

const directoriesToCopy = ["styles", "libs", "images"];

function ensureParentDir(filePath) {
  fs.mkdirSync(path.dirname(filePath), { recursive: true });
}

function copyFile(relativePath) {
  const sourcePath = path.join(rootDir, relativePath);
  const destinationPath = path.join(stageDir, relativePath);
  ensureParentDir(destinationPath);
  fs.copyFileSync(sourcePath, destinationPath);
}

function copyDirectory(relativePath) {
  const sourcePath = path.join(rootDir, relativePath);
  const destinationPath = path.join(stageDir, relativePath);
  fs.cpSync(sourcePath, destinationPath, { recursive: true });
}

function buildPackagedManifest() {
  const packagedManifest = structuredClone(manifest);
  const iconsDirExists = fs.existsSync(path.join(rootDir, "icons"));

  if (!iconsDirExists && Array.isArray(packagedManifest.web_accessible_resources)) {
    packagedManifest.web_accessible_resources = packagedManifest.web_accessible_resources.filter(
      (entry) => !Array.isArray(entry.resources) || !entry.resources.includes("icons/*"),
    );
  }

  return packagedManifest;
}

function createZip() {
  if (process.platform === "win32") {
    execFileSync(
      "powershell.exe",
      [
        "-NoProfile",
        "-Command",
        `Compress-Archive -Path '${stageDir.replace(/'/g, "''")}\\*' -DestinationPath '${zipPath.replace(/'/g, "''")}' -Force`,
      ],
      { stdio: "inherit" },
    );
    return;
  }

  execFileSync("zip", ["-qr", zipPath, "."], {
    cwd: stageDir,
    stdio: "inherit",
  });
}

fs.rmSync(stageDir, { recursive: true, force: true });
fs.rmSync(zipPath, { force: true });
fs.mkdirSync(stageDir, { recursive: true });

for (const relativePath of filesToCopy) {
  copyFile(relativePath);
}

for (const relativePath of directoriesToCopy) {
  copyDirectory(relativePath);
}

const packagedManifest = buildPackagedManifest();
fs.writeFileSync(
  path.join(stageDir, "manifest.json"),
  `${JSON.stringify(packagedManifest, null, 2)}\n`,
  "utf8",
);

if (fs.existsSync(path.join(rootDir, "icons"))) {
  copyDirectory("icons");
}

createZip();

console.log(`Created ${zipPath}`);
