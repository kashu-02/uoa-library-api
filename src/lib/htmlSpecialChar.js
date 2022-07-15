

export default function (str) {
  return (str + '').replace(/&amp;/g,'&')
                   .replace(/&quot;/g,'"')
                   .replace(/&#039;/g,"'")
                   .replace(/&lt;/g,'<')
                   .replace(/&gt;/g,'>'); 
                   
}