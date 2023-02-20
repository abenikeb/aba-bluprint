import * as jsrsasign from 'jsrsasign';

const excludeFiled = [
  'sign',
  'sign_type',
  'header',
  'refund_info',
  'openType',
  'raw_request',
];
/**
 * Format the rsa keys to standard pem format
 *
 * @param keyBase64String - the key base64 string
 * @param keyType - 'PUBLIC' or 'PRIVATE'
 */
export const formatKey = (keyBase64String: string, keyType: string) => {
  if (keyBase64String.startsWith('-----')) {
    return keyBase64String;
  }

  let key = `-----BEGIN ${keyType} KEY-----\n`;
  for (let i = 0, j = 1; i < keyBase64String.length; i++, j++) {
    key += keyBase64String.charAt(i);
    if (j % 76 === 0) {
      key += '\n';
      j = 0;
    }
  }
  key += `\n-----END ${keyType} KEY-----\n`;
  return key;
};

/**
 * Extract the attributes to be signed into a map
 *
 * @param json - the request message in json format
 * @return A json object includes attributes to be signed
 */
export const getParaMapToSign = (json: Object): Object => {
  let map = {};
  for (let key in json) {
    if (excludeFiled.includes(key)) {
      continue;
    }

    let val = json[key];
    if (json.hasOwnProperty(key)) {
      if (typeof val === 'object') {
        Object.assign(map, getParaMapToSign(val));
      } else {
        if (typeof val === 'string' && val != null) {
          map[key] = val;
        }
      }
    }
  }
  return map;
};

export const generateSign = (
  rsaPrivateKey: string,
  signatureSource: string,
) => {
  const sig = new jsrsasign.KJUR.crypto.Signature({
    alg: 'SHA256withRSAandMGF1',
  });
  sig.init(jsrsasign.KEYUTIL.getKey(formatKey(rsaPrivateKey, 'PRIVATE')));
  sig.updateString(signatureSource);
  return jsrsasign.hextob64(sig.sign());
};

/**
 * Generate signature original string
 *
 * @param paraMap the json includes all attributes to be signed, which is generated from the former step
 */
export const getSignSourceString = (paraMap: Object) => {
  let signatureSource = '';
  Object.keys(paraMap)
    .sort()
    .forEach(function (key) {
      if (paraMap[key].trim().length > 0) {
        signatureSource = `${signatureSource}&${key}=${paraMap[key].trim()}`;
      }
    });

  return signatureSource.substring(1);
};

export const createTimeStamp = () => {
  return Math.round(Date.now() / 1000) + '';
};

// create a 32 length random string
export const createNonceStr = () => {
  let chars = [
    '0',
    '1',
    '2',
    '3',
    '4',
    '5',
    '6',
    '7',
    '8',
    '9',
    'A',
    'B',
    'C',
    'D',
    'E',
    'F',
    'G',
    'H',
    'I',
    'J',
    'K',
    'L',
    'M',
    'N',
    'O',
    'P',
    'Q',
    'R',
    'S',
    'T',
    'U',
    'V',
    'W',
    'X',
    'Y',
    'Z',
  ];
  let str = '';
  for (let i = 0; i < 32; i++) {
    let index = Math.round(Math.random() * 35);
    str += chars[index];
  }
  return str;
};
