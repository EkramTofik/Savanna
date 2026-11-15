import { spawn } from "node:child_process";

export interface RunResult {
  stdout: string;
  stderr: string;
}

/**
 * Runs a program without a shell (so file names with spaces or quotes are safe).
 * Rejects with a plain-language message if the program is missing or exits non-zero.
 */
export function run(cmd: string, args: string[], opts: { cwd?: string } = {}): Promise<RunResult> {
  return new Promise((resolve, reject) => {
    const child = spawn(cmd, args, { cwd: opts.cwd, stdio: ["ignore", "pipe", "pipe"] });
    let stdout = "";
    let stderr = "";
    child.stdout.setEncoding("utf8").on("data", (d: string) => (stdout += d));
    child.stderr.setEncoding("utf8").on("data", (d: string) => (stderr += d));
    child.on("error", (err: NodeJS.ErrnoException) => {
      if (err.code === "ENOENT") {
        reject(new Error(`"${cmd}" was not found. Install it and make sure it is on your PATH.`));
      } else {
        reject(err);
      }
    });
    child.on("close", (code) => {
      if (code === 0) resolve({ stdout, stderr });
      else reject(new Error(`"${cmd}" failed (exit code ${code}).\n${stderr.trim().slice(-2000)}`));
    });
  });
}
