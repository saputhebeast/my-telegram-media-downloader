import * as esbuild from "esbuild";

const watch = process.argv.includes("--watch");

const options = {
  entryPoints: {
    content: "src/content/index.js",
    mainWorld: "src/content/mainWorld.js",
  },
  bundle: true,
  outdir: "dist",
  format: "iife",
  target: ["chrome111"],
  sourcemap: watch ? "inline" : false,
  logLevel: "info",
};

if (watch) {
  const ctx = await esbuild.context(options);
  await ctx.watch();
  console.log("Watching src/ for changes... (Ctrl+C to stop)");
} else {
  await esbuild.build(options);
}
