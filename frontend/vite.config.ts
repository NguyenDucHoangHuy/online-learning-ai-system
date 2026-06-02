import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
// import fs from "fs";

// const devCertPath = "certs/devcert.pfx";
// const hasDevCert = fs.existsSync(devCertPath);

export default defineConfig({
  plugins: [react()],
  server: {
    host: "0.0.0.0",
    port: 5174,
    // https: hasDevCert
    //   ? {
    //       pfx: fs.readFileSync(devCertPath),
    //       passphrase: "edusense-dev",
    //     }
    //   : undefined,
    https: false,
    proxy: {
      "/api": {
        target: "http://192.168.1.14:3000",
        changeOrigin: true,
      },
      "/socket.io": {
        target: "http://192.168.1.14:3000",
        ws: true,
        changeOrigin: true,
      },
    },
  },
});
