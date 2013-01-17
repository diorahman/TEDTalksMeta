var request = require('request')
var xml2js = require('xml2js');
var parser = new xml2js.Parser();

request('http://feeds.feedburner.com/tedtalks_video', function(err, response, body){
	parser.parseString(body, function (err, result) {
		var talks = result.rss.channel[0].item
		for(var i = 0; i < talks.length; i++){
			var obj = {

			}
		}
	})
})

/*
	
	{
      "id": 1,
      "talkDate": "Feb 2006",
      "talkfDate": "Feb 2006",
      "talkcDate": "Jun 2006",
      "talkpDate": "Jun 2006",
      "talkpDateTs": "1151367060",
      "talkDuration": "16:17",
      "talkLink": "/talks/al_gore_on_averting_climate_crisis.html",
      "tTitle": "Al Gore: Averting the climate crisis",
      "altTitle": "Al Gore: Averting the climate crisis",
      "blurb": "With the same humor and humanity he exuded in <em>An Inconvenient Truth,</em> Al Gore spells out 15 ways that individuals can address climate change immediately, from buying a hybrid to inventing a new, hotter \"brand name\" for global warming.",
      "speaker": "Al Gore",
      "fName": "Al",
      "lName": "Gore",
      "commentsCount": "228",
      "ratings": {
        "0": {
          "count": 400,
          "name": "Funny",
          "id": 7
        },
        "1": {
          "count": 329,
          "name": "Informative",
          "id": 8
        },
        "2": {
          "count": 309,
          "name": "Inspiring",
          "id": 10
        }
      },
      "emailed": 703,
      "views": "1,553,225",
      "image": "http://images.ted.com/images/ted/205"
    }

*/