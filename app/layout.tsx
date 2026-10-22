import type { Metadata, Viewport } from "next";
import "../styles.css";

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
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link href="https://fonts.googleapis.com/css2?family=DM+Mono:wght@400;500&family=DM+Sans:wght@400;500;600;700&family=Space+Grotesk:wght@400;500;600;700&display=swap" rel="stylesheet" />
      </head>
      <body>{children}</body>
    </html>
  );
}