const fs = require('fs');

const rawDataContent = fs.readFileSync('tips_data.js', 'utf8');
eval(rawDataContent.replace(/const\s+TIPS_DATA\s*=/, 'global.TIPS_DATA ='));


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

process.on('uncaughtException', (err) => {
  console.error("Uncaught exception!", err);
  process.exit(1);
});

try {
  eval(appCode);
  console.log("No syntax or immediate evaluation errors.");
} catch(e) {
  console.error("Evaluation Error:", e);
}

setTimeout(() => {
  console.log("DOMContentLoaded executed without crashing.");
}, 50);
