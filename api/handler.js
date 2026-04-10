// Vercel serverless function entry — delegates all requests to TanStack Start
import server from "../dist/server/server.js";

export default server.fetch;
