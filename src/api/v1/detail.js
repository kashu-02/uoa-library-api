import express from "express";
const app = express();

import axios from "axios";
import { JSDOM } from 'jsdom';

import htmlspecialchars_decode from '../../lib/htmlSpecialChar.js';

app.get('/',  (req, res, next) => {
  (async () => {
    const biblographyId = req.query.biblographyId
    if (!biblographyId) {
      let error = new Error('biblographyId is required.')
      error.status = 400
      throw error
    }

    const result = await axios.get(`https://libopsv.u-aizu.ac.jp/detail?bbid=${biblographyId}`)
     //console.log(`\n\n\n${result.data.replace(/\r?\n/g, '').replace(/\t?/g, '')}\n\n\n`)

    const { document } = (new JSDOM(result.data.replace(/\r?\n/g, '').replace(/\t?/g, ''))).window
  
    const book_detail_table = document.querySelectorAll('#detailTblArea > table > tbody > tr')

    let res_results = {
      biblographyId: '',
      title : '',
      type : '',
      authors: '',
      volumes: [],
      publisher : '',
      publishonDate : '',
      language : '',
      collections: [],
    }

    book_detail_table.forEach((element, detail_index) => {
      if (detail_index == 0) return;
      switch (element.querySelectorAll('td')[0].innerHTML) {
        case '書誌ID':
          res_results.biblographyId = element.querySelectorAll('td')[1].querySelector('span').innerHTML
          break;
        case '図雑/和洋':
          res_results.type = (element.querySelectorAll('td')[1].querySelector('span').innerHTML.match(/^(.*?)\/(.*?)$/)[1] == '図書') ? 'book' : 'magazine';
          if (res_results.type == 'magazine') {
            let error = new Error('Magazine is not supported.');
            error.status = 400;
            throw error;
          }
          res_results.language = (element.querySelectorAll('td')[1].querySelector('span').innerHTML.match(/^(.*?)\/(.*?)$/)[2] == '和') ? 'japanese' : 'non-japanese';
          break;
        case '書名/著者':
          const title = element.querySelectorAll('td')[1].querySelector('span').innerHTML.match(/^(.*?)\/(.*?)$/)
          const authors = element.querySelectorAll('td')[1].querySelector('font > span').innerHTML.match(/\/ (.*?)$/)
          res_results.title = title ? htmlspecialchars_decode(title[1]) : '';
          res_results.authors = authors ? htmlspecialchars_decode(authors[1]) : '';
          break;
        case 'VOL':
          const volume = element.querySelectorAll('td')[1].innerHTML.match(/\[VOL\]:? ?(.*) \[ISBN\]/);
          const isbn = element.querySelectorAll('td')[1].innerHTML.match(/\[ISBN\]([0-9]*)/);
          const price = element.querySelectorAll('td')[1].innerHTML.match(/\[PRICE\](.*)</);
          res_results.volumes.push({
            volume: volume ? htmlspecialchars_decode(volume[1]) : '',
            isbn: isbn ? isbn[1] : '',
            price: price ? htmlspecialchars_decode(price[1]) : '',
          })
          break;
        case '出版事項':
          const publisher = element.querySelectorAll('td')[1].querySelector('span').innerHTML.match(/: (.*) ,/);
          const publishionDate = element.querySelectorAll('td')[1].querySelector('span').innerHTML.match(/, (.*)$/);
          res_results.publisher = publisher ? htmlspecialchars_decode(publisher[1]) : '';
          res_results.publishonDate = publishionDate ? publishionDate[1] : '';
          break;
      
        default:
          break;
      }
    });

    //console.log(JSON.stringify(res_results))

    let collections_results_array = []

    const collections = document.querySelector('#holdBookTblArea').querySelectorAll('table > tbody > tr')
    console.log(`length: ${collections.length}`)
    collections.forEach((collection, collections_count) => {
     /* if ((collections.length == 4 && (collections_count == 0 || collections_count >= collections.length - 2)) || (collections.length > 4 && (collections_count < 2 || collections_count >= collections.length - 2 || collections_count % 2 != 0))) {
        return
      }*/
      if(collections_count == collections.length - 1) return;
      console.log(`td length: ${collection.querySelectorAll('td').length}`)
      if (collection.querySelectorAll('td').length != 10) return;
      console.log(`${collections_count}: ${collection.innerHTML}`)
      const requestNumber = collection.querySelectorAll('td')[2].innerHTML.match(/([0-9]|[A-Z])+([.]|[\/])([0-9]|[A-Z])*\s?([0-9]|[A-Z]|\/)*/);
      const materialId = collection.querySelectorAll('td')[3].innerHTML;
      const volume = collection.querySelectorAll('td')[4].innerHTML;
      const location = collection.querySelectorAll('td')[5].innerHTML
      let condition
      if (collection.querySelectorAll('td')[6].innerHTML == '貸出中') {
        condition = 'on-loan'
      } else if (collection.querySelectorAll('td')[6].innerHTML.match(/.*\[\].*/)) {
        condition = 'reference-only'
      } else {
        condition = 'available'
      }
      const dueDate = collection.querySelectorAll('td')[8].innerHTML;

      collections_results_array.push({
        requestNumber : requestNumber ? requestNumber[0] : '',
        materialId : materialId ? materialId : '',
        volume : volume ? htmlspecialchars_decode(volume) : '',
        location : location ? htmlspecialchars_decode(location) : '',
        condition : condition ? condition : '',
        dueDate : dueDate ? dueDate : '',
      })
      console.log(`${JSON.stringify(collections_results_array)}`)
    });

    res_results.collections = collections_results_array;
    
    
    
    res.send(res_results)

  })().catch(next)
})

export {app as default};

