import express from 'express';

import axios from 'axios';
import { JSDOM } from 'jsdom';

import getSessionId from '../../lib/getSessionId.js';
import htmlSpecialCharsDecode from '../../lib/htmlSpecialChar.js';

const app = express();

app.get('/', (req, res, next) => {
  (async () => {
    const sessionId = await getSessionId();

    if (Object.keys(req.query).length <= 1 && req.query.pageSize) {
      const error = new Error('At least one search criteria are required.');
      error.status = 400;
      throw error;
    }
    if (!req.query.pageSize) {
      const error = new Error('pageSize is required.');
      error.status = 400;
      throw error;
    }

    let bunkan;
    let bunkanStr;
    if (req.query.facility === 'university') {
      bunkan = '01';
      bunkanStr = '四大';
    } else if (req.query.facility === 'junior-college') {
      bunkan = '02';
      bunkanStr = '短大';
    } else {
      bunkan = '';
      bunkanStr = '全て';
    }
    const data = new URLSearchParams();
    data.append('position', 'book');
    data.append('searchForm.categoryName', '');
    data.append('method', 'search');
    data.append('searchForm.library', 'true');
    data.append('_searchForm.library', 'false');
    data.append('_searchForm.nii', 'false');
    data.append('searchForm.keyword', req.query.keyword || '');
    data.append('searchForm.title', req.query.title || '');
    data.append('searchForm.author', req.query.author || '');
    data.append('searchForm.subject', req.query.subject || '');
    data.append('searchForm.fullTitle', req.query.fullTitle || '');
    data.append('searchForm.category', req.query.ndc || '');
    data.append('searchForm.publisher', req.query.publisher || '');
    data.append('searchForm.fromYear', req.query.publishFromYear || '');
    data.append('searchForm.toYear', req.query.publishToyear || '');
    data.append('searchForm.isbn', req.query.isbn || '');
    data.append('searchForm.orderNumber', req.query.orderNumber || '');
    data.append('searchForm.siryoDiv', '');
    data.append('searchForm.allWord', req.query.allWord || '');
    data.append('searchForm.desc1', '');
    data.append('searchForm.bibExtCd1', '');
    data.append('searchForm.dispNum', req.query.pageSize);
    data.append('searchForm.subSearchForm.condition', '1');
    data.append('_searchForm.subSearchForm.typeTosho', 'false');
    data.append('_searchForm.subSearchForm.typeZasshi', 'false');
    data.append('searchForm.subSearchForm.language', '');
    data.append('searchForm.subSearchForm.bunkan', bunkan);
    data.append('searchForm.subSearchForm.siryo', '');
    data.append('searchForm.subSearchForm.bunkanStr', bunkanStr);
    data.append('searchForm.subSearchForm.haikaStr', '');
    data.append('searchForm.subSearchForm.siryoStr', 'All');
    data.append('searchForm.subSearchForm.languageStr', 'All');
    data.append('searchForm.subSearchForm.usableStr', '');
    data.append('searchForm.assignorIdStr', '');
    data.append('searchForm.siryoDivNm', 'All');
    data.append('searchForm.bibExtNm1', 'All');
    data.append('searchForm.bibExtNm2', '');
    data.append('searchForm.bibExtNm3', '');
    data.append('searchForm.bibExtNm4', '');
    data.append('searchForm.bibExtNm5', '');
    data.append('searchForm.bibExtNm6', '');
    data.append('searchForm.bibExtNm7', '');
    data.append('searchForm.bibExtNm8', '');
    data.append('searchForm.bibExtNm9', '');
    data.append('searchForm.bibExtNm10', '');
    data.append('searchForm.bibExtNm11', '');
    data.append('searchForm.bibExtNm12', '');
    data.append('searchForm.bibExtNm13', '');
    data.append('searchForm.bibExtNm14', '');
    data.append('searchForm.bibExtNm15', '');

    const result = await axios.post(
      'https://libopsv.u-aizu.ac.jp/search/search',
      data,
      {
        headers: { Cookie: `JSESSIONID=${sessionId}` },
      }
    );

    const { document } = new JSDOM(
      result.data.replace(/\r?\n/g, '').replace(/\t?/g, '')
    ).window;
    const books = document.querySelectorAll(
      '#BookListTable > table > tbody > tr'
    );
    console.log(`book total: ${books.length}`);
    const results = [];

    books.forEach((book, booksIndex) => {
      console.log(`booksIndex: ${booksIndex}`);
      console.log(`book: ${book.innerHTML}`);
      if (
        (books.length === 3 && booksIndex === 0) ||
        (books.length > 3 && booksIndex < 2) ||
        booksIndex === books.length - 1
      ) {
        return;
      }
      console.log(`books or: ${book.querySelectorAll('td')[3].innerHTML}`);
      if (book.querySelectorAll('td')[3].innerHTML === '図') {
        const bookInfo = book.querySelectorAll('td')[4];
        const titles = bookInfo
          .querySelectorAll('table')[0]
          .querySelector('tbody > tr > td > a').innerHTML;
        const title = titles.match(/^(.*) \//);
        const authors = titles.match(/\/ (.*?著)/);
        const publisher = titles.match(/-- (.*?),/);
        const series = titles.match(/-- \((.*)\)\./);
        const biblographyId = bookInfo
          .querySelectorAll('table')[0]
          .querySelector('tbody > tr > td > a')
          .href.match(/bibId=(.*)/)[1];
        const collections = bookInfo
          .querySelectorAll('table')[1]
          .querySelectorAll('tbody > tr > td')[1]
          .querySelectorAll('table > tbody > tr');
        const collectionsResults = [];
        collections.forEach((collection) => {
          const elements = collection.querySelectorAll('td');
          console.log(`element: ${elements[1].innerHTML}`);
          const volume = elements[0].innerHTML;
          const location = elements[1].innerHTML;

          const requestNumber = elements[2].innerHTML;
          const materialId = elements[3].innerHTML;
          let condition;
          if (elements[4].innerHTML === '貸出中') {
            condition = 'on-loan';
          } else if (elements[4].innerHTML === ' []') {
            condition = 'reference-only';
          } else {
            condition = 'available';
          }
          collectionsResults.push({
            volume: volume ? htmlSpecialCharsDecode(volume) : '',
            location: location ? htmlSpecialCharsDecode(location) : '',
            requestNumber: requestNumber
              ? htmlSpecialCharsDecode(requestNumber)
              : '',
            materialId: materialId ? htmlSpecialCharsDecode(materialId) : '',
            condition,
          });
          console.log(JSON.stringify(collectionsResults));
        });
        results.push({
          type: 'book',
          title: title ? htmlSpecialCharsDecode(title[1]) : '',
          authors: authors ? htmlSpecialCharsDecode(authors[1]) : '',
          publisher: publisher ? htmlSpecialCharsDecode(publisher[1]) : '',
          series: series ? htmlSpecialCharsDecode(series[1]) : '',
          biblographyId,
          collections: collectionsResults,
        });
        console.log(`\n\nresults: ${JSON.stringify(results)}\n\n`);
      } else if (book.querySelectorAll('td')[3].innerHTML === '雑') {
        const bookInfo = book.querySelectorAll('td')[4];
        const titles = bookInfo
          .querySelectorAll('table')[0]
          .querySelector('tbody > tr > td > a').innerHTML;
        const title = titles.match(/^(.*?)\./);
        const journal = titles.match(/\(.*? \|/);
        const volume = titles.match(/-- (.*?),/);
        const biblographyId = bookInfo
          .querySelectorAll('table')[0]
          .querySelector('tbody > tr > td > a')
          .href.match(/bibId=(.*)/)[1];
        const collections = bookInfo
          .querySelectorAll('table')[1]
          .querySelectorAll('tbody > tr > td')[1]
          .querySelectorAll('table > tbody > tr');
        const collectionsResults = [];
        collections.forEach((collection) => {
          const elements = collection.querySelectorAll('td');
          console.log(`element: ${elements[1].innerHTML}`);
          const location = elements[1].innerHTML;
          let condition;
          if (elements[4].innerHTML === '貸出中') {
            condition = 'on-loan';
          } else if (elements[4].innerHTML.match(/.*\[\].*/)) {
            condition = 'reference-only';
          } else {
            condition = 'available';
          }
          collectionsResults.push({
            location: location ? htmlSpecialCharsDecode(location) : '',
            condition,
          });
          console.log(JSON.stringify(collectionsResults));
        });
        results.push({
          type: 'magazine',
          title: title ? htmlSpecialCharsDecode(title[1]) : '',
          journal: journal ? htmlSpecialCharsDecode(journal[1]) : '',
          volume: volume ? htmlSpecialCharsDecode(volume[1]) : '',
          biblographyId,
          collections: collectionsResults,
        });
        console.log(`\n\nresults: ${JSON.stringify(results)}\n\n`);
      }
    });

    // console.log(JSON.stringify(document.querySelector('#BookListTable table tbody tr').innerHTML))
    res.send(results);
  })().catch(next);
});

// eslint-disable-next-line no-restricted-exports
export { app as default };
