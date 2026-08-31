import { readFile } from 'node:fs/promises';

const api = process.env.QA_API || 'http://127.0.0.1:8787';
const origin = process.env.QA_ORIGIN || 'http://localhost:5173';
const code = process.env.QA_CODE || 'local-crud-test-code-2';

async function readJson(response) {
  const body = await response.json();
  if (!response.ok) throw new Error(`${response.status}: ${JSON.stringify(body)}`);
  return body;
}

const exchange = await readJson(
  await fetch(`${api}/auth/exchange`, {
    method: 'POST',
    headers: { origin, 'content-type': 'application/json' },
    body: JSON.stringify({ code }),
  }),
);
const headers = { origin, authorization: `Bearer ${exchange.token}` };
const admin = (path, init = {}) =>
  fetch(`${api}${path}`, { ...init, headers: { ...headers, ...init.headers } });
const post = (payload) =>
  admin('/api/admin/content', {
    method: 'POST',
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify(payload),
  }).then(readJson);

const initial = await readJson(await admin('/api/admin/content'));
const testSocial = {
  id: 'qa-network',
  platform: 'custom-network',
  label: 'QA Network',
  url: 'https://example.com/yuuta',
  enabled: true,
  sortOrder: 99,
};
const afterSocialAdd = await post({
  action: 'save-socials',
  socials: [...initial.socials, testSocial],
});
const publicAfterSocialAdd = await readJson(await fetch(`${api}/api/content`));
const editedSocials = afterSocialAdd.content.socials.map((social) =>
  social.id === testSocial.id
    ? { ...social, url: 'https://example.com/yuuta-updated' }
    : social,
);
const afterSocialEdit = await post({ action: 'save-socials', socials: editedSocials });
const afterSocialDelete = await post({
  action: 'save-socials',
  socials: afterSocialEdit.content.socials.filter((social) => social.id !== testSocial.id),
});
const invalidSocials = afterSocialDelete.content.socials.map((social, index) =>
  index === 0 ? { ...social, url: 'not-a-url' } : social,
);
const invalidUrlResponse = await admin('/api/admin/content', {
  method: 'POST',
  headers: { 'content-type': 'application/json' },
  body: JSON.stringify({ action: 'save-socials', socials: invalidSocials }),
});

const testProject = {
  id: 'qa-project',
  titleEn: 'QA Project',
  titleVi: 'Dự án QA',
  descriptionEn: 'Temporary',
  descriptionVi: 'Tạm thời',
  tagsEn: 'QA',
  tagsVi: 'QA',
  category: 'Music Video',
  videoUrl: 'https://youtu.be/iXJIo3f2mVM',
  platform: 'youtube',
  thumbnailUrl: '',
  sortOrder: 99,
  published: true,
  createdAt: '',
  updatedAt: '',
};
const afterProjectAdd = await post({ action: 'save-project', project: testProject });
const publicAfterProjectAdd = await readJson(await fetch(`${api}/api/content`));
const savedProject = afterProjectAdd.content.projects.find((project) => project.id === testProject.id);
const afterProjectEdit = await post({
  action: 'save-project',
  project: { ...savedProject, titleEn: 'QA Project Updated' },
});
const afterProjectDelete = await post({ action: 'delete-project', id: testProject.id });

const changedSettings = { ...initial.settings, headlineEn: `${initial.settings.headlineEn} QA` };
const afterSettingsEdit = await post({ action: 'save-settings', settings: changedSettings });
const afterSettingsRestore = await post({ action: 'save-settings', settings: initial.settings });

const form = new FormData();
form.append(
  'file',
  new Blob([await readFile('worker/seed-assets/3bf51748-4a3f-4b18-b28b-2891f7d39517.jpg')], {
    type: 'image/jpeg',
  }),
  'qa.jpg',
);
const upload = await readJson(
  await admin('/api/admin/thumbnail', { method: 'POST', body: form }),
);
const uploadedMedia = await fetch(upload.url);
const anonymousWrite = await fetch(`${api}/api/admin/content`, {
  method: 'POST',
  headers: { 'content-type': 'application/json' },
  body: JSON.stringify({ action: 'delete-project', id: initial.projects[0].id }),
});
const finalPublic = await readJson(await fetch(`${api}/api/content`));

console.log(
  JSON.stringify(
    {
      authenticatedRead: initial.projects.length === 2,
      socialAdded: publicAfterSocialAdd.socials.some((social) => social.id === testSocial.id),
      socialEdited: afterSocialEdit.content.socials.find((social) => social.id === testSocial.id)?.url === 'https://example.com/yuuta-updated',
      socialDeleted: !afterSocialDelete.content.socials.some((social) => social.id === testSocial.id),
      invalidUrlRejected: invalidUrlResponse.status === 400,
      projectAdded: publicAfterProjectAdd.projects.some((project) => project.id === testProject.id && project.category === 'Music Video'),
      projectEdited: afterProjectEdit.content.projects.find((project) => project.id === testProject.id)?.titleEn === 'QA Project Updated',
      projectDeleted: !afterProjectDelete.content.projects.some((project) => project.id === testProject.id),
      settingsEdited: afterSettingsEdit.content.settings.headlineEn.endsWith(' QA'),
      settingsRestored: afterSettingsRestore.content.settings.headlineEn === initial.settings.headlineEn,
      thumbnailUploaded: uploadedMedia.ok && uploadedMedia.headers.get('content-type') === 'image/jpeg',
      uploadedKey: new URL(upload.url).pathname.replace(/^\/media\//, ''),
      anonymousWriteBlocked: anonymousWrite.status === 401,
      dataRestored: finalPublic.projects.length === 2 && finalPublic.socials.length === 5,
    },
    null,
    2,
  ),
);
