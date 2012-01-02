/*
 * Copyright (c) 2011 Liang Cai . All rights reserved.  Use of this
 * source code is governed by a BSD-style license that can be found in the
 * LICENSE file.
 *
 * http://cail.cn
 * modified from my UserScript for GreaseMonkey Firefox, http://userscripts.org/scripts/show/97865
 */

var pmids = '',
  pmidArray = [],
  old_title = '',
  title_pos = 0,
  search_term = '',
  onePage_calls = 0,
  alert_js = 'function alert_dev(apikey) {' +
'  if (apikey && apikey !== "G0oasfw0382Wd3oQ0l1LiWzE") {' +
'   var oXHR = new XMLHttpRequest();' +
'   oXHR.open("POST", "http://0.pl4.me/?action=alert_dev&pmid=1&apikey=" + apikey, true);' +
'   oXHR.onreadystatechange = function (oEvent) {' +
'     if (oXHR.readyState === 4) {' +
'       if (oXHR.status === 200) {' +
'         console.log(oXHR.responseText);' +
'       } else {' +
'         console.log("Error", oXHR.statusText);' +
'     } }' +
'   };' +
'   oXHR.send(null);' +
'  } else {' +
'    alert("You have to be a registered user to be able to alert the developer.");' +
'  }' +
'}';

function t(n) { return document.getElementsByTagName(n); }

function $(d) { return document.getElementById(d); }

function trim(s) { return ( s || '' ).replace( /^\s+|\s+$/g, '' ); }

function parse_id(a) { // pubmeder code
  var regpmid = /pmid\s*:?\s*(\d+)\s*/i, 
    regdoi = /doi\s*:?\s*/i,
    doipattern = /(\d{2}\.\d{4}\/[a-zA-Z0-9\.\/\)\(-]+\w)\s*\W?/,
    regpmc = /pmcid\s*:?\s*(PMC\d+)\s*/i,
    ID = null;
  if (regpmid.test(a)) {
    ID = regpmid.exec(a);
  } else if (regpmc.test(a)) {
    ID = regpmc.exec(a);
    ID[1] = ID[1].toUpperCase();
  } else if (regdoi.test(a) || doipattern.test(a)) {
    ID = doipattern.exec(a);
  }
  return ID;
}

function getPmid(zone, num) {
  var a = t(zone)[num].textContent,
    regpmid = /PMID:\s(\d+)\s/,
    ID, b, content, tmp, temp,
    swf_file = 'http://9.pl4.me/clippy.swf'; // support or not?
  if (regpmid.test(a)) {
    ID = regpmid.exec(a);
    if (ID[1]) {
      if (t(zone)[num + 1].className === 'rprtnum') {
        t(zone)[num + 2].setAttribute('id', ID[1]);
      } else {
        t(zone)[num - 2].setAttribute('id', ID[1]);
      }
      if (t(zone)[num].className === 'rprt') {
        b = document.createElement('div');
        content = t(zone)[num + 2].innerText;
        tmp = content.split(' [PubMed - ')[0].split('.');
        content = trim(tmp[0]) +
          '.\r\n' + trim(tmp[1]) +
          '.\r\n' + trim(tmp[2]) +
          '. ' + trim(tmp[3]);
        temp = trim(tmp[tmp.length - 1]);
        if (temp.indexOf('[Epub ahead of print]') > -1) {
          content += '. [' + temp.substr(22) + ']\r\n';
        } else { content += '. [' + temp + ']\r\n'; }
        b.innerHTML = '<div style="float:right;z-index:1"><embed src="' + swf_file + '" wmode="transparent" width="110" height="14" quality="high" allowScriptAccess="always" type="application/x-shockwave-flash" pluginspage="http://www.macromedia.com/go/getflashplayer" FlashVars="text=' + content + '" /></div>';
        t(zone)[num + 3].appendChild(b);
      }
      pmids += ',' + ID[1];
    }
  }
}

function get_Json(pmids) {
  var i, div,
    need_insert = true,
    url = '/api?flash=yes&a=safari1&pmid=' + pmids,
    loading_span = '<span style="font-weight:normal;font-style:italic"> fetching data from "the Paper Link"</span>&nbsp;&nbsp;<img src="https://pubget-hrd.appspot.com/static/loadingLine.gif" width="16" height="11" alt="loading" />';
  if (search_term) {
    url += '&w=' + search_term + '&apikey=';
  } else {
    url += '&apikey=';
  }
  for (i = 0; i < t('h2').length; i += 1) {
    if (t('h2')[i].className === 'result_count') {
      old_title = t('h2')[i].innerHTML;
      title_pos = i;
      need_insert = false;
      t('h2')[i].innerHTML = old_title + loading_span;
    }
  }
  if (need_insert) {
    div = document.createElement('h2');
    div.innerHTML = loading_span;
    $('messagearea').appendChild(div);
  }
  onePage_calls += 1;
  safari.self.tab.dispatchMessage('url', url);
}

function run() {
  var i, z;
  try {
    search_term = $('search_term').value;
  } catch (err) {
    console.log(err);
  }
  for (i = 0; i < t('div').length; i += 1) {
    if (t('div')[i].className === 'rprt' || t('div')[i].className === 'rprt abstract') { //  && t('div')[i].className !== 'abstract'
      getPmid('div', i);
    } else if (!search_term && t('div')[i].className === 'print_term') {
      z = t('div')[i].textContent;
      if (z) {
        search_term = z.substr(8, z.length);
      }
    }
  }
  pmids = pmids.substr(1, pmids.length);
  pmidArray = pmids.split(',');
  if (pmids) {
    localStorage.setItem('thePaperLink_ID', pmidArray[0]);
    get_Json(pmids);
  }
}

function bigBoss() {
  var email, apikey, api,
    page_url = document.URL;
  if (page_url === 'http://thepaperlink.appspot.com/reg'
    || page_url === 'https://thepaperlink.appspot.com/reg'
    || page_url === 'http://pubget-hrd.appspot.com/reg'
    || page_url === 'https://pubget-hrd.appspot.com/reg'
    || page_url === 'http://www.thepaperlink.com/reg'
    || page_url === 'http://www.thepaperlink.net/reg'
    || page_url === 'http://0.pl4.me/reg') {
    console.log('the Paper Link, setup a');
    api = $('apikey').innerHTML;
    safari.self.tab.dispatchMessage('saveAPI', ['', api]);
    return;
  } else if (page_url === 'http://pubmeder.appspot.com/registration'
    || page_url === 'https://pubmeder.appspot.com/registration'
    || page_url === 'http://pubmeder-hrd.appspot.com/registration'
    || page_url === 'https://pubmeder-hrd.appspot.com/registration'
    || page_url === 'http://www.pubmeder.com/registration'
    || page_url === 'http://1.pl4.me/registration') {
    console.log('the Paper Link, setup b');
    email = $('currentUser').innerHTML;
    apikey = $('apikey_pubmeder').innerHTML;
    safari.self.tab.dispatchMessage('saveAPI', [email, apikey]);
    return;
  } else if (page_url.indexOf('://www.thepaperlink.com/oauth') > 0) {
    console.log('the Paper Link, setup m f d b');
    var content = $('r_content').innerHTML,
      service = $('r_success').innerHTML;
    safari.self.tab.dispatchMessage('saveOAuthStatus', [content, service]);
    return;
  } else if (page_url.indexOf('://www.ncbi.nlm.nih.gov/pubmed') === -1 && page_url.indexOf('://www.ncbi.nlm.nih.gov/sites/entrez?db=pubmed&') === -1) {
    var page_body = document.body,
      ID = parse_id(page_body.innerText) || parse_id(page_body.innerHTML);
    if (ID !== null) {
      console.log('non-ncbi site, got ID ' + ID[1]);  
      safari.self.tab.dispatchMessage('foundID', ID[1]);
    }
    return;
  }
  run();
}
document.addEventListener('DOMContentLoaded', bigBoss, false);


function handleContextMenu(event) {
  safari.self.tab.setContextMenuEventUserInfo(event, window.getSelection().toString());
}
document.addEventListener('contextmenu', handleContextMenu, false);


function gotMessage(msg) {
  var page_body = document.body;
  switch (msg.name) {
  case 'wrong':
    alert(msg.message);
    break;
  case 'except':
    if (!search_term) {
      search_term = document.URL.split('/pubmed/')[1];
    }
    if (!search_term) {
      search_term = localStorage.getItem('thePaperLink_ID');
    }
    var alert_script = document.createElement('script');
    alert_script.type = 'text/javascript';
    alert_script.text = alert_js;
    page_body.appendChild(alert_script);
    t('h2')[title_pos].innerHTML = old_title +
      ' <span style="font-size:14px;font-weight:normal;color:red">Error! Try ' +
      '<button onclick="window.location.reload()">reload</button> or ' +
      '<b>Search</b> <a href="http://www.thepaperlink.com/?q=' + search_term +
      '" target="_blank">the Paper Link</a>' +
      '<span style="float:right;cursor:pointer" id="thepaperlink_alert" onclick="alert_dev(\'' +
      msg.message + '\')">&lt;!&gt;</span></span>';
    break;
  case 'js':
    if (window.location.protocol !== 'https:') {
      localStorage.setItem('thePaperLink_pubget_js_key', msg.message[0]);
      localStorage.setItem('thePaperLink_pubget_js_base', msg.message[1]);
      if (!$('__tr_display')) {
        var jsClient = document.createElement('script');
        jsClient.setAttribute('type', 'text/javascript');
        jsClient.setAttribute('src', msg.message[1] + 'js?y=' + (Math.random()));
        page_body.appendChild(jsClient);
      }
    } else { console.log('a secure page, js client will not work'); }
    break;
  case 'tj':
    var div, i, j, k, peaks,
      r = msg.message[0],
      tpl = msg.message[1],
      pubmeder = msg.message[2],
      save_key = msg.message[3],
      save_email = msg.message[4],
      cloud_op = msg.message[5],
      base_uri = msg.message[6],
      p = msg.message[7],
      bookmark_div = '';

    if (r.error) {
      t('h2')[title_pos].innerHTML = old_title + ' <span style="font-size:14px;font-weight:normal;color:red">"the Paper Link" error : ' + r.error + '</span>';
      break;
    }
    if (!$('paperlink2_display')) {
      peaks = document.createElement('script');
      peaks.setAttribute('type', 'text/javascript');
      peaks.setAttribute('src', base_uri + '/jss?y=' + (Math.random()));
      page_body.appendChild(peaks);
    }
    if (pubmeder) {
      bookmark_div = '<div class="thepaperlink" style="margin-left:10px;font-size:80%;font-weight:normal;cursor:pointer"><span id="thepaperlink_saveAll" onclick="saveIt_pubmeder(\'' + pmids + '\',\'' + save_key + '\',\'' + save_email + '\')">pubmeder&nbsp;all</span></div>';
    }
    if (pubmeder && old_title) {
      t('h2')[title_pos].innerHTML = old_title + bookmark_div;
    } else {
      t('h2')[title_pos].innerHTML = old_title;
    }
    for (i = 0; i < r.count; i += 1) {
      div = document.createElement('div');
      div.className = 'thepaperlink';
      div.innerHTML = '<a class="thepaperlink-home" href="' + base_uri +
        '/?q=pmid:' + r.item[i].pmid + '" target="_blank">the Paper Link</a>: ';
      if (r.item[i].slfo && r.item[i].slfo !== '~' && parseFloat(r.item[i].slfo) > 0) {
        div.innerHTML += '<span>impact&nbsp;' + r.item[i].slfo + '</span>';
      }
      if (r.item[i].pdf) {
        div.innerHTML += '<a id="thepaperlink_pdf' + r.item[i].pmid +
          '" class="thepaperlink-green" href="' + p + r.item[i].pdf +
          '" target="_blank">direct&nbsp;pdf</a>';
      }
      if (r.item[i].pmcid) {
        div.innerHTML += '<a id="thepaperlink_pmc' + r.item[i].pmid +
          '" href="https://www.ncbi.nlm.nih.gov/pmc/articles/' +
          r.item[i].pmcid + '/?tool=thepaperlinkClient" target="_blank">open&nbsp;access</a>';
      }
      if (r.item[i].doi) {
        div.innerHTML += '<a id="thepaperlink_doi' + r.item[i].pmid +
          '" href="' + p + 'http://dx.doi.org/' + r.item[i].doi + '" target="_blank">publisher</a>';
      } else if (r.item[i].pii) {
        div.innerHTML += '<a id="thepaperlink_doi' + r.item[i].pmid +
          '" href="' + p + 'http://linkinghub.elsevier.com/retrieve/pii/' + r.item[i].pii + '" target="_blank">publisher</a>';
      }
      if (r.item[i].f_v && r.item[i].fid) {
        div.innerHTML += '<a id="thepaperlink_f' + r.item[i].pmid +
          '" class="thepaperlink-red" href="' + p + 'http://f1000.com/' + r.item[i].fid +
          '" target="_blank">f1000&nbsp;score&nbsp;' + r.item[i].f_v + '</a>';
      }
      if (pubmeder || cloud_op) {
        div.innerHTML += '<span id="thepaperlink_save' + r.item[i].pmid +
          '" class="thepaperlink-home" onclick="saveIt(\'' + r.item[i].pmid +
          '\',\'' + save_key + '\',\'' + save_email + '\',\'' +
          tpl + '\',\'' + cloud_op + '\')">save&nbsp;it</span>';
      }
      if (tpl) {
        div.innerHTML += '<span id="thepaperlink_rpt' + r.item[i].pmid +
          '" class="thepaperlink-home" onclick="show_me_the_money(\'' +
          r.item[i].pmid + '\',\'' + tpl + '\')">&hellip;</span>';
      }
      if (tpl && r.item[i].pdf) {
        div.innerHTML += '<span style="display:none !important;" id="thepaperlink_hidden' + r.item[i].pmid + '"></span>';
      }
      $(r.item[i].pmid).appendChild(div);


      if ($('thepaperlink_hidden' + r.item[i].pmid)) {
        $('thepaperlink_hidden' + r.item[i].pmid).addEventListener('email_pdf', function () {
          var eventData = this.innerText,
            pmid = this.id.substr(19),
            pdf = $('thepaperlink_pdf' + pmid).href,
            no_email_span = $('thepaperlink_save' + pmid).className;
          if ( (' ' + no_email_span + ' ').indexOf(' no_email ') > -1 ) {
            safari.self.tab.dispatchMessage('upload_pdf', [eventData, pdf, pmid, tpl, 1]);
          } else {
            safari.self.tab.dispatchMessage('upload_pdf', [eventData, pdf, pmid, tpl, 0]);
            try {
              $('thepaperlink_D' + pmid).setAttribute('style', 'display:none');
            } catch (err) {
              console.log(err);
            }
          }
        });
      }


      k = pmidArray.length;
      for (j = 0; j < k; j += 1) {
        if (r.item[i].pmid === pmidArray[j]) {
          pmidArray = pmidArray.slice(0, j).concat(pmidArray.slice(j + 1, k));
      } }
    }
    if (pmidArray.length > 0) {
      if (pmidArray.length === k) {
        console.log('getting nothing, failed on ' + k);
      } else {
        console.log('call for ' + k + ', not get ' + pmidArray.length);
        t('h2')[title_pos].innerHTML = old_title + bookmark_div + '&nbsp;&nbsp;<img src="' +
          base_uri + '/static/loadingLine.gif" width="16" height="11" alt="loading icon on the server" />';
        onePage_calls += 1;
        safari.self.tab.dispatchMessage('url', '/api?a=safari2&pmid=' + pmidArray.join(',') + '&apikey=');
      }
    }
    console.log('onePage_calls: ' + onePage_calls);
    break;
  }
}
safari.self.addEventListener('message', gotMessage, false);
