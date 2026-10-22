import { readFileSync } from "node:fs";
import { join } from "node:path";
import Script from "next/script";

export const metadata = {
  title: "PatchPilot · Agentic Engineering",
  description: "A review-first engineering-agent workbench powered by NVIDIA Nemotron through Nebius Token Factory.",
};

export default function HomePage() {
  const source = readFileSync(join(process.cwd(), "index.html"), "utf8");
  const body = source.match(/<body[^>]*>([\s\S]*?)<\/body>/i)?.[1];
  if (!body) throw new Error("Could not find the PatchPilot document body.");
  const markup = body.replace(/<script\b[^>]*src=["']\/app\.js["'][^>]*><\/script>/i, "");
  return (
    <>
      <div dangerouslySetInnerHTML={{ __html: markup }} />
      <Script src="/app.js" strategy="afterInteractive" />
    </>
  );
}
