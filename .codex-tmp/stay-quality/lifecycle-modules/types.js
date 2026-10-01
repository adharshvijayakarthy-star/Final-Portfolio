"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.fetchJson = fetchJson;
async function fetchJson(url, signal) {
    const response = await fetch(url, { signal });
    if (!response.ok)
        throw new Error(`${url}: HTTP ${response.status}`);
    return response.json();
}
