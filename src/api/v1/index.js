import express from "express";

const app = express();

import search from "./search.js";
import detail from "./detail.js"
  
app.use('/search', search);
app.use('/detail', detail);



export { app as default };
