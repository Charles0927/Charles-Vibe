(() => {
  const repository = 'Charles0927/Charles-Vibe';
  const branch = 'main';
  const languages = [
    { id: 'zh', label: '中文' },
    { id: 'en', label: 'English' },
    { id: 'ja', label: '日本語' },
    { id: 'ko', label: '한국어' }
  ];
  const elements = {
    authCard: document.querySelector('#auth-card'),
    authForm: document.querySelector('#auth-form'),
    token: document.querySelector('#github-token'),
    editor: document.querySelector('#editor'),
    connection: document.querySelector('#connection-state'),
    signOut: document.querySelector('#sign-out'),
    save: document.querySelector('#save-changes'),
    saveState: document.querySelector('#save-state'),
    status: document.querySelector('#status-message'),
    photoList: document.querySelector('#photo-list'),
    photoEditor: document.querySelector('#photo-editor'),
    copyGrid: document.querySelector('#copy-grid'),
    photosPanel: document.querySelector('#photos-panel'),
    copyPanel: document.querySelector('#copy-panel')
  };

  let token = '';
  let content = null;
  let activeCollection = 'hong-kong';
  let activePhotoIndex = 0;
  let activeLanguage = 'zh';
  let dirty = false;
  const pendingFiles = new Map();
  const previewUrls = new Map();

  function message(text, kind = '') {
    elements.status.textContent = text;
    elements.status.className = `status-message${kind ? ` is-${kind}` : ''}`;
  }

  function markDirty() {
    dirty = true;
    elements.save.disabled = false;
    elements.saveState.textContent = '有未保存的修改';
  }

  function activeCollectionData() {
    return content.collections.find((collection) => collection.id === activeCollection);
  }

  function activePhoto() {
    return activeCollectionData().photos[activePhotoIndex];
  }

  function updateLanguageTabs() {
    document.querySelectorAll('.language-tab[data-language]').forEach((button) => {
      button.classList.toggle('is-active', button.dataset.language === activeLanguage);
    });
  }

  async function githubRequest(path, options = {}) {
    const response = await fetch(`https://api.github.com/repos/${repository}/${path}`, {
      ...options,
      headers: {
        Accept: 'application/vnd.github+json',
        Authorization: `Bearer ${token}`,
        'X-GitHub-Api-Version': '2022-11-28',
        ...(options.body ? { 'Content-Type': 'application/json' } : {}),
        ...options.headers
      }
    });
    const body = await response.json().catch(() => ({}));
    if (!response.ok) {
      const error = new Error(body.message || `GitHub request failed (${response.status})`);
      error.status = response.status;
      throw error;
    }
    return body;
  }

  function encodedPath(path) {
    return path.split('/').map(encodeURIComponent).join('/');
  }

  function utf8Base64(value) {
    const bytes = new TextEncoder().encode(value);
    let binary = '';
    for (let offset = 0; offset < bytes.length; offset += 0x8000) {
      binary += String.fromCharCode(...bytes.subarray(offset, offset + 0x8000));
    }
    return btoa(binary);
  }

  function fileBase64(blob) {
    return blob.arrayBuffer().then((buffer) => {
      const bytes = new Uint8Array(buffer);
      let binary = '';
      for (let offset = 0; offset < bytes.length; offset += 0x8000) {
        binary += String.fromCharCode(...bytes.subarray(offset, offset + 0x8000));
      }
      return btoa(binary);
    });
  }

  async function connect(event) {
    event.preventDefault();
    token = elements.token.value.trim();
    if (!token) return;
    elements.authForm.querySelector('button').disabled = true;
    message('正在验证仓库访问权限…');
    try {
      await githubRequest(`contents/content.js?ref=${branch}`);
      content = JSON.parse(JSON.stringify(window.siteContent));
      elements.authCard.hidden = true;
      elements.editor.hidden = false;
      elements.connection.textContent = '已连接 · Charles-Vibe';
      elements.connection.classList.add('is-connected');
      elements.signOut.hidden = false;
      renderPhotoList();
      renderPhotoEditor();
      message('已连接。选择照片或文案，修改后点击“保存并发布”。', 'success');
    } catch (error) {
      token = '';
      message(`连接失败：${error.message}。确认 Token 对 Charles-Vibe 有 Contents 读写权限。`, 'error');
    } finally {
      elements.authForm.querySelector('button').disabled = false;
    }
  }

  function signOut() {
    token = '';
    content = null;
    dirty = false;
    pendingFiles.clear();
    for (const url of previewUrls.values()) URL.revokeObjectURL(url);
    previewUrls.clear();
    elements.token.value = '';
    elements.editor.hidden = true;
    elements.authCard.hidden = false;
    elements.signOut.hidden = true;
    elements.connection.textContent = '未连接';
    elements.connection.classList.remove('is-connected');
    elements.save.disabled = true;
    elements.saveState.textContent = '尚未修改';
    message('Token 已从当前页面清除。');
  }

  function renderPhotoList() {
    const collection = activeCollectionData();
    elements.photoList.replaceChildren();
    collection.photos.forEach((photo, index) => {
      const button = document.createElement('button');
      button.type = 'button';
      button.className = `photo-choice${index === activePhotoIndex ? ' is-active' : ''}`;
      const image = document.createElement('img');
      image.src = `../${photo.src}?v=${Date.now()}`;
      image.alt = '';
      const title = document.createElement('span');
      title.textContent = photo.title.zh || photo.title.en || photo.src;
      button.append(image, title);
      button.addEventListener('click', () => {
        if (dirty && !window.confirm('当前修改尚未保存；切换后仍可一起保存。确定切换照片吗？')) return;
        activePhotoIndex = index;
        renderPhotoList();
        renderPhotoEditor();
      });
      elements.photoList.append(button);
    });
  }

  function field(label, language, key, value, options = {}) {
    const wrapper = document.createElement('label');
    wrapper.className = `field${options.full ? ' full' : ''}`;
    const caption = document.createElement('span');
    caption.className = 'field-label';
    caption.textContent = label;
    const locale = document.createElement('small');
    locale.textContent = languages.find((item) => item.id === language).label;
    caption.append(locale);
    const input = options.multiline ? document.createElement('textarea') : document.createElement('input');
    if (!options.multiline) input.type = 'text';
    input.value = value || '';
    input.addEventListener('input', () => {
      key.target[language] = input.value;
      markDirty();
      if (options.onChange) options.onChange(input.value);
    });
    wrapper.append(caption, input);
    return wrapper;
  }

  function renderPhotoEditor() {
    const photo = activePhoto();
    const language = activeLanguage;
    const wrapper = document.createElement('div');
    const preview = document.createElement('div');
    preview.className = 'photo-preview';
    const image = document.createElement('img');
    image.src = previewUrls.get(photo.src) || `../${photo.src}?v=${Date.now()}`;
    image.alt = photo.alt[language] || photo.alt.en || '';
    preview.append(image);

    const fileRow = document.createElement('div');
    fileRow.className = 'photo-file-row';
    const fileInput = document.createElement('input');
    fileInput.type = 'file';
    fileInput.accept = 'image/*';
    fileInput.setAttribute('aria-label', '选择替换照片');
    fileInput.addEventListener('change', () => {
      const file = fileInput.files?.[0];
      if (!file) return;
      if (!file.type.startsWith('image/')) {
        message('请选择图片文件。', 'error');
        fileInput.value = '';
        return;
      }
      const previousUrl = previewUrls.get(photo.src);
      if (previousUrl) URL.revokeObjectURL(previousUrl);
      const nextUrl = URL.createObjectURL(file);
      pendingFiles.set(photo.src, file);
      previewUrls.set(photo.src, nextUrl);
      image.src = nextUrl;
      message(`已选择 ${file.name}；保存时会缩放并优化为适合网站的 JPEG。`);
      markDirty();
    });
    const note = document.createElement('span');
    note.className = 'file-note';
    note.textContent = `当前文件：${photo.src.split('/').pop()}`;
    fileRow.append(fileInput, note);

    const tabs = document.createElement('div');
    tabs.className = 'language-tabs';
    for (const item of languages) {
      const button = document.createElement('button');
      button.type = 'button';
      button.className = `language-tab${item.id === language ? ' is-active' : ''}`;
      button.textContent = item.label;
      button.addEventListener('click', () => {
        activeLanguage = item.id;
        updateLanguageTabs();
        renderPhotoEditor();
      });
      tabs.append(button);
    }

    const fields = document.createElement('div');
    fields.className = 'photo-fields';
    fields.append(
      field('照片标题', language, { target: photo.title }, photo.title[language], { full: true, multiline: photo.title[language]?.length > 72 }),
      field('照片说明 / 替代文本', language, { target: photo.alt }, photo.alt[language], { full: true, multiline: true })
    );
    wrapper.append(preview, fileRow, tabs, fields);
    elements.photoEditor.replaceChildren(wrapper);
  }

  function renderCopyEditor() {
    const labels = content.labels[activeLanguage];
    elements.copyGrid.replaceChildren();
    Object.entries(labels).forEach(([key, value]) => {
      const wrapper = document.createElement('label');
      wrapper.className = 'copy-field';
      const title = document.createElement('span');
      title.textContent = key.replace(/([A-Z])/g, ' $1').replace(/^./, (letter) => letter.toUpperCase());
      const code = document.createElement('code');
      code.textContent = key;
      title.append(' ', code);
      const editor = value.length > 68 || value.includes('<br') ? document.createElement('textarea') : document.createElement('input');
      if (editor.tagName === 'INPUT') editor.type = 'text';
      editor.value = value;
      editor.addEventListener('input', () => {
        labels[key] = editor.value;
        markDirty();
      });
      wrapper.append(title, editor);
      elements.copyGrid.append(wrapper);
    });
  }

  async function optimizeImage(file) {
    const bitmap = await createImageBitmap(file);
    const scale = Math.min(1, 2200 / Math.max(bitmap.width, bitmap.height));
    const canvas = document.createElement('canvas');
    canvas.width = Math.round(bitmap.width * scale);
    canvas.height = Math.round(bitmap.height * scale);
    const context = canvas.getContext('2d', { alpha: false });
    context.drawImage(bitmap, 0, 0, canvas.width, canvas.height);
    bitmap.close();
    const blob = await new Promise((resolve, reject) => {
      canvas.toBlob((result) => result ? resolve(result) : reject(new Error('图片处理失败')), 'image/jpeg', .9);
    });
    if (blob.size > 8 * 1024 * 1024) throw new Error('优化后的照片仍超过 8 MB，请换一张或先缩小图片。');
    return blob;
  }

  async function replacePhoto(path, file) {
    const existing = await githubRequest(`contents/${encodedPath(path)}?ref=${branch}`);
    const blob = await optimizeImage(file);
    await githubRequest(`contents/${encodedPath(path)}`, {
      method: 'PUT',
      body: JSON.stringify({
        message: `Replace portfolio photo ${path.split('/').pop()}`,
        content: await fileBase64(blob),
        branch,
        sha: existing.sha
      })
    });
    pendingFiles.delete(path);
    const previewUrl = previewUrls.get(path);
    if (previewUrl) URL.revokeObjectURL(previewUrl);
    previewUrls.delete(path);
    message(`照片已上传（${Math.round(blob.size / 1024)} KB）。`, 'success');
  }

  async function saveContent() {
    if (!dirty && pendingFiles.size === 0) return;
    elements.save.disabled = true;
    elements.save.textContent = '正在保存…';
    message('正在向 GitHub 保存更改…');
    try {
      for (const [path, file] of [...pendingFiles]) await replacePhoto(path, file);
      const current = await githubRequest(`contents/content.js?ref=${branch}`);
      const source = `window.siteContent = ${JSON.stringify(content, null, 2)};\n`;
      await githubRequest('contents/content.js', {
        method: 'PUT',
        body: JSON.stringify({
          message: 'Update portfolio content via studio',
          content: utf8Base64(source),
          branch,
          sha: current.sha
        })
      });
      dirty = false;
      elements.saveState.textContent = '已提交 · 网站正在更新';
      elements.save.textContent = '保存并发布';
      renderPhotoList();
      renderPhotoEditor();
      message('已提交到 main，GitHub Pages 正在部署。稍后刷新网站即可查看。', 'success');
    } catch (error) {
      elements.save.disabled = false;
      elements.save.textContent = '重试保存';
      message(`保存失败：${error.message}`, 'error');
    }
  }

  elements.authForm.addEventListener('submit', connect);
  elements.signOut.addEventListener('click', signOut);
  elements.save.addEventListener('click', saveContent);

  document.querySelectorAll('.panel-tab').forEach((button) => {
    button.addEventListener('click', () => {
      document.querySelectorAll('.panel-tab').forEach((tab) => tab.classList.toggle('is-active', tab === button));
      const showPhotos = button.dataset.panel === 'photos';
      elements.photosPanel.hidden = !showPhotos;
      elements.copyPanel.hidden = showPhotos;
      if (!showPhotos) renderCopyEditor();
    });
  });

  document.querySelectorAll('.collection-tab').forEach((button) => {
    button.addEventListener('click', () => {
      if (dirty && !window.confirm('当前修改尚未保存；切换后仍可一起保存。确定切换合集吗？')) return;
      activeCollection = button.dataset.collection;
      activePhotoIndex = 0;
      document.querySelectorAll('.collection-tab').forEach((tab) => tab.classList.toggle('is-active', tab === button));
      renderPhotoList();
      renderPhotoEditor();
    });
  });

  document.querySelectorAll('.language-tab').forEach((button) => {
    button.addEventListener('click', () => {
      activeLanguage = button.dataset.language;
      updateLanguageTabs();
      renderCopyEditor();
    });
  });
})();

