var request = require('request')

request('http://www.ted.com/talks/browse.json', function(err, res, body){
	var obj = JSON.parse(body)
	var retObj = { sl_translate : obj.sl_translate, status : obj.status, talks : []}
	for(var key in obj.main){
		retObj.talks.push(obj.main[key])
	}
	console.log(retObj)
})