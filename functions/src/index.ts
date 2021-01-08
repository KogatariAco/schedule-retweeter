import * as admin from "firebase-admin";

if (!admin.apps.length) {
  admin.initializeApp();
}

const functionCalled = (name: string): boolean => {
  return process.env.FUNCTION_NAME === name;
};

export const exportIfNeeded = (name: string, exports: any): void => {
  if (functionCalled(name)) {
    const ex = exports;
    ex[name] = require(`./${name}`).default;
  }
};

exportIfNeeded("addTweeets", exports);
exportIfNeeded("scheduledRetweeets", exports);
