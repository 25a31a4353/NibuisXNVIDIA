import type { Metadata, Viewport } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "PatchPilot — Agentic Engineering Workspace",
  description:
    "From engineering issue to reviewed patch. A coding-agent prototype powered by NVIDIA Nemotron through Nebius Token Factory.",
  applicationName: "PatchPilot",
  keywords: ["Nebius", "NVIDIA", "Nemotron", "coding agent", "developer tools", "hackathon"]
};

export const viewport: Viewport = {
  themeColor: "#0b0d13",
  colorScheme: "dark",
  width: "device-width",
  initialScale: 1
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}