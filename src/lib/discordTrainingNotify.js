export async function notifyDiscordTraining(action, session) {
  try {
    await fetch("/api/discord/training-session", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        action,
        session,
      }),
    });
  } catch (error) {
    console.warn("Discord training notification failed", error);
  }
}
