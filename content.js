/*
 * Copyright (c) 2012 Liang Cai . All rights reserved.  Use of this
 * source code is governed by a BSD-style license that can be found in the
 * LICENSE file.
 *
 * http://cail.cn
 */

var DEBUG = false,
  noRun = 0,
  page_d = document,
  page_url = page_d.URL,
  loading_gif = 'http://www.thepaperlink.com/static/loadingLine.gif',
  pmids = '',
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


if (typeof window.uneval === 'undefined') {
  window.uneval = function (a) {
    return ( JSON.stringify(a) ) || '';
  };
}

function uneval_trim(a) {
  var b = uneval(a) || '""';
  return b.substr(1, b.length - 2);
}

function t(n) { return page_d.getElementsByTagName(n); }

function $(d) { return page_d.getElementById(d); }

function trim(s) { return ( s || '' ).replace( /^\s+|\s+$/g, '' ); }

function a_proxy(name, data) {
  DEBUG && console.log(name + ': sendRequest to global.html');
  safari.self.tab.dispatchMessage(name, data);
}

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
    ID, b, c, t_cont, t_strings, t_test, t_title,
    swf_file = 'http://www.thepaperlink.com/static/clippy.swf'; // support or not?
  DEBUG && console.log(a);
  if (regpmid.test(a)) {
    ID = regpmid.exec(a);
    if (ID[1]) {
      if (t(zone)[num + 1].className.indexOf('rprtnum') > -1) {
        t(zone)[num + 2].setAttribute('id', ID[1]);
      } else {
        t(zone)[num - 2].setAttribute('id', ID[1]);
      }
      if (t(zone)[num].className === 'rprt') {
        t_cont = t(zone)[num + 2].textContent;
        t_strings = t_cont.split(' [PubMed - ')[0].split('.');
        t_title = trim( t_strings[0] );
        t_cont = t_title +
          '.\r\n' + trim( t_strings[1] ) +
          '.\r\n' + trim( t_strings[2] ) +
          '. ' + trim( t_strings[3] ) +
          '. [' + ID[1] + ']\r\n';
      } else{
        t_strings = a.split('.');
        t_title = trim( t_strings[2] );
        t_cont = t_title +
          '.\r\n' + trim( t_strings[3] ) +
          '.\r\n' + trim( t_strings[0] ) +
          '. ' + trim( t_strings[1] ) +
          '. [' + ID[1] + ']\r\n';
      }
      DEBUG && console.log(t_cont);
      b = page_d.createElement('div');
      b.innerHTML = '<div style="float:right;z-index:1"><embed src="'
        + swf_file + '" wmode="transparent" width="110" height="14" quality="high" allowScriptAccess="always" type="application/x-shockwave-flash" pluginspage="http://www.macromedia.com/go/getflashplayer" FlashVars="text='
        + t_cont + '" /></div>';
      //b.onclick = function () {
      //  chrome.extension.sendRequest({t_cont: t_cont});
      //};
      c = page_d.createElement('span');
      c.style.cssText = 'border-left:4px #fccccc solid;padding-left:4px;padding-right:4px;font-size:11px;';
      c.innerHTML = 'Cited by: <span id="citedBy' + ID[1] + '"></span>';
      if (t(zone)[num].className === 'rprt') {
        t(zone)[num + 3].appendChild(b);
        t(zone)[num + 4].appendChild(c);
      } else { // display with abstract
        t(zone)[num + 1].appendChild(b);
        t(zone)[num + 5].appendChild(c);
      }
      pmids += ',' + ID[1];
      a_proxy('pmid_title', [ID[1], t_title]);
    }
  }
}

function get_Json(pmids) {
  var i, div,
    need_insert = 1,
    url = '/api?flash=yes&a=safari1&pmid=' + pmids,
    loading_span = '<span style="font-weight:normal;font-style:italic"> fetching data from "the Paper Link"</span>&nbsp;&nbsp;<img src="' + loading_gif + '" width="16" height="11" alt="loading" />';
  if (search_term) {
    url += '&w=' + search_term + '&apikey=';
  } else {
    url += '&apikey=';
  }
  for (i = 0; i < t('h2').length; i += 1) {
    if (t('h2')[i].className === 'result_count') {
      old_title = t('h2')[i].innerHTML;
      title_pos = i;
      need_insert = 0;
      t('h2')[i].innerHTML = old_title + loading_span;
    }
  }
  if (need_insert) {
    div = page_d.createElement('h2');
    div.innerHTML = loading_span;
    $('messagearea').appendChild(div);
  }
  onePage_calls += 1;
  a_proxy('url', url);
}

function run() {
  var i, z;
  try {
    search_term = $('search_term').value;
  } catch (err) {
    DEBUG && console.log(err);
  }
  a_proxy('reset_scholar_count', 1);
  for (i = 0; i < t('div').length; i += 1) {
    if (t('div')[i].className === 'rprt' || t('div')[i].className === 'rprt abstract') {
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
  if (pmidArray.length > 0) {
    a_proxy('sendID', pmidArray[0]);
  }
  if (pmids) {
    localStorage.setItem('thePaperLink_ID', pmidArray[0]);
    get_Json(pmids);
  }
}

function load_thepaperlink_api() {
  if (!$('apikey')) {
    setTimeout(load_thepaperlink_api, 500);
    return;
  }
  var apikey = $('apikey').innerHTML,
    cloud_op = $('cloud_op').innerHTML;
  a_proxy('saveAPI', ['', apikey]);
  a_proxy('save_cloud_op', cloud_op);
}

function bigBoss() {
  if ($('_thepaperlink_client_status')) {
    $('_thepaperlink_client_status').innerHTML = '1';
  }
  if ($('_thepaperlink_client_modify_it')) {
    $('_thepaperlink_client_modify_it').innerHTML = 'the browser you are using is good for that';
  }
  if (page_url === 'http://thepaperlink.appspot.com/reg'
    || page_url === 'https://thepaperlink.appspot.com/reg'
    || page_url === 'http://pubget-hrd.appspot.com/reg'
    || page_url === 'https://pubget-hrd.appspot.com/reg'
    || page_url === 'http://www.thepaperlink.com/reg'
    || page_url === 'http://www.thepaperlink.net/reg'
    || page_url === 'http://0.pl4.me/reg') {
    load_thepaperlink_api(); // strange, just like DOMContentLoaded is not working
    return;
  } else if (page_url === 'http://pubmeder.appspot.com/registration'
    || page_url === 'https://pubmeder.appspot.com/registration'
    || page_url === 'http://pubmeder-hrd.appspot.com/registration'
    || page_url === 'https://pubmeder-hrd.appspot.com/registration'
    || page_url === 'http://www.pubmeder.com/registration'
    || page_url === 'http://1.pl4.me/registration') {
    var email = $('currentUser').innerHTML,
      apikey = $('apikey_pubmeder').innerHTML;
    a_proxy('saveAPI', [email, apikey]);
    return;
  } else if (page_url.indexOf('/static/about_us.html') > 0) {
    a_proxy('fill_about_us_page', 1);
    return;
  } else if (page_url.indexOf('://www.thepaperlink.com/oauth') > 0) {
    var content = $('r_content').innerHTML,
      service = $('r_success').innerHTML;
    a_proxy('saveOAuthStatus', [content, service]);
    return;
  } else if (page_url.indexOf('://www.ncbi.nlm.nih.gov/pubmed') === -1
    && page_url.indexOf('://www.ncbi.nlm.nih.gov/sites/entrez?db=pubmed&') === -1
    && page_url.indexOf('://www.ncbi.nlm.nih.gov/sites/entrez') === -1) {
    var ID = parse_id(page_d.body.textContent) || parse_id(page_d.body.innerHTML);
    if (ID !== null && ID[1] !== '999999999') {
      DEBUG && console.log('non-ncbi site, got ID ' + ID[1]);
      a_proxy('sendID', ID[1]);
    }
    return;
  }
  a_proxy('loadExtraJs', 1);
  run();
}
page_d.addEventListener('DOMContentLoaded', bigBoss, false);


function handleContextMenu(event) {
  safari.self.tab.setContextMenuEventUserInfo(event, window.getSelection().toString());
}
page_d.addEventListener('contextmenu', handleContextMenu, false);


function gotMessage(msg) {
  DEBUG && console.log(msg);
  switch (msg.name) {

  case 'wrong':
    alert(msg.message);
    break;

  case 'except':
    if (!search_term) {
      search_term = page_url.split('/pubmed/')[1];
    }
    if (!search_term) {
      search_term = localStorage.getItem('thePaperLink_ID');
    }
    var alert_script = page_d.createElement('script');
    alert_script.type = 'text/javascript';
    alert_script.text = alert_js;
    page_d.body.appendChild(alert_script);
    t('h2')[title_pos].innerHTML = old_title +
      ' <span style="font-size:14px;font-weight:normal;color:red">Error! Try ' +
      '<button onclick="window.location.reload()">reload</button> or ' +
      '<b>Search</b> <a href="http://www.thepaperlink.com/?q=' + search_term +
      '" target="_blank">the Paper Link</a>' +
      '<span style="float:right;cursor:pointer" id="thepaperlink_alert" onclick="alert_dev(\'' +
      msg.message + '\')">&lt;!&gt;</span></span>';
    break;

  case 'paperlink2':
    if (!$('paperlink2_display')) {
      var peaks = page_d.createElement('script');
      peaks.setAttribute('type', 'text/javascript');
      peaks.setAttribute('src', msg.message + '?y=' + (Math.random()));
      page_d.body.appendChild(peaks);
    }
    break;

  case 'js':
    if (window.location.protocol !== 'https:') {
      localStorage.setItem('thePaperLink_pubget_js_key', msg.message[0]);
      localStorage.setItem('thePaperLink_pubget_js_base', msg.message[1]);
      if (!$('__tr_display')) {
        var jsClient = page_d.createElement('script');
        jsClient.setAttribute('type', 'text/javascript');
        jsClient.setAttribute('src', msg.message[1] + 'js?y=' + (Math.random()));
        page_d.body.appendChild(jsClient);
      }
    } else {
      DEBUG && console.log('a secure page, js client will not work');
    }
    break;

  case 'g_scholar':
    try {
      if (msg.message[1] === 1 && msg.message[2] === 1) {
        $('citedBy' + msg.message[0]).innerText = 'trying';
      } else if (msg.message[1] === 0 && msg.message[2] === 0) {
        $('citedBy' + msg.message[0]).innerHTML = '<i>Really? No one cited it yet. Is it a very recent publication?</i>';
        if (page_url.indexOf('://www.ncbi.nlm.nih.gov/') > 0) {
          $('citedBy' + msg.message[0]).parentNode.setAttribute('class', 'thepaperlink_Off');
        }
      } else if (msg.message[1] && msg.message[2]) {
        $('citedBy' + msg.message[0]).innerHTML = '<a target="_blank" href="http://scholar.google.com'
          + uneval_trim(msg.message[2]) + '">' + uneval_trim(msg.message[1])
          + ' times (in Google Scholar)</a>';
      }
    } catch (err) {
      DEBUG && console.log(err);
    }
    break;

  case 'el_link':
    try {
      if (msg.message[1] === 1 && page_url.indexOf('://www.ncbi.nlm.nih.gov/') === -1) {
        $(msg.message[0]).innerText = 'trying';
      } else {
        if (page_url.indexOf('://www.ncbi.nlm.nih.gov/') > 0) {
          $('thepaperlink' + msg.message[0]).innerText = 'pdf file';
          $('thepaperlink' + msg.message[0]).href = uneval_trim(msg.message[1]);
        } else {
          $(msg.message[0]).innerHTML = '&raquo; <a target="_blank" href="'
            + uneval_trim(msg.message[1]) +'">the file link</a>';
        }
      }
    } catch (err) {
      DEBUG && console.log(err);
    }
    break;

  case 'tj':
    var div, div_html, i, j, k, pmid,
      r = msg.message[0],
      tpl = msg.message[1],
      pubmeder = msg.message[2],
      save_key = msg.message[3],
      save_email = msg.message[4],
      cloud_op = msg.message[5],
      p = msg.message[6],
      bookmark_div = '<div id="css_loaded" class="thepaperlink" style="margin-left:10px;font-size:80%;font-weight:normal;cursor:pointer"> ';

    if (r && r.error) {
      t('h2')[title_pos].innerHTML = old_title +
        ' <span style="font-size:14px;font-weight:normal;color:red">"the Paper Link" error ' +
        uneval(r.error) + '</span>';
      break;
    }
    if (!r || !r.count) {
      break;
    }
    if (pubmeder) {
      bookmark_div += '<span id="thepaperlink_saveAll" onclick="saveIt_pubmeder(\'' +
        pmids + '\',\'' + save_key + '\',\'' +
        save_email + '\')">pubmeder&nbsp;all</span></div>';
    } else {
      bookmark_div += 'Wanna save what you are reading? Login<a href="http://www.pubmeder.com/registration" target="_blank">PubMed-er</a></div>';
    }
    if (old_title) {
      t('h2')[title_pos].innerHTML = old_title + bookmark_div;
    } else {
      t('h2')[title_pos].innerHTML = '';
    }
    for (i = 0; i < r.count; i += 1) {
      pmid = uneval_trim(r.item[i].pmid);
      div = page_d.createElement('div');
      div.className = 'thepaperlink';
      div_html = '<a class="thepaperlink-home" href="http://www.thepaperlink.com/?q=pmid:' +
        pmid + '" target="_blank">the Paper Link</a>: ';
      if (r.item[i].slfo && r.item[i].slfo !== '~' && parseFloat(r.item[i].slfo) > 0) {
        div_html += '<span>impact&nbsp;' + uneval_trim(r.item[i].slfo) + '</span>';
      }
      if (r.item[i].pdf) {
        div_html += '<a id="thepaperlink_pdf' + pmid +
          '" class="thepaperlink-green" href="' + p + uneval_trim(r.item[i].pdf) +
          '" target="_blank">direct&nbsp;pdf</a>';
      } else if (r.item[i].pii) {
        a_proxy('pii_link', [pmid, r.item[i].pii]);
        div_html += '<a id="thepaperlink_pdf' + pmid + '" href="#" target="_blank"></a>';
      }
      if (r.item[i].pmcid) {
        div_html += '<a id="thepaperlink_pmc' + pmid +
          '" href="https://www.ncbi.nlm.nih.gov/pmc/articles/' +
          uneval_trim(r.item[i].pmcid) + '/?tool=thepaperlinkClient" target="_blank">open&nbsp;access</a>';
      }
      if (r.item[i].doi) {
        div_html += '<a id="thepaperlink_doi' + pmid +
          '" href="' + p + 'http://dx.doi.org/' + uneval_trim(r.item[i].doi) +
          '" target="_blank">publisher</a>';
      } else if (r.item[i].pii) {
        div_html += '<a id="thepaperlink_doi' + pmid +
          '" href="' + p + 'http://linkinghub.elsevier.com/retrieve/pii/' +
          uneval_trim(r.item[i].pii) + '" target="_blank">publisher</a>';
      }
      if (r.item[i].f_v && r.item[i].fid) {
        div_html += '<a id="thepaperlink_f' + pmid +
          '" class="thepaperlink-red" href="' + p + 'http://f1000.com/' +
          uneval_trim(r.item[i].fid) + '" target="_blank">f1000&nbsp;score&nbsp;' +
          uneval_trim(r.item[i].f_v) + '</a>';
      }
      if (pubmeder || cloud_op) {
        div_html += '<span id="thepaperlink_save' + pmid +
          '" class="thepaperlink-home" onclick="saveIt(\'' + pmid +
          '\',\'' + save_key + '\',\'' + save_email + '\',\'' +
          tpl + '\',\'' + cloud_op + '\')">save&nbsp;it</span>';
      }
      if (tpl) {
        div_html += '<span id="thepaperlink_rpt' + pmid +
          '" class="thepaperlink-home" onclick="show_me_the_money(\'' +
          pmid + '\',\'' + tpl + '\')">&hellip;</span>';
      }
      if (tpl && r.item[i].pdf) {
        div_html += '<span class="thepaperlink_Off" id="thepaperlink_hidden' + pmid + '"></span>';
      }
      div.innerHTML = div_html;
      $(pmid).appendChild(div);

      if ($('thepaperlink_hidden' + pmid)) {
        $('thepaperlink_hidden' + pmid).addEventListener('email_pdf', function () {
          var eventData = this.textContent,
            pmid = this.id.substr(19),
            pdf = $('thepaperlink_pdf' + pmid).href,
            no_email_span = $('thepaperlink_save' + pmid).className;
          if ( (' ' + no_email_span + ' ').indexOf(' no_email ') > -1 ) {
            a_proxy('upload_pdf', [eventData, pdf, pmid, 1]);
          } else {
            a_proxy('upload_pdf', [eventData, pdf, pmid, 0]);
            try {
              $('thepaperlink_D' + pmid).setAttribute('class', 'thepaperlink_Off');
            } catch (err) {
              DEBUG && console.log(err);
            }
          }
        });
      }

      k = pmidArray.length;
      for (j = 0; j < k; j += 1) {
        if (pmid === pmidArray[j]) {
          pmidArray = pmidArray.slice(0, j).concat(pmidArray.slice(j + 1, k));
      } }
    }
    if (pmidArray.length > 0 && onePage_calls < 10) {
      if (pmidArray.length === k) {
        DEBUG && console.log('got nothing, stopped. ' + k);
      } else {
        DEBUG && console.log('call for ' + k + ', not get ' + pmidArray.length);
        t('h2')[title_pos].innerHTML = old_title + bookmark_div + '&nbsp;&nbsp;<img src="' +
          loading_gif + '" width="16" height="11" alt="loading" />';
        onePage_calls += 1;
        a_proxy('url', '/api?a=safari2&pmid=' + pmidArray.join(',') + '&apikey=');
      }
    }
    DEBUG && console.log('onePage_calls: ' + onePage_calls);
    break;

  case 'about_us_page':
    if (!$('client_title') || !$('client_content')) {
      break;
    }
    var apikey = msg.message[0],
      pubmeder_ok = msg.message[1],
      cloud_op = msg.message[2],
      tab_open_if_no_apikey = msg.message[3],
      rev_proxy = msg.message[4],
      ezproxy_prefix = msg.message[5],
      div_html;
    div_html = '<p><em>the Paper Link for PubMed</em><br />' +
      'Start searching in <a href="http://www.ncbi.nlm.nih.gov/pubmed/" target="_blank">http://www.ncbi.nlm.nih.gov/pubmed/' +
      '</a> and enjoy the convenience <a href="http://www.thepaperlink.com" target="_blank">the Paper Link</a> brought to you...</p><ul><li>';
    if (apikey) {
      div_html += 'After search, you can click the icon "&hellip;" shown on the bar for extra function.' +
        'You can update your apikey at ';
    } else {
      div_html += '<i>Want to get more reliable response?</i><br />' +
        '<i>Want to save the articles you read to the cloud?</i><br />' +
        'Activate your account! Visit ';
    }
    div_html += '<a href="http://www.thepaperlink.com/reg" target="_blank">http://www.thepaperlink.com/reg</a></li><li>';
    if (pubmeder_ok) {
      div_html += 'You are ready to save what-you-read to PubMed-er. You can update the status at ';
    } else {
      div_html += '<i>Want to save what-you-read to PubMed-er?</i><br />Connect it at ';
    }
    div_html += '<a href="http://www.pubmeder.com/registration" target="_blank">http://www.pubmeder.com/registration</a></li>';
    if (apikey) {
      div_html += '<li>save&nbsp;it: ';
      if (cloud_op.indexOf('mendeley') > -1) {
        div_html += 'check your existing connection with ';
      } else {
        div_html += 'set up the connection with ';
      }
      div_html += '<a href="http://www.thepaperlink.com/oauth?v=mendeley" target="_blank">Mendeley</a></li><li>save&nbsp;it: ';
      if (cloud_op.indexOf('facebook') > -1) {
        div_html += 'check your existing connection with ';
      } else {
        div_html += 'set up the connection with ';
      }
      div_html += '<a href="http://www.thepaperlink.com/oauth?v=facebook" target="_blank">Facebook</a></li><li>save&nbsp;it: ';
      if (cloud_op.indexOf('dropbox') > -1) {
        div_html += 'check your existing connection with ';
      } else {
        div_html += 'set up the connection with ';
      }
      div_html += '<a href="http://www.thepaperlink.com/oauth?v=dropbox" target="_blank">Dropbox</a></li><li>save&nbsp;it: ';
      if (cloud_op.indexOf('douban') > -1) {
        div_html += 'check your existing connection with ';
      } else {
        div_html += 'set up the connection with ';
      }
      div_html += '<a href="http://www.thepaperlink.com/oauth?v=douban" target="_blank">Douban</a></li>';
    }
    if (!tab_open_if_no_apikey) {
      div_html += '<li>[Pref.] You will not know if your apikey is not correct, really?<br /><button id="check_api">change it</button></li>';
    }
    if (rev_proxy) {
      div_html += '<li>you are using the slow server</li>';
    }
    if (ezproxy_prefix && ezproxy_prefix !== 'http://a.b.c/d?url=') {
      div_html += '<li>your library supports ezproxy? your setting is to use ' +
        ezproxy_prefix + '</li>';
    }
    if ($('firefox_note')) {
      $('firefox_note').innerHTML = '';
    }
    $('client_title').innerHTML = 'Instruction for Safari Extension';
    $('client_content').innerHTML = div_html +
      '<li>More at Safari Preferences <i>(command + ,)</i> Extensions section</li></ul>';

    if ($('check_api')) {
      $('check_api').onclick = function () {
        a_proxy('check_apikey', 1);
        window.location.reload();
      };
    }
    break;
} }
safari.self.addEventListener('message', gotMessage, false);
