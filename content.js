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
  loading_gif = 'http://www.zhaowenxian.com/static/loadingLine.gif',
  doipattern = /(\d{2}\.\d{4}\/[a-zA-Z0-9\.\/\)\(-]+\w)\s*\W?/,
  pmids = '',
  pmidArray = [],
  old_title = '',
  search_term = '',
  search_result_count = '',
  onePage_calls = 0,
  alert_js = 'function alert_dev(apikey) {' +
'  if (apikey && apikey !== "' + safari.extension.settings.GUEST_APIKEY + '") {' +
'   var oXHR = new XMLHttpRequest();' +
'   oXHR.open("POST", "http://www.zhaowenxian.com/?action=alert_dev&pmid=1&apikey=" + apikey, true);' +
'   oXHR.onreadystatechange = function () {' +
'     if (oXHR.readyState === 4) {' +
'       if (oXHR.status === 200) {' +
'         console.log(oXHR.responseText);' +
'       } else {' +
'         console.log("Error", oXHR.statusText);' +
'     } }' +
'   };' +
'   setTimeout(function () { oXHR.abort(); }, 60*1000);' +
'   oXHR.send(null);' +
'  } else {' +
'    alert("You have to be a registered user to be able to alert the developer.");' +
'  }' +
'}';


function ez_format_link(p, url){
  if (!p) return url;
  if (p.substr(0,1) === '.') {
    var i, ss = '', s = url.split('/');
    for (i = 0; i < s.length; i += 1) {
      ss += s[i];
      if (i === 2) {
        ss += p;
      }
      ss += '/';
    }
    return ss;
  } else {
    return (p + url);
  }
}

if (typeof uneval === 'undefined') {
  var uneval = function (a) {
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
  // _port.PostMessage
}

function process_orNSFC() {
  var i, len, ele, doi, prjID, b;
  for (i = 0, len = t('div').length; i < len; i += 1) {
    ele = t('div')[i];
    if (ele.className !== 'col-1')  continue;
    if (ele.textContent === 'DOI') {
      doi = trim( t('div')[i+1].textContent );
      DEBUG && console.log('>>>>>>>>>> DOI on or.nsfc page: ' + doi);
      continue;
    }
    if (ele.textContent === 'Project ID') {
      prjID = trim( t('div')[i+1].textContent );
      DEBUG && console.log('>>>>>>>>>> Project ID from or.nsfc: ' + prjID);
      continue;
    }
    if (doi && prjID)  break;
  }
  if (doi && doipattern.test(doi)) {
    a_proxy('from_orNSFC', [doi, prjID]);
    b = page_d.createElement('div');
    b.innerHTML = '<div id="thepaperlink_bar" style="position:relative;top:-552px;float:right;z-index:999;font-size:90%;"></div>';
    $('item-right').appendChild(b);
  }
}

function process_dxy() {
  var i, len, ele,
      pmid = $('pmid').value;
  if (pmid && pmid === '' + parseInt(pmid, 10)) {
    a_proxy('from_dxy', pmid);
  }
  for (i = 0, len = t('div').length; i < len; i += 1) {
    ele = t('div')[i];
    if (ele.className === 'setting') {
      ele.setAttribute('id', 'thepaperlink_bar');
      break;
    }
  }
}

function process_f1000() {
  var i, len, pmid = '',
      f_v = 0,
      fid = parseInt(page_url.split('://f1000.com/prime/')[1], 10);
  for (i = 0; i < t('meta').length; i += 1) {
    if (t('meta')[i].getAttribute('name') === 'citation_pmid') {
      pmid = t('meta')[i].getAttribute('content');
    }
  }
  for (i = 0, len = t('div').length; i < len; i += 1) {
    if (t('div')[i].className === 'articleFactor' && t('div')[i-1].id === 'article') {
      f_v = parseInt(t('div')[i].textContent, 10);
      // t('div')[i+3].setAttribute('id', '_thepaperlink_div'); // hidden tootip
    }
  }
  if (pmid && f_v && fid) { // require valid f1000.com login
    a_proxy('from_f1000', [pmid, fid, f_v]);
  } else {
    DEBUG && console.log('>> process_f1000: ' +
        pmid + ',' + fid + ',' + f_v);
  }
}

function order_gs() {
  var i, len, tobe = [], nodes = [],
      lists = $('_thepaperlink_order_lists').textContent.split(';');
  if ($('_thepaperlink_order_status').textContent === '0') {
    if (lists[1] === lists[0]) {
      tobe = lists[2].split(',');
      $('_thepaperlink_order_status').textContent = '2';
    } else {
      tobe = lists[1].split(',');
      $('_thepaperlink_order_status').textContent = '1';
    }
  } else if ($('_thepaperlink_order_status').textContent === '1') {
    tobe = lists[2].split(',');
    $('_thepaperlink_order_status').textContent = '2';
  } else {
    tobe = lists[0].split(',');
    $('_thepaperlink_order_status').textContent = '0';
  }
  $('gs_ccl').style.display = 'none';
  for (i = 0, len = tobe.length; i < len; i += 1) {
    nodes.push( $('_thepaperlink_' + tobe[i]) );
    $('gs_ccl').removeChild( $('_thepaperlink_' + tobe[i]) );
  }
  for (i = 0, len = nodes.length; i < len; i += 1) {
    $('gs_ccl').insertBefore(nodes[i], $('_thepaperlink_pos0'));
  }
  nodes = null;
  $('gs_ccl').style.display = 'block';
}

function process_googlescholar() {
  var i, ilen, j, jlen, tmp, nodes = $('gs_ccl').childNodes, a, b, c, d = [];
  for (i = 0, ilen = nodes.length; i < ilen; i += 1) {
    if (nodes[i].className === 'gs_alrt_btm') {
      nodes[i].setAttribute('id', '_thepaperlink_pos0');
      continue;
    }
    a = nodes[i].lastChild;
    if (!a) { continue; }
    for (j = 0, jlen = a.childNodes.length; j < jlen; j += 1) {
      if (a.childNodes[j].className === 'gs_fl') {
        b = a.childNodes[j].textContent; // class: gs_r -> gs_ri -> gs_fl
        if (b.substr(0, 9) === 'Cited by ') {
          c = parseInt(b.substr(9,7), 10);
          nodes[i].setAttribute('id', '_thepaperlink_' + c);
          d.push(c);
        }
        break;
      }
    }
  }
  if (d.length > 0) {
    tmp = page_d.createElement('div');
    tmp.setAttribute('style', 'float:right;cursor:pointer');
    tmp.innerHTML = '&nbsp;&nbsp;<span id="_thepaperlink_order_gs">[order the results, v' +
        '<span id="_thepaperlink_order_status">0</span>]</span>' +
        '<span id="_thepaperlink_order_lists" style="display:none">' +
        d.join(',') + ';' +
        d.sort(function(u,v){return v-u;}).join(',') + ';' +
        d.sort(function(u,v){return u-v;}).join(',') + '</span>';
    $('gs_ab_md').appendChild(tmp);
    $('_thepaperlink_order_gs').onclick = function () { order_gs(); };
  }
}

function parse_id(a) { // pubmeder code
  var regpmid = /pmid\s*:?\s*(\d+)\s*/i, 
    regdoi = /doi\s*:?\s*/i,
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
    ID, b, c, t_cont, t_strings, t_title, t_i,
    swf_file = 'http://www.zhaowenxian.com/static/clippy.swf'; // support or not in safari
  DEBUG && console.log(a);
  if (regpmid.test(a)) {
    ID = regpmid.exec(a);
    if (ID[1]) {
      if (t(zone)[num + 1].className.indexOf('rprtnum') > -1) {
        t(zone)[num + 2].setAttribute('id', ID[1]);
      } else { // abstract page
        t(zone)[num - 3].setAttribute('id', ID[1]);
      }
      if (t(zone)[num].className === 'rprt') {
        t_strings = t(zone)[num + 2].textContent.split('Related citations')[0].split('.');
        t_title = trim( t_strings[0] );
        t_cont = t_title +
          '.\r\n' + trim( t_strings[1].replace(/\d\./g, '.').replace(/\d,/g, ',') ) +
          '.\r\n' + trim( t_strings[2] ) + '. ';
        if ( t_strings[3].indexOf(';') > 0 ) {
          t_cont += trim( t_strings[3] ).replace(';', '; ') + '.';
        } else {
          for (t_i = 3; t_i < t_strings.length; t_i += 1) {
            if ( t_strings[t_i].indexOf('[Epub ahead') > -1 ) {
              break;
            }
            t_cont += trim( t_strings[t_i] ) + '.';
            if ( t_strings[t_i+1] && (
                    t_strings[t_i+1].substr(1,3) === 'pii' || t_strings[t_i+1].substr(1,3) === 'doi'
                ) ) {
              t_cont += ' ';
            }
          }
        }
      } else{ // abstract page
        t_strings = t(zone)[num+1].textContent.split('.');
        t_title = trim( t('h1')[1].textContent );
        t_cont = t_title +
            '\r\n' + trim( t(zone)[num+2].textContent.replace(/\d\./g, '.').replace(/\d,/g, ',') ) +
            '\r\n' + trim( t_strings[0] ) + '. ';
        if ( t_strings[1].indexOf(';') > 0 ) {
          t_cont += trim( t_strings[1] ).replace(';', '; ') + '.';
        } else {
          for (t_i = 1; t_i < t_strings.length; t_i += 1) {
            if ( t_strings[t_i].indexOf('Epub ') > -1 ) {
              break;
            }
            t_cont += trim( t_strings[t_i] ) + '.';
            if ( t_strings[t_i+1] && (
                    t_strings[t_i+1].substr(1,3) === 'pii' || t_strings[t_i+1].substr(1,3) === 'doi'
                ) ) {
              t_cont += ' ';
            }
          }
        }
      }
      t_cont += ' [PMID:' + ID[1] + ']\r\n';
      DEBUG && console.log(t_cont);
      b = page_d.createElement('div');
      b.innerHTML = '<div style="float:right;z-index:1;cursor:pointer">' +
          '<img class="pl4_clippy" title="copy to clipboard" src="' + clippy_file +
          '" alt="copy" width="14" height="14" />&nbsp;&nbsp;</div>';
      b.onclick = function () {
        a_proxy('t_cont', t_cont);
      };
      if (t(zone)[num].className === 'rprt') {
        t(zone)[num + 3].appendChild(b);
      } else { // display with abstract
        t(zone)[num + 1].appendChild(b);
      }
      pmids += ',' + ID[1];
      if (a.indexOf('- in process') < 0) {
        c = page_d.createElement('span');
        c.setAttribute('style', 'border-left:6px #fccccc solid;padding-left:6px;font-size:11px');
        c.innerHTML = 'Cited by: <span id="citedBy' + ID[1] + '">...</span>';
        if (t(zone)[num].className === 'rprt') {
          t(zone)[num + 4].appendChild(c);
        } else { // display with abstract
          t(zone)[num + 5].appendChild(c);
        }
        a_proxy('pmid_title', [ID[1], t_title]);
      }
    }
  }
}

function get_Json(pmids) {
  var i, len, ele,
    need_insert = 1,
    url = '/api?flash=yes&a=safari1&pmid=' + pmids,
    loading_span = '<span style="font-weight:normal;font-style:italic"> fetching data from "the Paper Link"</span>&nbsp;&nbsp;<img src="' + loading_gif + '" width="16" height="11" alt="loading" />';
  if (search_term) {
    url += '&w=' + search_term + '&apikey=';
  } else {
    url += '&apikey=';
  }
  for (i = 0, len = t('h2').length; i < len; i += 1) {
    ele = t('h2')[i];
    if (ele.className === 'result_count') {
      need_insert = 0;
      ele.setAttribute('id', 'pl4_title');
      old_title = ele.innerHTML;
      search_result_count = ele.textContent;
      if (search_result_count.indexOf(' of ') > 0) {
        search_result_count = parseInt(search_result_count.split(' of ')[1], 10);
      } else if (search_result_count.indexOf('Results: ') > -1) {
        search_result_count = parseInt(search_result_count.substr(9, search_result_count.length), 10);
      } else {
        search_result_count = 0;
      }
      a_proxy({search_term: search_term, search_result_count: search_result_count});
      ele.innerHTML = old_title + loading_span;
    }
  }
  if (need_insert) {
    ele = page_d.createElement('h2');
    ele.innerHTML = loading_span;
    ele.setAttribute('id', 'pl4_title');
    $('messagearea').appendChild(ele);
  }
  onePage_calls += 1;
  a_proxy('url', url);
}

function run() {
  var i, len, z;
  try {
    search_term = $('term').value; // 2013-3-26
  } catch (err) {
    DEBUG && console.log(err);
  }
  a_proxy('reset_counts', 1);
  for (i = 0, len = t('div').length; i < len; i += 1) {
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

function load_thepaperlink_api() { // safari specific
  if (!$('apikey')) {
    setTimeout(load_thepaperlink_api, 500);
    return;
  }
  a_proxy('saveAPI', ['', $('apikey').innerHTML]);
  a_proxy('save_cloud_op', $('cloud_op').innerHTML);
}

function bigBoss() {
  if ($('_thepaperlink_client_status')) {
    $('_thepaperlink_client_status').innerHTML = '1';
  }
  if ($('_thepaperlink_client_modify_it')) {
    $('_thepaperlink_client_modify_it').innerHTML = 'the browser you are using is good for that';
  }
  if (page_url === 'http://www.thepaperlink.com/reg'
      || page_url === 'http://www.thepaperlink.com/settings'
      || page_url === 'http://www.zhaowenxian.com/settings'
      || page_url === 'http://www.zhaowenxian.com/reg') { // storage data for access the api server
    load_thepaperlink_api(); // strange, just like DOMContentLoaded is not working
    return;
  } else if (page_url === 'http://www.pubmeder.com/registration'
      || page_url === 'http://pubmeder-hrd.appspot.com/registration'
      || page_url === 'https://pubmeder-hrd.appspot.com/registration'
      || page_url === 'http://1.zhaowenxian.com/registration') { // storage data for access the bookmark server
    a_proxy('saveAPI', [ $('currentUser').innerHTML,
                         $('apikey_pubmeder').innerHTML ]);
    return;
  } else if (page_url.indexOf('/static/about_us.html') > 0) { // safari or fx
    a_proxy('fill_about_us_page', 1);
    return;
  } else if (page_url.indexOf('://www.thepaperlink.com/oauth') > 0) {
    var content = $('r_content').innerHTML,
      service = $('r_success').innerHTML;
    a_proxy('saveOAuthStatus', [content, service]);
    return;
  } else if (page_url.indexOf('://f1000.com/prime/') > 0) {
    process_f1000();
    return;
  } else if (page_url.indexOf('://scholar.google.com/scholar?') > 0) {
    process_googlescholar();
    return;
  } else if (page_url.indexOf('://pubmed.cn/') > 0) {
    process_dxy();
    return;
  } else if (page_url.indexOf('://or.nsfc.gov.cn/') > 0) {
    process_orNSFC();
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

  case 'paperlink2':
    if (!$('paperlink2_display')) {
      var peaks = page_d.createElement('script');
      peaks.setAttribute('type', 'text/javascript');
      peaks.setAttribute('src', msg.message + '?y=' + (Math.random()));
      page_d.body.appendChild(peaks);
    }
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
    // alert_dev, is different from chrome
    $('pl4_title').innerHTML = old_title +
      ' <span style="font-size:12px;font-weight:normal;color:red;background-color:yellow">' +
      'Error!&nbsp;&nbsp;' + msg.message[0] +
      '&nbsp;<a href="http://www.zhaowenxian.com/?q=' + search_term +
      '" target="_blank">[?]</a></span>';
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

  case 'el_data':
    try {
      if (msg.message[1] && msg.message[1].indexOf('://') > -1) {
        if (page_url.indexOf('://www.ncbi.nlm.nih.gov/') > 0) {
          var e = $('thepaperlink' + msg.message[0]);
          if (msg.message[1] === '://') {
            e.parentNode.removeChild(e);
          } else {
            if (msg.message[0].indexOf('_scihub') > -1) {
              e.innerText = 'sci-hub';
            } else {
              e.innerText = 'pdf file';
            }
            e.href = uneval_trim(msg.message[1]);
          }
        } else {
          $(msg.message[0]).innerHTML = '&raquo; <a target="_blank" href="'
            + uneval_trim(msg.message[1]) +'">the file link</a>';
        }
      } else if (msg.message[1] === 1 && page_url.indexOf('://www.ncbi.nlm.nih.gov/') === -1) {
        $(msg.message[0]).innerText = 'trying';
      } else {
        $(msg.message[0]).innerText = msg.message[1];
      }
    } catch (err) {
      DEBUG && console.log(err);
    }
    break;

  case 'search_trend':
    var hook = $('myncbiusername').textContent;
    $('myncbiusername').innerHTML = '<span style="color:yellow">' + msg.message[0] +
        '</span>&nbsp;&nbsp;&nbsp;&nbsp;' + hook;
    $('myncbiusername').style.display = 'inline';
    //sendResponse({});
    break;

  case 'tj':
    var div, div_html, tmp, i, j, k, pmid, s2,
      r = msg.message[0],
      tpl = msg.message[1],
      pubmeder = msg.message[2],
      save_key = msg.message[3],
      save_email = msg.message[4],
      cloud_op = msg.message[5],
      p = msg.message[6],
      bookmark_div = '<div id="css_loaded" class="thepaperlink" style="margin-left:10px;font-size:80%;font-weight:normal;cursor:pointer"> ';
      // content.css

    if (r && r.error) {
      $('pl4_title').innerHTML = old_title +
        ' <span style="font-size:14px;font-weight:normal;color:red">"the Paper Link" error ' +
        uneval(r.error) + '</span>';
      break;
    }

    if (r.to_other_sites) { // dxy, f1000
      // content.css
      div = page_d.createElement('div');
      div.className = 'thepaperlink';
      div_html = '<a class="thepaperlink-home" href="' + r.uri + '/?q=pmid:' +
          r.pmid + '" target="_blank">the paper link</a>';
      div_html += r.extra;
      div.innerHTML = div_html;
      $(r.to_other_sites).appendChild(div);
      break;
    }

    if (!r || !r.count) {
      DEBUG && console.log('tj with nothing, oops - should never happen');
      break;
    }

    // if (!$('css_loaded')) // content.css

    if (pubmeder) {
      bookmark_div += '<span id="thepaperlink_saveAll" onclick="saveIt_pubmeder(\'' +
        pmids + '\',\'' + save_key + '\',\'' +
        save_email + '\')">pubmeder&nbsp;all</span></div>';
    } else {
      bookmark_div += 'save what you are reading? try <a href="http://www.pubmeder.com/registration" target="_blank">PubMed-er</a></div>';
    }
    if (old_title) {
      $('pl4_title').innerHTML = old_title + bookmark_div;
    } else {
      $('pl4_title').innerHTML = '';
    }
    for (i = 0; i < r.count; i += 1) {
      pmid = uneval_trim(r.item[i].pmid);
      k = pmidArray.length;
      for (j = 0; j < k; j += 1) {
        if (pmid === pmidArray[j]) {
          pmidArray = pmidArray.slice(0, j).concat(pmidArray.slice(j + 1, k));
      } }
      if ( $('pl4me_' + pmid) ) {
        continue;
      }
      div = page_d.createElement('div');
      div.className = 'thepaperlink';
      div_html = '<a class="thepaperlink-home" id="pl4me_' + pmid +
        '" href="h' + r.uri + '/?q=pmid:' +
        pmid + '" target="_blank">the Paper Link</a>: ';
      if (r.item[i].slfo && r.item[i].slfo !== '~' && parseFloat(r.item[i].slfo) > 0) {
        tmp = '<span>impact&nbsp;' + uneval_trim(r.item[i].slfo) + '</span>';
        div_html += tmp;
      }
      if (r.item[i].pdf) {
        tmp = '<a id="thepaperlink_pdf' + pmid +
          '" class="thepaperlink-green" href="' +
          ez_format_link(p, uneval_trim(r.item[i].pdf)) +
          '" target="_blank">direct&nbsp;pdf</a>';
        div_html += tmp;
      } else if (r.item[i].pii) {
        a_proxy('pii_link', [pmid, r.item[i].pii]);
        tmp = '<a id="thepaperlink_pdf' + pmid + '" href="#" target="_blank"></a>';
        div_html += tmp;
      }
      if (r.item[i].pmcid) {
        tmp = '<a id="thepaperlink_pmc' + pmid +
          '" href="https://www.ncbi.nlm.nih.gov/pmc/articles/' +
          uneval_trim(r.item[i].pmcid) + '/?tool=thepaperlink_safari" target="_blank">open&nbsp;access</a>';
        div_html += tmp;
      }
      if (r.item[i].doi) {
        a_proxy('doi_link', [pmid, r.item[i].doi]);
        tmp = '<a id="thepaperlink_doi' + pmid +
          '" href="' + ez_format_link(p,
              'http://dx.doi.org/' + uneval_trim(r.item[i].doi)
          ) + '" target="_blank">publisher</a><a id="thepaperlink_scihub' + pmid +
            '" href="http://dx.doi.org.sci-hub.org/' + uneval_trim(r.item[i].doi) +
            '" target="_blank">&#x219d;</a>';
        div_html += tmp;
      } else if (r.item[i].pii) {
        tmp = '<a id="thepaperlink_pii' + pmid +
          '" href="' + ez_format_link(p,
              'http://linkinghub.elsevier.com/retrieve/pii/' + uneval_trim(r.item[i].pii)
          ) + '" target="_blank">publisher</a><a id="thepaperlink_scihub' + pmid +
            '" href="http://linkinghub.elsevier.com.sci-hub.org/retrieve/pii/' + uneval_trim(r.item[i].pii) +
            '" target="_blank">&#x219d;</a>';
        div_html += tmp;
      }
      if (r.item[i].pii && $('citedBy' + pmid)) { // insert_span
        s2 = page_d.createElement('span');
        s2.innerHTML = '; <span id="pl4_scopus' + pmid + '"></span> <a href="' +
          p + 'http://linkinghub.elsevier.com/retrieve/pii/' +
          uneval_trim(r.item[i].pii) + '" target="_blank">(in Scopus)</a>';
        $('citedBy' + pmid).parentNode.appendChild(s2);
      }
      if (r.item[i].f_v && r.item[i].fid) {
        tmp = '<a id="thepaperlink_f' + pmid +
          '" class="thepaperlink-red" href="' +
          ez_format_link(p,
              'http://f1000.com/' + uneval_trim(r.item[i].fid)
          ) + '" target="_blank">f1000&nbsp;star&nbsp;' +
          uneval_trim(r.item[i].f_v) + '</a>';
        div_html += tmp;
      }
      if (pubmeder || cloud_op) {
        tmp = '<span id="thepaperlink_save' + pmid +
          '" class="thepaperlink-home" onclick="saveIt(\'' + pmid +
          '\',\'' + save_key + '\',\'' + save_email + '\',\'' +
          tpl + '\',\'' + cloud_op + '\')">save&nbsp;it</span>';
        div_html += tmp;
      }
      if (tpl) {
        tmp = '<span id="thepaperlink_rpt' + pmid +
          '" class="thepaperlink-home" onclick="show_me_the_money(\'' +
          pmid + '\',\'' + tpl + '\')">&hellip;</span>';
        div_html += tmp;
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
    }
    if (pmidArray.length > 0 && onePage_calls < 10) {
      if (pmidArray.length === k) {
        DEBUG && console.log('got nothing, stopped. ' + k);
      } else {
        DEBUG && console.log('call for ' + k + ', not get ' + pmidArray.length);
        $('pl4_title').innerHTML = old_title + bookmark_div + '&nbsp;&nbsp;<img src="' +
          loading_gif + '" width="16" height="11" alt="loading" />';
        onePage_calls += 1;
        a_proxy('url', '/api?a=safari2&pmid=' + pmidArray.join(',') + '&apikey=');
      }
    }
    DEBUG && console.log('onePage_calls: ' + onePage_calls);
    break;

  case 'about_us_page': // safari or fx
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