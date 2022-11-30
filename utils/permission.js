import { clipReg, PermissionNormalReg } from './reg';
import { getType } from '.';

const list = [
  'activeTab',
  'alarms',
  'background',
  'bg',
  'bookmarks',
  'browsingData',
  'certificateProvider',
  {
    name: 'clipboardRead',
    features: clipReg('paste'),
  },
  {
    name: 'clipboardWrite',
    features: [clipReg('copy'), clipReg('cut')],
  },
  'contentSettings',
  'contextMenus',
  'cookies',
  'debugger',
  'declarativeContent',
  'declarativeNetRequest',
  'declarativeNetRequestFeedback',
  'declarativeWebRequest',
  'desktopCapture',
  'documentScan',
  'downloads',
  'enterprise.deviceAttributes',
  'enterprise.hardwarePlatform',
  'enterprise.networkingAttributes',
  'enterprise.platformKeys',
  'experimental',
  'fileBrowserHandler',
  'fileSystemProvider',
  'fontSettings',
  'gcm',
  'geolocation',
  'history',
  'identity',
  'idle',
  'loginState',
  'management',
  'nativeMessaging',
  'notifications',
  'pageCapture',
  'platformKeys',
  'power',
  'printerProvider',
  'printing',
  'printingMetrics',
  'privacy',
  'processes',
  'proxy',
  'scripting',
  'search',
  'sessions',
  'signedInDevices',
  'storage',
  'system.cpu',
  'system.display',
  'system.memory',
  'system.storage',
  'tabCapture',
  'tabGroups',
  'tabs',
  'topSites',
  'tts',
  'ttsEngine',
  'unlimitedStorage',
  'vpnProvider',
  'wallpaper',
  'webNavigation',
  'webRequest',
  'webRequestBlocking',
];

export function match(code) {
  return list.reduce((accumulator, item) => {
    if (typeof item === 'string' && PermissionNormalReg(item).test(code)) {
      accumulator.push(item);
    } else if (
      getType(item.features) === '[object RegExp]' &&
      item.features.test(code)
    ) {
      accumulator.push(item.name);
    } else if (
      getType(item.features) === '[object Array]' &&
      item.features.map(item => item.test(code)).filter(item => item).length
    ) {
      accumulator.push(item.name);
    }
    return accumulator;
  }, []);
}
