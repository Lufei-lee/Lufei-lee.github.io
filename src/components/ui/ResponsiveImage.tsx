import type { ImgHTMLAttributes } from 'react';
import variants from '@/lib/imageVariants.json';

type Props = Omit<ImgHTMLAttributes<HTMLImageElement>, 'src'> & {src:string; fill?:boolean; priority?:boolean; unoptimized?:boolean};
export default function ResponsiveImage({src,fill,priority,unoptimized:_,sizes,style,alt='',...props}:Props) {
 void _;
 const image=variants[src as keyof typeof variants];
 const choices=image?.variants;
// Static export uses prebuilt srcsets instead of a runtime optimization server.
 // eslint-disable-next-line @next/next/no-img-element
 return <img {...props} alt={alt} src={choices?.at(-1)?.src??src}
  srcSet={choices?.map(v=>`${v.src} ${v.width}w`).join(', ')}
  sizes={sizes??'(max-width: 768px) 100vw, 960px'}
  width={image?.width??props.width} height={image?.height??props.height}
  loading={priority?'eager':props.loading??'lazy'} decoding="async"
  fetchPriority={priority?'high':props.fetchPriority}
  style={fill?{position:'absolute',height:'100%',width:'100%',inset:0,...style}:style}/>;
}
