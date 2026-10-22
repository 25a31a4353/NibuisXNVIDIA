module.exports = async function handler(req, res) {
  res.setHeader("Cache-Control", "no-store");
  const configured = Boolean(process.env.NEBIUS_API_KEY);
  const model = process.env.NEBIUS_MODEL || "nvidia/NVIDIA-Nemotron-3-Nano-30B-A3B";
  return res.status(200).json({
    ok: true,
    provider: "Nebius Token Factory",
    configured,
    live: configured,
    mode: configured ? "live" : "demo",
    modelName: configured ? model : "NVIDIA Nemotron · Demo preview"
  });
};