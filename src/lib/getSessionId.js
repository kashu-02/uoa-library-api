'use strict'
import axios from 'axios'

main()

export default async function main() {
  try {
    const result = await axios.get('https://libopsv.u-aizu.ac.jp/');
    const sessionId = result.headers['set-cookie'][0].match(/JSESSIONID=(.*?);/)[1]
    //console.log(`sessionId: ${sessionId}`)
    return sessionId

    

  } catch (error){
    throw Error(error)
  }
  


}