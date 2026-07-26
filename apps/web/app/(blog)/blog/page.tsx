import { redirect } from 'next/navigation';

/** Legacy System A stub — real Soft Gift journal is /articles (editorial publishes there). */
export default function BlogHomePage() {
  redirect('/articles');
}
