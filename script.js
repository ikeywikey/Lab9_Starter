// =============================================================
// Lab 9 - Errors and Error Reporting
// =============================================================

// -------------------------------------------------------------
// Step 5 (part 1) - Global error handlers
// -------------------------------------------------------------
// These live at the top so they are registered before anything
// else runs. They catch errors that escape every try/catch block
// and bubble up to the global scope. In the real world this is the
// hook you would use to fetch()/XMLHttpRequest the error off to a
// logging server (or a service like TrackJS).

// Classic approach: window.onerror
window.onerror = function (message, source, lineno, colno, error) {
  console.log('%c[window.onerror] caught a global error', 'color: red; font-weight: bold;');
  console.log(`  message: ${message}`);
  console.log(`  source : ${source}`);
  console.log(`  line:col: ${lineno}:${colno}`);
  console.log('  error  :', error);

  // This is where you would ship it somewhere, e.g.:
  // fetch('https://example.com/log', {
  //   method: 'POST',
  //   headers: { 'Content-Type': 'application/json' },
  //   body: JSON.stringify({ message, source, lineno, colno, stack: error?.stack })
  // });

  // Returning true tells the browser we've handled it (suppresses the
  // default "Uncaught Error" message in the console). Return false to
  // let the browser also log it.
  return false;
};

// Modern approach: addEventListener('error') — also catches resource
// load failures (e.g. a broken <img> or <script>) that onerror misses.
window.addEventListener('error', (event) => {
  console.log('%c[addEventListener("error")] caught a global error', 'color: orange; font-weight: bold;');
  console.log('  event.message:', event.message);
  console.log('  event.error  :', event.error);
});

// Promise rejections that are never caught don't trigger window.onerror,
// so we listen for them separately.
window.addEventListener('unhandledrejection', (event) => {
  console.log('%c[unhandledrejection] caught a rejected promise', 'color: purple; font-weight: bold;');
  console.log('  reason:', event.reason);
});

// =============================================================
// Step 4 - Custom error types (extending Error)
// =============================================================

// Base class for everything our calculator throws, so callers can do
// `catch (e) { if (e instanceof CalculatorError) ... }`.
class CalculatorError extends Error {
  constructor(message) {
    super(message);
    this.name = 'CalculatorError';
  }
}

// Thrown when an input isn't a valid, finite number.
class InvalidInputError extends CalculatorError {
  constructor(message, badValue) {
    super(message);
    this.name = 'InvalidInputError';
    this.badValue = badValue; // extra context, the whole point of a custom error
  }
}

// Thrown when the user tries to divide by zero.
class DivideByZeroError extends CalculatorError {
  constructor(message) {
    super(message);
    this.name = 'DivideByZeroError';
  }
}

// =============================================================
// Step 3 - Calculator with try / catch / finally / throw
// =============================================================

const form = document.querySelector('form');

form.addEventListener('submit', (e) => {
  e.preventDefault();

  try {
    // If someone comments out the <output> element in index.html,
    // this query returns null and the .textContent assignment below
    // throws a TypeError — a realistic "unexpected DOM" failure.
    const output = document.querySelector('output');

    const firstRaw = document.querySelector('#first-num').value;
    const secondRaw = document.querySelector('#second-num').value;
    const operator = document.querySelector('#operator').value;

    const firstNum = parseInputNumber(firstRaw, 'first number');
    const secondNum = parseInputNumber(secondRaw, 'second number');

    const result = compute(firstNum, secondNum, operator);

    // If <output> was commented out, this line throws.
    output.textContent = result;
    console.log(`Calculated ${firstNum} ${operator} ${secondNum} = ${result}`);
  } catch (err) {
    // Different handling depending on the kind of error we got.
    if (err instanceof DivideByZeroError) {
      console.error('Math problem:', err.message);
      writeOutputSafely('Cannot divide by zero');
    } else if (err instanceof InvalidInputError) {
      console.error(`Bad input (${err.badValue}):`, err.message);
      writeOutputSafely(err.message);
    } else if (err instanceof CalculatorError) {
      console.error('Calculator error:', err.message);
      writeOutputSafely(err.message);
    } else {
      // Anything we didn't anticipate (e.g. the missing <output> node).
      console.error('Unexpected error:', err);
      writeOutputSafely('Something went wrong — check the console.');
    }
  } finally {
    // Always runs, error or not. Good place for cleanup / logging.
    console.log('Calculation attempt finished (finally block ran).');
  }
});

// Validates raw input and throws a custom error if it's not a number.
function parseInputNumber(raw, label) {
  if (raw.trim() === '') {
    throw new InvalidInputError(`The ${label} is empty.`, raw);
  }
  const n = Number(raw);
  if (Number.isNaN(n)) {
    throw new InvalidInputError(`The ${label} "${raw}" is not a valid number.`, raw);
  }
  return n;
}

// Does the actual math and throws on divide-by-zero.
function compute(a, b, operator) {
  switch (operator) {
    case '+': return a + b;
    case '-': return a - b;
    case '*': return a * b;
    case '/':
      if (b === 0) {
        throw new DivideByZeroError('Division by zero is undefined.');
      }
      return a / b;
    default:
      throw new CalculatorError(`Unknown operator "${operator}".`);
  }
}

// Tries to show a message in <output>, but won't blow up if it's gone.
function writeOutputSafely(message) {
  const output = document.querySelector('output');
  if (output) {
    output.textContent = message;
  }
}

// =============================================================
// Step 2 - Console method demos, one per button
// =============================================================

// Some sample data we'll reuse across the demos.
const people = [
  { name: 'Ada Lovelace', role: 'Mathematician', year: 1815 },
  { name: 'Alan Turing', role: 'Computer Scientist', year: 1912 },
  { name: 'Grace Hopper', role: 'Rear Admiral', year: 1906 },
];

// Map each button's label to the console method it demonstrates.
const consoleDemos = {
  'Console Log': () => {
    console.log('console.log — plain logging:', 'Hello from Lab 9!', people[0]);
  },

  'Console Error': () => {
    console.error('console.error — this is what an error message looks like in the console.');
  },

  'Console Count': () => {
    // Increments a counter labelled "button clicks" every press.
    console.count('Console Count clicks');
  },

  'Console Warn': () => {
    console.warn('console.warn — a non-fatal warning the developer should notice.');
  },

  'Console Assert': () => {
    // Only logs when the assertion is false. 2 + 2 !== 5, so it fires.
    console.assert(2 + 2 === 5, 'console.assert — 2 + 2 is not 5, assertion failed!');
    console.log('(console.assert only prints when its condition is false.)');
  },

  'Console Clear': () => {
    console.clear();
    console.log('console.clear — the console was just wiped.');
  },

  'Console Dir': () => {
    // Shows an interactive list of an object's properties. Most useful
    // on a DOM node, where console.log prints the HTML but dir prints
    // the JS object/properties.
    console.dir(document.querySelector('#calculate'));
  },

  'Console dirxml': () => {
    // The opposite of dir on a DOM node: prints the XML/HTML tree.
    console.dirxml(document.querySelector('#error-btns'));
  },

  'Console Group Start': () => {
    // group() indents subsequent logs until groupEnd(). groupCollapsed()
    // would start it collapsed.
    console.group('Famous computing pioneers');
    people.forEach((p) => console.log(`${p.name} — ${p.role}`));
    console.log('(Press "Console Group End" to close this group.)');
  },

  'Console Group End': () => {
    console.log('Closing the group now.');
    console.groupEnd();
  },

  'Console Table': () => {
    // Renders array-of-objects as a sortable table.
    console.table(people);
  },

  'Start Timer': () => {
    // Starts a named timer.
    console.time('demo-timer');
    console.log('console.time — timer "demo-timer" started. Press "End Timer" to stop it.');
  },

  'End Timer': () => {
    // Stops the named timer and prints the elapsed time.
    console.timeEnd('demo-timer');
  },

  'Console Trace': () => {
    // Prints the call stack from wherever it's invoked.
    traceDemoOuter();
  },
};

// Helper functions so console.trace has an interesting stack to show.
function traceDemoOuter() {
  traceDemoInner();
}
function traceDemoInner() {
  console.trace('console.trace — here is how we got here:');
}

// -------------------------------------------------------------
// Wire up every button by its text label.
// -------------------------------------------------------------
const errorBtns = Array.from(document.querySelectorAll('#error-btns > button'));

errorBtns.forEach((btn) => {
  const label = btn.textContent.trim();

  if (label === 'Trigger a Global Error') {
    // Step 5 (part 2) - this button throws an error that is NOT inside
    // a try/catch, so it escapes to the global handlers above.
    btn.addEventListener('click', triggerGlobalError);
    return;
  }

  const demo = consoleDemos[label];
  if (demo) {
    btn.addEventListener('click', demo);
  } else {
    console.warn(`No demo wired up for button: "${label}"`);
  }
});

// =============================================================
// Step 5 (part 2) - Trigger a global (uncaught) error
// =============================================================
function triggerGlobalError() {
  // Deliberately call something that doesn't exist. Because this is
  // NOT wrapped in try/catch, the error propagates to window.onerror
  // and the 'error' event listener, which log it (and in production
  // would report it to a tracking service).
  thisFunctionDoesNotExist();
}
