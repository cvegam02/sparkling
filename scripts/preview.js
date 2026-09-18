'use strict';

// Builds the site into dist-preview/sparkling/ with every link pointing at
// localhost instead of the production baseUrl, so clicking a link while
// reviewing locally doesn't jump off to a domain that isn't live yet
// (see PREVIEW_OUT_DIR/PREVIEW_BASE_URL in build.js).
process.env.PREVIEW_OUT_DIR = 'dist-preview/sparkling';
process.env.PREVIEW_BASE_URL = 'http://localhost:5050/sparkling';

require('./build.js');
