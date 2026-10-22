module.exports = async function handler(req, res) {
  res.setHeader("Cache-Control", "no-store");
  const configured = Boolean(process.env.NEBIUS_API_KEY);
  const model = process.env.NEBIUS_MODEL || "nvidia/Nemotron-3_5-Lightning";
  // Key presence is configuration, not proof that model inference succeeded.
  return res.status(200).json({
    ok: true,
    provider: "Nebius Token Factory",
    configured,
    live: false,
    mode: configured ? "configured_not_tested" : "demo",
    modelName: model
  });
};