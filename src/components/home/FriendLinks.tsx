'use client';

import Image from 'next/image';
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
    </section>
  );
}
