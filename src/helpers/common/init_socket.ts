import express from 'express';
import http from 'http';

const marketingBackendApp = express();
const httpServer = http.createServer(marketingBackendApp);

export { marketingBackendApp, httpServer };
