import { createApp } from "./app";
import { loadConfig } from "./config";

const config = loadConfig();
const app = await createApp({ config });
app.listen(config.port, "0.0.0.0", () => console.log(`Savanna API listening on port ${config.port}`));
