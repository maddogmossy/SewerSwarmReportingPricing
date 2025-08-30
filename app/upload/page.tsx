// Opens a standard file picker (not a folder picker) and adds the files.
// Keeps the DB/PDF filters and works in all evergreen browsers.
async function pickFolderFS() {
  try {
    // Prefer the modern file-picker API if it exists
    if (typeof (window as any).showOpenFilePicker === 'function') {
      const handles: any[] = await (window as any).showOpenFilePicker({
        multiple: true,
        excludeAcceptAllOption: false,
        types: [
          {
            description: 'PDF',
            accept: { 'application/pdf': ['.pdf'] },
          },
          {
            description: 'SQLite DB',
            accept: {
              'application/x-sqlite3': ['.db', '.db3'],
              'application/vnd.sqlite3': ['.db', '.db3'],
              'application/octet-stream': ['.db', '.db3'],
            },
          },
        ],
      });

      const files = await Promise.all(handles.map(h => h.getFile()));
      if (files.length) addFiles(files);
      return;
    }

    // Fallback for browsers without showOpenFilePicker:
    // create a hidden <input type="file" multiple> and click it.
    const ACCEPT =
      '.pdf,.db,.db3,application/x-sqlite3,application/vnd.sqlite3,application/octet-stream';

    let input = document.getElementById('classic-file-input') as
      | HTMLInputElement
      | null;

    if (!input) {
      input = document.createElement('input');
      input.type = 'file';
      input.multiple = true;
      input.accept = ACCEPT;
      input.id = 'classic-file-input';
      input.style.position = 'fixed';
      input.style.left = '-9999px';
      input.style.top = '-9999px';
      document.body.appendChild(input);
    }

    // Clear any previous selection
    input.value = '';

    const files = await new Promise<File[]>((resolve) => {
      const onChange = () => {
        input!.removeEventListener('change', onChange);
        resolve(Array.from(input!.files ?? []));
      };
      input!.addEventListener('change', onChange, { once: true });
      input!.click();
    });

    if (files.length) addFiles(files);
  } catch {
    // user cancelled or picker error – ignore silently
  }
}
