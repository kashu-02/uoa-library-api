import express from 'express';

import axios from 'axios';
import { JSDOM } from 'jsdom';

import htmlSpecialCharsDecode from '../../lib/htmlSpecialChar.js';

const app = express();

app.get('/', (req, res, next) => {
  (async () => {
    const { biblographyId } = req.query;
    if (!biblographyId) {
      const error = new Error('biblographyId is required.');
      error.status = 400;
      throw error;
    }

    const result = await axios.get(
      `https://libopsv.u-aizu.ac.jp/detail?bbid=${biblographyId}`
    );
    // console.log(`\n\n\n${result.data.replace(/\r?\n/g, '').replace(/\t?/g, '')}\n\n\n`)

    const { document } = new JSDOM(
      result.data.replace(/\r?\n/g, '').replace(/\t?/g, '')
    ).window;

    const bookDetailTable = document.querySelectorAll(
      '#detailTblArea > table > tbody > tr'
    );

    const resResults = {
      biblographyId: '',
      title: '',
      type: '',
      authors: '',
      volumes: [],
      publisher: '',
      publishonDate: '',
      language: '',
      collections: [],
    };

    bookDetailTable.forEach((element, detailIndex) => {
      if (detailIndex === 0) return;
      switch (element.querySelectorAll('td')[0].innerHTML) {
        case '書誌ID':
          resResults.biblographyId = element
            .querySelectorAll('td')[1]
            .querySelector('span').innerHTML;
          break;
        case '図雑/和洋':
          resResults.type =
            element
              .querySelectorAll('td')[1]
              .querySelector('span')
              .innerHTML.match(/^(.*?)\/(.*?)$/)[1] === '図書'
              ? 'book'
              : 'magazine';
          if (resResults.type === 'magazine') {
            const error = new Error('Magazine is not supported.');
            error.status = 400;
            throw error;
          }
          resResults.language =
            element
              .querySelectorAll('td')[1]
              .querySelector('span')
              .innerHTML.match(/^(.*?)\/(.*?)$/)[2] === '和'
              ? 'japanese'
              : 'non-japanese';
          break;
        case '書名/著者': {
          const title = element
            .querySelectorAll('td')[1]
            .querySelector('span')
            .innerHTML.match(/^(.*?)\/(.*?)$/);
          const authors = element
            .querySelectorAll('td')[1]
            .querySelector('font > span')
            .innerHTML.match(/\/ (.*?)$/);
          resResults.title = title ? htmlSpecialCharsDecode(title[1]) : '';
          resResults.authors = authors
            ? htmlSpecialCharsDecode(authors[1])
            : '';
          break;
        }
        case 'VOL': {
          const volume = element
            .querySelectorAll('td')[1]
            .innerHTML.match(/\[VOL\]:? ?(.*) \[ISBN\]/);
          const isbn = element
            .querySelectorAll('td')[1]
            .innerHTML.match(/\[ISBN\]([0-9]*)/);
          const price = element
            .querySelectorAll('td')[1]
            .innerHTML.match(/\[PRICE\](.*)</);
          resResults.volumes.push({
            volume: volume ? htmlSpecialCharsDecode(volume[1]) : '',
            isbn: isbn ? isbn[1] : '',
            price: price ? htmlSpecialCharsDecode(price[1]) : '',
          });
          break;
        }
        case '出版事項': {
          const publisher = element
            .querySelectorAll('td')[1]
            .querySelector('span')
            .innerHTML.match(/: (.*) ,/);
          const publishionDate = element
            .querySelectorAll('td')[1]
            .querySelector('span')
            .innerHTML.match(/, (.*)$/);
          resResults.publisher = publisher
            ? htmlSpecialCharsDecode(publisher[1])
            : '';
          resResults.publishonDate = publishionDate ? publishionDate[1] : '';
          break;
        }
        default:
          break;
      }
    });

    // console.log(JSON.stringify(resResults))

    const collectionsResultsArray = [];

    const collections = document
      .querySelector('#holdBookTblArea')
      .querySelectorAll('table > tbody > tr');
    console.log(`length: ${collections.length}`);
    collections.forEach((collection, collectionsCount) => {
      /* if ((collections.length == 4 && (collectionsCount == 0 || collectionsCount >= collections.length - 2)) || (collections.length > 4 && (collectionsCount < 2 || collectionsCount >= collections.length - 2 || collectionsCount % 2 != 0))) {
        return
      } */
      if (collectionsCount === collections.length - 1) return;
      console.log(`td length: ${collection.querySelectorAll('td').length}`);
      if (collection.querySelectorAll('td').length !== 10) return;
      console.log(`${collectionsCount}: ${collection.innerHTML}`);
      const requestNumber = collection
        .querySelectorAll('td')[2]
        .innerHTML.match(
          /([0-9]|[A-Z])+([.]|[/])([0-9]|[A-Z])*\s?([0-9]|[A-Z]|\/)*/
        );
      const materialId = collection.querySelectorAll('td')[3].innerHTML;
      const volume = collection.querySelectorAll('td')[4].innerHTML;
      const location = collection.querySelectorAll('td')[5].innerHTML;
      let condition;
      if (collection.querySelectorAll('td')[6].innerHTML === '貸出中') {
        condition = 'on-loan';
      } else if (
        collection.querySelectorAll('td')[6].innerHTML.match(/.*\[\].*/)
      ) {
        condition = 'reference-only';
      } else {
        condition = 'available';
      }
      const dueDate = collection.querySelectorAll('td')[8].innerHTML;

      collectionsResultsArray.push({
        requestNumber: requestNumber ? requestNumber[0] : '',
        materialId: materialId || '',
        volume: volume ? htmlSpecialCharsDecode(volume) : '',
        location: location ? htmlSpecialCharsDecode(location) : '',
        condition: condition || '',
        dueDate: dueDate || '',
      });
      console.log(`${JSON.stringify(collectionsResultsArray)}`);
    });

    resResults.collections = collectionsResultsArray;

    res.send(resResults);
  })().catch(next);
});

// eslint-disable-next-line no-restricted-exports
export { app as default };
