// モジュールの読み込み
import express from 'express';

import apiv1 from './api/v1/index.js';

const PORT = process.env.PORT || 3000;
const app = express();

// /にアクセスがあった時、Deploy succeededと返す
app.get('/', (req, res) => {
  res.send('/ of UoA Library Search API');
});

app.use('/api/v1', apiv1);

app.listen(PORT);
console.log(`Server running at ${PORT}`);

// error handler
// eslint-disable-next-line no-unused-vars
app.use((err, req, res, next) => {
  console.log(err);
  res.status(err.status || 500).json({
    status: err.status || 500,
    message:
      err.status !== 500
        ? err.message || 'エラーが発生しました。'
        : 'エラーが発生しました。',
  });
});
