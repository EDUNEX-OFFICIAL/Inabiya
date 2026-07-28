import { redirect } from 'next/navigation';

/** Legacy /blog stub — journal lives at /articles (Blog Creative theme). */
export default function BlogHomePage() {
  redirect('/articles');
}
