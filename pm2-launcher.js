const { spawn } = require("child_process");

const child = spawn(
  "C:\\Program Files\\nodejs\\node.exe",
  ["./node_modules/next/dist/bin/next", "start", "-H", "0.0.0.0", "-p", "3000"],
  {
    cwd: "C:\\apps\\Blocmec",
    stdio: "inherit",
    shell: false
  }
);

child.on("exit", (code) => process.exit(code ?? 0));
child.on("error", (err) => {
  console.error(err);
  process.exit(1);
});
