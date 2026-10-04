'use client';

import { useEffect } from 'react';

export default function PrivateAnalytics() {
  const code = process.env.NEXT_PUBLIC_GOATCOUNTER_CODE;

  useEffect(() => {
    if (!code || document.querySelector('script[data-goatcounter]')) return;
    const script = document.createElement('script');
    script.async = true;
    script.src = 'https://gc.zgo.at/count.js';
    script.dataset.goatcounter = `https://${code}.goatcounter.com/count`;
    document.body.appendChild(script);
    return () => script.remove();
  }, [code]);

  return null;
}
