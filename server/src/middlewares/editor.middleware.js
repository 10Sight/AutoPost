/**
 * Middleware to apply Cross-Origin-Opener-Policy and Cross-Origin-Embedder-Policy
 * specifically for routes that require WebAssembly (like the Media Editor).
 */
export const applyEditorHeaders = (req, res, next) => {
    res.setHeader("Cross-Origin-Opener-Policy", "same-origin");
    res.setHeader("Cross-Origin-Embedder-Policy", "require-corp");
    next();
};
