const { execSync } = require("child_process");

const port = process.argv[2] || "3000";

try {
  if (process.platform === "win32") {
    const out = execSync(`netstat -aon | findstr :${port} | findstr LISTENING`, {
      encoding: "utf8",
      stdio: ["pipe", "pipe", "ignore"],
    });
    const pids = new Set();
    for (const line of out.split("\n")) {
      const parts = line.trim().split(/\s+/);
      const pid = parts[parts.length - 1];
      if (pid && /^\d+$/.test(pid)) pids.add(pid);
    }
    for (const pid of pids) {
      try {
        execSync(`taskkill /F /PID ${pid}`, { stdio: "ignore" });
        console.log(`Freed port ${port} (stopped PID ${pid})`);
      } catch {
        /* ignore */
      }
    }
  }
} catch {
  /* port already free */
}
