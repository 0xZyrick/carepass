export async function register() {
  if (process.env.NEXT_RUNTIME === "nodejs") {
    const { migrateLocal } = await import("./instrumentation-node");
    await migrateLocal();
  }
}
