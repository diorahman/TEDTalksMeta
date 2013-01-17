var url = require('url')
var request  = require('request')
var lela = require('../lib/lela')
var cheerio = require('cheerio')
var Step = require('step')

request('http://www.ted.com/search?cat=ss_talks&q=nuclear', function(err, response, body){

	var $ = cheerio.load(body)
	var resultText = $('.search-title').children('span').text()
	var arr = resultText.split(' ')

	var obj = { status : "success", talks : []}

	if(arr.length > 1){
		var total = parseInt(arr[2].trim())

		$('.video').each(function(){

			var talk = {
				tTitle : $(this).children('h5').text(),
				altTitle : $(this).children('h5').text(),
				blurb : $($(this).find('.desc')[0]).html(),
				talkLink : $(this).children('h5').children('a').attr('href'),
				image : $(this).children('.thumb').children('a').children('img').attr('src')
			}

			obj.talks.push(talk)
		})

		console.log(obj)

	}else{
		console.log('empty')
	}
	

})