import { request } from "@playwright/test";

async function globalSetup() {
  const requestContext = await request.newContext();

  try {
    // Reset the server state before running tests
    const response = await requestContext.post("http://localhost:8000/reset/");

    if (response.ok()) {
    } else {
      console.warn("⚠️ Failed to reset server state:", response.status());
    }
  } catch (error) {
    console.warn(
      "⚠️ Could not reset server state (server may not be running):",
      error,
    );
  } finally {
    await requestContext.dispose();
  }
}

export default globalSetup;
