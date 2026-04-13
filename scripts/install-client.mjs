#!/usr/bin/env node

import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import { spawnSync } from "node:child_process";
import { fileURLToPath } from "node:url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const ROOT_DIR = path.resolve(__dirname, "..");
const SKILL_NAME = "elderly-care";
const ENV_FILE = path.join(ROOT_DIR, ".env.local");
const BUNDLED_ENV_FILE = path.join(ROOT_DIR, ".env.skill");
const ENV_EXAMPLE_FILE = path.join(ROOT_DIR, ".env.local.example");
const MCP_START_SCRIPT = path.join(ROOT_DIR, "scripts", "start-local-mcp.sh");

const SUPPORTED_CLIENTS = [
  "openclaw",
  "claude",
  "cursor",
  "codex",
  "windsurf",
  "trae",
];

function printUsage() {
  console.log(`Usage:
  node scripts/install-client.mjs --client <name[,name...]>
  node scripts/install-client.mjs --all

Options:
  --client <clients>     Client names: ${SUPPORTED_CLIENTS.join(", ")}
  --all                  Install for all supported clients
  --dry-run              Print actions without changing anything
  --skip-bootstrap       Skip runtime env check, npm install, and build
  --skip-skill           Skip skill directory installation
  --skip-mcp             Skip MCP registration
  --home <dir>           Override the home directory for testing
  -h, --help             Show this help
`);
}

function parseArgs(argv) {
  const options = {
    clients: [],
    dryRun: false,
    skipBootstrap: false,
    skipSkill: false,
    skipMcp: false,
    homeDir: process.env.SKILL_SETUP_HOME || os.homedir(),
  };

  for (let index = 0; index < argv.length; index += 1) {
    const arg = argv[index];

    if (arg === "--client") {
      const value = argv[index + 1];
      if (!value) {
        throw new Error("--client requires a value");
      }
      options.clients.push(
        ...value
          .split(",")
          .map((item) => item.trim().toLowerCase())
          .filter(Boolean),
      );
      index += 1;
      continue;
    }

    if (arg === "--all") {
      options.clients.push(...SUPPORTED_CLIENTS);
      continue;
    }

    if (arg === "--dry-run") {
      options.dryRun = true;
      continue;
    }

    if (arg === "--skip-bootstrap") {
      options.skipBootstrap = true;
      continue;
    }

    if (arg === "--skip-skill") {
      options.skipSkill = true;
      continue;
    }

    if (arg === "--skip-mcp") {
      options.skipMcp = true;
      continue;
    }

    if (arg === "--home") {
      const value = argv[index + 1];
      if (!value) {
        throw new Error("--home requires a value");
      }
      options.homeDir = path.resolve(value);
      index += 1;
      continue;
    }

    if (arg === "-h" || arg === "--help") {
      printUsage();
      process.exit(0);
    }

    throw new Error(`Unknown argument: ${arg}`);
  }

  if (options.clients.length === 0) {
    throw new Error("Please pass --client <name> or --all");
  }

  const uniqueClients = [...new Set(options.clients)];
  const unsupportedClients = uniqueClients.filter(
    (client) => !SUPPORTED_CLIENTS.includes(client),
  );

  if (unsupportedClients.length > 0) {
    throw new Error(
      `Unsupported client(s): ${unsupportedClients.join(", ")}. Supported: ${SUPPORTED_CLIENTS.join(", ")}`,
    );
  }

  options.clients = uniqueClients;
  return options;
}

function logStep(message) {
  console.log(`- ${message}`);
}

function ensureDir(dirPath, dryRun) {
  if (dryRun) {
    logStep(`would create directory: ${dirPath}`);
    return;
  }
  fs.mkdirSync(dirPath, { recursive: true });
}

function prepareRuntimeEnv(dryRun) {
  if (fs.existsSync(ENV_FILE)) {
    logStep(`kept existing local overrides: ${ENV_FILE}`);
    return "local";
  }

  if (fs.existsSync(BUNDLED_ENV_FILE)) {
    logStep(`using bundled runtime config: ${BUNDLED_ENV_FILE}`);
    return "bundled";
  }

  if (dryRun) {
    logStep(`would create .env.local from example: ${ENV_FILE}`);
    return "example";
  }

  fs.copyFileSync(ENV_EXAMPLE_FILE, ENV_FILE);
  logStep(`created .env.local from example: ${ENV_FILE}`);
  return "example";
}

function commandExists(command) {
  const result = spawnSync("sh", ["-lc", `command -v ${command}`], {
    encoding: "utf8",
  });
  return result.status === 0;
}

function runCommand(command, args, options = {}) {
  const {
    allowFailure = false,
    dryRun = false,
    env = process.env,
    cwd = ROOT_DIR,
  } = options;
  const display = [command, ...args].join(" ");

  if (dryRun) {
    logStep(`would run: ${display}`);
    return { status: 0 };
  }

  const result = spawnSync(command, args, {
    cwd,
    env,
    stdio: "inherit",
  });

  if (result.status !== 0 && !allowFailure) {
    throw new Error(`Command failed: ${display}`);
  }

  return result;
}

function bootstrapRepo(dryRun) {
  const runtimeEnvMode = prepareRuntimeEnv(dryRun);

  if (!fs.existsSync(path.join(ROOT_DIR, "node_modules"))) {
    runCommand("npm", ["install"], { dryRun });
  } else {
    logStep("kept existing node_modules");
  }

  runCommand("npm", ["run", "build"], { dryRun });

  if (runtimeEnvMode === "bundled") {
    logStep(
      "bundled skill-scoped upstream access is ready, so users can use the skill after setup without editing env files",
    );
  }

  if (runtimeEnvMode === "example") {
    logStep(
      "created an optional .env.local override template because no bundled runtime config was found",
    );
  }
}

function readJsonFile(filePath, fallbackValue) {
  if (!fs.existsSync(filePath)) {
    return fallbackValue;
  }

  const content = fs.readFileSync(filePath, "utf8");
  return JSON.parse(content);
}

function backupFile(filePath, dryRun) {
  if (!fs.existsSync(filePath)) {
    return;
  }

  const timestamp = new Date().toISOString().replace(/[-:.TZ]/g, "").slice(0, 14);
  const backupPath = `${filePath}.bak-${timestamp}`;

  if (dryRun) {
    logStep(`would create backup: ${backupPath}`);
    return;
  }

  fs.copyFileSync(filePath, backupPath);
  logStep(`backed up config: ${backupPath}`);
}

function writeJsonFile(filePath, data, dryRun) {
  const serialized = `${JSON.stringify(data, null, 2)}\n`;

  if (dryRun) {
    logStep(`would write JSON config: ${filePath}`);
    return;
  }

  fs.writeFileSync(filePath, serialized, "utf8");
  logStep(`updated JSON config: ${filePath}`);
}

function createMcpServerConfig() {
  return {
    command: MCP_START_SCRIPT,
    args: [],
  };
}

function createSnippetText() {
  const snippet = {
    mcpServers: {
      [SKILL_NAME]: createMcpServerConfig(),
    },
  };

  return JSON.stringify(snippet, null, 2);
}

function installSkillLink(skillBaseDir, label, dryRun) {
  const destination = path.join(skillBaseDir, SKILL_NAME);
  ensureDir(skillBaseDir, dryRun);

  if (fs.existsSync(destination)) {
    const realPath = fs.realpathSync(destination);
    if (realPath === ROOT_DIR) {
      logStep(`${label}: skill already installed at ${destination}`);
      return destination;
    }

    throw new Error(
      `${label}: destination already exists and points elsewhere: ${destination}`,
    );
  }

  if (dryRun) {
    logStep(`${label}: would symlink ${ROOT_DIR} -> ${destination}`);
    return destination;
  }

  fs.symlinkSync(
    ROOT_DIR,
    destination,
    process.platform === "win32" ? "junction" : "dir",
  );
  logStep(`${label}: installed skill at ${destination}`);
  return destination;
}

function detectOpenClawSkillBase(homeDir, data) {
  const configPath = path.join(homeDir, ".openclaw", "openclaw.json");
  const fallback = path.join(homeDir, "skills");

  if (!data && !fs.existsSync(configPath)) {
    return fallback;
  }

  const configData = data ?? readJsonFile(configPath, {});
  const paths = configData.skills?.discover?.paths;

  if (!Array.isArray(paths)) {
    return fallback;
  }

  const preferred = [...paths]
    .reverse()
    .find(
      (candidate) =>
        typeof candidate === "string" &&
        candidate.startsWith(homeDir) &&
        !candidate.includes("/.openclaw/"),
    );

  return preferred || fallback;
}

function isInsideDir(parentDir, childPath) {
  const parent = path.resolve(parentDir);
  const child = path.resolve(childPath);
  const relative = path.relative(parent, child);

  return relative === "" || (!relative.startsWith("..") && !path.isAbsolute(relative));
}

function ensurePathInList(items, value) {
  const normalized = path.resolve(value);
  const existing = items.find(
    (item) => typeof item === "string" && path.resolve(item) === normalized,
  );

  if (existing) {
    return { items, added: false };
  }

  return { items: [...items, normalized], added: true };
}

function detectCodexSkillBase(homeDir) {
  const codexSkillDir = path.join(homeDir, ".codex", "skills");
  if (fs.existsSync(codexSkillDir)) {
    return codexSkillDir;
  }
  return codexSkillDir;
}

function configureOpenClaw(homeDir, dryRun) {
  const configPath = path.join(homeDir, ".openclaw", "openclaw.json");
  if (!fs.existsSync(configPath)) {
    throw new Error(`OpenClaw config not found: ${configPath}`);
  }

  const data = readJsonFile(configPath, {});
  const skillBaseDir = detectOpenClawSkillBase(homeDir, data);
  data.mcp ||= {};
  data.mcp.servers ||= {};
  data.mcp.servers[SKILL_NAME] = createMcpServerConfig();

  data.skills ||= {};
  data.skills.load ||= {};
  const extraDirs = Array.isArray(data.skills.load.extraDirs)
    ? data.skills.load.extraDirs.filter((item) => typeof item === "string")
    : [];

  if (!isInsideDir(skillBaseDir, ROOT_DIR)) {
    const ensured = ensurePathInList(extraDirs, ROOT_DIR);
    data.skills.load.extraDirs = ensured.items;

    if (ensured.added) {
      logStep(
        `OpenClaw: added repo root to skills.load.extraDirs so symlinked skill installs outside ${skillBaseDir} still load correctly`,
      );
    } else {
      logStep(
        `OpenClaw: kept existing skills.load.extraDirs entry for repo root ${ROOT_DIR}`,
      );
    }
  }

  backupFile(configPath, dryRun);
  writeJsonFile(configPath, data, dryRun);
}

function configureCursor(homeDir, dryRun) {
  const configPath = path.join(homeDir, ".cursor", "mcp.json");
  const data = readJsonFile(configPath, { mcpServers: {} });
  data.mcpServers ||= {};
  data.mcpServers[SKILL_NAME] = createMcpServerConfig();

  ensureDir(path.dirname(configPath), dryRun);
  backupFile(configPath, dryRun);
  writeJsonFile(configPath, data, dryRun);
}

function configureClaude(homeDir, dryRun) {
  if (!commandExists("claude")) {
    throw new Error("Claude Code CLI was not found in PATH");
  }

  const env = {
    ...process.env,
    HOME: homeDir,
  };

  runCommand(
    "claude",
    ["mcp", "remove", "-s", "user", SKILL_NAME],
    {
      allowFailure: true,
      dryRun,
      env,
    },
  );

  runCommand(
    "claude",
    [
      "mcp",
      "add",
      "-s",
      "user",
      SKILL_NAME,
      MCP_START_SCRIPT,
    ],
    {
      dryRun,
      env,
    },
  );
}

function configureCodex(homeDir, dryRun) {
  if (!commandExists("codex")) {
    throw new Error("Codex CLI was not found in PATH");
  }

  const env = {
    ...process.env,
    HOME: homeDir,
  };

  runCommand("codex", ["mcp", "remove", SKILL_NAME], {
    allowFailure: true,
    dryRun,
    env,
  });

  runCommand(
    "codex",
    [
      "mcp",
      "add",
      SKILL_NAME,
      "--",
      MCP_START_SCRIPT,
    ],
    {
      dryRun,
      env,
    },
  );
}

function printManualSnippet(label) {
  console.log("");
  console.log(`${label}: automatic MCP registration is not enabled in this installer yet.`);
  console.log("Use the following MCP snippet in that client's MCP settings:");
  console.log(createSnippetText());
  console.log("");
}

function getClientConfig(client, homeDir) {
  const configs = {
    openclaw: {
      label: "OpenClaw",
      skillBaseDir: detectOpenClawSkillBase(homeDir),
      configureMcp: () => configureOpenClaw(homeDir, false),
      configureMcpDryRun: () => configureOpenClaw(homeDir, true),
      autoMcp: true,
    },
    claude: {
      label: "Claude Code",
      skillBaseDir: path.join(homeDir, ".claude", "skills"),
      configureMcp: () => configureClaude(homeDir, false),
      configureMcpDryRun: () => configureClaude(homeDir, true),
      autoMcp: true,
    },
    cursor: {
      label: "Cursor",
      skillBaseDir: path.join(homeDir, ".cursor", "skills"),
      configureMcp: () => configureCursor(homeDir, false),
      configureMcpDryRun: () => configureCursor(homeDir, true),
      autoMcp: true,
    },
    codex: {
      label: "Codex",
      skillBaseDir: detectCodexSkillBase(homeDir),
      configureMcp: () => configureCodex(homeDir, false),
      configureMcpDryRun: () => configureCodex(homeDir, true),
      autoMcp: true,
    },
    windsurf: {
      label: "Windsurf",
      skillBaseDir: path.join(homeDir, ".windsurf", "skills"),
      autoMcp: false,
    },
    trae: {
      label: "Trae",
      skillBaseDir: path.join(homeDir, ".trae", "skills"),
      autoMcp: false,
    },
  };

  return configs[client];
}

function main() {
  const options = parseArgs(process.argv.slice(2));

  console.log(`Skill repo: ${ROOT_DIR}`);
  console.log(`Home dir:   ${options.homeDir}`);
  console.log(`Clients:    ${options.clients.join(", ")}`);
  console.log("");

  if (!options.skipBootstrap) {
    console.log("Bootstrapping repo");
    bootstrapRepo(options.dryRun);
    console.log("");
  }

  const summary = [];

  for (const client of options.clients) {
    const config = getClientConfig(client, options.homeDir);
    console.log(`Setting up ${config.label}`);

    if (!options.skipSkill) {
      installSkillLink(config.skillBaseDir, config.label, options.dryRun);
    }

    if (!options.skipMcp) {
      if (config.autoMcp) {
        if (options.dryRun) {
          config.configureMcpDryRun();
        } else {
          config.configureMcp();
        }
        summary.push(`${config.label}: skill + MCP configured`);
      } else {
        printManualSnippet(config.label);
        summary.push(`${config.label}: skill configured, MCP snippet printed`);
      }
    } else {
      summary.push(`${config.label}: skill configured`);
    }

    console.log("");
  }

  console.log("Summary");
  for (const line of summary) {
    console.log(`- ${line}`);
  }

  console.log("");
  console.log("Next");
  console.log("- Restart the target client after setup so it reloads new skills and MCP servers.");
  console.log("- This repo now ships a bundled skill-scoped upstream token for the five read-only elderly-care interfaces.");
  console.log("- Use .env.local only if you intentionally want to override the bundled defaults.");
}

try {
  main();
} catch (error) {
  console.error(`Setup failed: ${error.message}`);
  process.exit(1);
}
