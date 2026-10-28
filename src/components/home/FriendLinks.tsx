'use client';

import Image from 'next/image';
import { useState } from 'react';
import { useLocaleStore } from '@/lib/stores/localeStore';

const friends = [
  {
    name: 'MellowBlog',
    description: { zh: '你好，这里是MellowBlog', en: 'Hello, this is MellowBlog' },
    icon: '/friends/mellowblog.jpg',
    url: 'https://mellowwinds.com/',
  },
  {
    name: 'Kai',
    description: { zh: '', en: '' },
    icon: '/friends/kai.png',
    url: 'https://kai.moi/',
  },
];

export default function FriendLinks() {
  const zh = useLocaleStore((state) => state.locale) === 'zh';
  const [copyStatus,setCopyStatus] = useState<'idle'|'copied'|'manual'>('idle');
  const [showInfo,setShowInfo] = useState(false);
  const siteInfo = JSON.stringify({
    name: 'Lufei',
    description: zh ? 'Lufei 的个人主页' : "Lufei's personal homepage",
    icon: 'https://lufei-lee.github.io/profile-cosmo-cat.png',
    url: 'https://lufei-lee.github.io/',
  }, null, 2);
  async function copyInfo() {
    try { await navigator.clipboard.writeText(siteInfo); setCopyStatus('copied'); }
    catch { setShowInfo(true); setCopyStatus('manual'); }
  }

  return (
    <section id="friends" className="scroll-mt-28" aria-labelledby="friends-title">
      <h2 id="friends-title" className="section-title">{zh ? '友情链接' : 'Friends'}</h2>
      <div className="mt-6 grid gap-4 sm:grid-cols-2">
        {friends.map((friend) => {
          const description = zh ? friend.description.zh : friend.description.en;
          return (
            <a key={friend.url} href={friend.url} target="_blank" rel="noopener noreferrer" className="friend-link">
              <Image src={friend.icon} alt="" width={64} height={64} className="friend-link-icon" />
              <div className="friend-link-copy">
                <h3>{friend.name}</h3>
                {description && <p>{description}</p>}
              </div>
              <span aria-hidden="true" className="friend-link-arrow">↗</span>
            </a>
          );
        })}
      </div>
      <div className="friend-exchange">
        <h3>{zh ? '交换友情链接' : 'Exchange links'}</h3>
        <p>{zh ? '欢迎在留言中留下站点名称、简介（可留空）、头像图片网址和完整网站链接，也可以通过' : 'Leave your site name, an optional description, an icon image URL, and the full website URL in the guestbook, or contact me by '}
          <a href="mailto:1191743253@qq.com">{zh ? '邮件联系我' : 'email'}</a>{zh ? '。我会查看后手动添加。' : '. I will review the site and add the link manually.'}</p>
        <div className="friend-exchange-actions">
          <button type="button" onClick={copyInfo}>{zh ? '复制本站友链信息' : 'Copy this site’s link info'}</button>
          <button type="button" className="friend-info-toggle" aria-expanded={showInfo} aria-controls="friend-site-info" onClick={()=>setShowInfo(!showInfo)}>{zh ? (showInfo?'收起信息':'查看信息') : (showInfo?'Hide details':'View details')}</button>
        </div>
        <p role="status" aria-live="polite">{copyStatus==='copied' ? (zh?'已复制，可直接发给朋友。':'Copied. You can send it to a friend.') : copyStatus==='manual' ? (zh?'暂时无法自动复制，请选择下方内容手动复制。':'Automatic copying is unavailable. Select the text below to copy it manually.') : ''}</p>
        <div id="friend-site-info" hidden={!showInfo}>
          <label htmlFor="friend-site-json">{zh?'本站友链信息（JSON）':'This site’s link info (JSON)'}</label>
          <textarea id="friend-site-json" readOnly value={siteInfo} rows={8} spellCheck={false} onFocus={event=>event.target.select()}/>
        </div>
      </div>
    </section>
  );
}
