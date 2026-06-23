const https = require('https');

https.get('https://studyin.lt/study-programmes/?institution_id=4516', (res) => {
  let data = '';
  res.on('data', (chunk) => data += chunk);
  res.on('end', () => {
    const matches = data.match(/<h5 class="title">(.*?)<\/h5>/g);
    if (matches) {
      console.log(matches.map(m => m.replace(/<[^>]+>/g, '').trim()));
    } else {
      console.log('No matches');
    }
  });
}).on('error', (err) => console.error(err));
