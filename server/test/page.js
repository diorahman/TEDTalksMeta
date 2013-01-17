var url = require('url')
var request  = require('request')
var lela = require('../lib/lela')
var cheerio = require('cheerio')
var Step = require('step')

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
  if(title.indexOf(':') > -1){
    return title.split(':')[1].trim()
  }else{
    return title.split(speaker.name)[1].trim()
  }
}

function getPageData(body){
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

        console.log(retObj)
        
      }
      )
}
  
request('http://www.ted.com/talks/karen_thompson_walker_what_fear_can_teach_us.html', function(err, res, body){
  getPageData(body)
})
