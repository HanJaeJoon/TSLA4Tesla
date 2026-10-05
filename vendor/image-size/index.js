// image-size 2.x dropped sync path support (moved to image-size/fromFile, async) and no longer
// exposes a callable default the way metro Assets.js expects. Dependabot requires >=2.0.3, so this
// tiny wrapper keeps the patched 2.0.4 parser while restoring the 1.x call shape metro uses:
//   require("image-size")(pathOrBuffer) / .default(pathOrBuffer)
"use strict";
const fs = require("fs");
const upstream = require("@image-size/core");

function asBuffer(input) {
  if (typeof input === "string") return fs.readFileSync(input);
  return input;
}

function imageSize(input) {
  return upstream.imageSize(asBuffer(input));
}

module.exports = imageSize;
module.exports.imageSize = imageSize;
module.exports.default = imageSize;
module.exports.disableTypes = upstream.disableTypes;
module.exports.types = upstream.types;
module.exports.__esModule = true;
