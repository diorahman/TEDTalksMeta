var request = require('request')
var xml2js = require('xml2js');
var parser = new xml2js.Parser();

function title2Alt(title, speaker){

  var arr = []

  if(title.indexOf(':') > -1){
    arr = title.split(':');
  }else{
    arr = title.split(speaker.name);
    
  }

  if(arr.length > 1){
  	return arr[1].trim();
  }else{
  	return title;
  }
}


request('http://feeds.feedburner.com/tedtalks_video', function(err, response, body){
	parser.parseString(body, function (err, result) {
		var talks = result.rss.channel[0].item
		var retObj = { talks : []}
		for(var i = 0; i < talks.length; i++){
			var talk = talks[i]
			var obj = {
				id : talk['jwplayer:talkId'][0],
				tTitle : talk['itunes:subtitle'][0],
				altTitle : title2Alt(talk['itunes:subtitle'][0], {name: talk['itunes:author'][0]}),
				blurb : talk['itunes:summary'][0],
				speaker : talk['itunes:author'][0],
				image : (talk['itunes:image'][0]['$']).url
			}

			obj.image = obj.image.substring(0, obj.image.lastIndexOf('_'));

			retObj.talks.push(obj)
		}

		//console.log(retObj)
	})
})

/*
	
	 {
      "id": 1647,
      "talkDate": "Oct 2012",
      "talkfDate": "Oct 2012",
      "talkcDate": "Jan 2013",
      "talkpDate": "Jan 2013",
      "talkpDateTs": "1358352354",
      "talkDuration": "09:37",
      "talkLink": "/talks/cameron_russell_looks_aren_t_everything_believe_me_i_m_a_model.html",
      "tTitle": "Cameron Russell: Looks aren't everything. Believe me, I'm a model.",
      "altTitle": "Cameron Russell: Looks aren't everything. Believe me, I'm a model.",
      "blurb": "Cameron Russell admits she won “a genetic lottery”: she's tall, pretty and an underwear model. But don't judge her by her looks. In this fearless talk, she takes a wry look at the industry that had her looking highly seductive at barely 16-years-old. (<em>Filmed at TEDxMidAtlantic.</em>)",
      "speaker": "Cameron Russell",
      "fName": "Cameron",
      "lName": "Russell",
      "commentsCount": "88",
      "ratings": {
        "0": {
          "count": 143,
          "name": "Courageous",
          "id": 3
        },
        "1": {
          "count": 94,
          "name": "Inspiring",
          "id": 10
        },
        "2": {
          "count": 53,
          "name": "Informative",
          "id": 8
        }
      },
      "emailed": 0,
      "views": "170,652",
      "image": "http://images.ted.com/images/ted/1ba3bd800cbe51ac330462531885224ea07fae36"
    }

*/