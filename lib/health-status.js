const DEFAULT_MODEL = "nvidia/Nemotron-3_5-Lightning";

function getHealthStatus(env = process.env) {
  const configured = Boolean(env.NEBIUS_API_KEY);
  return {
    ok: true,
    provider: "Nebius Token Factory",
    configured,
    // Key presence is configuration, not evidence that a model request succeeded.
    live: false,
    mode: configured ? "configured_not_tested" : "demo",
    modelName: env.NEBIUS_MODEL || DEFAULT_MODEL,
    keyLocation: "server environment only",
  };
}

module.exports = { DEFAULT_MODEL, getHealthStatus };
