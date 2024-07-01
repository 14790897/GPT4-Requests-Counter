import { defineManifest } from '@crxjs/vite-plugin'
// @ts-ignore
import packageJson from './package.json'

const { version, name, description, displayName } = packageJson
// Convert from Semver (example: 0.1.0-beta6)
const [major, minor, patch, label = '0'] = version
  // can only contain digits, dots, or dash
  .replace(/[^\d.-]+/g, '')
  // split into version parts
  .split(/[.-]/)

export default defineManifest(async (env) => ({
  name: env.mode === 'staging' ? `[INTERNAL] ${name}` : displayName || name,
  description,
  default_locale: 'en',
  icons: {
    '128': 'src/assets/icon128.png',
  },
  // up to four numbers separated by dots
  version: `${major}.${minor}.${patch}.${label}`,
  // semver is OK in "version_name"
  version_name: version,
  manifest_version: 3,
  // key: 'ekgmcbpgglflmgcfajnglpbcbdccnnje',
  content_security_policy: {
    extension_pages: "script-src 'self'; object-src 'self'",
    sandbox: "sandbox allow-scripts; script-src 'self'",
  },
  action: {
    default_popup: 'src/popup/index.html',
  },
  background: {
    service_worker: 'src/background/index.ts',
  },
  content_scripts: [
    {
      all_frames: false,
      js: ['src/content-script/index.ts'],
      matches: [
        '<all_urls>',
        // '*://chat.openai.com/*',
        // '*://*.chat.openai.com/*',
        // '*://chat1.zhile.io/*',
        // '*://chat.zhile.io/*',
        // '*://ai.gptfree.me/*',
        // '*://chat.sharedchat.cn/*',
        // '*://free.xyhelper.com.cn/*',
        // '*://img.ylsagi.com/*',
        // '*://cc.plusai.me/*',
        // '*://c2c.gpt4fr.ee/*',
      ],
      run_at: 'document_end',
    },
  ],
  // host_permissions: ['*://*/*'],
  options_page: 'src/options/index.html',
  permissions: ['storage', 'activeTab'],
  web_accessible_resources: [
    {
      matches: ['*://*/*'],
      resources: ['src/content-script/index.ts'],
    },
    {
      matches: ['*://*/*'],
      resources: ['src/content-script/iframe/index.html'],
    },
  ],
}))
