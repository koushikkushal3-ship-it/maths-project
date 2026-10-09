const fs = require('fs');

const TIPS_DATA = []; // just an empty array or basic array
global.TIPS_DATA = TIPS_DATA;

const mockEl = {
  textContent: '',
  innerHTML: '',
  value: '100',
  style: {},
  addEventListener: () => {},
  classList: {
    add: () => {},
    remove: () => {},
    toggle: () => {},
    contains: () => false
  },
  appendChild: () => {}
};

global.document = {
  addEventListener: (event, cb) => {
    if(event === 'DOMContentLoaded') setTimeout(cb, 10);
  },
  getElementById: (id) => mockEl,
  querySelector: (sel) => mockEl,
  querySelectorAll: (sel) => [],
  createElement: (tag) => ({ ...mockEl }),
  body: { classList: mockEl.classList }
};

global.window = {
  Chart: class { constructor() { return { destroy: () => {} } } }
};
global.Chart = global.window.Chart;
global.Papa = { parse: () => {} };

const appCode = fs.readFileSync('app.js', 'utf8');

try {
  eval(appCode);
  console.log("No syntax or immediate evaluation errors.");
} catch(e) {
  console.error("Evaluation Error:", e);
}

setTimeout(() => {
  console.log("DOMContentLoaded executed without crashing.");
}, 50);
