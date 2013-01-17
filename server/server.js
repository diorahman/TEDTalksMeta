var url = require('url')
var express = require('express')
var request = require('request')
var lela = require('./lib/lela')
var Step = require('step')
var cheerio = require('cheerio')
var xml2js = require('xml2js')

var parser = new xml2js.Parser()
var server = express()

var userAgent = 'Mozilla/5.0 (Windows NT 6.1; rv:15.0) Gecko/20120716 Firefox/15.0a2'
var headers = { 'user-agent' : userAgent}

// express
function errorHandler(err, req, res, next) {
  res.status(500);
  res.render('error', { error: err });
}

// helper
function getRedirectedUrl(id, url, callback){
	request({ url : url, followRedirect : false}, function(err, res, body){
    callback(err, {location: res.headers.location, quality : id})
	})
}

function getStreamUrl(body, callback){
  var a = body.indexOf('htmlPlayerStreams');
  var b = body.indexOf('analyticsCategory');
  var c = body.substring(a,b);
  var str = 'var ' + c.substring(0,c.lastIndexOf(';'));
  eval(str)

  lela(getRedirectedUrl, htmlPlayerStreams, callback)
}

function getSubtitles($, callback){
  var map = {}

  $('select#subtitles_language_select').children().each(function(){
    var code = $(this).attr('value')
    if(code){
      map[code] = $(this).text()
    }
  })
  callback(null, map)
}

function getMetas($, callback){

  var map = {}
  $('meta').each(function(){
    var property = $(this).attr('property') ?  $(this).attr('property') : $(this).attr('name')
    if(property){
      map[property] = $(this).attr('content')
    }
  })

  callback(null, map)

}

function getDataId($, callback){
  callback(null, {id: $('#share_and_save').attr('data-id')})
}

function getSpeaker($, callback){
  var obj = {name: $('.speaker-photo').attr('alt'), photoUrl : $('.speaker-photo').attr('src')}
  obj.photoUrl = obj.photoUrl.substring(0, obj.photoUrl.lastIndexOf('_')) 
  
  // document.querySelector('.talk-intro').children[1].querySelector('a').href
  obj.bioLink = $($($('.talk-intro').children()[1]).find('a')[0]).attr('href')
  
  if($('q')){
    obj.quote = $('q').text()
  }

  callback(null, obj)
}

function getComments($, callback){
  // document.querySelector('#discussion').children[0].children[0].querySelector('.notranslate').innerText
  callback(null, {total : $($($($('#discussion').children()[0]).children()[0]).find('.notranslate')[0]).text()})

}

function getViews($, callback){
  // viewsHelp
  callback(null, {total: $($('#viewsHelp').children()[0]).text()})
}

function getTalkMeta($, callback){
  callback(null, {span : $('.talk-meta').text()})
}

function s2m(time){
  var minutes = Math.floor(time / 60)
  var seconds = time - minutes * 60
  return minutes + ':' +  seconds
}

function span2arr(span){
  var data = []
  var arr = span.split('•')
  for(var i = 0; i < arr.length; i++) data.push(arr[i].trim())
  return data;
}

function title2Alt(title, speaker){
	var arr = []

	if(title.indexOf(':') > -1){
    	arr = title.split(':');
  	}else{
    	arr = title.split(speaker.name);
    }

  if(arr.length > 1){
  	if(arr[0].indexOf(speaker.name) > -1)
  		return arr[1].trim();
  	else
  		return title;
  }else{
  	return title;
  }
}

function getPageData(body, callback){
  var $ = cheerio.load(body)

  Step(
      function getStuff() {
        getStreamUrl(body, this.parallel())
        getMetas($, this.parallel())
        getSubtitles($, this.parallel())
        getDataId($, this.parallel())
        getSpeaker($, this.parallel())
        getComments($, this.parallel())
        getViews($, this.parallel())
        getTalkMeta($, this.parallel())
      },
    
      // Show the result when done
      function showStuff(err, video, meta, subtitle, id, speaker, comments, views, talkMeta) {
        if (err) throw err;

        var retObj = {
          id : id.id,
          talkDuration : s2m(meta['video:duration']),
          talkLink : url.parse(meta['og:url']).path,
          tTitle : meta['title'].substring(0, meta['title'].lastIndexOf('|')).trim(),
          altTitle : title2Alt(meta['title'].substring(0, meta['title'].lastIndexOf('|')).trim(), speaker),
          blurb : meta['description'].substring(meta['description'].indexOf('TED Talks') + 'TED Talks'.length, meta['description'].length).trim(),
          speaker : speaker,
          commentsCount : comments.total,
          //ratings : {},
          //emailed : 0,
          views : views.total,
          image : meta['og:image'].substring(0, meta['og:image'].lastIndexOf('_')).trim(),
          keywords : meta['keywords'],
          meta : span2arr(talkMeta.span),
          video : video,
          subtitle : subtitle
        }
        callback(err, retObj)
      }
      )
}

// TEDTalks API
var TEDServerRootUrl = "http://www.ted.com"
var TEDServerBrowseUrl = "/talks/browse.json"
var TEDServerFeedUrl = 'http://feeds.feedburner.com/tedtalks_video'

var orders = {
	'newest' : 'newest',
	'filmed' : 'filmed',
	'mostviewed' : 'mostviewed',
	'mostemailed' : 'mostemailed',
	'mostdiscussed' : 'mostdiscussed',
	'mostpopular' : 'mostpopular',
	'jaw-dropping' : 'jaw-dropping',
	'persuasive' : 'persuasive',
	'courageous' : 'courageous',
	'ingenious' : 'ingenious',
	'fascinating' : 'fascinating',
	'inspiring' : 'inspiring',
	'beautiful' : 'beautiful',
	'funny' :'funny',
	'informative' : 'informative'
}

var tags = { 
	'technology' : 20,
	'entertainment' : 25,
	'design' : 26,
	'business' : 21,
	'science' : 24,
	'global issues' : 28
}

var images = {
	'talk-small-thumb' : '74x56',
	'talk-thumb' : '113x85',
	'talk-small' : '240x180',
	'talk-medium' : '389x292',
	'talk-big' : '800x600',
	'author-small' : '50x50',
	'author-big' : '254x191'
}

server.use(errorHandler)

server.get('/', function(req, res, next){
	var get = server.routes.get 
	var paths = []
	for(var i = 0; i < get.length; i++) paths.push(get[i].path)
	res.send({paths : paths})
})

server.get('/browse', function(req, res){
	var url = TEDServerRootUrl + TEDServerBrowseUrl
	var tagid = req.query.tag ? tags[req.query.tag] : ''
	var orderedby = req.query.orderedby ? orderedby : ''

	var qs = {}

	if(tagid || orderedby) qs = { tagid : tagid, orderedby : orderedby}

	request({url : url, qs : qs, headers : headers}, function(err, response, body){
		if(err) return next(err)

		var obj = JSON.parse(body)
		var retObj = { sl_translate : obj.sl_translate, status : obj.status, talks : []}
		for(var key in obj.main){
			retObj.talks.push(obj.main[key])
		}

		retObj.imageSize = images
		retObj.imageFormat = ".jpg"
		retObj.imageSeparator = "_"

		res.send(retObj)
	})
})

server.get('/subtitle', function(req, res, next){
	var id = req.query.id
	var lang = req.query.lang
	var url = TEDServerRootUrl + '/talks/subtitles/id/' + id + '/lang/' + lang 
	request({url : url, headers : headers}, function(err, respose, body){
		if(err) return next(err)
		res.send(body)
	})
})

server.get('/talk', function(req, res, next){

	var talkLink = req.query.link ? req.query.link : ''
	if(talkLink.length == 0) next(new Error("url invalid"))

	var url = TEDServerRootUrl + talkLink

	request({url : url, headers : headers}, function(err, response, body){
		if(err) return next(err)

		getPageData(body, function(err, obj){
			if(err) return next(err)
			obj.imageSize = images
			obj.imageFormat = ".jpg"
			obj.imageSeparator = "_"
			res.send(obj)
		})
	})
})

server.get('/info', function(req, res){
	var obj = {
		orders : orders, tags : tags, images : images
	}
	res.send(obj)
})

server.get('/search', function(req, res, next){
	var q = req.query.q ? req.query.q  : ''
	var page = req.query.page ? req.query.page : 1
	var qs = {cat : 'ss_talks'}

	qs.page = page
	qs.q = q

	request({ url : TEDServerRootUrl + '/search', qs : qs, headers : headers}, function(err, response, body){

		var $ = cheerio.load(body)
		var resultText = $('.search-title').children('span').text()
		var arr = resultText.split(' ')
		var obj = { status : "success", total : 0, page : page, talks : []}

	if(arr.length > 1){

		obj.total = parseInt(arr[2].trim())

		var pages = Math.floor(obj.total * 0.1)
		var mod = obj.total - pages;
		pages = pages + mod;

		obj.pages = pages;

		if(page > obj.pages) return next(new Error('Index out of range'))


		$('.video').each(function(){

			var talk = {
				tTitle : $(this).children('h5').text(),
				altTitle : $(this).children('h5').text(),
				blurb : $($(this).find('.desc')[0]).html(),
				talkLink : $(this).children('h5').children('a').attr('href'),
				image : $(this).children('.thumb').children('a').children('img').attr('src')
			}

			talk.image = talk.image.substring(0, talk.image.lastIndexOf('_'));
			obj.talks.push(talk)
		})

		obj.totalCurrentPage = obj.talks.length

		obj.imageSize = images
		obj.imageFormat = ".jpg"
		obj.imageSeparator = "_"

		res.send(obj)

	}else{
		res.send(obj)
	}

	})

})

server.get('/speaker', function(req, res, next){
	res.send({'endpoint' : 'speaker'})
})

server.get('/feed', function(req, res, next){
	request(TEDServerFeedUrl, function(err, response, body){
		if(err) next(err)
	parser.parseString(body, function (err, result) {
		if(err) next(err)
		var talks = result.rss.channel[0].item
		var retObj = { status : "success", talks : []}

		for(var i = 0; i < talks.length; i++){
			var talk = talks[i]
			var obj = {
				id : talk['jwplayer:talkId'][0],
				tTitle : talk['itunes:subtitle'][0],
				altTitle : title2Alt(talk['itunes:subtitle'][0], {name: talk['itunes:author'][0]}),
				blurb : talk['itunes:summary'][0],
				speaker : { name : talk['itunes:author'][0]},
				image : (talk['itunes:image'][0]['$']).url,
				talkLink : talk['link'][0],
				duration : talk['itunes:duration'][0],
				talkpDate : talk['pubDate'][0]
			}

			obj.image = obj.image.substring(0, obj.image.lastIndexOf('_'));
			
			var paths = url.parse(obj.talkLink).path.split('/');
			obj.talkLink = '/talks/' + paths[paths.length - 1]

			retObj.talks.push(obj)
		}

		retObj.imageSize = images
		retObj.imageFormat = ".jpg"
		retObj.imageSeparator = "_"
		res.send(retObj)
	})
})
})

server.listen(process.env.VMC_APP_PORT || 1337, null);
