import UploadClient from './upload-client';

export const metadata = { title: 'Upload Report' };

export default function Page() {
  return (
    <main className="mx-auto max-w-4xl p-6">
      <UploadClient />
    </main>
  );
}
