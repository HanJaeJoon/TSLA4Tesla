// decode-uri-component 0.4+ is ESM-only, but query-string 7 does require("decode-uri-component")(value).
// Dependabot requires >=0.5.1, so this wrapper keeps the patched 0.5.1 and restores the callable CJS export.
"use strict";
const upstream = require("@decode-uri-component/esm");

module.exports = upstream.default || upstream;
