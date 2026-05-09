/* Shared nav, footer actions, privacy modal for article subsites (paths via body[data-site-root]). */
(function () {
  'use strict';

  var APP_STORE_LIVE = true;
  var APP_STORE_URL =
    'https://apps.apple.com/app/%E6%97%B6%E7%BA%BF%E6%97%A5%E8%AE%B0/id6760802186';

  var PRIVACY = {
    zh: {
      title: '隐私政策',
      upd: '最后更新：2026 年 3 月',
      body:
        '<h2>1. 概述</h2>\n<p>时线日记（Snapline Diary）高度重视用户隐私，采用<strong>本地优先</strong>的数据策略。你的所有日记内容、图片及记忆曲线数据均默认存储在你的设备本地，不会被自动上传至任何服务器。</p>\n<div class="priv-hl">📍 <strong>核心原则：</strong>你的个人记录内容（日记文字、图片、标签）始终存储在你的设备上，开发者无法访问这些内容。</div>\n<h2>2. 我们不收集的信息</h2>\n<p>本应用<strong>不主动收集</strong>任何可识别个人身份的信息，包括：姓名、邮箱、电话号码、精确位置信息、联系人等。以下数据仅存储于设备本地：你创建的时间线节点（文字、图片、标签）、记忆曲线复习计划与进度、应用设置。</p>\n<h2>3. 广告服务（Google AdMob）</h2>\n<p>免费版本中，本应用使用 <strong>Google AdMob</strong> 提供广告服务。AdMob 可能收集设备广告标识符（IDFA）、设备类型、操作系统版本、应用使用数据及基于 IP 的大致地理位置。根据苹果 ATT 政策，应用首次运行时会请求跟踪授权，你可选择拒绝。<strong>Pro 版本</strong>完全去除广告。Google 隐私政策：<a href="https://policies.google.com/privacy" target="_blank" rel="noopener">policies.google.com/privacy</a></p>\n<h2>4. 内购与支付</h2>\n<p>Pro 版本升级完全通过 <strong>Apple App Store</strong> 处理，本应用不接触任何支付信息。</p>\n<h2>5. 通知与相册权限</h2>\n<p>记忆曲线复习提醒需要通知权限；添加图片需要访问相册权限（仅在你主动选择图片时使用，不会后台扫描）。两者均可在设备设置中随时关闭。</p>\n<h2>6. 备份数据（Pro）</h2>\n<p>备份文件存储在你指定的位置，由你完全掌控，应用不会将备份内容上传至任何云端服务。</p>\n<h2>7. 联系我们</h2>\n<p>如有隐私相关问题，请通过邮件<a href="mailto:neonyanbb@foxmail.com">联系我们</a>。</p>',
    },
    en: {
      title: 'Privacy Policy',
      upd: 'Last updated: March 2026',
      body:
        '<h2>1. Overview</h2>\n<p>Snapline Diary is built with a <strong>local-first</strong> philosophy. All your diary content, photos, tags, and memory curve data are stored on your device by default and are never automatically uploaded to any server.</p>\n<div class="priv-hl">📍 <strong>Core principle:</strong> Your personal records (diary text, images, tags) always stay on your device. We cannot access this content.</div>\n<h2>2. Information We Do Not Collect</h2>\n<p>The app does <strong>not</strong> collect any personally identifiable information such as name, email, phone number, precise location, or contacts. Timeline entries, memory curve plans/progress, and app settings are stored locally on your device only.</p>\n<h2>3. Advertising — Google AdMob</h2>\n<p>The <strong>free version</strong> uses Google AdMob (by Google LLC) to display ads. AdMob may collect: device advertising identifier (IDFA), device type, OS version, app usage data, and approximate location from IP. Per Apple\'s ATT framework, the app requests tracking permission on first launch — you may decline. The <strong>Pro version</strong> removes all ads and AdMob makes no data requests. Google Privacy Policy: <a href="https://policies.google.com/privacy" target="_blank" rel="noopener">policies.google.com/privacy</a></p>\n<h2>4. Purchases</h2>\n<p>Pro purchases are processed entirely by <strong>Apple App Store</strong>. We do not handle or store any payment information.</p>\n<h2>5. Notifications & Photo Library</h2>\n<p>Memory curve reminders require notification permission. Adding images requires photo library access (only when you explicitly select photos — no background scanning). Both can be revoked in iOS Settings at any time.</p>\n<h2>6. Backup (Pro)</h2>\n<p>Backup files are stored where you choose (e.g., Files app). The app does not upload backups to any cloud service.</p>\n<h2>7. Contact</h2>\n<p>For privacy questions, please <a href="mailto:neonyanbb@foxmail.com">contact us by email</a>.</p>',
    },
    es: {
      title: 'Política de privacidad',
      upd: 'Actualizado: marzo 2026',
      body:
        "<h2>1. Resumen</h2><p>Diario Cronología almacena todos tus datos localmente con filosofía <strong>local-first</strong>. No subimos tu contenido personal a ningún servidor.</p><div class=\"priv-hl\">📍 Tus registros personales siempre permanecen en tu dispositivo.</div><h2>2. Publicidad (Google AdMob)</h2><p>La versión gratuita usa <strong>Google AdMob</strong>. AdMob puede recopilar el IDFA, tipo de dispositivo, versión del SO y datos de uso. La versión Pro elimina todos los anuncios. Política de Google: <a href=\"https://policies.google.com/privacy\" target=\"_blank\" rel=\"noopener\">policies.google.com/privacy</a></p><h2>3. Compras</h2><p>Las compras se procesan a través de Apple App Store. No manejamos datos de pago.</p><h2>4. Contacto</h2><p>Para consultas de privacidad, <a href=\"mailto:neonyanbb@foxmail.com\">contáctanos</a>.</p>",
    },
    fr: {
      title: 'Politique de confidentialité',
      upd: 'Mis à jour: mars 2026',
      body:
        "<h2>1. Résumé</h2><p>Journal Chronologie adopte une philosophie <strong>local-first</strong>. Vos données ne sont jamais téléchargées automatiquement.</p><div class=\"priv-hl\">📍 Vos enregistrements restent toujours sur votre appareil.</div><h2>2. Publicité (Google AdMob)</h2><p>La version gratuite utilise <strong>Google AdMob</strong>. AdMob peut collecter l'IDFA, le type d'appareil, la version du système et les données d'utilisation. La version Pro supprime entièrement les publicités. Politique de Google: <a href=\"https://policies.google.com/privacy\" target=\"_blank\" rel=\"noopener\">policies.google.com/privacy</a></p><h2>3. Achats</h2><p>Les achats sont traités via l'App Store d'Apple. Nous ne gérons aucune donnée de paiement.</p><h2>4. Contact</h2><p>Pour les questions de confidentialité, <a href=\"mailto:neonyanbb@foxmail.com\">contactez-nous</a>.</p>",
    },
    ru: {
      title: 'Политика конфиденциальности',
      upd: 'Обновлено: март 2026',
      body:
        '<h2>1. Обзор</h2><p>Таймлайн Дневник придерживается принципа <strong>local-first</strong>. Данные хранятся локально и никогда не передаются на сервер автоматически.</p><div class="priv-hl">📍 Ваши личные записи всегда остаются на вашем устройстве.</div><h2>2. Реклама (Google AdMob)</h2><p>Бесплатная версия использует <strong>Google AdMob</strong>. AdMob может собирать IDFA, тип устройства, версию ОС и данные использования. Версия Pro полностью убирает рекламу. Политика Google: <a href="https://policies.google.com/privacy" target="_blank" rel="noopener">policies.google.com/privacy</a></p><h2>3. Покупки</h2><p>Покупки обрабатываются через App Store Apple. Мы не обрабатываем платёжные данные.</p><h2>4. Контакты</h2><p>По вопросам конфиденциальности <a href="mailto:neonyanbb@foxmail.com">напишите нам</a>.</p>',
    },
  };

  function siteRoot() {
    return (document.body && document.body.getAttribute('data-site-root')) || '.';
  }

  function siteIndexHref() {
    var r = siteRoot().replace(/\/+$/, '');
    return r + '/index.html';
  }

  function chromeLang() {
    try {
      var v = localStorage.getItem('snapline-diary-lang');
      if (v && /^(zh|en|es|fr|ru)$/.test(v)) return v;
    } catch (_) {}
    return 'zh';
  }

  var _soonTimer;
  function showSoonToast() {
    var el = document.getElementById('soon-toast');
    if (!el) return;
    var msg =
      typeof window.getSnaplineStr === 'function'
        ? window.getSnaplineStr('toast_coming')
        : '应用尚在 App Store 审核中，通过后将开放下载，感谢关注。';
    el.textContent = msg;
    el.classList.add('show');
    clearTimeout(_soonTimer);
    _soonTimer = setTimeout(function () {
      el.classList.remove('show');
    }, 4200);
  }

  function closeNav() {
    var nav = document.getElementById('site-main-nav');
    var btn = document.getElementById('site-nav-toggle');
    if (nav) nav.classList.remove('menu-open');
    document.body.classList.remove('site-nav-no-scroll');
    if (btn) {
      btn.setAttribute('aria-expanded', 'false');
      if (typeof window.getSnaplineStr === 'function')
        btn.setAttribute('aria-label', window.getSnaplineStr('nav_toggle_open'));
    }
  }

  function toggleNav() {
    var nav = document.getElementById('site-main-nav');
    var btn = document.getElementById('site-nav-toggle');
    if (!nav) return;
    var open = !nav.classList.contains('menu-open');
    nav.classList.toggle('menu-open', open);
    document.body.classList.toggle('site-nav-no-scroll', open);
    if (btn) {
      btn.setAttribute('aria-expanded', open ? 'true' : 'false');
      if (typeof window.getSnaplineStr === 'function') {
        btn.setAttribute(
          'aria-label',
          open ? window.getSnaplineStr('nav_toggle_close') : window.getSnaplineStr('nav_toggle_open')
        );
      }
    }
  }

  function goToSection(id) {
    closeNav();
    window.location.href = siteIndexHref() + '#' + id;
  }

  function openDownload() {
    closeNav();
    if (!APP_STORE_LIVE) {
      showSoonToast();
      return;
    }
    window.open(APP_STORE_URL, '_blank', 'noopener,noreferrer');
  }

  function showPrivacy() {
    closeNav();
    var lang = chromeLang();
    var p = PRIVACY[lang] || PRIVACY.zh;
    var body = document.getElementById('priv-body');
    if (!body) return;
    body.innerHTML =
      '<h1 id="priv-title-h">' +
      p.title +
      '</h1><p class="upd">' +
      p.upd +
      '</p>' +
      p.body;
    var pg = document.getElementById('priv-pg');
    if (!pg) return;
    pg.style.display = 'flex';
    pg.setAttribute('aria-hidden', 'false');
    document.body.style.overflow = 'hidden';
    clearTimeout(pg._privClose);
    requestAnimationFrame(function () {
      requestAnimationFrame(function () {
        pg.classList.add('show');
      });
    });
  }

  function closePg() {
    var pg = document.getElementById('priv-pg');
    if (!pg || !pg.classList.contains('show')) return;
    pg.classList.remove('show');
    pg.setAttribute('aria-hidden', 'true');
    clearTimeout(pg._privClose);
    pg._privClose = setTimeout(function () {
      pg.style.display = 'none';
      document.body.style.overflow = '';
    }, 480);
  }

  function refreshNavToggleAria() {
    var btn = document.getElementById('site-nav-toggle');
    var nav = document.getElementById('site-main-nav');
    if (!btn || typeof window.getSnaplineStr !== 'function') return;
    var open = nav && nav.classList.contains('menu-open');
    btn.setAttribute(
      'aria-label',
      open ? window.getSnaplineStr('nav_toggle_close') : window.getSnaplineStr('nav_toggle_open')
    );
  }

  function initChrome() {
    document.body.classList.toggle('app-soon', !APP_STORE_LIVE);

    var nav = document.getElementById('site-main-nav');
    if (nav) {
      window.addEventListener('scroll', function () {
        nav.classList.toggle('scrolled', window.scrollY > 40);
      });
    }
    window.addEventListener('resize', function () {
      if (window.innerWidth > 900) closeNav();
    });
    document.addEventListener('keydown', function (e) {
      if (e.key !== 'Escape') return;
      var pg = document.getElementById('priv-pg');
      if (pg && pg.classList.contains('show')) {
        closePg();
        return;
      }
      closeNav();
    });
    var links = document.getElementById('site-nav-links');
    if (links) {
      links.addEventListener('click', function (e) {
        if (e.target === e.currentTarget) closeNav();
      });
    }
    refreshNavToggleAria();
  }

  window.siteChromeGoTo = goToSection;
  window.siteChromeOpenDownload = openDownload;
  window.siteChromeToggleNav = toggleNav;
  window.siteChromeCloseNav = closeNav;
  window.siteChromeShowPrivacy = showPrivacy;
  window.siteChromeClosePrivacy = closePg;
  window.refreshSiteChromeI18n = refreshNavToggleAria;

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initChrome);
  } else {
    initChrome();
  }
})();
