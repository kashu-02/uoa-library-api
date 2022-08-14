import express from 'express';

import search from './search.js';
import detail from './detail.js';

const app = express();

app.use('/search', search);
app.use('/detail', detail);

// eslint-disable-next-line no-restricted-exports
export { app as default };
