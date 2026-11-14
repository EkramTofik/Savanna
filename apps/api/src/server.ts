import { createApp } from "./app";
import { loadConfig } from "./config";

const config = loadConfig();
const app = await createApp({ config });
app.listen(config.port, () => console.log(`Savanna API on http://localhost:${config.port}`));
